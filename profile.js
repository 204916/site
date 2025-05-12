// User profile management functions

// Import Supabase credentials
const SUPABASE_URL = "https://rpusltqaadfbabzkcull.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwdXNsdHFhYWRmYmFiemtjdWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2MjU4NjAsImV4cCI6MjA1NTIwMTg2MH0.fpiYDehk0F2bLX8TVqGmVB1lIpR8ZgcLKbkPmo6PORk";

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize Supabase client
    const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        storage: window.localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    }) : null;
    
    if (!supabase) {
      console.error('Supabase client not available');
      showToast('Unable to connect to the database', 'error');
      return;
    }

    // Setup search functionality
    setupSearchFunctionality();

    // Setup mobile menu
    setupMobileMenu();

    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = 'login.html';
      return;
    }

    // Load user data
    await loadUserData(session.user.id);

    // Setup navigation
    setupNavigation();

    // Setup orders
    await loadUserOrders(session.user.id);

    // Get cart and wishlist count
    await updateCartCount();
    await updateWishlistCount();

    // Load user cart items
    await loadCartItems(session.user.id);

    // Load user wishlist items
    await loadWishlistItems(session.user.id);

    // Load user addresses
    await loadUserAddresses(session.user.id);

    // Handle logout (main logout button)
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        await handleLogout();
      });
    }
    
    // Handle mobile logout
    const mobileLogoutLink = document.getElementById('mobile-logout-link');
    if (mobileLogoutLink) {
      mobileLogoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        await handleLogout();
      });
    }

    // Setup account form
    setupAccountForm(session.user.id);

    // Handle address functionality
    setupAddressHandlers(session.user.id);

    // Handle deposit modal
    setupDepositModal(session.user.id);

    // Handle avatar upload
    setupAvatarUpload(session);

    // Setup delete account
    setupDeleteAccount(session.user.id);

    // Hide preloader when everything is loaded
    document.querySelector('.preloader').classList.add('hide');
    
  } catch (error) {
    console.error('Error initializing profile page:', error);
    showToast('An error occurred while loading the profile page', 'error');
  }
});

// Setup search functionality
function setupSearchFunctionality() {
  const searchToggle = document.getElementById('search-toggle');
  const searchContainer = document.querySelector('.search-container');
  const searchInput = document.getElementById('search-input');
  
  if (searchToggle) {
    searchToggle.addEventListener('click', () => {
      searchContainer.classList.toggle('show');
      if (searchContainer.classList.contains('show')) {
        searchInput.focus();
      }
    });
  }
  
  document.addEventListener('click', (e) => {
    if (searchContainer && searchContainer.classList.contains('show') && 
        !searchContainer.contains(e.target) && e.target !== searchToggle) {
      searchContainer.classList.remove('show');
    }
  });
  
  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const query = searchInput.value.trim();
      if (query) {
        window.location.href = `product.html?search=${encodeURIComponent(query)}`;
      }
    });
  }
  
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          window.location.href = `product.html?search=${encodeURIComponent(query)}`;
        }
      }
    });
  }
}

// Setup mobile menu
function setupMobileMenu() {
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
  const mobileMenuClose = document.getElementById('mobile-menu-close');
  
  if (mobileMenuToggle && mobileMenuOverlay && mobileMenuClose) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenuOverlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    });
    
    mobileMenuClose.addEventListener('click', () => {
      mobileMenuOverlay.classList.remove('show');
      document.body.style.overflow = '';
    });
    
    mobileMenuOverlay.addEventListener('click', (e) => {
      if (e.target === mobileMenuOverlay) {
        mobileMenuOverlay.classList.remove('show');
        document.body.style.overflow = '';
      }
    });
  }
}

// Update cart count
async function updateCartCount() {
  try {
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return;
    
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select('id')
      .eq('user_id', session.user.id);
    
    if (error) {
      console.error('Error fetching cart count:', error);
      return;
    }
    
    const cartCount = cartItems ? cartItems.length : 0;
    const cartCountElements = document.querySelectorAll('.cart-count');
    
    cartCountElements.forEach(element => {
      element.textContent = cartCount;
    });
    
  } catch (error) {
    console.error('Error updating cart count:', error);
  }
}

