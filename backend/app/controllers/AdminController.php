<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Config\DB;
use App\Core\Auth;

class AdminController extends Controller {

  /**
   * GET /api/v1/admin/stats
   * Get system statistics for admin dashboard
   */
  public function stats() {
    $me = Auth::user();
    if (!$me || $me['role'] !== 'admin') {
      return $this->json(['error' => 'Unauthorized'], 401);
    }

    $pdo = DB::pdo();

    // Total salons
    $st = $pdo->query("SELECT COUNT(*) as count FROM salons");
    $totalSalons = (int)$st->fetch()['count'];

    // Active salons
    $st = $pdo->query("SELECT COUNT(*) as count FROM salons WHERE status = 'published'");
    $activeSalons = (int)$st->fetch()['count'];

    // Total customers (role_id = 3)
    $st = $pdo->query("SELECT COUNT(*) as count FROM users WHERE role_id = 3");
    $totalCustomers = (int)$st->fetch()['count'];

    // Total bookings
    $st = $pdo->query("SELECT COUNT(*) as count FROM bookings");
    $totalBookings = (int)$st->fetch()['count'];

    // Completed bookings
    $st = $pdo->query("SELECT COUNT(*) as count FROM bookings WHERE status = 'completed'");
    $completedBookings = (int)$st->fetch()['count'];

    // Total revenue (sum of paid payments)
    $st = $pdo->query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'paid'");
    $totalRevenue = (int)$st->fetch()['total'];

    // Pending payments
    $st = $pdo->query("SELECT COUNT(*) as count FROM payments WHERE status = 'init'");
    $pendingPayments = (int)$st->fetch()['count'];

    // Completed payments
    $st = $pdo->query("SELECT COUNT(*) as count FROM payments WHERE status = 'paid'");
    $completedPayments = (int)$st->fetch()['count'];

    return $this->json([
      'totalSalons' => $totalSalons,
      'activeSalons' => $activeSalons,
      'totalCustomers' => $totalCustomers,
      'totalBookings' => $totalBookings,
      'completedBookings' => $completedBookings,
      'totalRevenue' => $totalRevenue,
      'pendingPayments' => $pendingPayments,
      'completedPayments' => $completedPayments
    ]);
  }

