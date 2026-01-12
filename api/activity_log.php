<?php

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        
        $section = isset($_GET['section']) ? $_GET['section'] : 'all';
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 5;
        
        if ($section === 'all') {
            $query = "SELECT al.*, u.username 
                     FROM activity_log al 
                     LEFT JOIN users u ON al.user_id = u.id 
                     ORDER BY al.created_at DESC 
                     LIMIT :limit";
        } else {
            $query = "SELECT al.*, u.username 
                     FROM activity_log al 
                     LEFT JOIN users u ON al.user_id = u.id 
                     WHERE al.section = :section 
                     ORDER BY al.created_at DESC 
                     LIMIT :limit";
        }
        
        $stmt = $db->prepare($query);
        if ($section !== 'all') {
            $stmt->bindParam(':section', $section);
        }
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        
        $formatted_activities = [];
        foreach ($activities as $activity) {
            $formatted_activities[] = [
                'id' => $activity['id'],
                'type' => $activity['activity_type'],
                'details' => $activity['details'],
                'amount' => $activity['amount'],
                'username' => $activity['username'],
                'created_at' => $activity['created_at'],
                'time_ago' => timeAgo($activity['created_at'])
            ];
        }
        
        echo json_encode([
            'success' => true,
            'data' => $formatted_activities
        ]);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}


function timeAgo($timestamp) {
    $time = strtotime($timestamp);
    $diff = time() - $time;
    
    if ($diff < 60) {
        return $diff . ' sec ago';
    } elseif ($diff < 3600) {
        return floor($diff / 60) . ' min ago';
    } elseif ($diff < 86400) {
        return floor($diff / 3600) . ' hr ago';
    } else {
        return floor($diff / 86400) . ' day ago';
    }
}
?>