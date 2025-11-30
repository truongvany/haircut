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

// Admin routes
$router->get('/api/v1/admin/stats', 'App\\Controllers\\AdminController@stats');
$router->get('/api/v1/admin/salons', 'App\\Controllers\\AdminController@salons');
$router->put('/api/v1/admin/salons/{id}', 'App\\Controllers\\AdminController@updateSalon');
$router->get('/api/v1/admin/bookings', 'App\\Controllers\\AdminController@bookings');
$router->get('/api/v1/admin/bookings/{id}', 'App\\Controllers\\AdminController@bookingDetail');
$router->get('/api/v1/admin/payments', 'App\\Controllers\\AdminController@payments');
$router->get('/api/v1/admin/payments/{id}', 'App\\Controllers\\AdminController@paymentDetail');
$router->get('/api/v1/admin/users', 'App\\Controllers\\AdminController@users');

// News routes
$router->get('/api/v1/news', 'App\\Controllers\\NewsController@list');
$router->post('/api/v1/admin/news', 'App\\Controllers\\NewsController@create');
$router->put('/api/v1/admin/news/{id}', 'App\\Controllers\\NewsController@update');
$router->delete('/api/v1/admin/news/{id}', 'App\\Controllers\\NewsController@delete');

// Chat routes - FIXED routes first, then dynamic routes
$router->get('/api/v1/chats/conversations', 'App\\Controllers\\ChatController@listConversations');
$router->get('/api/v1/chats/total-unread', 'App\\Controllers\\ChatController@getTotalUnread');
$router->post('/api/v1/chats/{salon_id}/start', 'App\\Controllers\\ChatController@startConversation');
$router->get('/api/v1/chats/{conversation_id}/messages', 'App\\Controllers\\ChatController@getMessages');
$router->post('/api/v1/chats/{conversation_id}/messages', 'App\\Controllers\\ChatController@sendMessage');
$router->get('/api/v1/chats/{conversation_id}/unread-count', 'App\\Controllers\\ChatController@getUnreadCount');
$router->put('/api/v1/chats/{message_id}/read', 'App\\Controllers\\ChatController@markAsRead');

// Debug routes
$router->get('/api/v1/debug/headers', 'App\\Controllers\\DebugController@headers');

$router->run();