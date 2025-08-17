<?php
require_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['branchId'])) {
    $branchId = $_GET['branchId'];
    $data = json_decode(file_get_contents('php://input'), true);

    safe_query($conn, "DELETE FROM cash_box_entries WHERE branchId = ?", [$branchId]);

    $sql = "INSERT INTO cash_box_entries (id, branchId, date, type, category, description, amountLBP, amountUSD, invoiceNumber, isManual) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    foreach ($data as $e) {
        safe_query($conn, $sql, [$e['id'], $branchId, $e['date'], $e['type'], $e['category'], $e['description'], $e['amountLBP'], $e['amountUSD'], $e['invoiceNumber'], $e['isManual']]);
    }

    echo json_encode($data);
}
?>