// Update wishlist count
async function updateWishlistCount() {
  try {
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return;
    
    const { data: wishlistItems, error } = await supabase
      .from('wishlist_items')
      .select('id')
      .eq('user_id', session.user.id);
    
    if (error) {
      console.error('Error fetching wishlist count:', error);
      return;
    }
    
    const wishlistCount = wishlistItems ? wishlistItems.length : 0;
    const wishlistCountElements = document.querySelectorAll('.wishlist-count');
    
    wishlistCountElements.forEach(element => {
      element.textContent = wishlistCount;
    });
    
  } catch (error) {
    console.error('Error updating wishlist count:', error);
  }
}

// Load user data
async function loadUserData(userId) {
  try {
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    if (profile) {
      // Update profile header
      document.getElementById('user-fullname').textContent = profile.full_name || 'User';
      document.getElementById('user-email').textContent = profile.email || '';
      document.getElementById('user-balance').textContent = `₦${parseFloat(profile.balance || 0).toFixed(2)}`;
      
      // Update edit form
      document.getElementById('edit-fullname').value = profile.full_name || '';
      document.getElementById('edit-email').value = profile.email || '';
      document.getElementById('edit-phone').value = profile.phone || '';
      
      // Update avatar if available
      if (profile.avatar_url) {
        document.getElementById('user-avatar').src = profile.avatar_url;
      }
      
      // Update user IDs in deposit modal
      const userIdElements = document.querySelectorAll('#user-id, #crypto-user-id');
      const usernameElements = document.querySelectorAll('#username, #crypto-username');
      
      userIdElements.forEach(element => {
        element.textContent = userId;
      });
      
      usernameElements.forEach(element => {
        element.textContent = profile.username || profile.email || 'User';
      });
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    showToast('Failed to load user profile data', 'error');
  }
}

// Setup navigation
function setupNavigation() {
  const navLinks = document.querySelectorAll('.profile-nav-link');
  const sections = document.querySelectorAll('.profile-section');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const sectionId = link.getAttribute('data-section');
      
      if (sectionId) {
        e.preventDefault();
        
        // Update active link
        navLinks.forEach(item => item.classList.remove('active'));
        link.classList.add('active');
        
        // Show active section
        sections.forEach(section => section.classList.remove('active'));
        document.getElementById(sectionId).classList.add('active');
        
        // Update URL hash
        window.location.hash = sectionId;
      }
    });
  });
  
  // Check if URL has a hash and activate the corresponding section
  const hash = window.location.hash.substring(1);
  if (hash) {
    const activeLink = document.querySelector(`.profile-nav-link[data-section="${hash}"]`);
    if (activeLink) {
      activeLink.click();
    }
  }
}

// Handle logout
async function handleLogout() {
  try {
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    await supabase.auth.signOut();
    showToast('Successfully logged out', 'success');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);
  } catch (error) {
    console.error('Error logging out:', error);
    showToast('Failed to log out', 'error');
  }
}

// Setup account form
function setupAccountForm(userId) {
  const accountForm = document.getElementById('account-form');
  
  if (accountForm) {
    accountForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const fullName = document.getElementById('edit-fullname').value.trim();
      const phone = document.getElementById('edit-phone').value.trim();
      
      if (!fullName) {
        showToast('Please enter your full name', 'error');
        return;
      }
      
      try {
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            phone: phone
          })
          .eq('id', userId);
        
        if (error) throw error;
        
        // Update displayed name
        document.getElementById('user-fullname').textContent = fullName;
        
        showToast('Profile updated successfully', 'success');
      } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Failed to update profile', 'error');
      }
    });
  }
}

