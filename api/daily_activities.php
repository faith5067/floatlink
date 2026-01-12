<?php

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            
            $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
            
            $query = "SELECT da.*, u.username 
                     FROM daily_activities da 
                     JOIN users u ON da.created_by = u.id 
                     WHERE DATE(da.created_at) = :date 
                     ORDER BY da.created_at DESC";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':date', $date);
            $stmt->execute();
            
            $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $activities
            ]);
            break;

        case 'POST':
            
            $data = json_decode(file_get_contents("php://input"));
            
            if (!isset($data->category) || !isset($data->channel) || !isset($data->amount) || !isset($data->description)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Missing required fields']);
                break;
            }
            
            
            $created_by = isset($data->created_by) ? $data->created_by : 3;
            
            $query = "INSERT INTO daily_activities (category, channel, amount, staff, reference, description, created_by) 
                     VALUES (:category, :channel, :amount, :staff, :reference, :description, :created_by)";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':category', $data->category);
            $stmt->bindParam(':channel', $data->channel);
            $stmt->bindParam(':amount', $data->amount);
            $staff = isset($data->staff) ? $data->staff : null;
            $reference = isset($data->reference) ? $data->reference : null;
            $stmt->bindParam(':staff', $staff);
            $stmt->bindParam(':reference', $reference);
            $stmt->bindParam(':description', $data->description);
            $stmt->bindParam(':created_by', $created_by);
            
            if ($stmt->execute()) {
                $activity_id = $db->lastInsertId();
                
                
                $log_query = "INSERT INTO activity_log (section, activity_type, details, amount, user_id) 
                             VALUES ('reconcile', 'Daily Activity', :details, :amount, :user_id)";
                $log_stmt = $db->prepare($log_query);
                $details = "{$data->category}: {$data->description}";
                $log_stmt->bindParam(':details', $details);
                $log_stmt->bindParam(':amount', $data->amount);
                $log_stmt->bindParam(':user_id', $created_by);
                $log_stmt->execute();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Activity recorded successfully',
                    'activity_id' => $activity_id
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to record activity']);
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