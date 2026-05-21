<?php
// requests.php — Certificate Requests CRUD
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ── GET ?action=by_code — MUST come before the generic GET handler ──────────
if ($method === 'GET' && $action === 'by_code') {
    $code = trim($_GET['code'] ?? '');
    if (!$code) respond(['error' => 'Missing code'], 400);

    $db   = getDB();
    $stmt = $db->prepare(
        "SELECT cr.*,
                u.full_name, u.address, u.phone, u.email,
                ct.name AS cert_name
         FROM certificate_requests cr
         JOIN users u  ON u.id  = cr.user_id
         JOIN certificate_types ct ON ct.id = cr.certificate_type_id
         WHERE TRIM(cr.request_code) = ? LIMIT 1"
    );
    $stmt->bind_param("s", $code);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    if (!$row) respond(['error' => 'Not found'], 404);

    $row['id']                  = (int) $row['id'];
    $row['user_id']             = (int) $row['user_id'];
    $row['certificate_type_id'] = (int) $row['certificate_type_id'];
    respond($row);
}

// ── GET — get all requests ───────────────────────────────────────────────────
if ($method === 'GET') {
    $db     = getDB();
    $result = $db->query("SELECT * FROM certificate_requests ORDER BY requested_at DESC");
    $rows   = [];
    while ($row = $result->fetch_assoc()) {
        $row['id']                  = (int) $row['id'];
        $row['user_id']             = (int) $row['user_id'];
        $row['certificate_type_id'] = (int) $row['certificate_type_id'];
        $rows[] = $row;
    }
    respond($rows);
}

// ── POST ?action=create — create new request ─────────────────────────────────
if ($method === 'POST' && $action === 'create') {
    $body       = getBody();
    $userId     = (int) ($body['user_id'] ?? 0);
    $certTypeId = (int) ($body['certificate_type_id'] ?? 0);
    $purpose    = $body['purpose'] ?? '';
    $priority   = $body['priority'] ?? 'normal';
    $notes      = $body['notes'] ?? '';

    if (!$userId || !$certTypeId) {
        respond(['error' => 'Missing required fields'], 400);
    }

    $db = getDB();

    // Generate request code
    $year     = date('Y');
    $countRes = $db->query("SELECT COUNT(*) as cnt FROM certificate_requests");
    $countRow = $countRes->fetch_assoc();
    $nextNum  = $countRow['cnt'] + 1;
    $requestCode = "BUED-$year-" . str_pad($nextNum, 4, '0', STR_PAD_LEFT);

    $stmt = $db->prepare(
        "INSERT INTO certificate_requests (request_code, user_id, certificate_type_id, purpose, priority, notes, status, requested_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())"
    );
    $stmt->bind_param("siisss", $requestCode, $userId, $certTypeId, $purpose, $priority, $notes);
    $stmt->execute();
    $newId = $db->insert_id;

    // Notification — single prepared statement
    $msg      = "Your request $requestCode has been submitted successfully.";
    $notifStmt = $db->prepare(
        "INSERT INTO notifications (user_id, title, message, type, related_request_id)
         VALUES (?, 'Request Submitted', ?, 'info', ?)"
    );
    $notifStmt->bind_param("isi", $userId, $msg, $newId);
    $notifStmt->execute();

    $newRequest = [
        'id'                  => $newId,
        'request_code'        => $requestCode,
        'user_id'             => $userId,
        'certificate_type_id' => $certTypeId,
        'purpose'             => $purpose,
        'priority'            => $priority,
        'notes'               => $notes,
        'status'              => 'pending',
        'requested_at'        => date('Y-m-d H:i:s'),
        'approved_at'         => null,
        'released_at'         => null,
        'qr_code_data'        => null,
        'admin_remarks'       => '',
        'approved_by'         => null,
    ];

    respond($newRequest, 201);
}

