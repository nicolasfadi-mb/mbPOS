<?php
require_once 'db_connect.php';
require_once 'settings_helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['branchId'])) {
    $branchId = $_GET['branchId'];
    $data = file_get_contents('php://input'); // Keep as JSON string
    $updated_value = update_setting($conn, $branchId, 'shopInfo', $data);
    echo json_encode($updated_value);
}
?>