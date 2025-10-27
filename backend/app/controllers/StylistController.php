<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Config\DB;
use App\Core\Auth; // Make sure Auth is imported

class StylistController extends Controller {

    // GET /api/v1/salons/{salonId}/stylists
    public function index(array $params) {
        $salonId = (int)($params['salon_id'] ?? 0);
        if ($salonId <= 0) {
            return $this->json(['error' => 'Invalid Salon ID'], 400);
        }

        // Pagination and Search params
        $page   = max(1, (int)($_GET['page'] ?? 1));
        $limit  = max(5, (int)($_GET['limit'] ?? 10));
        $search = trim($_GET['search'] ?? '');
        $offset = ($page - 1) * $limit;

        $pdo = DB::pdo();
        $where = 'salon_id = ?';
        $args = [$salonId];

        if ($search !== '') {
            $where .= ' AND full_name LIKE ?'; // Search by full_name
            $args[] = '%' . $search . '%';
        }

        // Get total count
        $stTotal = $pdo->prepare("SELECT COUNT(*) FROM stylists WHERE $where");
        $stTotal->execute($args);
        $total = (int)$stTotal->fetchColumn();

        // Get items (Match frontend Stylist type: camelCase, boolean active, array specialties)
    // interpolate LIMIT/OFFSET as integers to avoid driver issues with bound LIMIT
    $limitInt = (int)$limit;
    $offsetInt = (int)$offset;
    $sql = "SELECT id, salon_id AS salonId, user_id AS userId, full_name AS fullName,
            bio, specialties, rating_avg AS ratingAvg, rating_count AS ratingCount,
            active, created_at AS createdAt, updated_at AS updatedAt
         FROM stylists
         WHERE $where
         ORDER BY full_name
         LIMIT {$limitInt} OFFSET {$offsetInt}";
    $st = $pdo->prepare($sql);
    $st->execute($args);
        $items = $st->fetchAll(\PDO::FETCH_ASSOC);

        // Convert specialties JSON string to array and active to boolean
        $items = array_map(function ($item) {
            $item['active'] = (bool)$item['active'];
            // specialties might be NULL in DB
            $item['specialties'] = $item['specialties'] ? json_decode($item['specialties'], true) : [];
            // Ensure numeric types are correct
            $item['ratingAvg'] = (float)$item['ratingAvg'];
            $item['ratingCount'] = (int)$item['ratingCount'];
            return $item;
        }, $items);

        return $this->json([
            'items' => $items,
            'total' => $total,
            'page'  => $page,
            'limit' => $limit,
        ]);
    }

