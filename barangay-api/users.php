<?php
// users.php — Get all users
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET /users.php — get all users
if ($method === 'GET') {
    $db     = getDB();
    $result = $db->query("SELECT * FROM users ORDER BY created_at DESC");
    $users  = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    respond($users);
}

respond(['error' => 'Invalid request'], 400);
