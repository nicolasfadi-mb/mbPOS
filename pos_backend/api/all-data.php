<?php
// htdocs/api/all-data.php

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

@ini_set('display_errors', '0');

try {
    require_once __DIR__ . '/db_connect.php';
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed', 'details' => $e->getMessage()]);
    exit;
}
if (!isset($conn) || !($conn instanceof mysqli)) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection is not available.']);
    exit;
}
@$conn->set_charset('utf8mb4');

// helpers
function cast_numeric(&$row, $fields) {
    foreach ($fields as $f) {
        if (array_key_exists($f, $row)) {
            $row[$f] = is_numeric($row[$f])
                ? ((strpos((string)$row[$f], '.') !== false) ? (float)$row[$f] : (int)$row[$f])
                : 0;
        }
    }
}
function decode_json(&$row, $fields) {
    foreach ($fields as $f) {
        if (array_key_exists($f, $row)) {
            $d = json_decode($row[$f], true);
            $row[$f] = (json_last_error() === JSON_ERROR_NONE) ? $d : [];
        }
    }
}
function cast_boolean(&$row, $fields) {
    foreach ($fields as $f) {
        if (array_key_exists($f, $row)) $row[$f] = (bool)$row[$f];
    }
}

try {
    $all = [
        'users' => [], 'branches' => [], 'products' => [], 'rooms' => [],
        'stockItems' => [], 'reservations' => [], 'transactions' => [],
        'cashierSessions' => [], 'cashBox' => [], 'mainCashBox' => [],
        'inventoryUnits' => [], 'invoiceSettings' => [], 'shopInfo' => [],
        'pettyCash' => [], 'cashBoxIncomeCategories' => [],
        'cashBoxExpenseCategories' => [], 'deletionPin' => ''
    ];

    // branches
    if ($r = $conn->query("SELECT * FROM branches")) {
        while ($row = $r->fetch_assoc()) $all['branches'][] = $row;
        $r->free();
    }

    // users
    if ($r = $conn->query("SELECT * FROM users")) {
        while ($row = $r->fetch_assoc()) {
            if (isset($row['accessibleBranchIds']) && $row['accessibleBranchIds'] !== 'all') {
                $decoded = json_decode($row['accessibleBranchIds'], true);
                $row['accessibleBranchIds'] = is_array($decoded) ? $decoded : [];
            }
            $all['users'][] = $row;
        }
        $r->free();
    }

    // settings
    if ($r = $conn->query("SELECT * FROM settings")) {
        while ($row = $r->fetch_assoc()) {
            $branchId = $row['branchId'] ?? 'global';
            $key = $row['settingKey'] ?? '';
            $raw = $row['settingValue'] ?? '';
            $val = json_decode($raw, true);
            if (json_last_error() !== JSON_ERROR_NONE) $val = $raw;

            if ($branchId === 'global') {
                if ($key === 'deletionPin') $all['deletionPin'] = $val;
            } else {
                if (!isset($all[$key]) || !is_array($all[$key])) $all[$key] = [];
                $all[$key][$branchId] = $val;
            }
        }
        $r->free();
    }

    // fix numeric types in settings
    foreach ($all['branches'] as $branch) {
        $bid = $branch['id'] ?? null; if (!$bid) continue;
        if (isset($all['shopInfo'][$bid]['usdToLbpRate'])) {
            $all['shopInfo'][$bid]['usdToLbpRate'] = (float)$all['shopInfo'][$bid]['usdToLbpRate'];
        }
        if (isset($all['pettyCash'][$bid])) {
            $all['pettyCash'][$bid]['lbp'] = (float)($all['pettyCash'][$bid]['lbp'] ?? 0);
            $all['pettyCash'][$bid]['usd'] = (float)($all['pettyCash'][$bid]['usd'] ?? 0);
        }
    }

    // branch tables
    $bt = [
        'products' => ['key' => 'products', 'num' => ['price', 'costOfGoodsSold'], 'json' => ['recipe']],
        'rooms' => ['key' => 'rooms', 'num' => ['capacity', 'hourlyRate']],
        'stock_items' => ['key' => 'stockItems', 'num' => ['stock', 'averageCost', 'lowStockThreshold']],
        'reservations' => ['key' => 'reservations', 'num' => ['guests'], 'json' => ['items']],
        'transactions' => ['key' => 'transactions', 'num' => ['subtotal','tax','total','costOfGoodsSold','profit','rentalCharge','amountPaidInCurrency','changeGiven','usdToLbpRate'], 'json' => ['items']],
        'cashier_sessions' => ['key' => 'cashierSessions', 'json' => ['startingInventory','currentInventory','overageLog','transactions'], 'bool' => ['isActive']],
        'cash_box_entries' => ['key' => 'cashBox', 'num' => ['amountLBP','amountUSD'], 'bool' => ['isManual']],
    ];
    foreach ($bt as $table => $cfg) {
        if ($r = $conn->query("SELECT * FROM `$table` WHERE branchId!='main'")) {
            while ($row = $r->fetch_assoc()) {
                $bid = $row['branchId'] ?? 'unknown';
                if (!isset($all[$cfg['key']][$bid])) $all[$cfg['key']][$bid] = [];
                if (!empty($cfg['num'])) cast_numeric($row, $cfg['num']);
                if (!empty($cfg['json'])) decode_json($row, $cfg['json']);
                if (!empty($cfg['bool'])) cast_boolean($row, $cfg['bool']);
                $all[$cfg['key']][$bid][] = $row;
            }
            $r->free();
        }
    }

    // main cash box
    if ($r = $conn->query("SELECT * FROM cash_box_entries WHERE branchId='main'")) {
        while ($row = $r->fetch_assoc()) {
            cast_numeric($row, ['amountLBP','amountUSD']);
            cast_boolean($row, ['isManual']);
            $all['mainCashBox'][] = $row;
        }
        $r->free();
    }

    echo json_encode($all, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Unexpected server error', 'details' => $e->getMessage()]);
    exit;
} finally {
    if (isset($conn) && $conn instanceof mysqli) @$conn->close();
}
