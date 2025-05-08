
// Initialize Supabase client
const SUPABASE_URL = "https://rpusltqaadfbabzkcull.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwdXNsdHFhYWRmYmFiemtjdWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2MjU4NjAsImV4cCI6MjA1NTIwMTg2MH0.fpiYDehk0F2bLX8TVqGmVB1lIpR8ZgcLKbkPmo6PORk";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to format price
const formatPrice = (price) => {
  return `₦${parseFloat(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Helper to show toast notifications
const showToast = (message, type = 'success') => {
  const toastContainer = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = message;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toastContainer.removeChild(toast);
      }, 300);
    }, 3000);
  }, 100);
};

// Update cart count in the header
const updateCartCount = (count) => {
  const cartCountElements = document.querySelectorAll('.cart-count');
  cartCountElements.forEach(element => {
    element.textContent = count;
  });
};

// Update wishlist count in the header
const updateWishlistCount = (count) => {
  const wishlistCountElements = document.querySelectorAll('.wishlist-count');
  wishlistCountElements.forEach(element => {
    element.textContent = count;
  });
};

// Load and display wishlist items
async function loadWishlistItems() {
  const user = await getCurrentUser();
  if (!user) return;

  const container = document.getElementById('wishlist-items-container');
  container.innerHTML = '<div class="loading-spinner"></div>';

  try {
    // Get wishlist items
    const { data: wishlistItems, error: wishlistError } = await supabase
      .from('wishlist_items')
      .select('*')
      .eq('user_id', user.id);

    if (wishlistError) throw wishlistError;

    // If no wishlist items, show empty state
    if (!wishlistItems || wishlistItems.length === 0) {
      container.innerHTML = `
        <div class="wishlist-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <h3>No items in your wishlist</h3>
          <p>Add items to your wishlist to keep track of products you're interested in.</p>
          <a href="product.html" class="btn btn-outline">Browse Products</a>
        </div>
      `;
      updateWishlistCount(0);
      return;
    }

    // Get product details for all wishlist items
    const productIds = wishlistItems.map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (productsError) throw productsError;

    // Build wishlist items HTML
    let html = '<div class="wishlist-grid">';
    
    products.forEach(product => {
      html += `
        <div class="wishlist-item" data-id="${product.id}">
          <div class="wishlist-item-image">
            <img src="${product.image_url || 'placeholder.svg'}" alt="${product.name}">
          </div>
          <div class="wishlist-item-details">
            <h4 class="wishlist-item-title">${product.name}</h4>
            <p class="wishlist-item-price">${formatPrice(product.price)}</p>
            <div class="wishlist-item-actions">
              <button class="btn btn-outline btn-sm add-to-cart" data-id="${product.id}">Add to Cart</button>
              <button class="btn btn-icon remove-from-wishlist" data-id="${product.id}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    updateWishlistCount(wishlistItems.length);

    // Add event listeners for wishlist items
    document.querySelectorAll('.remove-from-wishlist').forEach(button => {
      button.addEventListener('click', removeFromWishlist);
    });

    document.querySelectorAll('.wishlist-item .add-to-cart').forEach(button => {
      button.addEventListener('click', addToCartFromWishlist);
    });
  } catch (error) {
    console.error('Error loading wishlist:', error);
    container.innerHTML = `
      <div class="error-message">
        <p>Failed to load your wishlist. Please try again later.</p>
      </div>
    `;
  }
}

// Remove item from wishlist
async function removeFromWishlist(e) {
  const productId = e.currentTarget.getAttribute('data-id');
  const user = await getCurrentUser();
  if (!user) return;

  try {
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (error) throw error;

    // Remove item from UI
    const wishlistItem = e.currentTarget.closest('.wishlist-item');
    wishlistItem.classList.add('removing');
    setTimeout(() => {
      wishlistItem.remove();
      
      // Check if we need to show empty state
      const remainingItems = document.querySelectorAll('.wishlist-item').length;
      if (remainingItems === 0) {
        loadWishlistItems(); // Reload to show empty state
      } else {
        updateWishlistCount(remainingItems);
      }
    }, 300);

    showToast('Item removed from wishlist');
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    showToast('Failed to remove item from wishlist', 'error');
  }
}

