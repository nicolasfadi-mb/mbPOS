<?php
require_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // Clear existing users
    $conn->query("DELETE FROM users");

    $sql = "INSERT INTO users (id, name, pin, role, accessibleBranchIds) VALUES (?, ?, ?, ?, ?)";
    
    foreach ($data as $user) {
        $branchIds = $user['accessibleBranchIds'] === 'all' ? 'all' : json_encode($user['accessibleBranchIds']);
        safe_query($conn, $sql, [$user['id'], $user['name'], $user['pin'], $user['role'], $branchIds]);
    }

    echo json_encode($data);
}
?>