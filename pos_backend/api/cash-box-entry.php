<?php
require_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['target'])) {
    $targetId = $_GET['target'];
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['id']) && !empty($data['id'])) {
        // Update
        $sql = "UPDATE cash_box_entries SET date=?, type=?, category=?, description=?, amountLBP=?, amountUSD=? WHERE id = ? AND branchId = ?";
        safe_query($conn, $sql, [$data['date'] ?? date('Y-m-d H:i:s'), $data['type'], $data['category'], $data['description'], $data['amountLBP'], $data['amountUSD'], $data['id'], $targetId]);
    } else {
        // Insert
        $id = 'cbe_' . time() . rand(100, 999);
        $sql = "INSERT INTO cash_box_entries (id, branchId, date, type, category, description, amountLBP, amountUSD, isManual) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        safe_query($conn, $sql, [$id, $targetId, $data['date'] ?? date('Y-m-d H:i:s'), $data['type'], $data['category'], $data['description'], $data['amountLBP'], $data['amountUSD'], 1]);
    }

    $stmt = safe_query($conn, "SELECT * FROM cash_box_entries WHERE branchId = ?", [$targetId]);
    $result = $stmt->get_result();
    $entries = [];
    while($row = $result->fetch_assoc()) { $entries[] = $row; }
    echo json_encode($entries);
}
?>