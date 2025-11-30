<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Config\DB;
use App\Core\Auth;

class PaymentController extends Controller {

  /**
   * POST /api/v1/payments
   * body: { "booking_id": 1, "method": "cash"|"bank_transfer" }
   * Creates a payment record and returns payment details
   */
  public function create() {
    $me = Auth::user();
    if (!$me || !isset($me['uid'])) {
      return $this->json(['error' => 'Unauthorized'], 401);
    }

    $b = json_decode(file_get_contents('php://input'), true) ?: [];
    $bookingId = (int)($b['booking_id'] ?? 0);
    $method = trim($b['method'] ?? '');

    if (!$bookingId || !in_array($method, ['cash', 'bank_transfer'])) {
      return $this->json(['error' => 'Invalid booking_id or payment method'], 400);
    }

    $pdo = DB::pdo();

    // Verify booking exists and belongs to customer
    $st = $pdo->prepare("SELECT id, customer_id, total_amt, status FROM bookings WHERE id = ?");
    $st->execute([$bookingId]);
    $booking = $st->fetch(\PDO::FETCH_ASSOC);

    if (!$booking) {
      return $this->json(['error' => 'Booking not found'], 404);
    }

    if ((int)$booking['customer_id'] !== (int)$me['uid']) {
      return $this->json(['error' => 'This booking does not belong to you'], 403);
    }

    // Check if payment already exists
    $st = $pdo->prepare("SELECT id, status FROM payments WHERE booking_id = ?");
    $st->execute([$bookingId]);
    $existingPayment = $st->fetch(\PDO::FETCH_ASSOC);

    if ($existingPayment && $existingPayment['status'] !== 'failed') {
      return $this->json(['error' => 'Payment already exists for this booking'], 409);
    }

    try {
      // Create payment record
      $st = $pdo->prepare("
        INSERT INTO payments (booking_id, method, status, amount)
        VALUES (?, ?, 'init', ?)
      ");
      $st->execute([$bookingId, $method, (int)$booking['total_amt']]);
      $paymentId = $pdo->lastInsertId();

      // Return payment details
      return $this->json([
        'payment_id' => (int)$paymentId,
        'booking_id' => (int)$bookingId,
        'method' => $method,
        'amount' => (int)$booking['total_amt'],
        'status' => 'init',
        'message' => 'Payment initialized successfully'
      ]);
    } catch (\Exception $e) {
      return $this->json(['error' => 'Failed to create payment: ' . $e->getMessage()], 500);
    }
  }

  /**
   * GET /api/v1/payments/{id}
   * Get payment details and status
   */
  public function getById($params) {
    $me = Auth::user();
    if (!$me || !isset($me['uid'])) {
      return $this->json(['error' => 'Unauthorized'], 401);
    }

    $paymentId = (int)($params['id'] ?? 0);
    if (!$paymentId) {
      return $this->json(['error' => 'Invalid payment ID'], 400);
    }

    $pdo = DB::pdo();

    // Get payment and verify ownership
    $st = $pdo->prepare("
      SELECT p.id, p.booking_id, p.method, p.status, p.amount, 
             p.created_at, p.updated_at, b.customer_id
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      WHERE p.id = ?
    ");
    $st->execute([$paymentId]);
    $payment = $st->fetch(\PDO::FETCH_ASSOC);

    if (!$payment) {
      return $this->json(['error' => 'Payment not found'], 404);
    }

    if ((int)$payment['customer_id'] !== (int)$me['uid']) {
      return $this->json(['error' => 'This payment does not belong to you'], 403);
    }

    return $this->json([
      'payment_id' => (int)$payment['id'],
      'booking_id' => (int)$payment['booking_id'],
      'method' => $payment['method'],
      'status' => $payment['status'],
      'amount' => (int)$payment['amount'],
      'created_at' => $payment['created_at'],
      'updated_at' => $payment['updated_at']
    ]);
  }

  /**
   * POST /api/v1/payments/{id}/confirm
   * Mark payment as paid (for cash and bank transfer, user confirms after paying)
   */
  public function confirm($params) {
    $me = Auth::user();
    if (!$me || !isset($me['uid'])) {
      return $this->json(['error' => 'Unauthorized'], 401);
    }

    $paymentId = (int)($params['id'] ?? 0);
    if (!$paymentId) {
      return $this->json(['error' => 'Invalid payment ID'], 400);
    }

    $pdo = DB::pdo();

    // Get payment and verify ownership
    $st = $pdo->prepare("
      SELECT p.id, p.booking_id, p.status, b.customer_id
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      WHERE p.id = ?
    ");
    $st->execute([$paymentId]);
    $payment = $st->fetch(\PDO::FETCH_ASSOC);

    if (!$payment) {
      return $this->json(['error' => 'Payment not found'], 404);
    }

    if ((int)$payment['customer_id'] !== (int)$me['uid']) {
      return $this->json(['error' => 'This payment does not belong to you'], 403);
    }

    if ($payment['status'] === 'paid') {
      return $this->json(['error' => 'Payment is already confirmed'], 409);
    }

    try {
      // Update payment status to paid
      $st = $pdo->prepare("UPDATE payments SET status = 'paid' WHERE id = ?");
      $st->execute([$paymentId]);

      // Update booking status to confirmed (optional, can be updated by salon)
      // $st = $pdo->prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ?");
      // $st->execute([$payment['booking_id']]);

      return $this->json([
        'message' => 'Payment confirmed successfully',
        'payment_id' => (int)$paymentId,
        'status' => 'paid'
      ]);
    } catch (\Exception $e) {
      return $this->json(['error' => 'Failed to confirm payment: ' . $e->getMessage()], 500);
    }
  }

  /**
   * GET /api/v1/bookings/{id}/payment
   * Get payment status for a booking
   */
  public function getByBookingId($params) {
    $me = Auth::user();
    if (!$me || !isset($me['uid'])) {
      return $this->json(['error' => 'Unauthorized'], 401);
    }

    $bookingId = (int)($params['id'] ?? 0);
    if (!$bookingId) {
      return $this->json(['error' => 'Invalid booking ID'], 400);
    }

    $pdo = DB::pdo();

    // Get booking to verify ownership
    $st = $pdo->prepare("SELECT customer_id FROM bookings WHERE id = ?");
    $st->execute([$bookingId]);
    $booking = $st->fetch(\PDO::FETCH_ASSOC);

    if (!$booking) {
      return $this->json(['error' => 'Booking not found'], 404);
    }

    if ((int)$booking['customer_id'] !== (int)$me['uid']) {
      return $this->json(['error' => 'This booking does not belong to you'], 403);
    }

    // Get payment
    $st = $pdo->prepare("
      SELECT id, booking_id, method, status, amount, created_at, updated_at
      FROM payments
      WHERE booking_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    ");
    $st->execute([$bookingId]);
    $payment = $st->fetch(\PDO::FETCH_ASSOC);

    if (!$payment) {
      return $this->json(['has_payment' => false]);
    }

    return $this->json([
      'has_payment' => true,
      'payment_id' => (int)$payment['id'],
      'booking_id' => (int)$payment['booking_id'],
      'method' => $payment['method'],
      'status' => $payment['status'],
      'amount' => (int)$payment['amount'],
      'created_at' => $payment['created_at'],
      'updated_at' => $payment['updated_at']
    ]);
  }

  /**
   * GET /api/v1/payments?booking_id=1
   * List payments for user (can filter by booking_id)
   */
  public function list() {
    $me = Auth::user();
    if (!$me || !isset($me['uid'])) {
      return $this->json(['error' => 'Unauthorized'], 401);
    }

    $pdo = DB::pdo();
    $bookingId = isset($_GET['booking_id']) ? (int)$_GET['booking_id'] : null;

    // If user is a salon owner, show payments for their salon
    // Otherwise, show payments for their own bookings (customer)
    if ($me['role'] === 'salon') {
      // Get salon owner's salon
      $st = $pdo->prepare("SELECT id FROM salons WHERE owner_user_id = ? LIMIT 1");
      $st->execute([(int)$me['uid']]);
      $salon = $st->fetch(\PDO::FETCH_ASSOC);

      if (!$salon) {
        return $this->json(['items' => []]);
      }

      $query = "
        SELECT p.id, p.booking_id, p.method, p.status, p.amount, p.created_at, p.updated_at,
               b.customer_id, u.full_name as customer_name, s.name as salon_name
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        JOIN salons s ON b.salon_id = s.id
        JOIN users u ON b.customer_id = u.id
        WHERE b.salon_id = ?
      ";
      $params = [(int)$salon['id']];

      if ($bookingId) {
        $query .= " AND p.booking_id = ?";
        $params[] = $bookingId;
      }

      $query .= " ORDER BY p.created_at DESC LIMIT 100";
    } else {
      // Customer: show their own payments
      $query = "
        SELECT p.id, p.booking_id, p.method, p.status, p.amount, p.created_at, p.updated_at,
               b.customer_id, s.name as salon_name
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        JOIN salons s ON b.salon_id = s.id
        WHERE b.customer_id = ?
      ";
      $params = [(int)$me['uid']];

      if ($bookingId) {
        $query .= " AND p.booking_id = ?";
        $params[] = $bookingId;
      }

      $query .= " ORDER BY p.created_at DESC LIMIT 100";
    }

    $st = $pdo->prepare($query);
    $st->execute($params);
    $payments = $st->fetchAll(\PDO::FETCH_ASSOC);

    $items = array_map(function($p) {
      return [
        'payment_id' => (int)$p['id'],
        'booking_id' => (int)$p['booking_id'],
        'method' => $p['method'],
        'status' => $p['status'],
        'amount' => (int)$p['amount'],
        'salon_name' => $p['salon_name'],
        'customer_name' => $p['customer_name'] ?? null,
        'created_at' => $p['created_at'],
        'updated_at' => $p['updated_at']
      ];
    }, $payments);

    return $this->json(['items' => $items]);
  }
}
?>
