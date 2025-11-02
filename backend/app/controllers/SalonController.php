<?php
namespace App\Controllers;
use App\Core\Controller;
use App\Config\DB;

class SalonController extends Controller {
  public function index(){
    $pdo = DB::pdo();
    $st = $pdo->query("SELECT id,name,address_text,rating_avg,created_at FROM salons ORDER BY created_at DESC LIMIT 50");
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
}