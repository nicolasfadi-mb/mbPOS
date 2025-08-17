<?php
require_once 'db_connect.php';
require_once 'settings_helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['branchId'])) {
    $branchId = $_GET['branchId'];
    
    $stmt = safe_query($conn, "SELECT settingValue FROM settings WHERE branchId = ? AND settingKey = 'invoiceSettings'", [$branchId]);
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $settings = json_decode($row['settingValue'], true);

    $format = $settings['primaryFormat']['format'];
    $nextNumber = $settings['primaryFormat']['nextNumber'];
    
    $invoiceNumber = str_replace(
        ['{YYYY}', '{MM}', '{DD}', '{seq}'],
        [date('Y'), date('m'), date('d'), $nextNumber],
        $format
    );

    $settings['primaryFormat']['nextNumber']++;
    update_setting($conn, $branchId, 'invoiceSettings', json_encode($settings));

    echo json_encode(['invoiceNumber' => $invoiceNumber, 'settings' => $settings]);
}
?>