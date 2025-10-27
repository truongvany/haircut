<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Config\DB;

class BookingActionsController extends Controller {
  // PUT /api/v1/bookings/{id}/complete
  public function markCompleted($p){
    $id = (int)($p['id'] ?? 0);
    if ($id <= 0) return $this->json(['error'=>'Invalid booking id'], 400);
    $st = DB::pdo()->prepare("UPDATE bookings SET status='completed' WHERE id=? AND status IN ('confirmed')");
    $st->execute([$id]);
    return $this->json(['updated'=>$st->rowCount()]);
  }

  // PUT /api/v1/bookings/{id}/no-show
  public function markNoShow($p){
    $id = (int)($p['id'] ?? 0);
    if ($id <= 0) return $this->json(['error'=>'Invalid booking id'], 400);
    $st = DB::pdo()->prepare("UPDATE bookings SET status='no_show' WHERE id=? AND status IN ('pending','confirmed')");
    $st->execute([$id]);
    return $this->json(['updated'=>$st->rowCount()]);
  }

}
