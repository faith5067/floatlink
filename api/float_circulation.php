<?php

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
            
            $query = "SELECT fc.*, u.username 
                     FROM float_circulation fc 
                     JOIN users u ON fc.created_by = u.id 
                     ORDER BY fc.created_at DESC 
                     LIMIT :limit";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            $actions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $actions
            ]);
            break;

        case 'POST':
            
            $data = json_decode(file_get_contents("php://input"));
            
            if (!isset($data->network) || !isset($data->direction) || !isset($data->amount) || !isset($data->note)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Missing required fields']);
                break;
            }
            
            
            $created_by = isset($data->created_by) ? $data->created_by : 3;
            
            
            $db->beginTransaction();
            
            try {
                
                $query = "INSERT INTO float_circulation (network, direction, amount, note, created_by) 
                         VALUES (:network, :direction, :amount, :note, :created_by)";
                
                $stmt = $db->prepare($query);
                $stmt->bindParam(':network', $data->network);
                $stmt->bindParam(':direction', $data->direction);
                $stmt->bindParam(':amount', $data->amount);
                $stmt->bindParam(':note', $data->note);
                $stmt->bindParam(':created_by', $created_by);
                $stmt->execute();
                
                $circulation_id = $db->lastInsertId();
                
                
                
                $multiplier = ($data->direction === 'FROM_RESERVE') ? 1 : -1;
                
                $balance_query = "UPDATE reconciliation_balances 
                                 SET balance = balance + (:amount * :multiplier) 
                                 WHERE channel = 'Working Float'";
                
                $balance_stmt = $db->prepare($balance_query);
                $balance_stmt->bindParam(':amount', $data->amount);
                $balance_stmt->bindParam(':multiplier', $multiplier);
                $balance_stmt->execute();
                
                
                $log_query = "INSERT INTO activity_log (section, activity_type, details, amount, user_id) 
                             VALUES ('reconcile', 'Float Circulation', :details, :amount, :user_id)";
                $log_stmt = $db->prepare($log_query);
                $details = "{$data->direction}: {$data->network} - {$data->note}";
                $log_stmt->bindParam(':details', $details);
                $log_stmt->bindParam(':amount', $data->amount);
                $log_stmt->bindParam(':user_id', $created_by);
                $log_stmt->execute();
                
                $db->commit();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Float circulation recorded successfully',
                    'circulation_id' => $circulation_id
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