// Add item to cart from wishlist
async function addToCartFromWishlist(e) {
  const productId = e.currentTarget.getAttribute('data-id');
  const user = await getCurrentUser();
  if (!user) return;

  try {
    // Check if item already exists in cart
    const { data: existingItems } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (existingItems && existingItems.length > 0) {
      // Update quantity
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existingItems[0].quantity + 1 })
        .eq('id', existingItems[0].id);
      
      if (error) throw error;
    } else {
      // Add new item to cart
      const { error } = await supabase
        .from('cart_items')
        .insert([{ user_id: user.id, product_id: productId, quantity: 1 }]);
      
      if (error) throw error;
    }

    showToast('Item added to cart');
    loadCartItems(); // Refresh cart
  } catch (error) {
    console.error('Error adding to cart:', error);
    showToast('Failed to add item to cart', 'error');
  }
}

// Load and display cart items
async function loadCartItems() {
  const user = await getCurrentUser();
  if (!user) return;

  const container = document.getElementById('cart-items-container');
  const cartActions = document.getElementById('cart-actions');
  
  container.innerHTML = '<div class="loading-spinner"></div>';

  try {
    // Get cart items
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id);

    if (cartError) throw cartError;

    // If no cart items, show empty state
    if (!cartItems || cartItems.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added any products to your cart yet.</p>
          <a href="product.html" class="btn btn-outline">Start Shopping</a>
        </div>
      `;
      cartActions.style.display = 'none';
      updateCartCount(0);
      return;
    }

    // Get product details for all cart items
    const productIds = cartItems.map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (productsError) throw productsError;

    // Map products by ID for easy lookup
    const productsMap = {};
    products.forEach(product => {
      productsMap[product.id] = product;
    });

    // Build cart items HTML
    let html = '<div class="cart-items-list">';
    let totalAmount = 0;
    
    cartItems.forEach(item => {
      const product = productsMap[item.product_id];
      if (!product) return; // Skip if product not found
      
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      
      html += `
        <div class="cart-item" data-id="${item.id}">
          <div class="cart-item-image">
            <img src="${product.image_url || 'placeholder.svg'}" alt="${product.name}">
          </div>
          <div class="cart-item-details">
            <h4 class="cart-item-title">${product.name}</h4>
            <p class="cart-item-price">${formatPrice(product.price)}</p>
            <div class="cart-item-quantity">
              <button class="quantity-btn decrease" data-id="${item.id}">-</button>
              <span class="quantity">${item.quantity}</span>
              <button class="quantity-btn increase" data-id="${item.id}">+</button>
            </div>
          </div>
          <div class="cart-item-actions">
            <p class="cart-item-subtotal">${formatPrice(itemTotal)}</p>
            <button class="btn btn-icon remove-from-cart" data-id="${item.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Update total amount and show cart actions
    document.getElementById('cart-total-amount').textContent = formatPrice(totalAmount);
    cartActions.style.display = 'flex';
    updateCartCount(cartItems.length);

    // Disable checkout button if user's balance is insufficient
    const checkoutBtn = document.getElementById('checkout-btn');
    const userBalance = parseFloat(document.getElementById('user-balance').textContent.replace('₦', '').replace(',', ''));
    
    if (userBalance < totalAmount) {
      checkoutBtn.classList.add('disabled');
      checkoutBtn.title = 'Insufficient balance';
      showToast('Your balance is insufficient for checkout', 'warning');
    } else {
      checkoutBtn.classList.remove('disabled');
      checkoutBtn.title = '';
    }

    // Add event listeners for cart items
    document.querySelectorAll('.remove-from-cart').forEach(button => {
      button.addEventListener('click', removeFromCart);
    });

    document.querySelectorAll('.quantity-btn.decrease').forEach(button => {
      button.addEventListener('click', decreaseQuantity);
    });

    document.querySelectorAll('.quantity-btn.increase').forEach(button => {
      button.addEventListener('click', increaseQuantity);
    });
  } catch (error) {
    console.error('Error loading cart:', error);
    container.innerHTML = `
      <div class="error-message">
        <p>Failed to load your cart. Please try again later.</p>
      </div>
    `;
    cartActions.style.display = 'none';
  }
}

// Remove item from cart
async function removeFromCart(e) {
  const itemId = e.currentTarget.getAttribute('data-id');
  
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    // Remove item from UI with animation
    const cartItem = e.currentTarget.closest('.cart-item');
    cartItem.classList.add('removing');
    
    setTimeout(() => {
      cartItem.remove();
      loadCartItems(); // Reload cart to update totals
    }, 300);

    showToast('Item removed from cart');
  } catch (error) {
    console.error('Error removing from cart:', error);
    showToast('Failed to remove item from cart', 'error');
  }
}

