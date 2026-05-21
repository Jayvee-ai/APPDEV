<?php
// ============================================
// config.php — Database connection
// ============================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

define('DB_HOST', 'localhost');
define('DB_USER', 'root');       // default XAMPP username
define('DB_PASS', '');           // default XAMPP password (empty)
define('DB_NAME', 'barangay_bued');

function getDB() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]);
        exit();
    }
    $conn->set_charset("utf8mb4");
    return $conn;
}

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

function getBody() {
    return json_decode(file_get_contents("php://input"), true) ?? [];
}
