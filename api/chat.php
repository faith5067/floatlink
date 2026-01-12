<?php

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            
            $deal_id = isset($_GET['deal_id']) ? $_GET['deal_id'] : null;
            
            if (!$deal_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Deal ID required']);
                break;
            }
            
            $query = "SELECT cm.*, u.username, u.is_subscriber 
                     FROM chat_messages cm 
                     JOIN users u ON cm.sender_id = u.id 
                     WHERE cm.deal_id = :deal_id 
                     ORDER BY cm.created_at ASC";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':deal_id', $deal_id);
            $stmt->execute();
            
            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $messages
            ]);
            break;

        case 'POST':
            
            $data = json_decode(file_get_contents("php://input"));
            
            if (!isset($data->deal_id) || !isset($data->sender_id) || !isset($data->message)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Missing required fields']);
                break;
            }
            
            $query = "INSERT INTO chat_messages (deal_id, sender_id, message) 
                     VALUES (:deal_id, :sender_id, :message)";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':deal_id', $data->deal_id);
            $stmt->bindParam(':sender_id', $data->sender_id);
            $stmt->bindParam(':message', $data->message);
            
            if ($stmt->execute()) {
                $message_id = $db->lastInsertId();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Message sent successfully',
                    'message_id' => $message_id
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to send message']);
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