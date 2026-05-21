<?php
// audit_logs.php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET — get all audit logs
if ($method === 'GET') {
    $db     = getDB();
    $result = $db->query("SELECT * FROM audit_logs ORDER BY created_at DESC");
    $rows   = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
    respond($rows);
}

respond(['error' => 'Invalid request'], 400);