// Load user orders
async function loadUserOrders(userId) {
  try {
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('order_date', { ascending: false });
    
    if (error) throw error;
    
    const ordersList = document.querySelector('.orders-list');
    
    if (orders && orders.length > 0) {
      ordersList.innerHTML = '';
      
      orders.forEach(order => {
        const orderDate = new Date(order.order_date).toLocaleDateString();
        const orderItems = JSON.parse(order.order_items || '[]');
        
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        
        const statusClasses = {
          'processing': 'status-processing',
          'completed': 'status-completed',
          'pending': 'status-pending'
        };
        
        orderCard.innerHTML = `
          <div class="order-header">
            <div class="order-info">
              <h3 class="order-id">Order #${order.id.substring(0, 8)}</h3>
              <p class="order-date">${orderDate}</p>
            </div>
            <span class="order-status ${statusClasses[order.status] || 'status-processing'}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
          </div>
          <div class="order-details">
            <div class="order-items">
              <pre>${JSON.stringify(orderItems, null, 2)}</pre>
            </div>
            <div class="order-total">
              <span>Total:</span>
              <span>₦${parseFloat(order.order_total).toFixed(2)}</span>
            </div>
          </div>
        `;
        
        ordersList.appendChild(orderCard);
      });
    } else {
      ordersList.innerHTML = `
        <div class="order-card order-empty">
          <div class="order-empty-content">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <h3>No orders yet</h3>
            <p>Your orders will appear here when you make a purchase.</p>
            <a href="product.html" class="btn btn-outline">Start Shopping</a>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading orders:', error);
    showToast('Failed to load order history', 'error');
  }
}

// Load cart items
async function loadCartItems(userId) {
  try {
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Get cart items with product details
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products(*)
      `)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching cart items:', error);
      showToast('Failed to load cart items', 'error');
      return;
    }
    
    const cartContainer = document.getElementById('cart-items-container');
    const cartActions = document.getElementById('cart-actions');
    
    if (!cartContainer) {
      console.error('Cart container element not found');
      return;
    }
    
    if (cartItems && cartItems.length > 0) {
      let cartHTML = '';
      let cartTotal = 0;
      
      cartItems.forEach(item => {
        const product = item.products;
        if (!product) {
          console.warn(`Product not found for cart item ${item.id}`);
          return;
        }
        
        const itemTotal = product.price * item.quantity;
        cartTotal += itemTotal;
        
        cartHTML += `
          <div class="product-card" data-id="${item.id}" data-product-id="${product.id}">
            <img src="${product.image_url || 'placeholder.svg'}" alt="${product.name}" class="product-image">
            <div class="product-details">
              <div class="product-header">
                <h3 class="product-title">${product.name}</h3>
                <span class="product-price">₦${parseFloat(product.price).toFixed(2)}</span>
              </div>
              <p class="product-description">${product.description || ''}</p>
              <div class="product-meta">
                <div class="quantity-control">
                  <button class="quantity-btn decrease-quantity" data-id="${item.id}">-</button>
                  <span class="quantity">${item.quantity}</span>
                  <button class="quantity-btn increase-quantity" data-id="${item.id}">+</button>
                </div>
                <div class="product-actions">
                  <button class="wishlist-icon-btn" data-product-id="${product.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </button>
                  <button class="remove-btn" data-id="${item.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      
      cartContainer.innerHTML = cartHTML;
      document.getElementById('cart-total-amount').textContent = `₦${parseFloat(cartTotal).toFixed(2)}`;
      if (cartActions) cartActions.style.display = 'flex';
      
      // Add event listeners for quantity controls and remove buttons
      setupCartItemHandlers(userId);
      
    } else {
      cartContainer.innerHTML = `
        <div class="cart-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <h3>Your cart is empty</h3>
          <p>Add items to your cart for checkout.</p>
          <a href="product.html" class="btn btn-outline">Start Shopping</a>
        </div>
      `;
      if (cartActions) cartActions.style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading cart items:', error);
    showToast('Failed to load cart items', 'error');
  }
}

// Setup cart item event handlers
function setupCartItemHandlers(userId) {
  // Quantity increase buttons
  document.querySelectorAll('.increase-quantity').forEach(button => {
    button.addEventListener('click', async () => {
      const itemId = button.getAttribute('data-id');
      const quantityElement = button.parentElement.querySelector('.quantity');
      const currentQuantity = parseInt(quantityElement.textContent);
      
      try {
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: currentQuantity + 1 })
          .eq('id', itemId);
        
        if (error) throw error;
        
        quantityElement.textContent = currentQuantity + 1;
        updateCartTotal();
        updateCartCount();
        
      } catch (error) {
        console.error('Error updating quantity:', error);
        showToast('Failed to update quantity', 'error');
      }
    });
  });
  
  // Quantity decrease buttons
  document.querySelectorAll('.decrease-quantity').forEach(button => {
    button.addEventListener('click', async () => {
      const itemId = button.getAttribute('data-id');
      const quantityElement = button.parentElement.querySelector('.quantity');
      const currentQuantity = parseInt(quantityElement.textContent);
      
      if (currentQuantity <= 1) return;
      
      try {
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: currentQuantity - 1 })
          .eq('id', itemId);
        
        if (error) throw error;
        
        quantityElement.textContent = currentQuantity - 1;
        updateCartTotal();
        
      } catch (error) {
        console.error('Error updating quantity:', error);
        showToast('Failed to update quantity', 'error');
      }
    });
  });
  
  // Remove buttons
  document.querySelectorAll('.remove-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const itemId = button.getAttribute('data-id');
      const productCard = button.closest('.product-card');
      
      try {
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', itemId);
        
        if (error) throw error;
        
        productCard.remove();
        updateCartTotal();
        updateCartCount();
        
        // Check if cart is empty
        const cartItems = document.querySelectorAll('#cart-items-container .product-card');
        if (cartItems.length === 0) {
          loadCartItems(userId);
        }
        
      } catch (error) {
        console.error('Error removing item from cart:', error);
        showToast('Failed to remove item from cart', 'error');
      }
    });
  });
  
  // Add to wishlist buttons
  document.querySelectorAll('.wishlist-icon-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const productId = button.getAttribute('data-product-id');
      
      try {
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        // Check if item is already in wishlist
        const { data: existing, error: checkError } = await supabase
          .from('wishlist_items')
          .select('*')
          .eq('user_id', userId)
          .eq('product_id', productId);
        
        if (checkError) throw checkError;
        
        if (existing && existing.length > 0) {
          showToast('Item is already in your wishlist', 'info');
          return;
        }
        
        // Add to wishlist
        const { error } = await supabase
          .from('wishlist_items')
          .insert([{ user_id: userId, product_id: productId }]);
        
        if (error) throw error;
        
        showToast('Item added to wishlist', 'success');
        updateWishlistCount();
        
      } catch (error) {
        console.error('Error adding to wishlist:', error);
        showToast('Failed to add item to wishlist', 'error');
      }
    });
  });
}

// Update cart total
function updateCartTotal() {
  const cartItems = document.querySelectorAll('#cart-items-container .product-card');
  let total = 0;
  
  cartItems.forEach(item => {
    const price = parseFloat(item.querySelector('.product-price').textContent.replace('₦', ''));
    const quantity = parseInt(item.querySelector('.quantity').textContent);
    total += price * quantity;
  });
  
  const cartTotalElement = document.getElementById('cart-total-amount');
  if (cartTotalElement) {
    cartTotalElement.textContent = `₦${total.toFixed(2)}`;
  }
}

// Load wishlist items
async function loadWishlistItems(userId) {
  try {
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Get wishlist items with product details
    const { data: wishlistItems, error } = await supabase
      .from('wishlist_items')
      .select(`
        *,
        products(*)
      `)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching wishlist items:', error);
      showToast('Failed to load wishlist items', 'error');
      return;
    }
    
    const wishlistContainer = document.getElementById('wishlist-items-container');
    
    if (!wishlistContainer) {
      console.error('Wishlist container element not found');
      return;
    }
    
    if (wishlistItems && wishlistItems.length > 0) {
      let wishlistHTML = '';
      
      wishlistItems.forEach(item => {
        const product = item.products;
        if (!product) {
          console.warn(`Product not found for wishlist item ${item.id}`);
          return;
        }
        
        wishlistHTML += `
          <div class="product-card" data-id="${item.id}" data-product-id="${product.id}">
            <img src="${product.image_url || 'placeholder.svg'}" alt="${product.name}" class="product-image">
            <div class="product-details">
              <div class="product-header">
                <h3 class="product-title">${product.name}</h3>
                <span class="product-price">₦${parseFloat(product.price).toFixed(2)}</span>
              </div>
              <p class="product-description">${product.description || ''}</p>
              <div class="product-meta">
                <div class="product-actions">
                  <button class="cart-icon-btn" data-product-id="${product.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    Add to Cart
                  </button>
                  <button class="remove-btn" data-id="${item.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      
      wishlistContainer.innerHTML = wishlistHTML;
      
      // Add event listeners for cart and remove buttons
      setupWishlistItemHandlers(userId);
      
    } else {
      wishlistContainer.innerHTML = `
        <div class="wishlist-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <h3>Your wishlist is empty</h3>
          <p>Save your favorite items to your wishlist.</p>
          <a href="product.html" class="btn btn-outline">Start Shopping</a>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading wishlist items:', error);
    showToast('Failed to load wishlist items', 'error');
  }
}

// Setup wishlist item event handlers
function setupWishlistItemHandlers(userId) {
  // Add to cart buttons
  document.querySelectorAll('.cart-icon-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const productId = button.getAttribute('data-product-id');
      
      try {
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        // Check if item is already in cart
        const { data: existing, error: checkError } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', userId)
          .eq('product_id', productId);
        
        if (checkError) throw checkError;
        
        if (existing && existing.length > 0) {
          // Update quantity if already in cart
          const { error } = await supabase
            .from('cart_items')
            .update({ quantity: existing[0].quantity + 1 })
            .eq('id', existing[0].id);
          
          if (error) throw error;
          
          showToast('Cart updated successfully', 'success');
        } else {
          // Add new item to cart
          const { error } = await supabase
            .from('cart_items')
            .insert([{ user_id: userId, product_id: productId, quantity: 1 }]);
          
          if (error) throw error;
          
          showToast('Item added to cart', 'success');
        }
        
        updateCartCount();
        
      } catch (error) {
        console.error('Error adding to cart:', error);
        showToast('Failed to add item to cart', 'error');
      }
    });
  });
  
  // Remove buttons
  document.querySelectorAll('#wishlist-items-container .remove-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const itemId = button.getAttribute('data-id');
      const productCard = button.closest('.product-card');
      
      try {
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        const { error } = await supabase
          .from('wishlist_items')
          .delete()
          .eq('id', itemId);
        
        if (error) throw error;
        
        productCard.remove();
        updateWishlistCount();
        
        // Check if wishlist is empty
        const wishlistItems = document.querySelectorAll('#wishlist-items-container .product-card');
        if (wishlistItems.length === 0) {
          loadWishlistItems(userId);
        }
        
      } catch (error) {
        console.error('Error removing item from wishlist:', error);
        showToast('Failed to remove item from wishlist', 'error');
      }
    });
  });
}

// Load user addresses
async function loadUserAddresses(userId) {
  try {
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // For this example, we're using localStorage to store addresses
    // In a real application, you would store these in a database table
    let addresses = JSON.parse(localStorage.getItem(`addresses_${userId}`)) || [];
    
    const addressContainer = document.getElementById('address-list-container');
    
    if (addresses.length > 0) {
      let addressesHTML = '';
      
      addresses.forEach(address => {
        addressesHTML += `
          <div class="address-card ${address.isDefault ? 'default' : ''}" data-id="${address.id}">
            <div class="address-card-header">
              <h3 class="address-name">
                ${address.name}
                ${address.isDefault ? '<span class="default-badge">Default</span>' : ''}
              </h3>
              <div class="address-actions">
                <button class="edit-btn" data-id="${address.id}">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button class="delete-btn" data-id="${address.id}">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div class="address-content">
              <p class="recipient-name">${address.recipientName}</p>
              <p class="address-details">
                ${address.line1}<br>
                ${address.line2 ? address.line2 + '<br>' : ''}
                ${address.city}, ${address.state} ${address.zip}<br>
                ${address.country}
              </p>
              <p class="address-contact">
                ${address.phone}
              </p>
            </div>
          </div>
        `;
      });
      
      addressContainer.innerHTML = addressesHTML;
      
      // Add event listeners for edit and delete buttons
      setupAddressCardHandlers(userId);
      
    } else {
      addressContainer.innerHTML = `
        <div class="address-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <h3>No addresses saved</h3>
          <p>Add a new address for faster checkout.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading addresses:', error);
    showToast('Failed to load addresses', 'error');
  }
}

// Setup address handlers
function setupAddressHandlers(userId) {
  const addAddressBtn = document.getElementById('add-address-btn');
  const addressModal = document.getElementById('address-modal');
  const closeModalBtn = addressModal.querySelector('.close-modal');
  const addressForm = document.getElementById('address-form');
  
  // Open modal on add address button click
  addAddressBtn.addEventListener('click', () => {
    // Reset form
    addressForm.reset();
    document.getElementById('address-id').value = '';
    document.getElementById('address-modal-title').textContent = 'Add New Address';
    
    // Show modal
    addressModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  });
  
  // Close modal on close button click
  closeModalBtn.addEventListener('click', () => {
    addressModal.classList.remove('show');
    document.body.style.overflow = '';
  });
  
  // Close modal on outside click
  addressModal.addEventListener('click', (e) => {
    if (e.target === addressModal) {
      addressModal.classList.remove('show');
      document.body.style.overflow = '';
    }
  });
  
  // Handle form submission
  addressForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = {
      id: document.getElementById('address-id').value || generateId(),
      name: document.getElementById('address-name').value,
      recipientName: document.getElementById('recipient-name').value,
      line1: document.getElementById('address-line1').value,
      line2: document.getElementById('address-line2').value,
      city: document.getElementById('address-city').value,
      state: document.getElementById('address-state').value,
      zip: document.getElementById('address-zip').value,
      country: document.getElementById('address-country').value,
      phone: document.getElementById('address-phone').value,
      isDefault: document.getElementById('default-address').checked
    };
    
    // Get existing addresses
    let addresses = JSON.parse(localStorage.getItem(`addresses_${userId}`)) || [];
    
    // Check if this is an update or new address
    const existingIndex = addresses.findIndex(addr => addr.id === formData.id);
    
    if (formData.isDefault) {
      // If this address is default, remove default from other addresses
      addresses.forEach(addr => {
        addr.isDefault = false;
      });
    } else if (addresses.length === 0) {
      // If this is the first address, make it default
      formData.isDefault = true;
    } else if (existingIndex !== -1 && addresses[existingIndex].isDefault && !formData.isDefault) {
      // If this was the default address and user unchecked default, make another address default
      formData.isDefault = true;
    }
    
    if (existingIndex !== -1) {
      // Update existing address
      addresses[existingIndex] = formData;
    } else {
      // Add new address
      addresses.push(formData);
    }
    
    // Save addresses
    localStorage.setItem(`addresses_${userId}`, JSON.stringify(addresses));
    
    // Reload addresses
    loadUserAddresses(userId);
    
    // Close modal
    addressModal.classList.remove('show');
    document.body.style.overflow = '';
    
    // Show success message
    showToast(existingIndex !== -1 ? 'Address updated successfully' : 'Address added successfully', 'success');
  });
}

