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

// Auth routes
$router->post('/api/v1/auth/register', 'App\\Controllers\\AuthController@register');
$router->post('/api/v1/auth/login', 'App\\Controllers\\AuthController@login');
$router->get('/api/v1/me', 'App\\Controllers\\AuthController@me');
$router->put('/api/v1/me', 'App\\Controllers\\AuthController@updateMe');
$router->put('/api/v1/me/password', 'App\\Controllers\\AuthController@changePassword');

// Health check
$router->get('/api/v1/health', 'App\\Controllers\\HealthController@status');

// Salon routes
$router->get('/api/v1/salons', 'App\\Controllers\\SalonController@index');
$router->get('/api/v1/salons/my', 'App\\Controllers\\SalonController@getMySalon');
$router->post('/api/v1/salons', 'App\\Controllers\\SalonController@create');
$router->get('/api/v1/salons/{id}', 'App\\Controllers\\SalonController@show');
$router->put('/api/v1/salons/{id}', 'App\\Controllers\\SalonController@update');
$router->delete('/api/v1/salons/{id}', 'App\\Controllers\\SalonController@delete');

// Service routes
$router->get('/api/v1/salons/{salon_id}/services', 'App\\Controllers\\ServiceController@index');
$router->post('/api/v1/salons/{salon_id}/services', 'App\\Controllers\\ServiceController@create');
$router->put('/api/v1/salons/{salon_id}/services/{id}', 'App\\Controllers\\ServiceController@update');
$router->delete('/api/v1/salons/{salon_id}/services/{id}', 'App\\Controllers\\ServiceController@delete');

// Stylist routes
$router->get('/api/v1/salons/{salon_id}/stylists', 'App\\Controllers\\StylistController@index');
$router->post('/api/v1/salons/{salon_id}/stylists', 'App\\Controllers\\StylistController@create');
$router->put('/api/v1/salons/{salon_id}/stylists/{id}', 'App\\Controllers\\StylistController@update');
$router->delete('/api/v1/salons/{salon_id}/stylists/{id}', 'App\\Controllers\\StylistController@delete');

// Booking routes 
$router->get('/api/v1/bookings/salon-id', 'App\\Controllers\\BookingController@getSalonId');
$router->get('/api/v1/bookings/mine', 'App\\Controllers\\BookingController@mine');
$router->post('/api/v1/bookings', 'App\\Controllers\\BookingController@create');
$router->get('/api/v1/bookings', 'App\\Controllers\\BookingController@bySalonDate'); 
$router->get('/api/v1/bookings/{id}', 'App\\Controllers\\BookingController@show');
$router->put('/api/v1/bookings/{id}/confirm', 'App\\Controllers\\BookingController@confirm');
$router->put('/api/v1/bookings/{id}/cancel', 'App\\Controllers\\BookingController@cancel');
$router->put('/api/v1/bookings/{id}/complete', 'App\\Controllers\\BookingActionsController@markCompleted');
$router->put('/api/v1/bookings/{id}/no-show', 'App\\Controllers\\BookingActionsController@markNoShow');

// Availability routes
$router->get('/api/v1/salons/{salon_id}/availability', 'App\\Controllers\\BookingController@availability');

// Voucher routes
$router->get('/api/v1/salons/{salon_id}/vouchers', 'App\\Controllers\\VoucherController@index');

// Review routes
$router->get('/api/v1/bookings/{id}/review-check', 'App\\Controllers\\ReviewController@checkReview');
$router->get('/api/v1/salons/{salon_id}/reviews', 'App\\Controllers\\ReviewController@index');
$router->post('/api/v1/bookings/{id}/reviews', 'App\\Controllers\\ReviewController@create');

// Payment routes
$router->post('/api/v1/payments', 'App\\Controllers\\PaymentController@create');
$router->get('/api/v1/payments', 'App\\Controllers\\PaymentController@list');
$router->get('/api/v1/payments/{id}', 'App\\Controllers\\PaymentController@getById');
$router->post('/api/v1/payments/{id}/confirm', 'App\\Controllers\\PaymentController@confirm');
$router->get('/api/v1/bookings/{id}/payment', 'App\\Controllers\\PaymentController@getByBookingId');

// Upload routes
$router->post('/api/v1/upload/avatar', 'App\\Controllers\\UploadController@uploadAvatar');

// Debug routes
$router->get('/api/v1/debug/headers', 'App\\Controllers\\DebugController@headers');

$router->run();