    // POST /api/v1/salons/{salonId}/stylists
    public function create(array $params) {
        // 1) Auth & Permissions
        $me = Auth::user(); // ['uid'=>..., 'role'=>...]
        if (!$me || !in_array($me['role'], ['admin', 'salon'], true)) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $salonId = (int)($params['salon_id'] ?? 0);
        if ($salonId <= 0) return $this->json(['error' => 'Invalid Salon ID'], 400);

        $pdo = DB::pdo();
        // Check if salon exists and get owner_id for permission check
        $stSalon = $pdo->prepare('SELECT owner_user_id FROM salons WHERE id = ? LIMIT 1');
        $stSalon->execute([$salonId]);
        $ownerId = $stSalon->fetchColumn();
        if ($ownerId === false) return $this->json(['error' => 'Salon not found'], 404);

        // Check ownership if user role is 'salon'
        if ($me['role'] === 'salon' && (int)$me['uid'] !== (int)$ownerId) {
            return $this->json(['error' => 'Forbidden - Not owner'], 403);
        }

        // 2) Read body (expects camelCase from frontend)
        $b   = $this->body();
        $name = trim($b['fullName'] ?? ''); // Use fullName
        $bio  = isset($b['bio']) ? trim($b['bio']) : null;
        $spec = isset($b['specialties']) && is_array($b['specialties']) ? $b['specialties'] : []; // Expect array
        $active = isset($b['active']) ? (bool)$b['active'] : true; // Expect boolean

        if ($name === '') return $this->json(['error' => 'Thiếu tên stylist (fullName)'], 400);

        // 3) Insert into DB
        try {
            $ins = $pdo->prepare(
                'INSERT INTO stylists(salon_id, full_name, bio, specialties, active)
                 VALUES (?, ?, ?, ?, ?)'
            );
            // Encode specialties array to JSON string for DB
            $ins->execute([$salonId, $name, $bio, json_encode($spec, JSON_UNESCAPED_UNICODE), (int)$active]);
            $newId = $pdo->lastInsertId();

            // Fetch the created stylist to return (optional but good practice)
             $stNew = $pdo->prepare('SELECT id, salon_id AS salonId, user_id AS userId, full_name AS fullName, bio, specialties, rating_avg AS ratingAvg, rating_count AS ratingCount, active, created_at AS createdAt, updated_at AS updatedAt FROM stylists WHERE id = ?');
             $stNew->execute([$newId]);
             $newStylist = $stNew->fetch(\PDO::FETCH_ASSOC);
             if ($newStylist) {
                $newStylist['active'] = (bool)$newStylist['active'];
                $newStylist['specialties'] = $newStylist['specialties'] ? json_decode($newStylist['specialties'], true) : [];
             }


            return $this->json($newStylist ?: ['stylist_id' => $newId, 'message' => 'Tạo stylist thành công'], 201);
        } catch (\PDOException $e) {
            error_log("Stylist Create Error: " . $e->getMessage());
            return $this->json(['error' => 'Lỗi hệ thống khi tạo stylist'], 500);
        }
    }

    // PUT /api/v1/salons/{salonId}/stylists/{id}
    public function update(array $params) {
        // 1) Auth & Permissions
        $me = Auth::user();
        if (!$me || !in_array($me['role'], ['admin', 'salon'], true)) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $salonId = (int)($params['salon_id'] ?? 0);
        $stylistId = (int)($params['id'] ?? 0);
        if ($salonId <= 0 || $stylistId <= 0) {
            return $this->json(['error' => 'Invalid Salon ID or Stylist ID'], 400);
        }

        $pdo = DB::pdo();
        // Check if salon exists and get owner_id
        $stSalon = $pdo->prepare('SELECT owner_user_id FROM salons WHERE id = ? LIMIT 1');
        $stSalon->execute([$salonId]);
        $ownerId = $stSalon->fetchColumn();
        if ($ownerId === false) return $this->json(['error' => 'Salon not found'], 404);

        // Check ownership
        if ($me['role'] === 'salon' && (int)$me['uid'] !== (int)$ownerId) {
            return $this->json(['error' => 'Forbidden - Not owner'], 403);
        }

        // 2) Read body
        $b = $this->body();
        $name = isset($b['fullName']) ? trim($b['fullName']) : null;
        $bio = isset($b['bio']) ? trim($b['bio']) : null;
        $spec = isset($b['specialties']) && is_array($b['specialties']) ? $b['specialties'] : null;
        $active = isset($b['active']) ? (bool)$b['active'] : null;

        if ($name === '') { // Name is required for update
            return $this->json(['error' => 'Tên stylist (fullName) không được để trống'], 400);
        }

        // 3) Update DB
        try {
            // Build SET clause dynamically based on provided fields
            $setClauses = [];
            $updateArgs = [];

            if ($name !== null) {
                $setClauses[] = 'full_name = ?';
                $updateArgs[] = $name;
            }
            if ($bio !== null) {
                $setClauses[] = 'bio = ?';
                $updateArgs[] = $bio;
            }
            if ($spec !== null) {
                $setClauses[] = 'specialties = ?';
                $updateArgs[] = json_encode($spec, JSON_UNESCAPED_UNICODE);
            }
            if ($active !== null) {
                $setClauses[] = 'active = ?';
                $updateArgs[] = (int)$active;
            }

            if (empty($setClauses)) {
                return $this->json(['message' => 'Không có dữ liệu để cập nhật'], 200);
            }

            $sql = 'UPDATE stylists SET ' . implode(', ', $setClauses) . ' WHERE id = ? AND salon_id = ?';
            $updateArgs[] = $stylistId;
            $updateArgs[] = $salonId;

            $updateSt = $pdo->prepare($sql);
            $updateSt->execute($updateArgs);

            if ($updateSt->rowCount() > 0) {
                 // Fetch updated data to return
                 $stUpdated = $pdo->prepare('SELECT id, salon_id AS salonId, user_id AS userId, full_name AS fullName, bio, specialties, rating_avg AS ratingAvg, rating_count AS ratingCount, active, created_at AS createdAt, updated_at AS updatedAt FROM stylists WHERE id = ?');
                 $stUpdated->execute([$stylistId]);
                 $updatedStylist = $stUpdated->fetch(\PDO::FETCH_ASSOC);
                 if ($updatedStylist) {
                    $updatedStylist['active'] = (bool)$updatedStylist['active'];
                    $updatedStylist['specialties'] = $updatedStylist['specialties'] ? json_decode($updatedStylist['specialties'], true) : [];
                 }
                return $this->json($updatedStylist ?: ['message' => 'Cập nhật thành công']);
            } else {
                // Check if stylist actually exists for this salon
                $chk = $pdo->prepare('SELECT 1 FROM stylists WHERE id = ? AND salon_id = ?');
                $chk->execute([$stylistId, $salonId]);
                if (!$chk->fetch()) {
                    return $this->json(['error' => 'Stylist không tồn tại hoặc không thuộc salon này'], 404);
                }
                return $this->json(['message' => 'Không có gì thay đổi']);
            }
        } catch (\PDOException $e) {
            error_log("Stylist Update Error: " . $e->getMessage());
            return $this->json(['error' => 'Lỗi hệ thống khi cập nhật stylist'], 500);
        }
    }

