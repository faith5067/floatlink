<?php

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            
            $deal_id = isset($_GET['id']) ? $_GET['id'] : null;
            
            if (!$deal_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Deal ID required']);
                break;
            }
            
            $query = "SELECT d.*, 
                     fo.from_network, fo.to_network, fo.amount,
                     u1.username as poster_username, u1.legal_name as poster_legal_name,
                     u2.username as subscriber_username, u2.legal_name as subscriber_legal_name
                     FROM deals d
                     JOIN float_offers fo ON d.offer_id = fo.id
                     JOIN users u1 ON fo.poster_id = u1.id
                     JOIN users u2 ON d.subscriber_id = u2.id
                     WHERE d.id = :deal_id";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':deal_id', $deal_id);
            $stmt->execute();
            
            $deal = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($deal) {
                echo json_encode(['success' => true, 'data' => $deal]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Deal not found']);
            }
            break;

        case 'POST':
            
            $data = json_decode(file_get_contents("php://input"));
            
            if (!isset($data->offer_id) || !isset($data->subscriber_id)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Missing required fields']);
                break;
            }
            
            
            $expires_at = date('Y-m-d H:i:s', strtotime('+15 minutes'));
            
            $query = "INSERT INTO deals (offer_id, subscriber_id, status, expires_at) 
                     VALUES (:offer_id, :subscriber_id, 'active', :expires_at)";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':offer_id', $data->offer_id);
            $stmt->bindParam(':subscriber_id', $data->subscriber_id);
            $stmt->bindParam(':expires_at', $expires_at);
            
            if ($stmt->execute()) {
                $deal_id = $db->lastInsertId();
                
                
                $update_query = "UPDATE float_offers SET status = 'in_progress' WHERE id = :offer_id";
                $update_stmt = $db->prepare($update_query);
                $update_stmt->bindParam(':offer_id', $data->offer_id);
                $update_stmt->execute();
                
                
                $log_query = "INSERT INTO activity_log (section, activity_type, details, user_id) 
                             VALUES ('offers', 'Deal Started', 'Subscriber picked an offer', :user_id)";
                $log_stmt = $db->prepare($log_query);
                $log_stmt->bindParam(':user_id', $data->subscriber_id);
                $log_stmt->execute();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Deal created successfully',
                    'deal_id' => $deal_id,
                    'expires_at' => $expires_at
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to create deal']);
            }
            break;

        case 'PUT':
            
            $data = json_decode(file_get_contents("php://input"));
            
            if (!isset($data->deal_id) || !isset($data->status)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Missing required fields']);
                break;
            }
            
            $query = "UPDATE deals SET status = :status";
            
            if ($data->status === 'completed') {
                $query .= ", completed_at = NOW()";
            }
            
            $query .= " WHERE id = :deal_id";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':status', $data->status);
            $stmt->bindParam(':deal_id', $data->deal_id);
            
            if ($stmt->execute()) {
                
                if ($data->status === 'completed') {
                    $offer_query = "UPDATE float_offers fo
                                   JOIN deals d ON fo.id = d.offer_id
                                   SET fo.status = 'completed'
                                   WHERE d.id = :deal_id";
                    $offer_stmt = $db->prepare($offer_query);
                    $offer_stmt->bindParam(':deal_id', $data->deal_id);
                    $offer_stmt->execute();
                    
                    
                    $log_query = "INSERT INTO activity_log (section, activity_type, details) 
                                 VALUES ('offers', 'Deal Completed', 'Float exchange completed successfully')";
                    $log_stmt = $db->prepare($log_query);
                    $log_stmt->execute();
                }
                
                echo json_encode(['success' => true, 'message' => 'Deal status updated']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to update deal']);
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