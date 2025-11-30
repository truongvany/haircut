<?php
namespace App\Controllers;

use App\Config\DB;
use App\Core\Controller;
use App\Core\Auth;

class NewsController extends Controller {
  public function list() {
    $pdo = DB::pdo();
    $query = "SELECT id, title, content, badge, created_at, updated_at FROM news ORDER BY created_at DESC";
    $st = $pdo->prepare($query);
    $st->execute();
    $items = $st->fetchAll(\PDO::FETCH_ASSOC);
    
    $this->json(['items' => $items]);
  }

  public function create($params = []) {
    $user = Auth::user();
    if (!$user || $user['role'] !== 'admin') {
      http_response_code(403);
      $this->json(['error' => 'Unauthorized']);
      return;
    }

    $body = $this->body();
    $title = $body['title'] ?? '';
    $content = $body['content'] ?? '';
    $badge = $body['badge'] ?? null;

    if (!$title || !$content) {
      http_response_code(400);
      $this->json(['error' => 'Title and content are required']);
      return;
    }

    $pdo = DB::pdo();
    $query = "INSERT INTO news (title, content, badge) VALUES (?, ?, ?)";
    $st = $pdo->prepare($query);
    $st->execute([$title, $content, $badge]);
    
    $id = $pdo->lastInsertId();
    http_response_code(201);
    $this->json(['id' => $id, 'message' => 'News created']);
  }

  public function update($params = []) {
    $user = Auth::user();
    if (!$user || $user['role'] !== 'admin') {
      http_response_code(403);
      $this->json(['error' => 'Unauthorized']);
      return;
    }

    $id = $params['id'] ?? 0;
    $body = $this->body();
    $title = $body['title'] ?? '';
    $content = $body['content'] ?? '';
    $badge = $body['badge'] ?? null;

    if (!$id || !$title || !$content) {
      http_response_code(400);
      $this->json(['error' => 'Invalid parameters']);
      return;
    }

    $pdo = DB::pdo();
    $query = "UPDATE news SET title = ?, content = ?, badge = ? WHERE id = ?";
    $st = $pdo->prepare($query);
    $st->execute([$title, $content, $badge, $id]);
    
    $this->json(['message' => 'News updated']);
  }

  public function delete($params = []) {
    $user = Auth::user();
    if (!$user || $user['role'] !== 'admin') {
      http_response_code(403);
      $this->json(['error' => 'Unauthorized']);
      return;
    }

    $id = $params['id'] ?? 0;
    if (!$id) {
      http_response_code(400);
      $this->json(['error' => 'Invalid ID']);
      return;
    }

    $pdo = DB::pdo();
    $query = "DELETE FROM news WHERE id = ?";
    $st = $pdo->prepare($query);
    $st->execute([$id]);
    
    $this->json(['message' => 'News deleted']);
  }
}