// Decrease item quantity in cart
async function decreaseQuantity(e) {
  const itemId = e.currentTarget.getAttribute('data-id');
  const quantityElement = e.currentTarget.nextElementSibling;
  let currentQuantity = parseInt(quantityElement.textContent);
  
  if (currentQuantity <= 1) {
    removeFromCart({ currentTarget: e.currentTarget.parentElement.parentElement.nextElementSibling.querySelector('.remove-from-cart') });
    return;
  }
  
  currentQuantity--;
  
  try {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: currentQuantity })
      .eq('id', itemId);

    if (error) throw error;

    // Update quantity in UI
    quantityElement.textContent = currentQuantity;
    
    // Reload cart to update totals
    loadCartItems();
  } catch (error) {
    console.error('Error updating quantity:', error);
    showToast('Failed to update quantity', 'error');
  }
}

// Increase item quantity in cart
async function increaseQuantity(e) {
  const itemId = e.currentTarget.getAttribute('data-id');
  const quantityElement = e.currentTarget.previousElementSibling;
  let currentQuantity = parseInt(quantityElement.textContent);
  
  currentQuantity++;
  
  try {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: currentQuantity })
      .eq('id', itemId);

    if (error) throw error;

    // Update quantity in UI
    quantityElement.textContent = currentQuantity;
    
    // Reload cart to update totals
    loadCartItems();
  } catch (error) {
    console.error('Error updating quantity:', error);
    showToast('Failed to update quantity', 'error');
  }
}

// Helper to get current user
async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}

// Save user profile including address
async function saveUserProfile() {
  const user = await getCurrentUser();
  if (!user) return;
  
  // Get form values
  const firstName = document.getElementById('profile-first-name').value.trim();
  const lastName = document.getElementById('profile-last-name').value.trim();
  const email = document.getElementById('profile-email').value.trim();
  const phone = document.getElementById('profile-phone').value.trim();
  
  // Get address inputs
  const street = document.getElementById('profile-address').value.trim();
  const city = document.getElementById('profile-city').value.trim();
  const state = document.getElementById('profile-state').value.trim();
  const zipCode = document.getElementById('profile-zipcode').value.trim();
  
  // Format complete address
  const fullAddress = `${street}, ${city}, ${state} ${zipCode}`;
  
  try {
    // Update profile with address
    const { error } = await supabase
      .from('profiles')
      .update({ 
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        phone: phone,
        address: fullAddress
      })
      .eq('id', user.id);
      
    if (error) throw error;
    
    showToast('Profile updated successfully');
  } catch (error) {
    console.error('Error updating profile:', error);
    showToast('Failed to update profile', 'error');
  }
}

