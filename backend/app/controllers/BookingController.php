<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Config\DB;
use App\Core\Auth; // Đảm bảo đã import Auth

class BookingController extends Controller {

  // POST /api/v1/bookings
  // body: { "salon_id":1, "stylist_id":1, "appointment_at":"2025-10-25 10:00:00",
  //         "items":[ {"service_id":1,"qty":1}, {"service_id":2,"qty":1} ], "note": "..." }
  public function create() {
    // 1) Lấy thông tin người dùng đang đăng nhập từ token
    $me = Auth::user();
    if (!$me || !isset($me['uid']) || $me['role'] !== 'customer') { // Chỉ customer mới được đặt lịch
        return $this->json(['error'=>'Chỉ khách hàng mới được đặt lịch'], 403); // Forbidden
    }
    $customerId = (int)$me['uid']; // Lấy customer ID từ token

    // 2) Đọc dữ liệu từ body request
    $b = json_decode(file_get_contents('php://input'), true) ?: [];
    $sid = (int)($b['salon_id'] ?? 0);
    $sty = isset($b['stylist_id']) ? (int)$b['stylist_id'] : null; // stylist_id có thể là null
    $at  = trim($b['appointment_at'] ?? ''); // YYYY-MM-DD HH:MM:SS
    $items = isset($b['items']) && is_array($b['items']) ? $b['items'] : [];
    $note = isset($b['note']) ? trim($b['note']) : null;

    // 3) Validate dữ liệu cơ bản
    if ($sid <= 0 || !$at || !preg_match('/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/', $at) || empty($items)) {
      return $this->json(['error'=>'Thiếu hoặc sai dữ liệu salon_id, appointment_at hoặc items'], 400);
    }
    if (strtotime($at) < time() + 3600) { // Ít nhất 1 giờ trong tương lai
        return $this->json(['error'=>'Thời gian hẹn phải ở trong tương lai (ít nhất 1 giờ nữa)'], 400);
    }

    $pdo = DB::pdo();
    $pdo->beginTransaction();
    try {
        // 4) Kiểm tra tồn tại Salon
        $chkSalon = $pdo->prepare('SELECT id, open_time, close_time FROM salons WHERE id=? AND status="published"'); // Chỉ salon published
        $chkSalon->execute([$sid]);
        $salon = $chkSalon->fetch();
        if (!$salon) throw new \Exception('Salon không tồn tại hoặc chưa được công bố', 404);

        // 5) Kiểm tra tồn tại và trạng thái Stylist (nếu được chọn)
        if ($sty) {
            $chkStylist = $pdo->prepare('SELECT id FROM stylists WHERE id=? AND salon_id=? AND active=1');
            $chkStylist->execute([$sty, $sid]);
            if (!$chkStylist->fetch()) throw new \Exception('Stylist không tồn tại, không thuộc salon hoặc không hoạt động', 400);
        }

        $date = substr($at, 0, 10);
        $weekday = (int)date('N', strtotime($date)); // 1 (Mon) -> 7 (Sun)

        // 6) Kiểm tra ngày nghỉ (Holiday) của Salon hoặc Stylist (nếu có)
        $holidaySql = 'SELECT 1 FROM holidays WHERE salon_id=? AND off_date=? AND (stylist_id IS NULL'; // Check salon holiday
        $holidayArgs = [$sid, $date];
        if ($sty) {
            $holidaySql .= ' OR stylist_id = ?'; // Check specific stylist holiday
            $holidayArgs[] = $sty;
        }
        $holidaySql .= ') LIMIT 1';
        $hStmt = $pdo->prepare($holidaySql);
        $hStmt->execute($holidayArgs);
        if ($hStmt->fetch()) throw new \Exception('Ngày này tiệm hoặc stylist bạn chọn đang nghỉ', 409); // Conflict

        // 7) Lấy thông tin dịch vụ, tính tổng thời gian và tiền
        $svcIds = array_map(fn($i)=>(int)($i['service_id'] ?? 0), $items);
        $validSvcIds = array_filter($svcIds, fn($id) => $id > 0);
        if (empty($validSvcIds)) throw new \Exception('Danh sách dịch vụ không hợp lệ', 400);

        $in = implode(',', array_fill(0, count($validSvcIds), '?'));
        $qSvc = $pdo->prepare("SELECT id, duration_min, base_price FROM services WHERE salon_id=? AND active=1 AND id IN ($in)");
        $qSvc->execute(array_merge([$sid], $validSvcIds));
        // fetch as associative rows and build a map id => service
        $svcRows = $qSvc->fetchAll(\PDO::FETCH_ASSOC);
        $svcMap = [];
        foreach ($svcRows as $r) {
            $svcMap[(int)$r['id']] = $r;
        }

        $totalMin = 0;
        $subtotal = 0;
        $bookedServiceDetails = [];

        foreach ($items as $it) {
            $serviceId = (int)($it['service_id'] ?? 0);
            if (!isset($svcMap[$serviceId])) continue; // Bỏ qua nếu service không hợp lệ

            $sv = $svcMap[$serviceId]; // Lấy chi tiết service
            $qty = max(1, (int)($it['qty'] ?? 1));
            $totalMin += $sv['duration_min'] * $qty;
            $subtotal += $sv['base_price'] * $qty;
            $bookedServiceDetails[] = [
                'service_id' => $sv['id'],
                'unit_price' => $sv['base_price'],
                'duration_min' => $sv['duration_min'],
                'quantity' => $qty
            ];
        }
        if (empty($bookedServiceDetails)) throw new \Exception('Không có dịch vụ hợp lệ nào được chọn', 400);

        $discount = 0; // Voucher discount amount (in VND)
        $voucherId = null;
        // Apply voucher if provided (voucher_code or voucher_id)
        $vcode = isset($b['voucher_code']) ? trim($b['voucher_code']) : '';
        $vIdIn = isset($b['voucher_id']) ? (int)$b['voucher_id'] : 0;
        if ($vcode !== '' || $vIdIn > 0) {
            // Lookup voucher by id or code
            if ($vIdIn > 0) {
                $vStmt = $pdo->prepare('SELECT * FROM vouchers WHERE id = ? AND salon_id = ? LIMIT 1');
                $vStmt->execute([$vIdIn, $sid]);
            } else {
                $vStmt = $pdo->prepare('SELECT * FROM vouchers WHERE salon_id = ? AND code = ? LIMIT 1');
                $vStmt->execute([$sid, $vcode]);
            }
            $v = $vStmt->fetch(\PDO::FETCH_ASSOC);
            if (!$v) throw new \Exception('Voucher không tồn tại', 400);
            $now = date('Y-m-d H:i:s');
            if ((int)$v['active'] !== 1 || $v['start_at'] > $now || $v['end_at'] < $now) {
                throw new \Exception('Voucher đã hết hạn hoặc không hoạt động', 400);
            }
            // Check min order
            if ($v['min_order_amt'] !== null && (int)$v['min_order_amt'] > 0 && $subtotal < (int)$v['min_order_amt']) {
                throw new \Exception('Đơn hàng chưa đạt giá trị tối thiểu cho voucher này', 400);
            }
            // Compute discount
            if (!is_null($v['discount_amt']) && $v['discount_amt'] !== '') {
                $discount = min((int)$v['discount_amt'], (int)$subtotal);
            } elseif (!is_null($v['discount_pct']) && $v['discount_pct'] !== '') {
                $pct = (float)$v['discount_pct'];
                $calc = (int)floor($subtotal * $pct / 100.0);
                if (!is_null($v['max_discount']) && $v['max_discount'] > 0) {
                    $discount = min($calc, (int)$v['max_discount']);
                } else {
                    $discount = $calc;
                }
            }
            $voucherId = (int)$v['id'];
        }

        $totalAmt = max(0, $subtotal - $discount);

        // 8) Kiểm tra giờ làm việc (Working Hours)
        $slotStart = strtotime($at);
        $slotEnd   = $slotStart + $totalMin * 60;

        $whSql = "SELECT start_time, end_time FROM working_hours
                  WHERE salon_id=? AND weekday=? AND stylist_id ";
        $whArgs = [$sid, $weekday];
        if ($sty) {
            $whSql .= "= ?";
            $whArgs[] = $sty;
        } else {
            $whSql = ""; // Sẽ fallback về giờ salon nếu không chọn stylist
        }

        $hours = [];
        if (!empty($whSql)) {
            $whStmt = $pdo->prepare($whSql);
            $whStmt->execute($whArgs);
            $hours = $whStmt->fetchAll();
        }

        // Fallback về giờ salon nếu không có giờ riêng hoặc không chọn stylist
        if (empty($hours)) {
            if (empty($salon['open_time']) || empty($salon['close_time'])) {
                throw new \Exception('Salon chưa cấu hình giờ mở cửa hoặc không làm việc vào ngày này', 400);
            }
            $hours = [['start_time'=>$salon['open_time'], 'end_time'=>$salon['close_time']]];
        }

        $insideWorkingHours = false;
        foreach ($hours as $h) {
            $workStart = strtotime("$date ".$h['start_time']);
            $workEnd = strtotime("$date ".$h['end_time']);
            // Xử lý trường hợp giờ kết thúc nhỏ hơn giờ bắt đầu (qua đêm) - Tạm bỏ qua
            if ($slotStart >= $workStart && $slotEnd <= $workEnd) {
                $insideWorkingHours = true;
                break;
            }
        }
        if (!$insideWorkingHours) throw new \Exception('Khung giờ chọn nằm ngoài giờ làm việc', 409); // Conflict

        // 9) Kiểm tra chồng lịch (Conflict Check) - Chỉ khi chọn stylist cụ thể
        if ($sty) {
            $bqStmt = $pdo->prepare("SELECT appointment_at, total_minutes FROM bookings
                                     WHERE salon_id=? AND stylist_id=?
                                     AND status IN ('pending','confirmed')
                                     AND DATE(appointment_at)=?");
            $bqStmt->execute([$sid, $sty, $date]);
            while ($r = $bqStmt->fetch()) {
                $existingStart = strtotime($r['appointment_at']);
                $existingEnd = $existingStart + ((int)$r['total_minutes'] * 60);
                if ($slotStart < $existingEnd && $slotEnd > $existingStart) {
                    throw new \Exception('Khung giờ bạn chọn cho stylist này đã bị trùng', 409); // Conflict
                }
            }
        } else {
             // TODO: Xử lý logic kiểm tra nếu không chọn stylist
        }

        // 10) Tạo Booking
    $insBooking = $pdo->prepare('INSERT INTO bookings(customer_id,salon_id,stylist_id,appointment_at,total_minutes,subtotal_amt,discount_amt,total_amt,status, note, voucher_id)
                      VALUES (?,?,?,?,?,?,?,?,? , ?, ?)');
    $insBooking->execute([$customerId, $sid, $sty, $at, $totalMin, $subtotal, $discount, $totalAmt, 'pending', $note, $voucherId]);
        $bid = (int)$pdo->lastInsertId(); // Lấy ID booking mới

        // 11) Tạo Booking Services
        $insBkSvc = $pdo->prepare('INSERT INTO booking_services(booking_id,service_id,unit_price,duration_min,quantity) VALUES (?,?,?,?,?)');
        foreach ($bookedServiceDetails as $it) {
            $insBkSvc->execute([$bid, $it['service_id'], $it['unit_price'], $it['duration_min'], $it['quantity']]);
        }

        $pdo->commit();
        return $this->json([
            'message' => 'Đặt lịch thành công',
            'booking_id' => $bid,
            'total_minutes' => $totalMin,
            'total_amt' => $totalAmt
        ], 201); // Created

    } catch(\Exception $e){
        if ($pdo->inTransaction()) $pdo->rollBack();
        $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 400;
        error_log("Booking Create Failed: ". $e->getMessage()); // Log lỗi
        return $this->json(['error'=>$e->getMessage()], $code);
    }
  }

  // GET /api/v1/bookings?salon_id=1&date=YYYY-MM-DD
  public function bySalonDate(){
    $sid = (int)($_GET['salon_id'] ?? 0);
    $date = $_GET['date'] ?? date('Y-m-d');
    if ($sid <= 0 || !preg_match('/^\d{4}-\d{2}-\d{2}$/',$date)) {
        return $this->json(['error'=>'Thiếu salon_id hoặc date'],400);
    }

    $pdo = DB::pdo();
    $sql = "SELECT
                b.id,
                b.customer_id AS customerId,
                u.full_name AS customerName,
                b.stylist_id AS stylistId,
                st.full_name AS stylistName,
                b.appointment_at AS appointmentAt,
                b.total_minutes AS totalMinutes,
                b.status,
                b.total_amt AS totalAmt
            FROM bookings b
            JOIN users u ON b.customer_id = u.id
            LEFT JOIN stylists st ON b.stylist_id = st.id
            WHERE b.salon_id = ? AND DATE(b.appointment_at) = ?
            ORDER BY b.appointment_at";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$sid, $date]);
    $items = $stmt->fetchAll(\PDO::FETCH_ASSOC);

    // Chuyển đổi kiểu dữ liệu nếu cần
    $items = array_map(function($item){
        $item['totalMinutes'] = (int)$item['totalMinutes'];
        $item['totalAmt'] = (int)$item['totalAmt'];
        $item['stylistName'] = $item['stylistName'] ?? null;
        return $item;
    }, $items);

    return $this->json(['items'=>$items]);
  }

    // GET /api/v1/bookings/{id}
    public function show($p){
        $id = (int)($p['id'] ?? 0);
        if ($id <= 0) return $this->json(['error'=>'Invalid booking id'], 400);

        $pdo = DB::pdo();
        $sql = "SELECT
                                b.id,
                                b.salon_id,
                                s.name AS salonName,
                                b.customer_id,
                                u.full_name AS customerName,
                                b.stylist_id,
                                st.full_name AS stylistName,
                                b.appointment_at AS appointmentAt,
                                b.total_minutes AS totalMinutes,
                                b.subtotal_amt AS subtotalAmt,
                                b.discount_amt AS discountAmt,
                                b.total_amt AS totalAmt,
                                b.status,
                                b.note,
                                b.voucher_id
                        FROM bookings b
                        LEFT JOIN users u ON b.customer_id = u.id
                        LEFT JOIN stylists st ON b.stylist_id = st.id
                        LEFT JOIN salons s ON b.salon_id = s.id
                        WHERE b.id = ? LIMIT 1";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([$id]);
        $bk = $stmt->fetch(
                \PDO::FETCH_ASSOC
        );
        if (!$bk) return $this->json(['error'=>'Booking not found'], 404);

        // Fetch booked services
        $svcStmt = $pdo->prepare('SELECT bs.service_id, bs.unit_price, bs.duration_min, bs.quantity, sv.name as serviceName
                                                            FROM booking_services bs
                                                            LEFT JOIN services sv ON bs.service_id = sv.id
                                                            WHERE bs.booking_id = ?');
        $svcStmt->execute([$id]);
        $services = $svcStmt->fetchAll(\PDO::FETCH_ASSOC);

        // Normalize numeric fields
        $bk['totalMinutes'] = (int)$bk['totalMinutes'];
        $bk['subtotalAmt'] = (int)$bk['subtotalAmt'];
        $bk['discountAmt'] = (int)$bk['discountAmt'];
        $bk['totalAmt'] = (int)$bk['totalAmt'];
        $bk['stylistName'] = $bk['stylistName'] ?? null;
        $bk['customerName'] = $bk['customerName'] ?? null;

        return $this->json(['booking' => $bk, 'services' => $services]);
    }

    // GET /api/v1/bookings/mine
    public function mine() {
        $me = Auth::user();
        if (!$me || !isset($me['uid'])) return $this->json(['error'=>'Unauthorized'], 401);
        $customerId = (int)$me['uid'];

        $pdo = DB::pdo();
        $sql = "SELECT
                                b.id,
                                b.salon_id,
                                s.name AS salon_name,
                                b.customer_id,
                                u.full_name AS customer_name,
                                b.stylist_id,
                                st.full_name AS stylist_name,
                                b.appointment_at,
                                b.total_minutes,
                                b.status,
                                b.total_amt
                        FROM bookings b
                        LEFT JOIN users u ON b.customer_id = u.id
                        LEFT JOIN stylists st ON b.stylist_id = st.id
                        LEFT JOIN salons s ON b.salon_id = s.id
                        WHERE b.customer_id = ?
                        ORDER BY b.appointment_at DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([$customerId]);
        $items = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Normalize keys to camelCase for compatibility with frontend
        $items = array_map(function($it){
                return [
                        'id' => (int)$it['id'],
                        'salonId' => (int)$it['salon_id'],
                        'salonName' => $it['salon_name'] ?? null,
                        'customerId' => (int)$it['customer_id'],
                        'customerName' => $it['customer_name'] ?? null,
                        'stylistId' => $it['stylist_id'] ? (int)$it['stylist_id'] : null,
                        'stylistName' => $it['stylist_name'] ?? null,
                        'appointmentAt' => $it['appointment_at'] ?? '',
                        'totalMinutes' => (int)$it['total_minutes'],
                        'status' => $it['status'] ?? null,
                        'totalAmt' => (int)$it['total_amt']
                ];
        }, $items);

        return $this->json(['items'=>$items]);
    }

  // PUT /api/v1/bookings/{id}/confirm
  public function confirm($p){
     $id = (int)($p['id'] ?? 0);
     if ($id <= 0) return $this->json(['error'=>'Invalid Booking ID'], 400);
     // TODO: Add permission check (only admin or salon owner of this booking)
     $st = DB::pdo()->prepare("UPDATE bookings SET status='confirmed' WHERE id=? AND status = 'pending'"); // Only from pending
     $st->execute([$id]);
     if ($st->rowCount() > 0) {
        // TODO: Send notification to customer
        return $this->json(['updated'=>$st->rowCount(), 'message' => 'Đã xác nhận lịch hẹn']);
     } else {
        return $this->json(['error' => 'Không thể xác nhận (sai trạng thái hoặc ID)'], 400);
     }
  }

  // PUT /api/v1/bookings/{id}/cancel
  public function cancel($p){
    $id = (int)($p['id'] ?? 0);
    if ($id <= 0) return $this->json(['error'=>'Invalid Booking ID'], 400);
    // TODO: Add permission check (admin, salon owner, or the customer themselves before a certain time?)
    $st = DB::pdo()->prepare("UPDATE bookings SET status='cancelled' WHERE id=? AND status IN ('pending','confirmed')"); // Can cancel pending or confirmed
    $st->execute([$id]);
    if ($st->rowCount() > 0) {
        // TODO: Send notification
        return $this->json(['updated'=>$st->rowCount(), 'message' => 'Đã hủy lịch hẹn']);
    } else {
         return $this->json(['error' => 'Không thể hủy (sai trạng thái hoặc ID)'], 400);
    }
  }

  // PUT /api/v1/bookings/{id}/complete
  public function markCompleted($p){
    $id = (int)($p['id'] ?? 0);
    if ($id <= 0) return $this->json(['error'=>'Invalid Booking ID'], 400);
    // TODO: Add permission check (only admin or salon owner)
    $st = DB::pdo()->prepare("UPDATE bookings SET status='completed' WHERE id=? AND status = 'confirmed'"); // Only from confirmed
    $st->execute([$id]);
    if ($st->rowCount() > 0) {
        // TODO: Logic for revenue, stylist commission, etc.
        return $this->json(['updated'=>$st->rowCount(), 'message' => 'Đã đánh dấu hoàn thành']);
    } else {
        return $this->json(['error' => 'Không thể đánh dấu hoàn thành (có thể sai trạng thái hoặc ID)'], 400);
    }
  }

  // PUT /api/v1/bookings/{id}/no-show
  public function markNoShow($p){
    $id = (int)($p['id'] ?? 0);
    if ($id <= 0) return $this->json(['error'=>'Invalid Booking ID'], 400);
    // TODO: Add permission check (only admin or salon owner)
    $st = DB::pdo()->prepare("UPDATE bookings SET status='no_show' WHERE id=? AND status = 'confirmed'"); // Only from confirmed
    $st->execute([$id]);
     if ($st->rowCount() > 0) {
         return $this->json(['updated'=>$st->rowCount(), 'message' => 'Đã đánh dấu không đến']);
     } else {
         return $this->json(['error' => 'Không thể đánh dấu không đến (có thể sai trạng thái hoặc ID)'], 400);
     }
  }

}