// ── POST ?action=update_status — update request status ───────────────────────
if ($method === 'POST' && $action === 'update_status') {
    $body      = getBody();
    $requestId = (int) ($body['request_id'] ?? 0);
    $status    = $body['status'] ?? '';
    $adminId   = (int) ($body['admin_id'] ?? 0);
    $remarks   = $body['remarks'] ?? '';

    if (!$requestId || !$status) {
        respond(['error' => 'Missing required fields'], 400);
    }

    $db = getDB();

    $res = $db->query(
        "SELECT cr.*, u.full_name, u.email, u.phone, u.address, ct.name as cert_name
         FROM certificate_requests cr
         JOIN users u ON u.id = cr.user_id
         JOIN certificate_types ct ON ct.id = cr.certificate_type_id
         WHERE cr.id = $requestId LIMIT 1"
    );
    $request = $res->fetch_assoc();
    if (!$request) {
        respond(['error' => 'Request not found'], 404);
    }

    $now        = date('Y-m-d H:i:s');
    $approvedAt = ($status === 'approved' && !$request['approved_at']) ? $now : $request['approved_at'];
    $releasedAt = ($status === 'released' && !$request['released_at']) ? $now : $request['released_at'];
    $approvedBy = in_array($status, ['approved', 'released']) ? $adminId : $request['approved_by'];

    // Build QR payload on first approval/release
    $qrData = $request['qr_code_data'];
    if (in_array($status, ['approved', 'released']) && !$qrData) {
        $qrPayload = [
            'system'            => 'Barangay Bued Digital Certificate Request System',
            'verification_type' => 'barangay_certificate',
            'request_code'      => $request['request_code'],
            'resident_id'       => $request['user_id'],
            'resident_name'     => $request['full_name'],
            'resident_email'    => $request['email'],
            'resident_phone'    => $request['phone'],
            'resident_address'  => $request['address'],
            'certificate_type'  => $request['cert_name'],
            'purpose'           => $request['purpose'],
            'status'            => $status,
            'approved_at'       => $approvedAt,
            'released_at'       => $releasedAt,
            'approved_by'       => $adminId,
        ];
        $qrData = json_encode($qrPayload);
    }

    $stmt = $db->prepare(
        "UPDATE certificate_requests
         SET status=?, admin_remarks=?, approved_by=?, approved_at=?, released_at=?, qr_code_data=?
         WHERE id=?"
    );
    $stmt->bind_param("ssisssi", $status, $remarks, $approvedBy, $approvedAt, $releasedAt, $qrData, $requestId);
    $stmt->execute();

    // Notification
    $titleMap = [
        'under_review' => 'Request Under Review',
        'approved'     => 'Request Approved!',
        'rejected'     => 'Request Rejected',
        'released'     => 'Certificate Released!',
    ];
    $msgMap = [
        'under_review' => "Your request {$request['request_code']} is now under review.",
        'approved'     => "Your {$request['cert_name']} ({$request['request_code']}) has been approved.",
        'rejected'     => "Your request {$request['request_code']} was rejected." . ($remarks ? " Remarks: $remarks" : ''),
        'released'     => "Your {$request['cert_name']} ({$request['request_code']}) has been released.",
    ];
    $typeMap = ['under_review' => 'info', 'approved' => 'success', 'rejected' => 'warning', 'released' => 'success'];

    $notifTitle = $titleMap[$status] ?? 'Request Updated';
    $notifMsg   = $msgMap[$status]  ?? "Your request was updated.";
    $notifType  = $typeMap[$status] ?? 'info';
    $userId     = $request['user_id'];

    $notifStmt = $db->prepare(
        "INSERT INTO notifications (user_id, title, message, type, related_request_id)
         VALUES (?, ?, ?, ?, ?)"
    );
    $notifStmt->bind_param("isssi", $userId, $notifTitle, $notifMsg, $notifType, $requestId);
    $notifStmt->execute();

    // Audit log
    $detail    = $remarks ?: "Status changed to $status";
    $auditStmt = $db->prepare(
        "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value, ip_address)
         VALUES (?, ?, 'certificate_request', ?, ?, ?)"
    );
    $auditAction = 'REQUEST_' . strtoupper($status);
    $ip          = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $auditStmt->bind_param("isiss", $adminId, $auditAction, $requestId, $detail, $ip);
    $auditStmt->execute();

    respond(['success' => true, 'status' => $status]);
}

respond(['error' => 'Invalid request'], 400);