    // DELETE /api/v1/salons/{salonId}/stylists/{id}
    public function delete(array $params) {
        // 1) Auth & Permissions (Similar to update)
        $me = Auth::user();
        if (!$me || !in_array($me['role'], ['admin', 'salon'], true)) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $salonId = (int)($params['salon_id'] ?? 0);
        $stylistId = (int)($params['id'] ?? 0);
        if ($salonId <= 0 || $stylistId <= 0) {
            return $this->json(['error' => 'Invalid Salon ID or Stylist ID'], 400);
        }

        $pdo = DB::pdo();
        // Check salon owner
        $stSalon = $pdo->prepare('SELECT owner_user_id FROM salons WHERE id = ? LIMIT 1');
        $stSalon->execute([$salonId]);
        $ownerId = $stSalon->fetchColumn();
        if ($ownerId === false) return $this->json(['error' => 'Salon not found'], 404);

        if ($me['role'] === 'salon' && (int)$me['uid'] !== (int)$ownerId) {
            return $this->json(['error' => 'Forbidden - Not owner'], 403);
        }

        // 2) Delete from DB
        try {
            // Only delete if stylist belongs to the specified salon
            $delSt = $pdo->prepare('DELETE FROM stylists WHERE id = ? AND salon_id = ?');
            $delSt->execute([$stylistId, $salonId]);

            if ($delSt->rowCount() > 0) {
                return $this->json(['ok' => true, 'message' => 'Xóa stylist thành công']);
            } else {
                return $this->json(['error' => 'Không tìm thấy stylist để xóa'], 404);
            }
        } catch (\PDOException $e) {
             // Check foreign key constraint (e.g., stylist assigned to bookings)
             if (strpos($e->getMessage(), 'foreign key constraint fails') !== false) {
                  return $this->json(['error' => 'Không thể xóa stylist đã có lịch hẹn'], 409); // Conflict
             }
            error_log("Stylist Delete Error: " . $e->getMessage());
            return $this->json(['error' => 'Lỗi hệ thống khi xóa stylist'], 500);
        }
    }
}