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
$router->get('/api/v1/me', 'App\\Controllers\\AuthController@me');
$router->put('/api/v1/me', 'App\\Controllers\\AuthController@updateMe');
$router->put('/api/v1/me/password', 'App\\Controllers\\AuthController@changePassword');
$router->get('/api/v1/salons', 'App\\Controllers\\SalonController@index');
$router->get('/api/v1/salons/{id}', 'App\\Controllers\\SalonController@show');
$router->get('/api/v1/salons/{salon_id}/services', 'App\\Controllers\\ServiceController@index');
$router->post('/api/v1/salons/{salon_id}/services', 'App\\Controllers\\ServiceController@create');
$router->put('/api/v1/salons/{salon_id}/services/{id}', 'App\\Controllers\\ServiceController@update');
$router->delete('/api/v1/salons/{salon_id}/services/{id}', 'App\\Controllers\\ServiceController@delete');
$router->get('/api/v1/salons/{salon_id}/stylists', 'App\\Controllers\\StylistController@index');
$router->post('/api/v1/salons/{salon_id}/stylists', 'App\\Controllers\\StylistController@create');
$router->put('/api/v1/salons/{salon_id}/stylists/{id}', 'App\\Controllers\\StylistController@update');
$router->delete('/api/v1/salons/{salon_id}/stylists/{id}', 'App\\Controllers\\StylistController@delete');
$router->post('/api/v1/bookings', 'App\\Controllers\\BookingController@create');
$router->get('/api/v1/bookings',  'App\\Controllers\\BookingController@bySalonDate'); 
// Availability: GET /api/v1/salons/{salon_id}/availability?date=YYYY-MM-DD&duration_min=30&step=15&stylist_id=123
$router->get('/api/v1/salons/{salon_id}/availability', 'App\\Controllers\\BookingController@availability');
$router->get('/api/v1/bookings/{id}', 'App\\Controllers\\BookingController@show');
$router->get('/api/v1/bookings/mine',  'App\\Controllers\\BookingController@mine');
$router->put('/api/v1/bookings/{id}/confirm', 'App\\Controllers\\BookingController@confirm');
$router->put('/api/v1/bookings/{id}/cancel',  'App\\Controllers\\BookingController@cancel');
$router->put('/api/v1/bookings/{id}/complete', 'App\\Controllers\\BookingActionsController@markCompleted');
$router->put('/api/v1/bookings/{id}/no-show', 'App\\Controllers\\BookingActionsController@markNoShow');
$router->get('/api/v1/debug/headers', 'App\\Controllers\\DebugController@headers');
// Voucher endpoints: validate/get by code for a salon
$router->get('/api/v1/salons/{salon_id}/vouchers', 'App\\Controllers\\VoucherController@index');
$router->get('/api/v1/salons/{salon_id}/reviews', 'App\\Controllers\\ReviewController@index');
$router->post('/api/v1/bookings/{id}/reviews', 'App\\Controllers\\ReviewController@create');
$router->post('/api/v1/upload/avatar', 'App\\Controllers\\UploadController@uploadAvatar');

$router->run();
