<?php
namespace App\Core;   // CHÍNH XÁC chữ C hoa

class Controller {
    protected function json($data, $code = 200) {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
    }

    public function body(): array {
    $raw = file_get_contents('php://input') ?: '';
    $ct  = $_SERVER['CONTENT_TYPE'] ?? '';

    // debug để soi trong error.log
        // Log để soi nhanh trong error.log
        error_log('REQ_CT=' . $ct . ' | RAW=' . $raw);

    // JSON chuẩn
    if (stripos($ct, 'application/json') !== false) {
        $data = json_decode($raw, true);
        if (is_array($data) && !empty($data)) return $data;

        // JSON bị dính script -> cắt phần { ... } hợp lệ
        $start = strpos($raw, '{');
        $end   = strrpos($raw, '}');
        if ($start !== false && $end !== false && $end > $start) {
            $jsonOnly = substr($raw, $start, $end - $start + 1);
            $data2 = json_decode($jsonOnly, true);
            if (is_array($data2) && !empty($data2)) return $data2;
        }
    }

    // form-encoded
    if (!empty($_POST)) return $_POST;

    // query string rơi vào body
    $tmp = [];
    parse_str($raw, $tmp);
    if (!empty($tmp)) return $tmp;

    return [];
    }

}
