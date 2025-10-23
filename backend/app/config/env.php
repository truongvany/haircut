<?php
require __DIR__ . '/../../vendor/autoload.php';
$dotEnv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
if (file_exists(__DIR__ . '/../../.env')) {
  $dotEnv->load();
}
date_default_timezone_set($_ENV['TIMEZONE'] ?? 'Asia/Ho_Chi_Minh');