  /**
   * GET /api/v1/admin/salons
   * Get all salons for admin management
   */
  public function salons() {
    $me = Auth::user();
    if (!$me || $me['role'] !== 'admin') {
      return $this->json(['error' => 'Unauthorized'], 401);
    }

    $pdo = DB::pdo();
    $st = $pdo->query("
      SELECT s.*, u.full_name as owner_name
      FROM salons s
      LEFT JOIN users u ON s.owner_user_id = u.id
      ORDER BY s.created_at DESC
    ");
    $items = $st->fetchAll(\PDO::FETCH_ASSOC);

    return $this->json(['items' => $items]);
  }

  /**
   * PUT /api/v1/admin/salons/{id}
   * Update salon status
   */
  public function updateSalon($params) {
    $me = Auth::user();
    if (!$me || $me['role'] !== 'admin') {
      return $this->json(['error' => 'Unauthorized'], 401);
    }

    $salonId = (int)($params['id'] ?? 0);
    if (!$salonId) {
      return $this->json(['error' => 'Invalid salon ID'], 400);
    }

    $body = $this->body();
    $newStatus = trim($body['status'] ?? '');

    if (!in_array($newStatus, ['draft', 'published', 'suspended'])) {
      return $this->json(['error' => 'Invalid status'], 400);
    }

    $pdo = DB::pdo();
    $st = $pdo->prepare("UPDATE salons SET status = ? WHERE id = ?");
    $st->execute([$newStatus, $salonId]);

    return $this->json(['message' => 'Salon updated successfully']);
  }

  /**
   * GET /api/v1/admin/bookings
   * Get all bookings for admin management
   */
  public function bookings() {
    $me = Auth::user();
    if (!$me || $me['role'] !== 'admin') {
      return $this->json(['error' => 'Unauthorized'], 401);
    }

    $pdo = DB::pdo();
    $st = $pdo->query("
      SELECT b.*, u.full_name as customer_name, s.name as salon_name
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN salons s ON b.salon_id = s.id
      ORDER BY b.created_at DESC
    ");
    $items = $st->fetchAll(\PDO::FETCH_ASSOC);

    // Transform appointment_at into booking_date and booking_time
    $mapped = array_map(function($b) {
      $dt = new \DateTime($b['appointment_at']);
      return [
        'id' => (int)$b['id'],
        'customer_id' => (int)$b['customer_id'],
        'customer_name' => $b['customer_name'],
        'salon_id' => (int)$b['salon_id'],
        'salon_name' => $b['salon_name'],
        'booking_date' => $dt->format('Y-m-d'),
        'booking_time' => $dt->format('H:i'),
        'total_amt' => (int)$b['total_amt'],
        'status' => $b['status'],
        'created_at' => $b['created_at']
      ];
    }, $items);

    return $this->json(['items' => $mapped]);
  }

  /**
   * GET /api/v1/admin/bookings/{id}
   * Get booking detail for admin
   */
  public function bookingDetail($params) {
    $me = Auth::user();
    if (!$me || $me['role'] !== 'admin') {
      return $this->json(['error' => 'Unauthorized'], 401);
    }

    $bookingId = (int)($params['id'] ?? 0);
    if (!$bookingId) {
      return $this->json(['error' => 'Invalid booking ID'], 400);
    }

    $pdo = DB::pdo();
    $st = $pdo->prepare("
      SELECT b.*, u.full_name as customer_name, s.name as salon_name, st.full_name as stylist_name
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN salons s ON b.salon_id = s.id
      LEFT JOIN users st ON b.stylist_id = st.id
      WHERE b.id = ?
    ");
    $st->execute([$bookingId]);
    $booking = $st->fetch(\PDO::FETCH_ASSOC);

    if (!$booking) {
      return $this->json(['error' => 'Booking not found'], 404);
    }

    $dt = new \DateTime($booking['appointment_at']);
    $result = [
      'id' => (int)$booking['id'],
      'customer_id' => (int)$booking['customer_id'],
      'customer_name' => $booking['customer_name'],
      'salon_id' => (int)$booking['salon_id'],
      'salon_name' => $booking['salon_name'],
      'stylist_id' => $booking['stylist_id'] ? (int)$booking['stylist_id'] : null,
      'stylist_name' => $booking['stylist_name'] ?? null,
      'booking_date' => $dt->format('Y-m-d'),
      'booking_time' => $dt->format('H:i'),
      'total_minutes' => (int)$booking['total_minutes'],
      'subtotal_amt' => (int)$booking['subtotal_amt'],
      'discount_amt' => (int)$booking['discount_amt'],
      'total_amt' => (int)$booking['total_amt'],
      'status' => $booking['status'],
      'note' => $booking['note'] ?? null,
      'created_at' => $booking['created_at']
    ];

    return $this->json($result);
  }

  /**
   * GET /api/v1/admin/payments
   * Get all payments for admin management
   */
  public function payments() {
    $me = Auth::user();
    if (!$me || $me['role'] !== 'admin') {
      return $this->json(['error' => 'Unauthorized'], 401);
    }

    $pdo = DB::pdo();
    $st = $pdo->query("
      SELECT p.*, b.customer_id, u.full_name as customer_name, s.name as salon_name
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN users u ON b.customer_id = u.id
      JOIN salons s ON b.salon_id = s.id
      ORDER BY p.created_at DESC
    ");
    $items = $st->fetchAll(\PDO::FETCH_ASSOC);

    $mapped = array_map(function($p) {
      return [
        'id' => (int)$p['id'],
        'booking_id' => (int)$p['booking_id'],
        'customer_name' => $p['customer_name'],
        'salon_name' => $p['salon_name'],
        'method' => $p['method'],
        'status' => $p['status'],
        'amount' => (int)$p['amount'],
        'created_at' => $p['created_at']
      ];
    }, $items);

    return $this->json(['items' => $mapped]);
  }

  /**
   * GET /api/v1/admin/payments/{id}
   * Get payment detail for admin
   */
  public function paymentDetail($params) {
    $me = Auth::user();
    if (!$me || $me['role'] !== 'admin') {
      return $this->json(['error' => 'Unauthorized'], 401);
    }

    $paymentId = (int)($params['id'] ?? 0);
    if (!$paymentId) {
      return $this->json(['error' => 'Invalid payment ID'], 400);
    }

    $pdo = DB::pdo();
    $st = $pdo->prepare("
      SELECT p.*, b.customer_id, b.salon_id, u.full_name as customer_name, s.name as salon_name,
             b.appointment_at as booking_date, b.total_minutes
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN users u ON b.customer_id = u.id
      JOIN salons s ON b.salon_id = s.id
      WHERE p.id = ?
    ");
    $st->execute([$paymentId]);
    $payment = $st->fetch(\PDO::FETCH_ASSOC);

    if (!$payment) {
      return $this->json(['error' => 'Payment not found'], 404);
    }

    $dt = new \DateTime($payment['booking_date']);
    $result = [
      'id' => (int)$payment['id'],
      'booking_id' => (int)$payment['booking_id'],
      'customer_id' => (int)$payment['customer_id'],
      'customer_name' => $payment['customer_name'],
      'salon_id' => (int)$payment['salon_id'],
      'salon_name' => $payment['salon_name'],
      'method' => $payment['method'],
      'status' => $payment['status'],
      'amount' => (int)$payment['amount'],
      'created_at' => $payment['created_at'],
      'booking_date' => $dt->format('Y-m-d'),
      'booking_time' => $dt->format('H:i')
    ];

    return $this->json($result);
  }

  /**
   * GET /api/v1/admin/users
   * Get all users for admin management
   */
  public function users() {
    $me = Auth::user();
    if (!$me || $me['role'] !== 'admin') {
      return $this->json(['error' => 'Unauthorized'], 401);
    }

    $pdo = DB::pdo();
    $st = $pdo->query("
      SELECT id, full_name, email, role_id, created_at
      FROM users
      ORDER BY created_at DESC
    ");
    $users = $st->fetchAll(\PDO::FETCH_ASSOC);

    $mapped = array_map(function($u) {
      $role = ((int)$u['role_id'] === 1) ? 'admin' : (((int)$u['role_id'] === 2) ? 'salon' : 'customer');
      return [
        'id' => (int)$u['id'],
        'full_name' => $u['full_name'],
        'email' => $u['email'],
        'role' => $role,
        'created_at' => $u['created_at']
      ];
    }, $users);

    return $this->json(['items' => $mapped]);
  }
}
?>
