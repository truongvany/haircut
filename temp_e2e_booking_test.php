<?php
function http_post($url, $data, $headers = []){
    $opts = ['http' => ['method' => 'POST', 'header' => implode("\r\n", $headers) . "\r\n", 'content' => $data, 'ignore_errors' => true]];
    $ctx = stream_context_create($opts);
    $res = file_get_contents($url, false, $ctx);
    return [$res, $http_response_header ?? null];
}
function http_get($url, $headers = []){
    $opts = ['http' => ['method' => 'GET', 'header' => implode("\r\n", $headers) . "\r\n", 'ignore_errors' => true]];
    $ctx = stream_context_create($opts);
    $res = file_get_contents($url, false, $ctx);
    return [$res, $http_response_header ?? null];
}
function http_put($url, $data = null, $headers = []){
    $opts = ['http' => ['method' => 'PUT', 'header' => implode("\r\n", $headers) . "\r\n", 'content' => $data, 'ignore_errors' => true]];
    $ctx = stream_context_create($opts);
    $res = file_get_contents($url, false, $ctx);
    return [$res, $http_response_header ?? null];
}
$base = 'http://localhost/haircut/backend/public/api/v1';
// 1) login as guest2
list($loginRes,) = http_post("$base/auth/login", json_encode(['email'=>'guest2@haircut.test','password'=>'secret123']), ['Content-Type: application/json']);
echo "LOGIN RESPONSE:\n". $loginRes ."\n";
$login = json_decode($loginRes, true);
if (!isset($login['token'])) { echo "Login failed, aborting\n"; exit(1); }
$token = $login['token'];
$headers = ["Content-Type: application/json","Authorization: Bearer $token"];

// 2) create a booking 2 hours from now
$appt = date('Y-m-d H:i:s', time() + 86400); // schedule ~24h in future to avoid timezone/check issues
// Leave stylist_id null so salon can assign an available stylist
$payload = json_encode([
    'salon_id' => 1,
    'stylist_id' => null,
    'appointment_at' => $appt,
    'items' => [ ['service_id'=>1,'qty'=>1] ],
    'note' => 'E2E test booking'
]);
list($createRes, $hdr) = http_post("$base/bookings", $payload, $headers);
echo "CREATE RESPONSE:\n". $createRes ."\n";
$create = json_decode($createRes, true);
if (isset($create['booking_id'])) {
    $bid = $create['booking_id'];
    echo "Created booking id: $bid\n";
} else {
    echo "Create failed, aborting\n"; exit(2);
}

// 3) list mine
list($mineRes,) = http_get("$base/bookings/mine", $headers);
echo "MINE AFTER CREATE:\n". $mineRes ."\n";

// 4) cancel booking
list($cancelRes,) = http_put("$base/bookings/$bid/cancel", json_encode([]), $headers);
if ($cancelRes === false) $cancelRes = 'NO RESPONSE';
echo "CANCEL RESPONSE:\n". $cancelRes ."\n";

// 5) list mine again
list($mineRes2,) = http_get("$base/bookings/mine", $headers);
echo "MINE AFTER CANCEL:\n". $mineRes2 ."\n";

?>