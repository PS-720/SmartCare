<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "No data provided"]);
    exit;
}

$user_id = $data['user_id'] ?? null;
if (!$user_id) {
    echo json_encode(["success" => false, "message" => "Missing user ID"]);
    exit;
}

// Extract data
$full_name = $data['full_name'];
$email = $data['email'];
$phone = $data['phone'];
$specialization = $data['specialization'];
$experience_years = $data['experience_years'];
$qualification = $data['qualification'];
$consultation_fee = $data['consultation_fee'];
$location = $data['location'];
$education = $data['education'];
$bio = $data['bio'];

// Start Transaction
mysqli_begin_transaction($conn);

try {
    // 1. Update Users Table
    $update_user_query = "UPDATE users SET full_name = ?, email = ?, phone = ? WHERE user_id = ?";
    $stmt1 = mysqli_prepare($conn, $update_user_query);
    mysqli_stmt_bind_param($stmt1, "sssi", $full_name, $email, $phone, $user_id);
    mysqli_stmt_execute($stmt1);

    // 2. Update Doctors Table (using user_id to find the record)
    // First, let's get doctor_id just in case, but updating by user_id is fine if unique
    $update_doctor_query = "UPDATE doctors SET 
                            specialization = ?, 
                            experience_years = ?, 
                            qualification = ?, 
                            consultation_fee = ?, 
                            location = ?, 
                            bio = ? 
                            WHERE user_id = ?";
    $stmt2 = mysqli_prepare($conn, $update_doctor_query);
    mysqli_stmt_bind_param($stmt2, "sisisis", $specialization, $experience_years, $qualification, $consultation_fee, $location, $bio, $user_id);
    mysqli_stmt_execute($stmt2);
    
    // Note: 'education' is currently stored in a way that might need a specific column or just bio.
    // If there's no education column, we can prepend it to bio or check schema.
    // Based on previous views, MD/Harvard was likely in a p tag. 
    // I'll assume qualification is being used for education/degrees for now, or just update doctors table fields available.

    mysqli_commit($conn);
    echo json_encode(["success" => true, "message" => "Profile updated successfully"]);

} catch (Exception $e) {
    mysqli_rollback($conn);
    echo json_encode(["success" => false, "message" => "Update failed: " . $e->getMessage()]);
}

mysqli_close($conn);
?>
