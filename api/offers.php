<?php

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
          
            $query = "SELECT fo.*, u.username, u.legal_name, u.is_verified 
                     FROM float_offers fo 
                     JOIN users u ON fo.poster_id = u.id 
                     WHERE fo.status = 'active' 
                     ORDER BY fo.created_at DESC";
            
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $offers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $offers
            ]);
            break;

        case 'POST':
           
            $data = json_decode(file_get_contents("php://input"));
            
            if (!isset($data->from_network) || !isset($data->to_network) || !isset($data->amount)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Missing required fields']);
                break;
            }
            
          
            $poster_id = isset($data->poster_id) ? $data->poster_id : 1;
            
            $query = "INSERT INTO float_offers (poster_id, from_network, to_network, amount, status) 
                     VALUES (:poster_id, :from_network, :to_network, :amount, 'active')";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':poster_id', $poster_id);
            $stmt->bindParam(':from_network', $data->from_network);
            $stmt->bindParam(':to_network', $data->to_network);
            $stmt->bindParam(':amount', $data->amount);
            
            if ($stmt->execute()) {
                $offer_id = $db->lastInsertId();
                
                
                $log_query = "INSERT INTO activity_log (section, activity_type, details, amount, user_id) 
                             VALUES ('offers', 'Offer Posted', :details, :amount, :user_id)";
                $log_stmt = $db->prepare($log_query);
                $details = "Float offer from {$data->from_network} to {$data->to_network}";
                $log_stmt->bindParam(':details', $details);
                $log_stmt->bindParam(':amount', $data->amount);
                $log_stmt->bindParam(':user_id', $poster_id);
                $log_stmt->execute();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Offer created successfully',
                    'offer_id' => $offer_id
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to create offer']);
            }
            break;

        case 'DELETE':
            
            $offer_id = isset($_GET['id']) ? $_GET['id'] : null;
            
            if (!$offer_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Offer ID required']);
                break;
            }
            
            $query = "UPDATE float_offers SET status = 'cancelled' WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $offer_id);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Offer cancelled']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to cancel offer']);
            }
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