// Setup address card event handlers
function setupAddressCardHandlers(userId) {
  // Edit address buttons
  document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', () => {
      const addressId = button.getAttribute('data-id');
      
      // Get addresses from storage
      let addresses = JSON.parse(localStorage.getItem(`addresses_${userId}`)) || [];
      
      // Find the address to edit
      const address = addresses.find(addr => addr.id === addressId);
      
      if (address) {
        // Populate form with address data
        document.getElementById('address-id').value = address.id;
        document.getElementById('address-name').value = address.name;
        document.getElementById('recipient-name').value = address.recipientName;
        document.getElementById('address-line1').value = address.line1;
        document.getElementById('address-line2').value = address.line2 || '';
        document.getElementById('address-city').value = address.city;
        document.getElementById('address-state').value = address.state;
        document.getElementById('address-zip').value = address.zip;
        document.getElementById('address-country').value = address.country;
        document.getElementById('address-phone').value = address.phone;
        document.getElementById('default-address').checked = address.isDefault;
        
        // Update modal title
        document.getElementById('address-modal-title').textContent = 'Edit Address';
        
        // Show modal
        document.getElementById('address-modal').classList.add('show');
        document.body.style.overflow = 'hidden';
      }
    });
  });
  
  // Delete address buttons
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', () => {
      const addressId = button.getAttribute('data-id');
      
      if (confirm('Are you sure you want to delete this address?')) {
        // Get addresses from storage
        let addresses = JSON.parse(localStorage.getItem(`addresses_${userId}`)) || [];
        
        // Find the address to delete
        const addressIndex = addresses.findIndex(addr => addr.id === addressId);
        
        if (addressIndex !== -1) {
          const isDefault = addresses[addressIndex].isDefault;
          
          // Remove the address
          addresses.splice(addressIndex, 1);
          
          // If the deleted address was default and there are other addresses, make the first one default
          if (isDefault && addresses.length > 0) {
            addresses[0].isDefault = true;
          }
          
          // Save updated addresses
          localStorage.setItem(`addresses_${userId}`, JSON.stringify(addresses));
          
          // Reload addresses
          loadUserAddresses(userId);
          
          // Show success message
          showToast('Address deleted successfully', 'success');
        }
      }
    });
  });
}

