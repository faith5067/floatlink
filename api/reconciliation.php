<?php

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            
            $query = "SELECT * FROM reconciliation_balances ORDER BY channel";
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $balances = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $balances[$row['channel']] = $row['balance'];
            }
            
            
            $total = array_sum($balances);
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'balances' => $balances,
                    'total_capital' => $total
                ]
            ]);
            break;

        case 'POST':
            
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Use office movements or circulation endpoints']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>