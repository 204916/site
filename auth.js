
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

// Find User ID by email
async function findUserIdByEmail(email) {
    try {
        // First try to find in profiles table
        const { data, error } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', email);

        console.log('Checking profiles table for email:', email);
        console.log('Query result:', data);
        
        if (error) {
            console.error('Error querying profiles:', error);
            throw error;
        }
        
        // If user found in profiles table
        if (data && data.length > 0) {
            const userId = data[0].id;
            console.log('Found user ID in profiles:', userId);
            
            // Simulate sending email with user ID (in a real app, this would be an email service)
            console.log(`Email would be sent to ${email} with User ID: ${userId}`);
            
            return { 
                success: true, 
                userId: userId, 
                message: `User ID has been sent to your email: ${email}` 
            };
        } else {
            console.log('User not found in profiles, checking auth.users');
            
            // Try to find user in auth users table directly (this requires admin rights)
            const { data: authUsers, error: authError } = await supabase.auth.admin
                .listUsers();
                
            if (authError) {
                console.error('Error querying auth users:', authError);
                throw new Error('Failed to find user with this email.');
            }
            
            // Find user by email
            const user = authUsers?.users?.find(u => u.email === email);
            
            if (!user) {
                throw new Error('Email not found. Please check and try again.');
            }
            
            return { 
                success: true, 
                userId: user.id, 
                message: `User ID has been sent to your email: ${email}`
            };
        }
    } catch (error) {
        console.error('Error finding user by email:', error);
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
