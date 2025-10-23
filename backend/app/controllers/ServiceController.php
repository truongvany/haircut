<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Config\DB;
use App\Core\Auth;
use App\Core\Str;

class ServiceController extends Controller
{
    // POST /api/v1/salons/{salonId}/services
    public function create(array $params)
    {
        // 1) Xác thực
        $me = Auth::user(); // ['uid'=>..., 'role'=>..., 'email'=>..., ...]
        if (!$me || !in_array($me['role'], ['admin', 'salon'], true)) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        // 2) Lấy salon và kiểm tra quyền sở hữu
        $salonId = (int)($params['salonId'] ?? 0);
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

        // Nếu là chủ salon thì uid phải khớp owner_user_id; admin thì qua cửa
        if ($me['role'] === 'salon' && (int)$me['uid'] !== (int)$salon['owner_user_id']) {
            return $this->json(['error' => 'Forbidden'], 403);
        }

        // 3) Đọc body
        $body     = $this->body();
        $name     = trim($body['name']        ?? '');
        $category = trim($body['category']    ?? '');
        $duration = (int)($body['duration_min'] ?? 0);
        $price    = (int)($body['base_price']   ?? 0);

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
            ]);
        } catch (\PDOException $e) {
            // 23000: vi phạm ràng buộc (unique...)
            if ($e->getCode() === '23000') {
                return $this->json(['error' => 'Tên dịch vụ đã tồn tại'], 409);
            }
            // Không phơi nội tạng hệ thống
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
