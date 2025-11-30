<?php
namespace App\Controllers;
use App\Core\Controller;
use App\Config\DB;
use App\Core\Auth;

class SalonController extends Controller {
  public function index(){
    $pdo = DB::pdo();
    $st = $pdo->query("SELECT id,name,address_text,rating_avg,open_time,close_time,created_at FROM salons ORDER BY created_at DESC LIMIT 50");
    return $this->json(['items'=>$st->fetchAll()]);
  }

  public function show($params){
    $id = (int)($params['id'] ?? 0);

    if($id <= 0) {
      return $this->json(['error'=>'ID không hợp lệ'], 400);
    }

    $pdo = DB::pdo();

    // Fetch salon info
    $st = $pdo->prepare("SELECT * FROM salons WHERE id=?");
    $st->execute([$id]);
    $s = $st->fetch(\PDO::FETCH_ASSOC);

    if(!$s) {
      return $this->json(['error'=>'Không tìm thấy salon với ID: ' . $id], 404);
    }

    // Fetch services
    $svc = $pdo->prepare('SELECT id, name, duration_min AS durationMin, base_price AS price, active FROM services WHERE salon_id = ? AND active = 1 ORDER BY name');
    $svc->execute([$id]);
    $services = $svc->fetchAll(\PDO::FETCH_ASSOC);

    // Fetch stylists
    $sty = $pdo->prepare('SELECT id, full_name AS fullName, bio, rating_avg AS ratingAvg, rating_count AS ratingCount, active FROM stylists WHERE salon_id = ? AND active = 1 ORDER BY full_name');
    $sty->execute([$id]);
    $stylists = $sty->fetchAll(\PDO::FETCH_ASSOC);

    // Fetch recent reviews
    $revSql = "SELECT r.id, r.booking_id, r.salon_id, r.stylist_id, r.customer_id, r.rating, r.comment, r.created_at, u.full_name AS customerName, st.full_name AS stylistName
               FROM reviews r
               LEFT JOIN users u ON r.customer_id = u.id
               LEFT JOIN stylists st ON r.stylist_id = st.id
               WHERE r.salon_id = ? AND r.visible = 1
               ORDER BY r.created_at DESC
               LIMIT 50";
    $rev = $pdo->prepare($revSql);
    $rev->execute([$id]);
    $reviews = $rev->fetchAll(\PDO::FETCH_ASSOC);

    // Normalize rating to int
    foreach($reviews as &$rr) {
      $rr['rating'] = isset($rr['rating']) ? (int)$rr['rating'] : 0;
    }

    return $this->json([
      'salon' => $s,
      'services' => $services,
      'stylists' => $stylists,
      'reviews' => $reviews
    ]);
  }

  // Lấy salon của user hiện tại (cho salon owner)
  public function getMySalon() {
    $me = Auth::user();
    if (!$me || !isset($me['uid'])) {
      return $this->json(['error' => 'Unauthorized'], 401);
    }

    $pdo = DB::pdo();
    $st = $pdo->prepare("SELECT * FROM salons WHERE owner_user_id = ? LIMIT 1");
    $st->execute([$me['uid']]);
    $salon = $st->fetch(\PDO::FETCH_ASSOC);

    if (!$salon) {
      return $this->json([
        'error' => 'Không tìm thấy salon',
        'message' => 'Vui lòng tạo salon trong mục Quản lý Salon'
      ], 404);
    }

    if ($salon['status'] !== 'published') {
      return $this->json([
        'error' => 'Salon chưa được kích hoạt',
        'message' => 'Vui lòng liên hệ admin để kích hoạt salon'
      ], 403);
    }

    return $this->json(['salon' => $salon]);
  }

  // Tạo salon mới (chỉ cho salon owner)
  public function create() {
    $me = Auth::user();
    if (!$me || !isset($me['uid'])) {
      return $this->json(['error' => 'Unauthorized'], 401);
    }

    // Kiểm tra role
    if ($me['role'] !== 'salon') {
      return $this->json(['error' => 'Chỉ salon owner mới được tạo salon'], 403);
    }

    $pdo = DB::pdo();

    // Kiểm tra xem user đã có salon chưa
    $check = $pdo->prepare("SELECT id FROM salons WHERE owner_user_id = ? LIMIT 1");
    $check->execute([$me['uid']]);
    if ($check->fetch()) {
      return $this->json(['error' => 'Bạn đã có salon rồi. Mỗi tài khoản chỉ được tạo 1 salon'], 409);
    }

    $body = $this->body();
    $name = trim($body['name'] ?? '');
    $address = trim($body['address_text'] ?? '');
    $phone = trim($body['phone'] ?? '');
    $email = trim($body['email'] ?? '');
    $description = trim($body['description'] ?? '');
    $openTime = trim($body['open_time'] ?? '08:00:00');
    $closeTime = trim($body['close_time'] ?? '21:00:00');

    if ($name === '' || $address === '') {
      return $this->json(['error' => 'Tên salon và địa chỉ là bắt buộc'], 400);
    }

    // Validate time format (HH:MM hoặc HH:MM:SS)
    if ($openTime && !preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/', $openTime)) {
      return $this->json(['error' => 'Giờ mở cửa không đúng định dạng (HH:MM)'], 400);
    }
    if ($closeTime && !preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/', $closeTime)) {
      return $this->json(['error' => 'Giờ đóng cửa không đúng định dạng (HH:MM)'], 400);
    }

    // Tạo slug từ tên
    $slug = $this->createSlug($name);

    // Kiểm tra slug trùng
    $slugCheck = $pdo->prepare("SELECT id FROM salons WHERE slug = ? LIMIT 1");
    $slugCheck->execute([$slug]);
    if ($slugCheck->fetch()) {
      $slug = $slug . '-' . time();
    }

    // Insert salon
    $ins = $pdo->prepare("INSERT INTO salons(owner_user_id, name, slug, description, phone, email, address_text, open_time, close_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')");
    $ins->execute([$me['uid'], $name, $slug, $description, $phone, $email, $address, $openTime, $closeTime]);

    $salonId = (int)$pdo->lastInsertId();

    return $this->json([
      'message' => 'Tạo salon thành công',
      'salon_id' => $salonId
    ], 201);
  }

