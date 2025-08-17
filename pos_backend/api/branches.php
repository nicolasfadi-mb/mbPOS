<?php
require_once 'db_connect.php';
require_once 'settings_helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $name = $data['name'];
    $id = 'branch' . (time() % 10000); // Simple unique ID

    $sql = "INSERT INTO branches (id, name) VALUES (?, ?)";
    safe_query($conn, $sql, [$id, $name]);

    // Add default settings for the new branch
    $initial_shop_info = '{"shopName":"' . $name . '","address":"","phone":"","website":"","footerMessage":"Thank you!","usdToLbpRate":90000}';
    $initial_invoice_settings = '{"primaryFormat":{"format":"INV-{YYYY}{MM}-{seq}","nextNumber":1},"useDualSystem":false,"dualSystemPercentage":80,"secondaryFormat":{"format":"ALT-{YYYY}{MM}-{seq}","nextNumber":1}}';
    $initial_units = '["g","ml","pcs","kg"]';
    
    update_setting($conn, $id, 'shopInfo', $initial_shop_info);
    update_setting($conn, $id, 'invoiceSettings', $initial_invoice_settings);
    update_setting($conn, $id, 'inventoryUnits', $initial_units);
    
    $result = $conn->query("SELECT * FROM branches");
    $branches = [];
    while($row = $result->fetch_assoc()) { $branches[] = $row; }
    echo json_encode($branches);
}
?>