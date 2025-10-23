<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Config\DB;

class BookingController extends Controller {
  // POST /api/v1/bookings
  // body: { "customer_id":2, "salon_id":1, "stylist_id":1, "appointment_at":"2025-10-25 10:00:00",
  //         "items":[ {"service_id":1,"qty":1}, {"service_id":2,"qty":1} ] }
  public function create() {
    $b = json_decode(file_get_contents('php://input'), true) ?: [];
    $cid = (int)($b['customer_id'] ?? 0);
    $sid = (int)($b['salon_id'] ?? 0);
    $sty = isset($b['stylist_id']) ? (int)$b['stylist_id'] : null;
    $at  = trim($b['appointment_at'] ?? '');
    $items = $b['items'] ?? [];

    if ($cid<=0 || $sid<=0 || !$at || !preg_match('/^\d{4}\-\d{2}\-\d{2}\s\d{2}:\d{2}:\d{2}$/',$at) || empty($items)) {
      return $this->json(['error'=>'Thiếu hoặc sai dữ liệu'], 400);
    }

    $pdo = DB::pdo();
    $pdo->beginTransaction();
    try {
      // 1) tồn tại salon/user
      $chk = $pdo->prepare('SELECT id, open_time, close_time FROM salons WHERE id=?');
      $chk->execute([$sid]);
      $salon = $chk->fetch();
      if (!$salon) throw new \Exception('Salon không tồn tại', 404);

      $u = $pdo->prepare('SELECT id FROM users WHERE id=?');
      $u->execute([$cid]);
      if (!$u->fetch()) throw new \Exception('Khách hàng không tồn tại', 404);

      if ($sty) {
        $s = $pdo->prepare('SELECT id FROM stylists WHERE id=? AND salon_id=?');
        $s->execute([$sty,$sid]);
        if (!$s->fetch()) throw new \Exception('Stylist không thuộc salon', 400);
      }

      $date = substr($at,0,10);
      $weekday = (int)date('N', strtotime($date));

      // 2) holiday
      $h = $pdo->prepare('SELECT 1 FROM holidays WHERE salon_id=? AND off_date=? AND (stylist_id '.($sty?'=?':'IS NULL').') LIMIT 1');
      $h->execute($sty? [$sid,$date,$sty] : [$sid,$date]);
      if ($h->fetch()) throw new \Exception('Ngày này nghỉ', 409);

      // 3) lấy dịch vụ và tính tổng thời gian, tiền
      $svcIds = array_map(fn($i)=>(int)$i['service_id'], $items);
      $in = implode(',', array_fill(0, count($svcIds), '?'));
      $q = $pdo->prepare("SELECT id, duration_min, base_price FROM services WHERE salon_id=? AND id IN ($in)");
      $q->execute(array_merge([$sid], $svcIds));
      $found = $q->fetchAll();
      if (count($found) !== count($svcIds)) throw new \Exception('Có dịch vụ không thuộc salon', 400);

      $map=[]; foreach($found as $r){ $map[$r['id']]=$r; }
      $totalMin=0; $subtotal=0;
      foreach($items as $it){
        $sv = $map[(int)$it['service_id']];
        $qty = max(1,(int)($it['qty'] ?? 1));
        $totalMin += $sv['duration_min'] * $qty;
        $subtotal += $sv['base_price'] * $qty;
      }
      $discount = 0; // chưa áp voucher cho đơn giản
      $totalAmt = $subtotal - $discount;

      // 4) nằm trong working hours?
      $slotStart = strtotime($at);
      $slotEnd   = $slotStart + $totalMin*60;

      // ưu tiên working_hours theo stylist, nếu không có thì fallback salon.open/close
      $wh = $pdo->prepare("SELECT start_time, end_time FROM working_hours
                            WHERE salon_id=? AND weekday=? AND (stylist_id ".($sty?'=?':'IS NULL').")");
      $wh->execute($sty? [$sid,$weekday,$sty] : [$sid,$weekday]);
      $hours = $wh->fetchAll();
      if (!$hours) {
        if (!$salon['open_time'] || !$salon['close_time']) throw new \Exception('Salon chưa cấu hình giờ mở cửa', 400);
        $hours = [ ['start_time'=>$salon['open_time'],'end_time'=>$salon['close_time']] ];
      }
      $inside = false;
      foreach($hours as $h){
        $ws = strtotime("$date ".$h['start_time']);
        $we = strtotime("$date ".$h['end_time']);
        if ($slotStart >= $ws && $slotEnd <= $we) { $inside = true; break; }
      }
      if (!$inside) throw new \Exception('Ngoài giờ làm việc', 409);

      // 5) không chồng lịch pending/confirmed
      $bq = $pdo->prepare("SELECT appointment_at,total_minutes FROM bookings
                           WHERE salon_id=? ".($sty?'AND stylist_id='.$pdo->quote($sty):'')."
                           AND status IN ('pending','confirmed')
                           AND DATE(appointment_at)=?");
      $bq->execute([$sid,$date]);
      while($r=$bq->fetch()){
        $bs = strtotime($r['appointment_at']);
        $be = $bs + ((int)$r['total_minutes']*60);
        if ($slotStart < $be && $slotEnd > $bs) throw new \Exception('Khung giờ đã bị đặt', 409);
      }

      // 6) tạo booking + booking_services
      $ins = $pdo->prepare('INSERT INTO bookings(customer_id,salon_id,stylist_id,appointment_at,total_minutes,subtotal_amt,discount_amt,total_amt,status)
                            VALUES (?,?,?,?,?,?,?,?,"pending")');
      $ins->execute([$cid,$sid,$sty,$at,$totalMin,$subtotal,$discount,$totalAmt]);
      $bid = $pdo->lastInsertId();

      $bs = $pdo->prepare('INSERT INTO booking_services(booking_id,service_id,unit_price,duration_min,quantity)
                           VALUES (?,?,?,?,?)');
      foreach($items as $it){
        $sv = $map[(int)$it['service_id']];
        $qty = max(1,(int)($it['qty'] ?? 1));
        $bs->execute([$bid,$sv['id'],$sv['base_price'],$sv['duration_min'],$qty]);
      }

      $pdo->commit();
      return $this->json(['message'=>'Tạo lịch thành công','booking_id'=>$bid,'total_minutes'=>$totalMin,'total_amt'=>$totalAmt], 201);
    } catch(\Exception $e){
      if ($pdo->inTransaction()) $pdo->rollBack();
      $code = $e->getCode() ?: 400;
      return $this->json(['error'=>$e->getMessage()], $code);
    }
  }

  // GET /api/v1/bookings?salon_id=1&date=YYYY-MM-DD
  public function bySalonDate(){
    $sid = (int)($_GET['salon_id'] ?? 0);
    $date = $_GET['date'] ?? date('Y-m-d');
    if ($sid<=0 || !preg_match('/^\d{4}-\d{2}-\d{2}$/',$date)) return $this->json(['error'=>'Thiếu salon_id hoặc date'],400);
    $st = DB::pdo()->prepare("SELECT id, customer_id, stylist_id, appointment_at, total_minutes, status, total_amt
                              FROM bookings WHERE salon_id=? AND DATE(appointment_at)=? ORDER BY appointment_at");
    $st->execute([$sid,$date]);
    return $this->json(['items'=>$st->fetchAll()]);
  }
    public function confirm($p){
     $id = (int)($p['id'] ?? 0);
     $st = DB::pdo()->prepare("UPDATE bookings SET status='confirmed' WHERE id=? AND status IN ('pending')");
     $st->execute([$id]);
     return $this->json(['updated'=>$st->rowCount()]);
    }

    public function cancel($p){
    $id = (int)($p['id'] ?? 0);
    $st = DB::pdo()->prepare("UPDATE bookings SET status='cancelled' WHERE id=? AND status IN ('pending','confirmed')");
    $st->execute([$id]);
    return $this->json(['updated'=>$st->rowCount()]);
    }

}
