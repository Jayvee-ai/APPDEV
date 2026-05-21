<?php
// notifications.php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$userId = (int) ($_GET['user_id'] ?? 0);

// GET ?user_id=X — get notifications for user
if ($method === 'GET' && $userId) {
    $db     = getDB();
    $result = $db->query("SELECT * FROM notifications WHERE user_id = $userId ORDER BY created_at DESC");
    $rows   = [];
    while ($row = $result->fetch_assoc()) {
        $row['is_read'] = (bool) $row['is_read'];
        $rows[] = $row;
    }
    respond($rows);
}

// POST ?action=mark_read&user_id=X — mark all as read
if ($method === 'POST' && $action === 'mark_read' && $userId) {
    $db = getDB();
    $db->query("UPDATE notifications SET is_read = 1 WHERE user_id = $userId");
    respond(['success' => true]);
}

respond(['error' => 'Invalid request'], 400);
