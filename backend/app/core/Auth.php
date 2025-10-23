<?php
namespace App\Core;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class Auth {
  private static function headerToken(): ?string {
    $h = null;
    foreach (['HTTP_AUTHORIZATION','REDIRECT_HTTP_AUTHORIZATION'] as $k) {
    if (!empty($_SERVER[$k])) { $h = $_SERVER[$k]; break; }
    }
    if (!$h && function_exists('apache_request_headers')) {
    $all = apache_request_headers();
    if (isset($all['Authorization'])) $h = $all['Authorization'];
    }
    if (!$h) return null;
    return preg_match('/Bearer\s+(\S+)/', $h, $m) ? $m[1] : null;
    }


  public static function issue(array $payload): string {
    $secret = $_ENV['APP_KEY'] ?? 'dev-secret';
    $payload['iat'] = time();
    $payload['exp'] = time() + 86400;
    return JWT::encode($payload, $secret, 'HS256');
  }

  public static function user(): ?array {
    $jwt = self::headerToken();
    if (!$jwt) return null;
    try {
      $secret = $_ENV['APP_KEY'] ?? 'dev-secret';
      $data = JWT::decode($jwt, new Key($secret, 'HS256'));
      return (array)$data;
    } catch (\Throwable $e) { return null; }
  }
}
