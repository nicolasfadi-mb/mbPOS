<?php
require_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['branchId'])) {
    $branchId = $_GET['branchId'];
    $data = json_decode(file_get_contents('php://input'), true);

    safe_query($conn, "DELETE FROM cashier_sessions WHERE branchId = ?", [$branchId]);

    $sql = "INSERT INTO cashier_sessions (sessionId, branchId, userId, userName, startTime, endTime, startingInventory, currentInventory, overageLog, transactions, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    foreach ($data as $s) {
        safe_query($conn, $sql, [$s['sessionId'], $branchId, $s['userId'], $s['userName'], $s['startTime'], $s['endTime'], json_encode($s['startingInventory']), json_encode($s['currentInventory']), json_encode($s['overageLog']), json_encode($s['transactions']), $s['isActive']]);
    }

    echo json_encode($data);
}
?>