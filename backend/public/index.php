<?php
require __DIR__ . '/../app/config/env.php';
require __DIR__ . '/../app/config/cors.php';

spl_autoload_register(function($class){
  $prefix = 'App\\';
  $base = __DIR__ . '/../app/';
  if (strncmp($prefix, $class, strlen($prefix)) !== 0) return;
  $rel = substr($class, strlen($prefix));
  $file = $base . str_replace('\\','/',$rel) . '.php';
  if (file_exists($file)) require $file;
});

use App\Core\Router;

$router = new Router('/haircut/backend/public');
$router->post('/api/v1/auth/register', 'App\\Controllers\\AuthController@register');
$router->post('/api/v1/auth/login', 'App\\Controllers\\AuthController@login');
$router->get('/api/v1/health', 'App\\Controllers\\HealthController@status');
$router->get('/api/v1/salons', 'App\\Controllers\\SalonController@index');
$router->get('/api/v1/salons/{id}', 'App\\Controllers\\SalonController@show');
$router->get('/api/v1/salons/{salon_id}/services', 'App\\Controllers\\ServiceController@index');
$router->post('/api/v1/salons/{salon_id}/services', 'App\\Controllers\\ServiceController@create');
$router->get('/api/v1/salons/{salon_id}/stylists', 'App\\Controllers\\StylistController@index');
$router->post('/api/v1/salons/{salon_id}/stylists', 'App\\Controllers\\StylistController@create');
$router->post('/api/v1/bookings', 'App\\Controllers\\BookingController@create');
$router->get('/api/v1/bookings',  'App\\Controllers\\BookingController@bySalonDate'); // ?salon_id=1&date=YYYY-MM-DD
$router->put('/api/v1/bookings/{id}/confirm', 'App\\Controllers\\BookingController@confirm');
$router->put('/api/v1/bookings/{id}/cancel',  'App\\Controllers\\BookingController@cancel');
$router->get('/api/v1/debug/headers', 'App\\Controllers\\DebugController@headers');


$router->run();
