<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Config\DB;
use App\Core\Auth as AuthCore;

class AuthController extends Controller
{
    // POST /api/v1/auth/register
    public function register()
    {
        // Dùng helper body() cho đồng bộ
        $body  = $this->body();
        $name  = trim($body['full_name'] ?? '');
        $email = trim($body['email'] ?? '');
        $pass  = $body['password'] ?? '';

        if ($name === '' || $email === '' || $pass === '') {
            return $this->json(['error' => 'Thiếu thông tin'], 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json(['error' => 'Email không hợp lệ'], 400);
        }

        $pdo = DB::pdo();

        // Check trùng email
        $st = $pdo->prepare('SELECT id FROM users WHERE email=? LIMIT 1');
        $st->execute([$email]);
        if ($st->fetch()) {
            return $this->json(['error' => 'Email đã tồn tại'], 409);
        }

        // role_id mặc định: 3 (customer)
        $hash = password_hash($pass, PASSWORD_BCRYPT);
        $ins  = $pdo->prepare('INSERT INTO users(role_id, full_name, email, password_hash) VALUES (3, ?, ?, ?)');
        $ins->execute([$name, $email, $hash]);

        return $this->json([
            'message' => 'Đăng ký thành công',
            'user_id' => (int)$pdo->lastInsertId()
        ], 201);
    }

    // POST /api/v1/auth/login
    public function login()
    {
        // Chỉ dùng DUY NHẤT helper body()
        $body  = $this->body();
        $email = trim($body['email'] ?? '');
        $pass  = $body['password'] ?? '';

        if ($email === '' || $pass === '') {
            return $this->json(['error' => 'Thiếu email hoặc mật khẩu'], 400);
        }

        $pdo = DB::pdo();
        $st  = $pdo->prepare('SELECT id, role_id, full_name, email, password_hash FROM users WHERE email=?');
        $st->execute([$email]);
        $u = $st->fetch();

        if (!$u || !password_verify($pass, $u['password_hash'])) {
            return $this->json(['error' => 'Sai thông tin đăng nhập'], 401);
        }

        $role = ((int)$u['role_id'] === 1)
            ? 'admin'
            : (((int)$u['role_id'] === 2) ? 'salon' : 'customer');

        $token = AuthCore::issue([
            'uid'   => (int)$u['id'],
            'role'  => $role,
            'email' => $u['email'],
            'name'  => $u['full_name'],
        ]);

        return $this->json([
            'token' => $token,
            'user'  => [
                'id'    => (int)$u['id'],
                'name'  => $u['full_name'],
                'role'  => $role,
                'email' => $u['email'],
            ]
        ]);
    }

    // GET /api/v1/me
    public function me()
    {
        $me = \App\Core\Auth::user();
        if (!$me || !isset($me['uid'])) return $this->json(['error'=>'Unauthorized'], 401);
        $uid = (int)$me['uid'];
        $pdo = DB::pdo();
        $st = $pdo->prepare('SELECT id, full_name, email, phone, avatar_url, role_id FROM users WHERE id = ? LIMIT 1');
        $st->execute([$uid]);
        $u = $st->fetch(\PDO::FETCH_ASSOC);
        if (!$u) return $this->json(['error'=>'User not found'], 404);
        $role = ((int)$u['role_id'] === 1) ? 'admin' : (((int)$u['role_id'] === 2) ? 'salon' : 'customer');
        return $this->json(['user' => [
            'id' => (int)$u['id'],
            'name' => $u['full_name'],
            'email' => $u['email'],
            'phone' => $u['phone'] ?? null,
            'avatar' => $u['avatar_url'] ?? null,
            'role' => $role
        ]]);
    }

    // PUT /api/v1/me
    public function updateMe()
    {
        $me = \App\Core\Auth::user();
        if (!$me || !isset($me['uid'])) return $this->json(['error'=>'Unauthorized'], 401);
        $uid = (int)$me['uid'];
        $body = $this->body();
        $name = trim($body['name'] ?? $body['full_name'] ?? '');
        $phone = isset($body['phone']) ? trim($body['phone']) : null;
        $avatar = isset($body['avatar']) ? trim($body['avatar']) : null;
        if ($name === '') return $this->json(['error'=>'Name cannot be empty'], 400);
        $pdo = DB::pdo();
        $u = $pdo->prepare('UPDATE users SET full_name = ?, phone = ?, avatar_url = ? WHERE id = ?');
        $u->execute([$name, $phone, $avatar, $uid]);
        return $this->json(['message'=>'Profile updated']);
    }

    // PUT /api/v1/me/password
    public function changePassword()
    {
        $me = \App\Core\Auth::user();
        if (!$me || !isset($me['uid'])) return $this->json(['error'=>'Unauthorized'], 401);
        $uid = (int)$me['uid'];
        $body = $this->body();
        $current = $body['current_password'] ?? '';
        $new = $body['new_password'] ?? '';
        if ($current === '' || $new === '') return $this->json(['error'=>'Missing password fields'], 400);
        $pdo = DB::pdo();
        $st = $pdo->prepare('SELECT password_hash FROM users WHERE id = ? LIMIT 1');
        $st->execute([$uid]);
        $r = $st->fetch(\PDO::FETCH_ASSOC);
        if (!$r || !password_verify($current, $r['password_hash'])) return $this->json(['error'=>'Current password is incorrect'], 400);
        $hash = password_hash($new, PASSWORD_BCRYPT);
        $u = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $u->execute([$hash, $uid]);
        return $this->json(['message'=>'Password changed']);
    }
}
