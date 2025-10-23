<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Config\DB;

class StylistController extends Controller {
  public function index($p){
    $salonId = (int)($p['salon_id'] ?? 0);
    if ($salonId<=0) return $this->json(['error'=>'salon_id không hợp lệ'],400);
    $st = DB::pdo()->prepare("SELECT id,full_name,rating_avg,rating_count,active
                              FROM stylists WHERE salon_id=? ORDER BY full_name");
    $st->execute([$salonId]);
    return $this->json(['items'=>$st->fetchAll()]);
  }

  public function create($p){
    $salonId = (int)($p['salon_id'] ?? 0);
    $b   = json_decode(file_get_contents('php://input'), true) ?: [];
    $name = trim($b['full_name'] ?? '');
    $bio  = trim($b['bio'] ?? '');
    $spec = $b['specialties'] ?? [];

    if ($salonId<=0 || $name==='') return $this->json(['error'=>'Thiếu dữ liệu'],400);
    $pdo = DB::pdo();
    $chk = $pdo->prepare('SELECT id FROM salons WHERE id=?'); $chk->execute([$salonId]);
    if (!$chk->fetch()) return $this->json(['error'=>'Salon không tồn tại'],404);

    $ins = $pdo->prepare('INSERT INTO stylists(salon_id,full_name,bio,specialties,active) VALUES (?,?,?,?,1)');
    $ins->execute([$salonId, $name, $bio, json_encode($spec, JSON_UNESCAPED_UNICODE)]);
    return $this->json(['message'=>'Tạo stylist thành công','stylist_id'=>$pdo->lastInsertId()], 201);
  }
}
