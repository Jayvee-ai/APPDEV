<?php
// auth.php — Login & Register
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// POST /auth.php?action=login
if ($method === 'POST' && $action === 'login') {
    $body = getBody();
    $email    = $body['email'] ?? '';
    $password = $body['password'] ?? '';

    $db   = getDB();
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ? AND password = ? LIMIT 1");
    $stmt->bind_param("ss", $email, $password);
    $stmt->execute();
    $result = $stmt->get_result();
    $user   = $result->fetch_assoc();

    if (!$user) {
        respond(['error' => 'Invalid email or password'], 401);
    }

    // Audit log
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $db->query("INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value, ip_address)
                VALUES ({$user['id']}, 'LOGIN', 'user', {$user['id']}, 'User logged in', '$ip')");

    respond($user);
}

// POST /auth.php?action=register
if ($method === 'POST' && $action === 'register') {
    $body    = getBody();
    $name    = $body['full_name'] ?? '';
    $email   = $body['email'] ?? '';
    $password = $body['password'] ?? '';
    $phone   = $body['phone'] ?? '';
    $address = $body['address'] ?? '';

    if (!$name || !$email || !$password) {
        respond(['error' => 'Missing required fields'], 400);
    }

    $db = getDB();

    // Check email exists
    $check = $db->prepare("SELECT id FROM users WHERE email = ?");
    $check->bind_param("s", $email);
    $check->execute();
    if ($check->get_result()->num_rows > 0) {
        respond(['error' => 'Email already exists'], 409);
    }

    $stmt = $db->prepare("INSERT INTO users (full_name, email, password, role, phone, address)
                          VALUES (?, ?, ?, 'resident', ?, ?)");
    $stmt->bind_param("sssss", $name, $email, $password, $phone, $address);
    $stmt->execute();
    $newId = $db->insert_id;

    $newUser = [
        'id'         => $newId,
        'full_name'  => $name,
        'email'      => $email,
        'role'       => 'resident',
        'phone'      => $phone,
        'address'    => $address,
        'created_at' => date('Y-m-d H:i:s'),
    ];

    respond($newUser, 201);
}

respond(['error' => 'Invalid action'], 400);
