<?php
function http_post($url, $data, $headers = []){
    $opts = ['http' => ['method' => 'POST', 'header' => implode("\r\n", $headers) . "\r\n", 'content' => $data, 'ignore_errors' => true]];
    $ctx = stream_context_create($opts);
    $res = file_get_contents($url, false, $ctx);
    return [$res, $http_response_header ?? null];
}
$base = 'http://localhost/haircut/backend/public/api/v1';
// login
$loginPayload = json_encode(['email'=>'guest2@haircut.test','password'=>'secret123']);
list($loginRes,) = http_post("$base/auth/login", $loginPayload, ['Content-Type: application/json']);
echo "login raw: \n". $loginRes ."\n";
$j = json_decode($loginRes, true);
if (!isset($j['token'])) { exit; }
$token = $j['token'];
$appt = date('Y-m-d H:i:s', time() + 7200);
$payload = json_encode([
    'salon_id' => 1,
    'stylist_id' => 2,
    'appointment_at' => $appt,
    'items' => [ ['service_id'=>1, 'qty'=>1] ],
    'note' => 'test'
]);
list($createRes, $hdr) = http_post("$base/bookings", $payload, ["Content-Type: application/json", "Authorization: Bearer $token"]);
echo "create raw:\n". $createRes ."\n";
if ($hdr) print_r($hdr);