// Load user profile data including address
async function loadUserProfile() {
  const user = await getCurrentUser();
  if (!user) return;
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (error) throw error;
    
    if (profile) {
      // Set profile form values
      document.getElementById('profile-first-name').value = profile.first_name || '';
      document.getElementById('profile-last-name').value = profile.last_name || '';
      document.getElementById('profile-email').value = profile.email || '';
      document.getElementById('profile-phone').value = profile.phone || '';
      
      // Display user name and balance
      document.getElementById('user-name').textContent = profile.full_name || 'User';
      document.getElementById('user-balance').textContent = formatPrice(profile.balance || 0);
      
      // Parse and set address fields if address exists
      if (profile.address) {
        const addressParts = profile.address.split(',').map(part => part.trim());
        
        if (addressParts.length >= 3) {
          document.getElementById('profile-address').value = addressParts[0];
          document.getElementById('profile-city').value = addressParts[1];
          
          // Handle state and zip which might be in format "State Zip"
          const stateZip = addressParts[2].split(' ');
          document.getElementById('profile-state').value = stateZip[0] || '';
          document.getElementById('profile-zipcode').value = stateZip[1] || '';
        }
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    showToast('Failed to load profile data', 'error');
  }
}

// Handle checkout process
async function processCheckout() {
  const user = await getCurrentUser();
  if (!user) return;
  
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn.classList.contains('disabled')) {
    showToast('Insufficient balance for checkout', 'error');
    return;
  }
  
  try {
    // 1. Get cart items
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id);
    
    if (cartError) throw cartError;
    if (!cartItems || cartItems.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }
    
    // 2. Get user profile for address
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (profileError) throw profileError;
    
    // Check if address exists
    if (!profile.address) {
      showToast('Please add your address before checkout', 'error');
      document.querySelector('.profile-nav-link[data-section="profile"]').click();
      return;
    }
    
    // 3. Get product details and calculate total
    const productIds = cartItems.map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);
      
    if (productsError) throw productsError;
    
    // Build order items and calculate total
    let orderItems = [];
    let orderTotal = 0;
    
    cartItems.forEach(cartItem => {
      const product = products.find(p => p.id === cartItem.product_id);
      if (product) {
        const itemTotal = product.price * cartItem.quantity;
        orderTotal += itemTotal;
        
        orderItems.push({
          product_id: product.id,
          name: product.name,
          price: product.price,
          quantity: cartItem.quantity,
          subtotal: itemTotal
        });
      }
    });
    
    // 4. Check if user has enough balance
    if (profile.balance < orderTotal) {
      showToast('Insufficient balance for checkout', 'error');
      return;
    }
    
    // 5. Create order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: user.id,
        user_email: profile.email,
        user_full_name: profile.full_name,
        user_address: profile.address,
        order_items: JSON.stringify(orderItems),
        order_total: orderTotal,
        status: 'processing'
      }])
      .select();
      
    if (orderError) throw orderError;
    
    // 6. Update user balance
    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ balance: profile.balance - orderTotal })
      .eq('id', user.id);
      
    if (balanceError) throw balanceError;
    
    // 7. Clear cart
    const { error: clearCartError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);
      
    if (clearCartError) throw clearCartError;
    
    // 8. Show success and update UI
    showToast('Order placed successfully!');
    loadCartItems();
    
    // Update displayed balance
    const userBalance = document.getElementById('user-balance');
    userBalance.textContent = formatPrice(profile.balance - orderTotal);
    
    // Show order confirmation
    const cartContainer = document.getElementById('cart-container');
    cartContainer.innerHTML = `
      <div class="order-success">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="green" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="16 12 12 16 8 12"></polyline>
          <line x1="12" y1="8" x2="12" y2="16"></line>
        </svg>
        <h3>Order Placed Successfully!</h3>
        <p>Your order #${order[0].id.substring(0, 8)} has been placed.</p>
        <p class="order-detail">Total amount: ${formatPrice(orderTotal)}</p>
        <p class="order-detail">You will receive a confirmation email shortly.</p>
        <button class="btn" onclick="document.querySelector('.profile-nav-link[data-section=\\'home\\']').click()">Continue Shopping</button>
      </div>
    `;
    
  } catch (error) {
    console.error('Error during checkout:', error);
    showToast('Checkout failed. Please try again.', 'error');
  }
}

// Check authentication and initialize
async function initUserProfile() {
  const user = await getCurrentUser();
  
  if (!user) {
    // Redirect to login
    window.location.href = "login.html";
    return;
  }
  
  // Load user profile, cart and wishlist data
  loadUserProfile();
  loadWishlistItems();
  loadCartItems();
  
  // Add tab navigation functionality
  document.querySelectorAll('.profile-nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
      if (this.classList.contains('logout')) return;
      
      e.preventDefault();
      const targetSection = this.getAttribute('data-section');
      
      // Update active nav link
      document.querySelectorAll('.profile-nav-link').forEach(navLink => {
        navLink.classList.remove('active');
      });
      this.classList.add('active');
      
      // Show target section
      document.querySelectorAll('.profile-section').forEach(section => {
        section.classList.remove('active');
      });
      document.getElementById(targetSection).classList.add('active');
      
      // Update URL hash
      window.location.hash = targetSection;
    });
  });
  
  // Handle initial load based on URL hash
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    const navLink = document.querySelector(`.profile-nav-link[data-section="${hash}"]`);
    if (navLink) {
      navLink.click();
    }
  }
  
  // Add save profile event listener
  document.getElementById('save-profile-btn').addEventListener('click', function(e) {
    e.preventDefault();
    saveUserProfile();
  });
  
  // Add checkout button event listener
  document.getElementById('checkout-btn').addEventListener('click', function(e) {
    e.preventDefault();
    processCheckout();
  });
  
  // Add logout functionality
  document.querySelectorAll('#logout-link, #mobile-logout-link').forEach(link => {
    link.addEventListener('click', async function(e) {
      e.preventDefault();
      
      try {
        await supabase.auth.signOut();
        window.location.href = "index.html";
      } catch (error) {
        console.error('Error signing out:', error);
        showToast('Error signing out. Please try again.', 'error');
      }
    });
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initCartWishlist);
document.addEventListener('DOMContentLoaded', initUserProfile);
