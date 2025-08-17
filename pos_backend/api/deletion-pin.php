<?php
require_once 'db_connect.php';
require_once 'settings_helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $pin = json_encode($data['pin']); // Store as JSON string
    $updated_value = update_setting($conn, 'global', 'deletionPin', $pin);
    echo json_encode($updated_value);
}
?>