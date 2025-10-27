<?php
namespace App\Controllers;
use App\Core\Controller;
use App\Config\DB;

class ReviewController extends Controller {
  // GET /api/v1/salons/{salon_id}/reviews
  public function index($params){
    $salonId = (int)($params['salon_id'] ?? 0);
    if ($salonId <= 0) return $this->json(['error'=>'Missing salon_id'], 400);

    $pdo = DB::pdo();
    $sql = "SELECT r.id, r.booking_id, r.salon_id, r.stylist_id, r.customer_id, r.rating, r.comment, r.created_at,
                   u.full_name AS customerName, st.full_name AS stylistName
            FROM reviews r
            LEFT JOIN users u ON r.customer_id = u.id
            LEFT JOIN stylists st ON r.stylist_id = st.id
            WHERE r.salon_id = ?
            ORDER BY r.created_at DESC
            LIMIT 100";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$salonId]);
    $items = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    // Normalize numeric types
    $items = array_map(function($it){
      $it['rating'] = (int)$it['rating'];
      $it['customerName'] = $it['customerName'] ?? null;
      $it['stylistName'] = $it['stylistName'] ?? null;
      return $it;
    }, $items);
    return $this->json(['items'=>$items]);
  }

  // POST /api/v1/bookings/{id}/reviews
  public function create($params){
    $me = \App\Core\Auth::user();
    if (!$me || !isset($me['uid'])) return $this->json(['error'=>'Unauthorized'], 401);
    $customerId = (int)$me['uid'];

    $bookingId = (int)($params['id'] ?? 0);
    if ($bookingId <= 0) return $this->json(['error'=>'Invalid booking id'], 400);

    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $rating = isset($body['rating']) ? (int)$body['rating'] : 0;
    $comment = isset($body['comment']) ? trim($body['comment']) : null;

    if ($rating < 1 || $rating > 5) return $this->json(['error'=>'Rating must be between 1 and 5'], 400);

    $pdo = DB::pdo();
    // Ensure booking exists and belongs to the customer and is completed
    $bStmt = $pdo->prepare('SELECT id, salon_id, stylist_id, customer_id, status FROM bookings WHERE id = ? LIMIT 1');
    $bStmt->execute([$bookingId]);
    $b = $bStmt->fetch(\PDO::FETCH_ASSOC);
    if (!$b) return $this->json(['error'=>'Booking not found'], 404);
    if ((int)$b['customer_id'] !== $customerId) return $this->json(['error'=>'Forbidden'], 403);
    if ($b['status'] !== 'completed') return $this->json(['error'=>'Only completed bookings can be reviewed'], 400);

    // Check if review already exists for this booking
    $chk = $pdo->prepare('SELECT id FROM reviews WHERE booking_id = ? LIMIT 1');
    $chk->execute([$bookingId]);
    if ($chk->fetch()) return $this->json(['error'=>'Review already submitted for this booking'], 409);

    // Insert review
    $ins = $pdo->prepare('INSERT INTO reviews(booking_id, salon_id, stylist_id, customer_id, rating, comment) VALUES (?,?,?,?,?,?)');
    $ins->execute([$bookingId, $b['salon_id'], $b['stylist_id'], $customerId, $rating, $comment]);
    $rid = (int)$pdo->lastInsertId();

    // Update salon rating aggregates (simple incremental average)
    $sStmt = $pdo->prepare('SELECT rating_avg, rating_count FROM salons WHERE id = ? LIMIT 1');
    $sStmt->execute([$b['salon_id']]);
    $s = $sStmt->fetch(\PDO::FETCH_ASSOC);
    if ($s) {
      $oldAvg = (float)$s['rating_avg'];
      $oldCount = (int)$s['rating_count'];
      $newCount = $oldCount + 1;
      $newAvg = ($oldAvg * $oldCount + $rating) / max(1, $newCount);
      $u = $pdo->prepare('UPDATE salons SET rating_avg = ?, rating_count = ? WHERE id = ?');
      $u->execute([round($newAvg,2), $newCount, $b['salon_id']]);
    }

    return $this->json(['message'=>'Review submitted','review_id'=>$rid], 201);
  }
}
