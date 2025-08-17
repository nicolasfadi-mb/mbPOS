<?php
require_once 'db_connect.php';
require_once 'settings_helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['branchId'])) {
    $branchId = $_GET['branchId'];
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Get current petty cash
    $stmt_pc = safe_query($conn, "SELECT settingValue FROM settings WHERE branchId = ? AND settingKey = 'pettyCash'", [$branchId]);
    $result_pc = $stmt_pc->get_result();
    $row_pc = $result_pc->fetch_assoc();
    $pettyCash = json_decode($row_pc['settingValue'], true);

    // Update petty cash
    $pettyCash['lbp'] += $data['amountLBP'];
    $pettyCash['usd'] += $data['amountUSD'];
    update_setting($conn, $branchId, 'pettyCash', json_encode($pettyCash));
    
    // Add expense to main cash box
    $id = 'cbe_' . time();
    $sql = "INSERT INTO cash_box_entries (id, branchId, date, type, category, description, amountLBP, amountUSD, isManual) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    safe_query($conn, $sql, [$id, $branchId, date('Y-m-d H:i:s'), 'expense', 'Petty Cash Funding', $data['memo'], $data['amountLBP'], $data['amountUSD'], 0]);

    // Return updated data
    $stmt_cb = safe_query($conn, "SELECT * FROM cash_box_entries WHERE branchId = ?", [$branchId]);
    $result_cb = $stmt_cb->get_result();
    $cash_box = [];
    while($row = $result_cb->fetch_assoc()) { $cash_box[] = $row; }

    echo json_encode(['updatedCashBox' => $cash_box, 'updatedPettyCash' => $pettyCash]);
}
?>