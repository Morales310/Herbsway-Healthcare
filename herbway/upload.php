<?php
// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Configuration
$uploadDir = 'uploads/';
$maxFileSize = 5 * 1024 * 1024; // 5MB
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
$emailTo = 'your-email@example.com'; // Replace with your email

// Create uploads directory if it doesn't exist
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Handle the upload
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['image'])) {
    $file = $_FILES['image'];
    $response = ['success' => false, 'message' => ''];

    // Validate file size
    if ($file['size'] > $maxFileSize) {
        $response['message'] = 'File is too large. Maximum size is 5MB.';
        echo json_encode($response);
        exit;
    }

    // Validate file type
    if (!in_array($file['type'], $allowedTypes)) {
        $response['message'] = 'Invalid file type. Only JPG, PNG and GIF are allowed.';
        echo json_encode($response);
        exit;
    }

    // Generate unique filename
    $fileName = uniqid() . '_' . basename($file['name']);
    $targetPath = $uploadDir . $fileName;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        // Send email
        $to = $emailTo;
        $subject = 'New Image Upload';
        $message = "A new image has been uploaded:\n\n";
        $message .= "Filename: " . $fileName . "\n";
        $message .= "File type: " . $file['type'] . "\n";
        $message .= "File size: " . round($file['size'] / 1024, 2) . " KB\n";
        
        $headers = 'From: noreply@' . $_SERVER['HTTP_HOST'] . "\r\n" .
                  'X-Mailer: PHP/' . phpversion();

        mail($to, $subject, $message, $headers);

        $response['success'] = true;
        $response['message'] = 'File uploaded successfully!';
        $response['path'] = $targetPath;
    } else {
        $response['message'] = 'Error uploading file.';
    }

    echo json_encode($response);
    exit;
}
?>