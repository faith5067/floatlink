<?php

require_once 'config/database.php';


$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];


$path = strtok($request_uri, '?');
$path = trim($path, '/');


$base_path = 'floatlink'; 
if (strpos($path, $base_path) === 0) {
    $path = substr($path, strlen($base_path));
    $path = trim($path, '/');
}


switch($path) {
    case 'api/offers':
        require 'api/offers.php';
        break;
    
    case 'api/providers':
        require 'api/providers.php';
        break;
    
    case 'api/deals':
        require 'api/deals.php';
        break;
    
    case 'api/chat':
        require 'api/chat.php';
        break;
    
    case 'api/reconciliation':
        require 'api/reconciliation.php';
        break;
    
    case 'api/office_movements':
        require 'api/office_movements.php';
        break;
    
    case 'api/float_circulation':
        require 'api/float_circulation.php';
        break;
    
    case 'api/daily_activities':
        require 'api/daily_activities.php';
        break;
    
    case 'api/activity_log':
        require 'api/activity_log.php';
        break;
    
    case '':
    case 'api':
        // API info endpoint
        echo json_encode([
            'name' => 'FloatLink API',
            'version' => '1.0',
            'status' => 'running',
            'endpoints' => [
                'GET /api/offers' => 'Get all float offers',
                'POST /api/offers' => 'Create new offer',
                'DELETE /api/offers?id={id}' => 'Cancel offer',
                'GET /api/providers' => 'Get provider cards',
                'POST /api/providers' => 'Update provider visibility',
                'GET /api/deals?id={id}' => 'Get deal details',
                'POST /api/deals' => 'Create new deal',
                'PUT /api/deals' => 'Update deal status',
                'GET /api/chat?deal_id={id}' => 'Get chat messages',
                'POST /api/chat' => 'Send chat message',
                'GET /api/reconciliation' => 'Get balances',
                'GET /api/office_movements' => 'Get movements',
                'POST /api/office_movements' => 'Record movement',
                'GET /api/float_circulation' => 'Get circulation',
                'POST /api/float_circulation' => 'Record circulation',
                'GET /api/daily_activities' => 'Get activities',
                'POST /api/daily_activities' => 'Record activity',
                'GET /api/activity_log?section={section}' => 'Get recent activities'
            ]
        ]);
        break;
    
    default:
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Endpoint not found',
            'path' => $path
        ]);
        break;
}
?>