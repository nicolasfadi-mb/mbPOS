<?php
require_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['branchId'])) {
    $branchId = $_GET['branchId'];
    $data = json_decode(file_get_contents('php://input'), true);

    safe_query($conn, "DELETE FROM stock_items WHERE branchId = ?", [$branchId]);

    $sql = "INSERT INTO stock_items (id, branchId, name, unit, stock, averageCost, lowStockThreshold) VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    foreach ($data as $item) {
        safe_query($conn, $sql, [$item['id'], $branchId, $item['name'], $item['unit'], $item['stock'], $item['averageCost'], $item['lowStockThreshold']]);
    }

    echo json_encode($data);
}
?>