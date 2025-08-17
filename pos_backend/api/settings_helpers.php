<?php
function update_setting($conn, $branchId, $key, $value) {
    // Check if the setting exists
    $sql_check = "SELECT * FROM settings WHERE branchId = ? AND settingKey = ?";
    $stmt_check = safe_query($conn, $sql_check, [$branchId, $key]);
    $result_check = $stmt_check->get_result();

    if ($result_check->num_rows > 0) {
        // Update existing setting
        $sql_update = "UPDATE settings SET settingValue = ? WHERE branchId = ? AND settingKey = ?";
        safe_query($conn, $sql_update, [$value, $branchId, $key]);
    } else {
        // Insert new setting
        $sql_insert = "INSERT INTO settings (branchId, settingKey, settingValue) VALUES (?, ?, ?)";
        safe_query($conn, $sql_insert, [$branchId, $key, $value]);
    }
    
    // Return the updated value, decoding if it was a JSON string
    $decodedValue = json_decode($value, true);
    return is_null($decodedValue) ? $value : $decodedValue;
}
?>