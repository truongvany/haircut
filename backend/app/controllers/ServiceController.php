<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Config\DB;
use App\Core\Auth;
use App\Core\Str;

class ServiceController extends Controller
{
    // GET /api/v1/salons/{salonId}/services
    public function index(array $params)
    {
        $salonId = (int)($params['salon_id'] ?? 0);
        if ($salonId <= 0) {
            return $this->json(['error' => 'Salon not found'], 404);
        }

        // Lấy tham số phân trang
        $page   = max(1, (int)($_GET['page'] ?? 1));
        $limit  = max(5, (int)($_GET['limit'] ?? 10));
        $search = trim($_GET['search'] ?? '');
        $offset = ($page - 1) * $limit;

        $pdo = DB::pdo();
        $where = 'salon_id = ?';
        $args = [$salonId];

        if ($search !== '') {
            $where .= ' AND name LIKE ?';
            $args[] = '%' . $search . '%';
        }

        // Lấy tổng số
        $stTotal = $pdo->prepare("SELECT COUNT(*) FROM services WHERE $where");
        $stTotal->execute($args);
        $total = (int)$stTotal->fetchColumn();

        // Lấy danh sách (đổi tên cột cho khớp với frontend)
    // Build SQL with numeric LIMIT/OFFSET interpolated (avoids DB driver issues with binding LIMIT)
    $limitInt = (int)$limit;
    $offsetInt = (int)$offset;
        // Use the comma form LIMIT offset, count which is widely supported by MariaDB
        $sql = "SELECT id, name, category, base_price AS price, duration_min AS durationMin, active AS isActive
            FROM services
            WHERE $where
            ORDER BY name
            LIMIT {$offsetInt}, {$limitInt}";
    // Debug: log the final SQL and bound args if something goes wrong
    error_log('SERVICE_LIST_SQL=' . $sql);
    error_log('SERVICE_LIST_ARGS=' . json_encode($args));
    $st = $pdo->prepare($sql);
    $st->execute($args);
        $items = $st->fetchAll();

        // Trả về dữ liệu khớp với frontend/src/api/services.ts
        return $this->json([
            'items' => $items,
            'total' => $total,
            'page'  => $page,
            'limit' => $limit,
        ]);
    }

