<?php
require_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['branchId'])) {
    $branchId = $_GET['branchId'];
    $data = json_decode(file_get_contents('php://input'), true);

    // Clear existing products for this branch
    safe_query($conn, "DELETE FROM products WHERE branchId = ?", [$branchId]);

    $sql = "INSERT INTO products (id, branchId, name, price, category, recipe, costOfGoodsSold) VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    foreach ($data as $product) {
        $recipe = json_encode($product['recipe']);
        safe_query($conn, $sql, [$product['id'], $branchId, $product['name'], $product['price'], $product['category'], $recipe, $product['costOfGoodsSold']]);
    }

    echo json_encode($data);
}
?>