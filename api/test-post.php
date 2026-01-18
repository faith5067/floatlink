<?php
ini_set('display_errors', 0);
error_reporting(0);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once '../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if (!$conn) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

// Test insert
try {
    $query = "INSERT INTO float_offers (poster_id, from_network, to_network, amount, status) 
             VALUES (1, 'M-Pesa', 'Airtel', 50000, 'active')";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    
    echo json_encode([
        'success' => true,
        'message' => 'Test offer created',
        'id' => $conn->lastInsertId()
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>