<?php
require_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['branchId'])) {
    $branchId = $_GET['branchId'];
    $data = json_decode(file_get_contents('php://input'), true);

    safe_query($conn, "DELETE FROM transactions WHERE branchId = ?", [$branchId]);

    $sql = "INSERT INTO transactions (id, branchId, invoiceNumber, date, items, subtotal, tax, total, paymentMethod, costOfGoodsSold, profit, rentalCharge, reservationId, amountPaidInCurrency, paymentCurrency, changeGiven, usdToLbpRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    foreach ($data as $t) {
        $items = json_encode($t['items']);
        safe_query($conn, $sql, [$t['id'], $branchId, $t['invoiceNumber'], $t['date'], $items, $t['subtotal'], $t['tax'], $t['total'], $t['paymentMethod'], $t['costOfGoodsSold'], $t['profit'], $t['rentalCharge'], $t['reservationId'], $t['amountPaidInCurrency'], $t['paymentCurrency'], $t['changeGiven'], $t['usdToLbpRate']]);
    }

    echo json_encode($data);
}
?>