// Setup deposit modal
function setupDepositModal(userId) {
  const depositBtn = document.getElementById('deposit-btn');
  const depositModal = document.getElementById('deposit-modal');
  const closeModalBtn = depositModal.querySelector('.close-modal');
  const currencyTabs = document.querySelectorAll('.currency-tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const copyButtons = document.querySelectorAll('.copy-btn');
  
  // Open modal on deposit button click
  depositBtn.addEventListener('click', () => {
    depositModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  });
  
  // Close modal on close button click
  closeModalBtn.addEventListener('click', () => {
    depositModal.classList.remove('show');
    document.body.style.overflow = '';
  });
  
  // Close modal on outside click
  depositModal.addEventListener('click', (e) => {
    if (e.target === depositModal) {
      depositModal.classList.remove('show');
      document.body.style.overflow = '';
    }
  });
  
  // Currency tab switching
  currencyTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const currency = tab.getAttribute('data-currency');
      
      // Update active tab
      currencyTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show corresponding content
      tabContents.forEach(content => {
        content.style.display = content.id === `${currency}-content` ? 'block' : 'none';
      });
    });
  });
  
  // Copy buttons
  copyButtons.forEach(button => {
    button.addEventListener('click', () => {
      const textToCopy = button.getAttribute('data-clipboard-text');
      
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          // Change button text temporarily
          const originalHTML = button.innerHTML;
          button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Copied!
          `;
          
          setTimeout(() => {
            button.innerHTML = originalHTML;
          }, 2000);
        })
        .catch(err => {
          console.error('Error copying text:', err);
          showToast('Failed to copy to clipboard', 'error');
        });
    });
  });
}

// Setup avatar upload
function setupAvatarUpload(session) {
  const changeAvatarBtn = document.getElementById('change-avatar-btn');
  const avatarUploadInput = document.getElementById('avatar-upload');
  
  if (changeAvatarBtn && avatarUploadInput) {
    changeAvatarBtn.addEventListener('click', () => {
      avatarUploadInput.click();
    });
    
    avatarUploadInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      
      if (!file) return;
      
      // Check file type
      if (!file.type.match('image.*')) {
        showToast('Please select an image file', 'error');
        return;
      }
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showToast('Image size should be less than 2MB', 'error');
        return;
      }
      
      try {
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        // Upload avatar to storage
        const fileName = `avatar_${session.user.id}_${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        if (!urlData || !urlData.publicUrl) {
          throw new Error('Failed to get avatar URL');
        }
        
        const avatarUrl = urlData.publicUrl;
        
        // Update profile with new avatar URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: avatarUrl })
          .eq('id', session.user.id);
        
        if (updateError) throw updateError;
        
        // Update avatar in UI
        document.getElementById('user-avatar').src = avatarUrl;
        
        showToast('Avatar updated successfully', 'success');
        
      } catch (error) {
        console.error('Error uploading avatar:', error);
        showToast('Failed to upload avatar', 'error');
      }
    });
  }
}

