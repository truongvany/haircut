<?php
function post($url, $data, $headers = []){
    $opts = ['http' => ['method' => 'POST', 'header' => "Content-Type: application/json\r\n" . implode("\r\n", $headers) . "\r\n", 'content' => json_encode($data)]];
    $ctx = stream_context_create($opts);
    $res = file_get_contents($url, false, $ctx);
    if ($res === false) {
        return ['error' => error_get_last()];
    }
    return json_decode($res, true);
}
function postRaw($url, $raw, $headers = []){
    $opts = ['http' => ['method' => 'POST', 'header' => implode("\r\n", $headers) . "\r\n", 'content' => $raw]];
    $ctx = stream_context_create($opts);
    $res = file_get_contents($url, false, $ctx);
    if ($res === false) return ['error'=>error_get_last()];
    return json_decode($res, true);
}
$base = 'http://localhost/haircut/backend/public/api/v1';
// 1) login
$login = post("$base/auth/login", ['email'=>'guest2@haircut.test','password'=>'secret123']);
print_r(["login_response"=>$login]);
if (!isset($login['token'])) exit(0);
$token = $login['token'];
// 2) create booking for 2 hours from now
$appt = date('Y-m-d H:i:s', time() + 7200);
$payload = [
    'salon_id' => 1,
    'stylist_id' => 2,
    'appointment_at' => $appt,
    'items' => [ ['service_id'=>1, 'qty'=>1] ],
    'note' => 'Test booking from script'
];
$headers = ["Authorization: Bearer $token", 'Content-Type: application/json'];
$create = postRaw("$base/bookings", json_encode($payload), $headers);
print_r(["create_response"=>$create]);
