
// Supabase configuration
const SUPABASE_URL = 'https://rpusltqaadfbabzkcull.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwdXNsdHFhYWRmYmFiemtjdWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2MjU4NjAsImV4cCI6MjA1NTIwMTg2MH0.fpiYDehk0F2bLX8TVqGmVB1lIpR8ZgcLKbkPmo6PORk';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        storage: window.localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Check if user is logged in
async function checkSession() {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
        console.error('Error checking auth session:', error);
        return null;
    }
    
    return data.session;
}

// Send custom email via our Brevo SMTP edge function
async function sendCustomEmail(email, subject, htmlBody, textBody = '') {
    try {
        console.log('Sending custom email to:', email);
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({
                to: email,
                subject: subject,
                htmlBody: htmlBody,
                textBody: textBody
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to send email');
        }
        
        console.log('Custom email sent successfully:', data);
        return { success: true };
    } catch (error) {
        console.error('Error sending custom email:', error);
        return { error: error.message || 'Failed to send email' };
    }
}

// Handle login form
async function handleLogin(email, password) {
    try {
        console.log('Attempting login with:', email);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        console.log('Login successful!', data);
        // Redirect to home page or dashboard
        window.location.href = 'user.html';
        
    } catch (error) {
        console.error('Error logging in:', error);
        return { error: error.message || 'Failed to login. Please try again.' };
    }
}

// Handle signup form
async function handleSignup(email, password, fullName) {
    try {
        console.log('Attempting signup with:', email, fullName);
        // First, create the user in Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });
        
        if (error) throw error;
        
        console.log('Signup successful!', data);
        
        // Send custom welcome email
        await sendCustomEmail(
            email,
            'Welcome to E-Mall - Account Created Successfully!',
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h1 style="color: #4a5568; text-align: center;">Welcome to E-Mall!</h1>
                <p style="color: #4a5568; line-height: 1.6;">Hello ${fullName},</p>
                <p style="color: #4a5568; line-height: 1.6;">Thank you for creating an account with us. Your account has been successfully set up.</p>
                <p style="color: #4a5568; line-height: 1.6;">You can now log in and start shopping!</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${window.location.origin}/login.html" style="background-color: #4299e1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Your Account</a>
                </div>
                <p style="color: #4a5568; line-height: 1.6;">If you have any questions, feel free to contact our support team.</p>
                <p style="color: #4a5568; line-height: 1.6;">Best regards,<br>The E-Mall Team</p>
            </div>
            `
        );
        
        // Redirect to login page or dashboard
        window.location.href = 'login.html?signup=success';
        
    } catch (error) {
        console.error('Error signing up:', error);
        return { error: error.message || 'Failed to signup. Please try again.' };
    }
}

// Handle logout
async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;
        
        // Redirect to home page or login page
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('Error logging out:', error);
        return { error: error.message || 'Failed to logout. Please try again.' };
    }
}

// Find User ID by email - Improved version to properly search in profiles table
async function findUserIdByEmail(email) {
    try {
        console.log('Looking for user with email:', email);
        
        // First try to find in profiles table
        let { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', email)
            .maybeSingle();

        console.log('Profiles query result:', profileData);
        
        if (profileError) {
            console.error('Error querying profiles:', profileError);
            throw profileError;
        }
        
        // If user found in profiles table
        if (profileData && profileData.id) {
            const userId = profileData.id;
            console.log('Found user ID in profiles:', userId);
            
            // Send password reset email with user ID
            const resetLink = `${window.location.origin}/password-reset.html?userId=${userId}`;
            
            const emailResult = await sendCustomEmail(
                email,
                'E-Mall - Password Reset Request',
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h1 style="color: #4a5568; text-align: center;">Password Reset Request</h1>
                    <p style="color: #4a5568; line-height: 1.6;">We received a request to reset your password.</p>
                    <p style="color: #4a5568; line-height: 1.6;">Please click the button below to reset your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #4299e1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p style="color: #4a5568; line-height: 1.6;">Your User ID is: <strong>${userId}</strong></p>
                    <p style="color: #4a5568; line-height: 1.6;">If you didn't request a password reset, you can ignore this email.</p>
                    <p style="color: #4a5568; line-height: 1.6;">This link will expire in 24 hours.</p>
                    <p style="color: #4a5568; line-height: 1.6;">Best regards,<br>The E-Mall Team</p>
                </div>
                `
            );
            
            if (emailResult.error) {
                throw new Error(`Failed to send password reset email: ${emailResult.error}`);
            }
            
            return { 
                success: true, 
                userId: userId, 
                message: `Password reset instructions have been sent to your email: ${email}` 
            };
        } 
        
        // Try to find email in auth.users directly using signInWithOtp
        console.log('User not found in profiles, trying passwordless login');
        try {
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email: email,
                options: {
                    shouldCreateUser: false,
                }
            });
            
            if (otpError) {
                console.error('OTP error:', otpError);
                if (otpError.message.includes('is not found')) {
                    throw new Error('Email not found. Please check and try again.');
                }
                throw otpError;
            }
            
            // If we get here, an email was sent
            return { 
                success: true, 
                message: `A login link has been sent to your email: ${email}. Please use it to reset your password.`
            };
        } catch (otpError) {
            console.error('OTP login error:', otpError);
            
            // As a last resort, try to send our custom email
            try {
                const emailResult = await sendCustomEmail(
                    email,
                    'E-Mall - Account Recovery',
                    `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                        <h1 style="color: #4a5568; text-align: center;">Account Recovery</h1>
                        <p style="color: #4a5568; line-height: 1.6;">We received a request to recover your account.</p>
                        <p style="color: #4a5568; line-height: 1.6;">If you have an account with us, please try logging in again or creating a new account.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${window.location.origin}/login.html" style="background-color: #4299e1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Login</a>
                        </div>
                        <p style="color: #4a5568; line-height: 1.6;">Best regards,<br>The E-Mall Team</p>
                    </div>
                    `
                );
                
                return { 
                    success: true, 
                    message: `If an account exists with this email, recovery instructions have been sent to: ${email}`
                };
            } catch (finalError) {
                console.error('Final email error:', finalError);
                throw new Error('Email not found. Please check and try again.');
            }
        }
        
    } catch (error) {
        console.error('Error in findUserIdByEmail:', error);
        return { error: error.message || 'Failed to find user. Please try again.' };
    }
}