// Setup delete account functionality
function setupDeleteAccount(userId) {
  // Add delete account button to account section
  const accountForm = document.getElementById('account-form');
  
  if (accountForm) {
    const deleteAccountBtn = document.createElement('button');
    deleteAccountBtn.type = 'button';
    deleteAccountBtn.className = 'btn btn-danger delete-account-btn';
    deleteAccountBtn.textContent = 'Delete Account';
    
    const formActions = accountForm.querySelector('.form-actions');
    formActions.appendChild(deleteAccountBtn);
    
    // Create delete account modal
    const modalHTML = `
      <div id="delete-account-modal" class="modal">
        <div class="modal-content">
          <span class="close-modal">&times;</span>
          <h3 class="warning-title">Delete Account</h3>
          
          <div id="delete-account-step-1">
            <p class="warning-message">Are you sure you want to delete your account? This action cannot be undone and:</p>
            <ul class="warning-list">
              <li>All your personal information will be permanently deleted</li>
              <li>Your email address will be removed from our system</li>
              <li>Any funds in your account will be forfeited</li>
              <li>All your orders, addresses, and preferences will be lost</li>
              <li>You will no longer be able to access any purchases</li>
            </ul>
            
            <div class="modal-actions">
              <button type="button" class="btn btn-outline cancel-delete">Cancel</button>
              <button type="button" class="btn btn-danger confirm-delete">Delete My Account</button>
            </div>
          </div>
          
          <div id="delete-account-step-2" style="display: none;">
            <p class="warning-message">Please enter your password to confirm account deletion:</p>
            
            <div class="form-group">
              <label for="confirm-password">Password</label>
              <input type="password" id="confirm-password" class="form-control" required>
              <p class="password-attempts" id="password-attempts">Attempts remaining: <span>2</span></p>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn btn-outline back-to-step-1">Back</button>
              <button type="button" class="btn btn-danger confirm-password">Confirm</button>
            </div>
          </div>
          
          <div id="delete-account-step-3" style="display: none;">
            <div class="account-frozen">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <h3>Account Frozen</h3>
              <p>Your account has been frozen due to multiple failed password attempts. Please contact our customer service to resolve this issue.</p>
              <a href="mailto:ecommerxe01@gmail.com" class="btn btn-outline">Contact Support</a>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Append modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Get modal elements
    const deleteAccountModal = document.getElementById('delete-account-modal');
    const closeModalBtn = deleteAccountModal.querySelector('.close-modal');
    const cancelDeleteBtn = deleteAccountModal.querySelector('.cancel-delete');
    const confirmDeleteBtn = deleteAccountModal.querySelector('.confirm-delete');
    const backToStep1Btn = deleteAccountModal.querySelector('.back-to-step-1');
    const confirmPasswordBtn = deleteAccountModal.querySelector('.confirm-password');
    const passwordInput = document.getElementById('confirm-password');
    const passwordAttemptsSpan = document.querySelector('#password-attempts span');
    
    let passwordAttempts = 2;
    
    // Show modal when delete account button is clicked
    deleteAccountBtn.addEventListener('click', () => {
      passwordAttempts = 2;
      passwordAttemptsSpan.textContent = passwordAttempts;
      
      document.getElementById('delete-account-step-1').style.display = 'block';
      document.getElementById('delete-account-step-2').style.display = 'none';
      document.getElementById('delete-account-step-3').style.display = 'none';
      
      deleteAccountModal.classList.add('show');
      document.body.style.overflow = 'hidden';
    });
    
    // Close modal on close button click
    closeModalBtn.addEventListener('click', () => {
      deleteAccountModal.classList.remove('show');
      document.body.style.overflow = '';
    });
    
    // Close modal on outside click
    deleteAccountModal.addEventListener('click', (e) => {
      if (e.target === deleteAccountModal) {
        deleteAccountModal.classList.remove('show');
        document.body.style.overflow = '';
      }
    });
    
    // Cancel delete
    cancelDeleteBtn.addEventListener('click', () => {
      deleteAccountModal.classList.remove('show');
      document.body.style.overflow = '';
    });
    
    // Go to password confirmation step
    confirmDeleteBtn.addEventListener('click', () => {
      document.getElementById('delete-account-step-1').style.display = 'none';
      document.getElementById('delete-account-step-2').style.display = 'block';
      passwordInput.value = '';
      passwordInput.focus();
    });
    
    // Go back to first step
    backToStep1Btn.addEventListener('click', () => {
      document.getElementById('delete-account-step-1').style.display = 'block';
      document.getElementById('delete-account-step-2').style.display = 'none';
    });
    
    // Handle password confirmation
    confirmPasswordBtn.addEventListener('click', async () => {
      const password = passwordInput.value;
      
      if (!password) {
        showToast('Please enter your password', 'error');
        return;
      }
      
      try {
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          showToast('You are not logged in', 'error');
          return;
        }
        
        // Try to sign in with the provided password
        const { error } = await supabase.auth.signInWithPassword({
          email: session.user.email,
          password: password
        });
        
        if (error) {
          // Password is incorrect
          passwordAttempts--;
          passwordAttemptsSpan.textContent = passwordAttempts;
          
          if (passwordAttempts <= 0) {
            // Freeze account
            document.getElementById('delete-account-step-2').style.display = 'none';
            document.getElementById('delete-account-step-3').style.display = 'block';
            
            // Here you would typically update a flag in the database to mark the account as frozen
            // For now, we'll just simulate that
            
            showToast('Account frozen due to multiple failed attempts', 'error');
          } else {
            showToast('Incorrect password, please try again', 'error');
          }
        } else {
          // Password is correct, proceed with account deletion
          const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
          
          if (deleteError) {
            showToast(`Failed to delete account: ${deleteError.message}`, 'error');
          } else {
            showToast('Account successfully deleted', 'success');
            
            setTimeout(() => {
              window.location.href = 'login.html';
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Error during account deletion:', error);
        showToast('An error occurred while attempting to delete your account', 'error');
      }
    });
  }
}

// Helper function to show toast messages
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  
  if (!toastContainer) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast-message toast-${type}`;
  toast.textContent = message;
  
  document.getElementById('toast-container').appendChild(toast);
  
  // Remove toast after animation completes
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// Helper function to generate a random ID
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
