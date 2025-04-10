
// Fix for Multiple GoTrueClient instances

// Wait for the document to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Fixing profile page issues');
    
    // Function to fix cart and wishlist loading
    function fixDataLoading() {
        // Fix for cart items
        window.loadCartItems = async function() {
            try {
                console.log('Loading cart items with fixed function');
                const { data: session } = await supabase.auth.getSession();
                
                if (!session || !session.session) {
                    console.log('No active session found');
                    return [];
                }
                
                const { data, error } = await supabase
                    .from('cart_items')
                    .select(`
                        id,
                        quantity,
                        product_id
                    `)
                    .eq('user_id', session.session.user.id);
                
                if (error) {
                    throw error;
                }
                
                console.log('Cart items loaded successfully:', data);
                return data || [];
            } catch (error) {
                console.error('Error in fixed loadCartItems:', error);
                showToast('Failed to load cart items', 'error');
                return [];
            }
        };
        
        // Fix for wishlist items
        window.loadWishlistItems = async function() {
            try {
                console.log('Loading wishlist items with fixed function');
                const { data: session } = await supabase.auth.getSession();
                
                if (!session || !session.session) {
                    console.log('No active session found');
                    return [];
                }
                
                const { data, error } = await supabase
                    .from('wishlist_items')
                    .select(`
                        id,
                        product_id
                    `)
                    .eq('user_id', session.session.user.id);
                
                if (error) {
                    throw error;
                }
                
                console.log('Wishlist items loaded successfully:', data);
                return data || [];
            } catch (error) {
                console.error('Error in fixed loadWishlistItems:', error);
                showToast('Failed to load wishlist items', 'error');
                return [];
            }
        };
        
        // Function to reload data on the page
        const reloadPageData = async () => {
            console.log('Reloading page data with fixed functions');
            // Check if these functions exist in the global scope
            if (typeof updateCartCount === 'function') {
                const cartItems = await window.loadCartItems();
                updateCartCount(cartItems.length);
                renderCartItems(cartItems);
            }
            
            if (typeof updateWishlistCount === 'function') {
                const wishlistItems = await window.loadWishlistItems();
                updateWishlistCount(wishlistItems.length);
                renderWishlistItems(wishlistItems);
            }
        };
        
        // Wait a bit for other scripts to initialize, then reload data
        setTimeout(reloadPageData, 500);
    }
    
    // Execute the fix
    fixDataLoading();
    
    // Helper to show toast notifications if not already defined
    if (typeof window.showToast !== 'function') {
        window.showToast = function(message, type = 'info') {
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
        };
    }
});
