<?php

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
            
            $query = "SELECT om.*, u.username 
                     FROM office_movements om 
                     JOIN users u ON om.created_by = u.id 
                     ORDER BY om.created_at DESC 
                     LIMIT :limit";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            $movements = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $movements
            ]);
            break;

        case 'POST':
        
            $data = json_decode(file_get_contents("php://input"));
            
            if (!isset($data->channel) || !isset($data->direction) || !isset($data->amount) || !isset($data->note)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Missing required fields']);
                break;
            }
            
            
            $created_by = isset($data->created_by) ? $data->created_by : 3;
            
            
            $db->beginTransaction();
            
            try {
                
                $query = "INSERT INTO office_movements (channel, direction, amount, note, created_by) 
                         VALUES (:channel, :direction, :amount, :note, :created_by)";
                
                $stmt = $db->prepare($query);
                $stmt->bindParam(':channel', $data->channel);
                $stmt->bindParam(':direction', $data->direction);
                $stmt->bindParam(':amount', $data->amount);
                $stmt->bindParam(':note', $data->note);
                $stmt->bindParam(':created_by', $created_by);
                $stmt->execute();
                
                $movement_id = $db->lastInsertId();
                
                
                $multiplier = ($data->direction === 'IN') ? 1 : -1;
                $balance_query = "UPDATE reconciliation_balances 
                                 SET balance = balance + (:amount * :multiplier) 
                                 WHERE channel = :channel";
                
                $balance_stmt = $db->prepare($balance_query);
                $balance_stmt->bindParam(':amount', $data->amount);
                $balance_stmt->bindParam(':multiplier', $multiplier);
                $balance_stmt->bindParam(':channel', $data->channel);
                $balance_stmt->execute();
                
                
                $log_query = "INSERT INTO activity_log (section, activity_type, details, amount, user_id) 
                             VALUES ('reconcile', 'Office Movement', :details, :amount, :user_id)";
                $log_stmt = $db->prepare($log_query);
                $details = "{$data->direction} movement: {$data->channel} - {$data->note}";
                $log_stmt->bindParam(':details', $details);
                $log_stmt->bindParam(':amount', $data->amount);
                $log_stmt->bindParam(':user_id', $created_by);
                $log_stmt->execute();
                
                $db->commit();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Office movement recorded successfully',
                    'movement_id' => $movement_id
                ]);
            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
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