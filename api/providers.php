<?php

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            
            $query = "SELECT pc.*, u.username, u.legal_name 
                     FROM provider_cards pc 
                     JOIN users u ON pc.user_id = u.id 
                     WHERE pc.is_public = TRUE AND u.is_subscriber = TRUE
                     ORDER BY pc.rating DESC, pc.completed_deals DESC";
            
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $providers = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $row['networks'] = json_decode($row['networks']);
                $providers[] = $row;
            }
            
            echo json_encode([
                'success' => true,
                'data' => $providers
            ]);
            break;

        case 'POST':
            
            $data = json_decode(file_get_contents("php://input"));
            
            if (!isset($data->user_id) || !isset($data->is_public)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Missing required fields']);
                break;
            }
            
            $query = "UPDATE provider_cards SET is_public = :is_public WHERE user_id = :user_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':is_public', $data->is_public, PDO::PARAM_BOOL);
            $stmt->bindParam(':user_id', $data->user_id);
            
            if ($stmt->execute()) {
                
                $log_query = "INSERT INTO activity_log (section, activity_type, details, user_id) 
                             VALUES ('providers', 'Visibility Updated', :details, :user_id)";
                $log_stmt = $db->prepare($log_query);
                $details = $data->is_public ? "Provider card made public" : "Provider card hidden";
                $log_stmt->bindParam(':details', $details);
                $log_stmt->bindParam(':user_id', $data->user_id);
                $log_stmt->execute();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Provider visibility updated'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to update visibility']);
            }
            break;

        case 'PUT':
            
            $data = json_decode(file_get_contents("php://input"));
            
            if (!isset($data->user_id)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'User ID required']);
                break;
            }
            
            $query = "UPDATE provider_cards 
                     SET completed_deals = completed_deals + 1,
                         avg_response_time = :avg_response_time,
                         rating = :rating
                     WHERE user_id = :user_id";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $data->user_id);
            $stmt->bindParam(':avg_response_time', $data->avg_response_time);
            $stmt->bindParam(':rating', $data->rating);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Provider stats updated']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to update stats']);
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