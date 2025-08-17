<?php
require_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['branchId'])) {
    $branchId = $_GET['branchId'];
    $data = json_decode(file_get_contents('php://input'), true);

    safe_query($conn, "DELETE FROM reservations WHERE branchId = ?", [$branchId]);

    $sql = "INSERT INTO reservations (id, branchId, roomId, customerName, guests, scheduledStartTime, scheduledEndTime, actualStartTime, actualEndTime, status, items) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    foreach ($data as $res) {
        $items = json_encode($res['items']);
        safe_query($conn, $sql, [$res['id'], $branchId, $res['roomId'], $res['customerName'], $res['guests'], $res['scheduledStartTime'], $res['scheduledEndTime'], $res['actualStartTime'], $res['actualEndTime'], $res['status'], $items]);
    }

    echo json_encode($data);
}
?>