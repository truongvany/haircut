<?php
namespace App\Controllers;

use App\Core\Controller;

class DebugController extends Controller {
  public function headers() {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null);

    // Lấy thêm qua apache_request_headers nếu có
    $raw = null;
    if (function_exists('apache_request_headers')) {
      $h = apache_request_headers();
      if (isset($h['Authorization'])) $raw = $h['Authorization'];
    }

    return $this->json([
      'HTTP_AUTHORIZATION' => $auth,
      'apache_request_headers.Authorization' => $raw
    ]);
  }
}
