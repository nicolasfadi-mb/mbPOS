<?php
// htdocs/api/db_connect.php
declare(strict_types=1);

// Do NOT send headers or echo/print here. Keep this file silent.

mysqli_report(MYSQLI_REPORT_OFF);

// TODO: Immediately rotate these credentials in InfinityFree and update them here.
// Never commit real credentials to a public repo.
$servername = "sql206.infinityfree.com";
$username   = "if0_39708271";
$password   = "T3c7bitNRv2SWTv";
$dbname     = "if0_39708271_mb_pos";

/**
 * Create a mysqli connection with utf8mb4.
 * Throws on failure; caller should catch and return JSON.
 */
function db_connect(
    string $host,
    string $user,
    string $pass,
    string $name
): mysqli {
    $conn = @new mysqli($host, $user, $pass, $name);
    if ($conn->connect_errno) {
        throw new Exception('DB connection failed: ' . $conn->connect_error);
    }
    // Best-effort character set
    @$conn->set_charset('utf8mb4');
    return $conn;
}

/**
 * Prepare and execute a statement.
 * Optionally pass $types (e.g., "sids") and $params.
 * Returns mysqli_stmt; caller can fetch result or affected rows.
 */
function db_exec(mysqli $conn, string $sql, ?string $types = null, array $params = []): mysqli_stmt {
    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }

    if (!empty($params)) {
        // If no explicit $types provided, assume strings.
        $bindTypes = $types ?? str_repeat('s', count($params));
        if (!$stmt->bind_param($bindTypes, ...$params)) {
            $err = $stmt->error;
            $stmt->close();
            throw new Exception('Bind failed: ' . $err);
        }
    }

    if (!$stmt->execute()) {
        $err = $stmt->error;
        $stmt->close();
        throw new Exception('Execute failed: ' . $err);
    }

    return $stmt;
}

/**
 * Convenience for SELECT queries: returns all rows as associative arrays.
 */
function db_select_all(mysqli $conn, string $sql, ?string $types = null, array $params = []): array {
    $stmt = db_exec($conn, $sql, $types, $params);
    $result = $stmt->get_result();
    $rows = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
    if ($result) $result->free();
    $stmt->close();
    return $rows;
}

// Expose a ready-to-use connection
$conn = db_connect($servername, $username, $password, $dbname);