  // Cập nhật salon
  public function update($params) {
    $me = Auth::user();
    if (!$me || !isset($me['uid'])) {
      return $this->json(['error' => 'Unauthorized'], 401);
    }

    $id = (int)($params['id'] ?? 0);
    if ($id <= 0) {
      return $this->json(['error' => 'ID không hợp lệ'], 400);
    }

    $pdo = DB::pdo();

    // Kiểm tra quyền sở hữu
    $st = $pdo->prepare("SELECT owner_user_id FROM salons WHERE id = ?");
    $st->execute([$id]);
    $salon = $st->fetch(\PDO::FETCH_ASSOC);

    if (!$salon) {
      return $this->json(['error' => 'Không tìm thấy salon'], 404);
    }

    if ($me['role'] !== 'admin' && $salon['owner_user_id'] != $me['uid']) {
      return $this->json(['error' => 'Bạn không có quyền sửa salon này'], 403);
    }

    $body = $this->body();
    $name = trim($body['name'] ?? '');
    $address = trim($body['address_text'] ?? '');
    $phone = trim($body['phone'] ?? '');
    $email = trim($body['email'] ?? '');
    $description = trim($body['description'] ?? '');
    $avatar = trim($body['avatar'] ?? '');
    $openTime = trim($body['open_time'] ?? '08:00:00');
    $closeTime = trim($body['close_time'] ?? '21:00:00');

    if ($name === '' || $address === '') {
      return $this->json(['error' => 'Tên salon và địa chỉ là bắt buộc'], 400);
    }

    // Validate time format
    if ($openTime && !preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/', $openTime)) {
      return $this->json(['error' => 'Giờ mở cửa không đúng định dạng (HH:MM)'], 400);
    }
    if ($closeTime && !preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/', $closeTime)) {
      return $this->json(['error' => 'Giờ đóng cửa không đúng định dạng (HH:MM)'], 400);
    }

    // Update
    $upd = $pdo->prepare("UPDATE salons SET name = ?, description = ?, phone = ?, email = ?, address_text = ?, avatar = ?, open_time = ?, close_time = ? WHERE id = ?");
    $upd->execute([$name, $description, $phone, $email, $address, $avatar, $openTime, $closeTime, $id]);

    return $this->json(['message' => 'Cập nhật salon thành công']);
  }

  // Xóa salon
  public function delete($params) {
    $me = Auth::user();
    if (!$me || !isset($me['uid'])) {
      return $this->json(['error' => 'Unauthorized'], 401);
    }

    $id = (int)($params['id'] ?? 0);
    if ($id <= 0) {
      return $this->json(['error' => 'ID không hợp lệ'], 400);
    }

    $pdo = DB::pdo();

    // Kiểm tra quyền sở hữu
    $st = $pdo->prepare("SELECT owner_user_id FROM salons WHERE id = ?");
    $st->execute([$id]);
    $salon = $st->fetch(\PDO::FETCH_ASSOC);

    if (!$salon) {
      return $this->json(['error' => 'Không tìm thấy salon'], 404);
    }

    if ($me['role'] !== 'admin' && $salon['owner_user_id'] != $me['uid']) {
      return $this->json(['error' => 'Bạn không có quyền xóa salon này'], 403);
    }

    // Xóa salon (cascade sẽ xóa services, stylists, bookings liên quan)
    $del = $pdo->prepare("DELETE FROM salons WHERE id = ?");
    $del->execute([$id]);

    return $this->json(['message' => 'Xóa salon thành công']);
  }

  // Helper: Tạo slug từ tên
  private function createSlug($str) {
    $str = mb_strtolower($str, 'UTF-8');
    $str = preg_replace('/[àáạảãâầấậẩẫăằắặẳẵ]/u', 'a', $str);
    $str = preg_replace('/[èéẹẻẽêềếệểễ]/u', 'e', $str);
    $str = preg_replace('/[ìíịỉĩ]/u', 'i', $str);
    $str = preg_replace('/[òóọỏõôồốộổỗơờớợởỡ]/u', 'o', $str);
    $str = preg_replace('/[ùúụủũưừứựửữ]/u', 'u', $str);
    $str = preg_replace('/[ỳýỵỷỹ]/u', 'y', $str);
    $str = preg_replace('/đ/u', 'd', $str);
    $str = preg_replace('/[^a-z0-9\s-]/u', '', $str);
    $str = preg_replace('/[\s-]+/', '-', $str);
    return trim($str, '-');
  }
}