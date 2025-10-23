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
    $pdo = DB::pdo();
    $st = $pdo->prepare("SELECT * FROM salons WHERE id=?");
    $st->execute([$id]);
    $s = $st->fetch();
    if(!$s) return $this->json(['error'=>'Không tìm thấy tiệm'],404);
    return $this->json(['salon'=>$s]);
  }
}
