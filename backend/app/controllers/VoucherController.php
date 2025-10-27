<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Config\DB;

class VoucherController extends Controller {

    // GET /api/v1/salons/{salon_id}/vouchers?code=CODE
    public function index(array $params) {
        $salonId = (int)($params['salon_id'] ?? 0);
        $code = trim($_GET['code'] ?? '');
        if ($salonId <= 0) return $this->json(['error' => 'Invalid Salon ID'], 400);
        if ($code === '') return $this->json(['error' => 'Missing voucher code (code)'], 400);

        $pdo = DB::pdo();
        $st = $pdo->prepare('SELECT id, salon_id, code, description, discount_amt, discount_pct, min_order_amt, max_discount, start_at, end_at, active FROM vouchers WHERE salon_id = ? AND code = ? LIMIT 1');
        $st->execute([$salonId, $code]);
        $v = $st->fetch(\PDO::FETCH_ASSOC);
        if (!$v) return $this->json(['error' => 'Voucher not found'], 404);

        // Check active and time window
        $now = date('Y-m-d H:i:s');
        if ((int)$v['active'] !== 1 || $v['start_at'] > $now || $v['end_at'] < $now) {
            return $this->json(['error' => 'Voucher is inactive or expired'], 400);
        }

        // Return voucher data (frontend will validate min_order_amt etc)
        return $this->json(['voucher' => [
            'id' => (int)$v['id'],
            'code' => $v['code'],
            'description' => $v['description'],
            'discount_amt' => $v['discount_amt'] !== null ? (int)$v['discount_amt'] : null,
            'discount_pct' => $v['discount_pct'] !== null ? (float)$v['discount_pct'] : null,
            'min_order_amt' => $v['min_order_amt'] !== null ? (int)$v['min_order_amt'] : null,
            'max_discount' => $v['max_discount'] !== null ? (int)$v['max_discount'] : null,
        ]] );
    }
}