    // POST /api/v1/salons/{salonId}/services
    public function create(array $params)
    {
        // 1) Xác thực
        $me = Auth::user(); // ['uid'=>..., 'role'=>..., 'email'=>..., ...] // Sửa lại key là uid
        if (!$me || !in_array($me['role'], ['admin', 'salon'], true)) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        // 2) Lấy salon và kiểm tra quyền sở hữu
        $salonId = (int)($params['salon_id'] ?? 0);
        if ($salonId <= 0) {
            return $this->json(['error' => 'Salon not found'], 404);
        }

        $pdo = DB::pdo();
        $st  = $pdo->prepare('SELECT id, owner_user_id FROM salons WHERE id=? LIMIT 1');
        $st->execute([$salonId]);
        $salon = $st->fetch();

        if (!$salon) {
            return $this->json(['error' => 'Salon not found'], 404);
        }

        // Nếu là chủ salon thì id phải khớp owner_user_id; admin thì qua cửa
        // SỬA Ở ĐÂY: Dùng $me['id'] thay vì $me['uid']
        if ($me['role'] === 'salon' && (int)$me['uid'] !== (int)$salon['owner_user_id']) {
             return $this->json(['error' => 'Forbidden - Bạn không phải chủ salon này'], 403);
        }

        // 3) Đọc body (Đã sửa ở lần trước để chấp nhận camelCase)
        $body     = $this->body();
        $name     = trim($body['name']        ?? '');
        $category = trim($body['category']    ?? '');
    // Accept both snake_case (duration_min, base_price) and camelCase (durationMin, price)
    $duration = (int)($body['duration_min'] ?? $body['durationMin'] ?? 0);
    $price    = (int)($body['base_price'] ?? $body['price'] ?? 0);

        if ($name === '' || $category === '' || $duration <= 0 || $price <= 0) {
            return $this->json(['error' => 'Thiếu dữ liệu bắt buộc'], 400);
        }

        // 4) Slug + chống trùng
        $baseSlug = Str::slug($name);

        // Cách B: chặn trùng, trả 409
        $chk = $pdo->prepare('SELECT id FROM services WHERE salon_id=? AND slug=? LIMIT 1');
        $chk->execute([$salonId, $baseSlug]);
        if ($chk->fetch()) {
            return $this->json(['error' => 'Tên dịch vụ đã tồn tại'], 409);
        }

        // Hoặc bật Cách C: tự tạo slug duy nhất
        $slug = $baseSlug;
        // $slug = $this->uniqueSlug($pdo, $salonId, $baseSlug);

        // 5) Ghi DB
        try {
            $ins = $pdo->prepare(
                'INSERT INTO services(salon_id, name, slug, category, duration_min, base_price)
                 VALUES (?, ?, ?, ?, ?, ?)'
            );
            $ins->execute([$salonId, $name, $slug, $category, $duration, $price]);

            return $this->json([
                'message'    => 'Tạo dịch vụ thành công',
                'service_id' => (int)$pdo->lastInsertId(),
            ], 201); // Trả về 201 Created cho chuẩn REST
        } catch (\PDOException $e) {
            // 23000: vi phạm ràng buộc (unique...)
            if ($e->getCode() === '23000') {
                return $this->json(['error' => 'Tên dịch vụ đã tồn tại'], 409);
            }
            // Log lỗi để debug phía server nếu cần
            error_log("Service Create Error: " . $e->getMessage());
            // Không phơi nội tạng hệ thống
            return $this->json(['error' => 'Lỗi hệ thống'], 500);
        }
    }
    // PUT /api/v1/salons/{salonId}/services/{id}
    public function update(array $params)
    {
         // 1) Xác thực & Kiểm tra quyền (Tương tự hàm create)
         $me = Auth::user(); // ['uid'=>..., 'role'=>...]
         if (!$me || !in_array($me['role'], ['admin', 'salon'], true)) {
        return $this->json(['error' => 'Unauthorized'], 401);
         }

         $salonId = (int)($params['salon_id'] ?? 0);
         $serviceId = (int)($params['id'] ?? 0);
         if ($salonId <= 0 || $serviceId <= 0) {
        return $this->json(['error' => 'Invalid Salon ID or Service ID'], 400);
        }

        $pdo = DB::pdo();
        // Lấy cả salon và service để kiểm tra
         $st = $pdo->prepare('SELECT s.owner_user_id, sv.id as service_exists
                         FROM salons s LEFT JOIN services sv ON s.id = sv.salon_id AND sv.id = ?
                         WHERE s.id = ? LIMIT 1');
        $st->execute([$serviceId, $salonId]);
        $result = $st->fetch();

        if (!$result || !$result['service_exists']) {
        return $this->json(['error' => 'Salon or Service not found'], 404);
        }

         if ($me['role'] === 'salon' && (int)$me['uid'] !== (int)$result['owner_user_id']) {
        return $this->json(['error' => 'Forbidden - Not owner'], 403);
        }

        // 2) Đọc body (Nhận camelCase từ frontend)
         $body        = $this->body();
    $name        = trim($body['name'] ?? '');
    $category    = trim($body['category'] ?? '');
    // Accept both camelCase and snake_case from clients
    $duration    = null;
    if (isset($body['durationMin'])) $duration = (int)$body['durationMin'];
    elseif (isset($body['duration_min'])) $duration = (int)$body['duration_min'];
    $price       = null;
    if (isset($body['price'])) $price = (int)$body['price'];
    elseif (isset($body['base_price'])) $price = (int)$body['base_price'];
    $description = isset($body['description']) ? trim($body['description']) : null;
    $isActive    = null;
    if (isset($body['isActive'])) $isActive = (bool)$body['isActive'];
    elseif (isset($body['active'])) $isActive = (bool)$body['active']; // Dùng bool cho active

        // Validate dữ liệu cơ bản (có thể thêm validate chi tiết hơn)
        if ($name === '' || $category === '' || $duration === null || $price === null || $duration <= 0 || $price < 0) {
         return $this->json(['error' => 'Thiếu hoặc sai dữ liệu bắt buộc (name, category, durationMin, price)'], 400);
        }


        // 3) Cập nhật DB
        // Tạo slug mới dựa trên tên mới
        $slug = Str::slug($name);

        // Kiểm tra trùng slug (ngoại trừ chính service này)
        $chk = $pdo->prepare('SELECT id FROM services WHERE salon_id=? AND slug=? AND id != ? LIMIT 1');
        $chk->execute([$salonId, $slug, $serviceId]);
        if ($chk->fetch()) {
        return $this->json(['error' => 'Tên dịch vụ mới đã tồn tại'], 409);
        }

        try {
        $updateSt = $pdo->prepare(
            'UPDATE services SET
                name = ?, slug = ?, category = ?, duration_min = ?, base_price = ?,
                description = ?, active = ?
             WHERE id = ? AND salon_id = ?'
        );
        $updateSt->execute([
            $name, $slug, $category, $duration, $price,
            $description, (int)$isActive, // Chuyển bool thành 0/1 cho DB
            $serviceId, $salonId
        ]);

        if ($updateSt->rowCount() > 0) {
             return $this->json(['message' => 'Cập nhật thành công']);
        } else {
             // Có thể serviceId không khớp salonId, hoặc không có gì thay đổi
             return $this->json(['message' => 'Không có gì thay đổi hoặc lỗi']);
        }
         } catch (\PDOException $e) {
         error_log("Service Update Error: " . $e->getMessage());
         return $this->json(['error' => 'Lỗi hệ thống'], 500);
         }
    }
    public function delete(array $params)
{
    // 1) Xác thực & Kiểm tra quyền (Tương tự hàm update)
    $me = Auth::user(); // ['uid'=>..., 'role'=>...]
    if (!$me || !in_array($me['role'], ['admin', 'salon'], true)) {
        return $this->json(['error' => 'Unauthorized'], 401);
    }

    $salonId = (int)($params['salon_id'] ?? 0);
    $serviceId = (int)($params['id'] ?? 0);
    if ($salonId <= 0 || $serviceId <= 0) {
        return $this->json(['error' => 'Invalid Salon ID or Service ID'], 400);
    }

    $pdo = DB::pdo();
    // Lấy owner_id để kiểm tra quyền
    $st = $pdo->prepare('SELECT owner_user_id FROM salons WHERE id = ? LIMIT 1');
    $st->execute([$salonId]);
    $ownerId = $st->fetchColumn();

    if ($ownerId === false) {
         return $this->json(['error' => 'Salon not found'], 404);
    }

    if ($me['role'] === 'salon' && (int)$me['uid'] !== (int)$ownerId) {
        return $this->json(['error' => 'Forbidden - Not owner'], 403);
    }

    // 2) Thực hiện xóa
    try {
        // Chỉ xóa service nếu nó thuộc đúng salon
        $delSt = $pdo->prepare('DELETE FROM services WHERE id = ? AND salon_id = ?');
        $delSt->execute([$serviceId, $salonId]);

        if ($delSt->rowCount() > 0) {
            return $this->json(['ok' => true, 'message' => 'Xóa dịch vụ thành công']);
        } else {
            // Service không tồn tại hoặc không thuộc salon này
            return $this->json(['error' => 'Không tìm thấy dịch vụ để xóa'], 404);
        }
    } catch (\PDOException $e) {
         // Kiểm tra lỗi khóa ngoại (nếu service đã được dùng trong booking chẳng hạn)
         if (strpos($e->getMessage(), 'foreign key constraint fails') !== false) {
              return $this->json(['error' => 'Không thể xóa dịch vụ đã được sử dụng'], 409); // Conflict
         }
         error_log("Service Delete Error: " . $e->getMessage());
         return $this->json(['error' => 'Lỗi hệ thống'], 500);
    }
}
    // Cách C: tự tạo slug duy nhất theo salon
    private function uniqueSlug(\PDO $pdo, int $salonId, string $base): string
    {
        $slug = $base;
        $i = 2;
        $q = $pdo->prepare('SELECT 1 FROM services WHERE salon_id=? AND slug=? LIMIT 1');
        while (true) {
            $q->execute([$salonId, $slug]);
            if (!$q->fetch()) return $slug;
            $slug = $base . '-' . $i++;
        }
    }
}