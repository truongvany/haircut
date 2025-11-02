<?php
namespace App\Controllers;
use App\Core\Controller;

class UploadController extends Controller {
  public function uploadAvatar() {
    $user = $this->requireAuth();
    
    if (!isset($_FILES['avatar'])) {
      return $this->json(['error' => 'No file uploaded'], 400);
    }
    
    $file = $_FILES['avatar'];
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!in_array($file['type'], $allowedTypes)) {
      return $this->json(['error' => 'Invalid file type. Only JPG, PNG, GIF, WEBP allowed'], 400);
    }
    
    if ($file['size'] > 5 * 1024 * 1024) { // 5MB max
      return $this->json(['error' => 'File too large (max 5MB)'], 400);
    }
    
    // Create uploads directory
    $uploadDir = __DIR__ . '/../../public/uploads/avatars/';
    if (!is_dir($uploadDir)) {
      mkdir($uploadDir, 0755, true);
    }
    
    // Generate unique filename
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'avatar_' . $user['id'] . '_' . time() . '.' . $ext;
    $filepath = $uploadDir . $filename;
    
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
      return $this->json(['error' => 'Failed to upload file'], 500);
    }
    
    // QUAN TRỌNG: Return full URL với /haircut/backend/public prefix
    $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? "https" : "http";
    $host = $_SERVER['HTTP_HOST'];
    $url = $protocol . '://' . $host . '/haircut/backend/public/uploads/avatars/' . $filename;
    
    return $this->json([
      'url' => $url, 
      'path' => '/haircut/backend/public/uploads/avatars/' . $filename
    ]);
  }
}