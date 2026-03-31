// ==================================
// Auth.js - SmartCare Authentication
// Handles Signup & Login form submission
// ==================================

document.addEventListener("DOMContentLoaded", function () {

    // ---- SIGNUP FORM HANDLER ----
    const signupForm = document.querySelector(".signupForm");
    const signupBtn = document.querySelector(".login-btn");

    // Detect if this is the signup page (has fullName field)
    const fullNameField = document.getElementById("fullName");
    const isSignupPage = !!fullNameField;

    if (isSignupPage && signupForm) {
        signupForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const role = document.getElementById("signup-role").value;
            const fullName = document.getElementById("fullName").value.trim();
            const email = document.getElementById("email").value.trim();
            const phone = document.getElementById("number").value.trim();
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;
            const agreeTerms = document.getElementById("rememberMe").checked;

            // Client-side validation
            if (!fullName || !email || !phone || !password || !confirmPassword) {
                showAlert("Please fill in all fields", "error");
                return;
            }

            if (!isValidEmail(email)) {
                showAlert("Please enter a valid email address", "error");
                return;
            }

            if (password.length < 6) {
                showAlert("Password must be at least 6 characters", "error");
                return;
            }

            if (password !== confirmPassword) {
                showAlert("Passwords do not match", "error");
                return;
            }

            if (!agreeTerms) {
                showAlert("Please agree to the Terms of Service", "error");
                return;
            }

            // Doctor-specific validation
            if (role === "doctor") {
                const specialization = document.getElementById("specialization").value;
                const qualification = document.getElementById("qualification").value.trim();
                if (!specialization) {
                    showAlert("Please select a specialization", "error");
                    return;
                }
                if (!qualification) {
                    showAlert("Qualification is required for doctors", "error");
                    return;
                }
            }

            // Disable button & show loading
            signupBtn.disabled = true;
            signupBtn.textContent = "Creating Account...";

            // Send data to PHP
            const formData = new FormData();
            formData.append("role", role);
            formData.append("fullName", fullName);
            formData.append("email", email);
            formData.append("phone", phone);
            formData.append("password", password);
            formData.append("confirmPassword", confirmPassword);

            // Append doctor-specific fields if role is doctor
            if (role === "doctor") {
                formData.append("specialization", document.getElementById("specialization").value);
                formData.append("qualification", document.getElementById("qualification").value.trim());
                formData.append("experience", document.getElementById("experience").value || "0");
                formData.append("consultationFee", document.getElementById("consultationFee").value || "0");
            }

            fetch("../PHP/signup.php", {
                method: "POST",
                body: formData,
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        showAlert(data.message, "success");
                        // Redirect to login page after 2 seconds
                        setTimeout(() => {
                            window.location.href = "../HTML/logIn.html";
                        }, 2000);
                    } else {
                        showAlert(data.message, "error");
                        signupBtn.disabled = false;
                        signupBtn.textContent = "Sign Up";
                    }
                })
                .catch((error) => {
                    console.error("Signup error:", error);
                    showAlert("Something went wrong. Please try again.", "error");
                    signupBtn.disabled = false;
                    signupBtn.textContent = "Sign Up";
                });
        });
    }

    // ---- LOGIN FORM HANDLER ----
    if (!isSignupPage && signupForm) {
        signupForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            // Client-side validation
            if (!email || !password) {
                showAlert("Please fill in all fields", "error");
                return;
            }

            if (!isValidEmail(email)) {
                showAlert("Please enter a valid email address", "error");
                return;
            }

            // Disable button & show loading
            const loginBtn = document.querySelector(".login-btn");
            loginBtn.disabled = true;
            loginBtn.textContent = "Logging In...";

            // Send data to PHP (no role - auto-detected from database)
            const formData = new FormData();
            formData.append("email", email);
            formData.append("password", password);

            fetch("../PHP/login.php", {
                method: "POST",
                body: formData,
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        showAlert(data.message, "success");
                        // Store user info in localStorage for frontend use
                        localStorage.setItem("smartcare_user", JSON.stringify(data.user));
                        // Redirect to role-based dashboard automatically
                        setTimeout(() => {
                            window.location.href = data.redirect;
                        }, 1000);
                    } else {
                        showAlert(data.message, "error");
                        loginBtn.disabled = false;
                        loginBtn.textContent = "Log In";
                    }
                })
                .catch((error) => {
                    console.error("Login error:", error);
                    showAlert("Something went wrong. Please try again.", "error");
                    loginBtn.disabled = false;
                    loginBtn.textContent = "Log In";
                });
        });
    }
});

// =========================================
// UTILITY FUNCTIONS
// =========================================

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showAlert(message, type) {
    // Remove existing alerts
    const existingAlert = document.querySelector(".auth-alert");
    if (existingAlert) existingAlert.remove();

    // Create alert element
    const alert = document.createElement("div");
    alert.className = `auth-alert auth-alert-${type}`;
    alert.textContent = message;

    // Style the alert
    Object.assign(alert.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        padding: "14px 24px",
        borderRadius: "10px",
        color: "#fff",
        fontSize: "0.9rem",
        fontFamily: "'Nunito Sans', sans-serif",
        fontWeight: "600",
        zIndex: "9999",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        animation: "slideIn 0.3s ease-out",
        maxWidth: "350px",
    });

    if (type === "success") {
        alert.style.background = "linear-gradient(135deg, #10b981, #059669)";
    } else {
        alert.style.background = "linear-gradient(135deg, #ef4444, #dc2626)";
    }

    // Add animation keyframes
    if (!document.getElementById("alert-animation")) {
        const style = document.createElement("style");
        style.id = "alert-animation";
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to   { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to   { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(alert);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        alert.style.animation = "slideOut 0.3s ease-in forwards";
        setTimeout(() => alert.remove(), 300);
    }, 4000);
}
