<?php
// ==================================
// Signup Handler - SmartCare
// Role-Based: Patient & Doctor
// ==================================

header('Content-Type: application/json');
require_once 'db_connect.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
    exit;
}

// Get common form data
$fullName        = trim($_POST['fullName'] ?? '');
$email           = trim($_POST['email'] ?? '');
$phone           = trim($_POST['phone'] ?? '');
$password        = $_POST['password'] ?? '';
$confirmPassword = $_POST['confirmPassword'] ?? '';
$role            = trim($_POST['role'] ?? 'patient');

// ---- Common Validation ----

if (empty($fullName) || empty($email) || empty($phone) || empty($password) || empty($confirmPassword)) {
    echo json_encode(["success" => false, "message" => "All fields are required"]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Invalid email format"]);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode(["success" => false, "message" => "Password must be at least 6 characters"]);
    exit;
}

if ($password !== $confirmPassword) {
    echo json_encode(["success" => false, "message" => "Passwords do not match"]);
    exit;
}

// Only allow patient and doctor self-registration (admin is created by admin only)
if (!in_array($role, ['patient', 'doctor'])) {
    echo json_encode(["success" => false, "message" => "Invalid role. Admin accounts can only be created by existing admins."]);
    exit;
}

// ---- Doctor-Specific Validation ----
if ($role === 'doctor') {
    $specialization   = trim($_POST['specialization'] ?? '');
    $qualification    = trim($_POST['qualification'] ?? '');
    $experience       = intval($_POST['experience'] ?? 0);
    $consultationFee  = floatval($_POST['consultationFee'] ?? 0);

    if (empty($specialization)) {
        echo json_encode(["success" => false, "message" => "Please select a specialization"]);
        exit;
    }
    if (empty($qualification)) {
        echo json_encode(["success" => false, "message" => "Qualification is required for doctors"]);
        exit;
    }
}

// Check if email already exists
$checkEmail = mysqli_prepare($conn, "SELECT user_id FROM users WHERE email = ?");
mysqli_stmt_bind_param($checkEmail, "s", $email);
mysqli_stmt_execute($checkEmail);
mysqli_stmt_store_result($checkEmail);

if (mysqli_stmt_num_rows($checkEmail) > 0) {
    echo json_encode(["success" => false, "message" => "Email already registered. Please log in."]);
    mysqli_stmt_close($checkEmail);
    exit;
}
mysqli_stmt_close($checkEmail);

// Hash the password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// ---- Insert User ----
$stmt = mysqli_prepare($conn, "INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)");
mysqli_stmt_bind_param($stmt, "sssss", $fullName, $email, $phone, $hashedPassword, $role);

if (mysqli_stmt_execute($stmt)) {
    $userId = mysqli_insert_id($conn);

    if ($role === 'patient') {
        // Create patient profile
        $profileStmt = mysqli_prepare($conn, "INSERT INTO patients (user_id) VALUES (?)");
        mysqli_stmt_bind_param($profileStmt, "i", $userId);
        mysqli_stmt_execute($profileStmt);
        mysqli_stmt_close($profileStmt);

        echo json_encode([
            "success" => true,
            "message" => "Patient account created successfully! Please log in."
        ]);

    } elseif ($role === 'doctor') {
        // Create doctor profile (is_approved = 0, needs admin approval)
        $profileStmt = mysqli_prepare($conn, 
            "INSERT INTO doctors (user_id, specialization, qualification, experience_years, consultation_fee, is_approved) 
             VALUES (?, ?, ?, ?, ?, 0)"
        );
        mysqli_stmt_bind_param($profileStmt, "issid", $userId, $specialization, $qualification, $experience, $consultationFee);
        mysqli_stmt_execute($profileStmt);
        mysqli_stmt_close($profileStmt);

        echo json_encode([
            "success" => true,
            "message" => "Doctor account created! Your profile will be active after admin approval."
        ]);
    }

} else {
    echo json_encode([
        "success" => false,
        "message" => "Registration failed. Please try again."
    ]);
}

mysqli_stmt_close($stmt);
mysqli_close($conn);
?>
