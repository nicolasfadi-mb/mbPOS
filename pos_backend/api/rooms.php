<?php
require_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['branchId'])) {
    $branchId = $_GET['branchId'];
    $data = json_decode(file_get_contents('php://input'), true);

    safe_query($conn, "DELETE FROM rooms WHERE branchId = ?", [$branchId]);

    $sql = "INSERT INTO rooms (id, branchId, name, capacity, hourlyRate) VALUES (?, ?, ?, ?, ?)";
    
    foreach ($data as $room) {
        safe_query($conn, $sql, [$room['id'], $branchId, $room['name'], $room['capacity'], $room['hourlyRate']]);
    }

    echo json_encode($data);
}
?>