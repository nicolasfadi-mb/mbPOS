<?php
require_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $fromBranchId = $data['fromBranchId'];
    $amountLBP = $data['amountLBP'];
    $amountUSD = $data['amountUSD'];
    $memo = $data['memo'];

    // Add expense to branch
    $branch_id = 'cbe_' . time() . '_b';
    $branch_sql = "INSERT INTO cash_box_entries (id, branchId, date, type, category, description, amountLBP, amountUSD, isManual) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    safe_query($conn, $branch_sql, [$branch_id, $fromBranchId, date('Y-m-d H:i:s'), 'expense', 'Transfer to Main', $memo, $amountLBP, $amountUSD, 0]);

    // Add income to main
    $main_id = 'cbe_' . time() . '_m';
    $main_sql = "INSERT INTO cash_box_entries (id, branchId, date, type, category, description, amountLBP, amountUSD, isManual) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    safe_query($conn, $main_sql, [$main_id, 'main', date('Y-m-d H:i:s'), 'income', 'Transfer from Branch', "From branch ID: $fromBranchId - $memo", $amountLBP, $amountUSD, 0]);

    // Return updated boxes
    $stmt_branch = safe_query($conn, "SELECT * FROM cash_box_entries WHERE branchId = ?", [$fromBranchId]);
    $result_branch = $stmt_branch->get_result();
    $branch_box = [];
    while($row = $result_branch->fetch_assoc()) { $branch_box[] = $row; }

    $stmt_main = safe_query($conn, "SELECT * FROM cash_box_entries WHERE branchId = 'main'");
    $result_main = $stmt_main->get_result();
    $main_box = [];
    while($row = $result_main->fetch_assoc()) { $main_box[] = $row; }

    echo json_encode(['updatedBranchBox' => $branch_box, 'updatedMainBox' => $main_box]);
}
?>