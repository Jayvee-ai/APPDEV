<?php
// cert_types.php — Certificate Types CRUD
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET — get all cert types
if ($method === 'GET') {
    $db     = getDB();
    $result = $db->query("SELECT * FROM certificate_types ORDER BY id ASC");
    $types  = [];
    while ($row = $result->fetch_assoc()) {
        $row['fee']           = (float) $row['fee'];
        $row['processing_days'] = (int) $row['processing_days'];
        $row['is_active']     = (bool) $row['is_active'];
        $types[] = $row;
    }
    respond($types);
}

respond(['error' => 'Invalid request'], 400);