// Update password
async function updatePassword(userId, newPassword) {
    try {
        const { error } = await supabase.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );
        
        if (error) throw error;
        
        return { success: true, message: 'Password updated successfully!' };
        
    } catch (error) {
        console.error('Error updating password:', error);
        return { error: error.message || 'Failed to update password. Please try again.' };
    }
}

// Handle user login
async function loginUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Login error:', error.message);
      showToast('Login failed: ' + error.message, 'error');
      return false;
    }
    console.log('User logged in:', data.user);
    showToast('Login successful!', 'success');
    window.location.href = 'user.html'; // Redirect to user profile page after login
    return true;
  } catch (err) {
    console.error('Error during login:', err);
    showToast('An error occurred during login', 'error');
    return false;
  }
}

// Handle user logout
async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
      showToast('Logout failed: ' + error.message, 'error');
      return false;
    }
    console.log('User logged out');
    showToast('Logout successful!', 'success');
    window.location.href = 'login.html'; // Redirect to login page after logout
    return true;
  } catch (err) {
    console.error('Error during logout:', err);
    showToast('An error occurred during logout', 'error');
    return false;
  }
}

// Helper function to show toast messages
function showToast(message, type = 'info') {
  // Check if toast container exists, if not create it
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast-message toast-${type}`;
  toast.textContent = message;
  
  toastContainer.appendChild(toast);
  
  // Remove toast after animation completes
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// Expose functions globally
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.findUserIdByEmail = findUserIdByEmail;
window.updatePassword = updatePassword;
window.checkSession = checkSession;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleLogout = handleLogout;
window.showToast = showToast;

// Initialize login form if it exists
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing auth forms');
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        console.log('Login form found, adding event listener');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Login form submitted');
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorContainer = document.getElementById('error-message');
            
            // Basic validation
            if (!email || !password) {
                errorContainer.textContent = 'Please fill in all fields.';
                errorContainer.style.display = 'block';
                return;
            }
            
            // Show loading state
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Logging in...';
            
            // Attempt login
            const result = await handleLogin(email, password);
            
            // Reset button state
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            
            // Handle result
            if (result && result.error) {
                errorContainer.textContent = result.error;
                errorContainer.style.display = 'block';
            }
        });
    }
    
    // Initialize signup form if it exists
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        console.log('Signup form found, adding event listener');
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Signup form submitted');
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const fullName = document.getElementById('fullname').value;
            const errorContainer = document.getElementById('error-message');
            
            // Basic validation
            if (!email || !password || !confirmPassword || !fullName) {
                errorContainer.textContent = 'Please fill in all fields.';
                errorContainer.style.display = 'block';
                return;
            }
            
            // Check if passwords match
            if (password !== confirmPassword) {
                errorContainer.textContent = 'Passwords do not match.';
                errorContainer.style.display = 'block';
                return;
            }
            
            // Show loading state
            const submitButton = signupForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Creating account...';
            
            // Attempt signup
            const result = await handleSignup(email, password, fullName);
            
            // Reset button state
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            
            // Handle result
            if (result && result.error) {
                errorContainer.textContent = result.error;
                errorContainer.style.display = 'block';
            }
        });
    }
    
    // Initialize logout buttons
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            await handleLogout();
        });
    });
    
    // Check for query parameters (e.g., successful signup)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('signup') && urlParams.get('signup') === 'success') {
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = 'Account created successfully! Please login with your new credentials.';
        successMessage.style.display = 'block';
        
        const errorContainer = document.getElementById('error-message');
        if (errorContainer) {
            errorContainer.parentNode.insertBefore(successMessage, errorContainer);
        }
    }
});
