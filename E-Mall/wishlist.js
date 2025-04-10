     
// Supabase configuration
const SUPABASE_URL = "https://rpusltqaadfbabzkcull.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwdXNsdHFhYWRmYmFiemtjdWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2MjU4NjAsImV4cCI6MjA1NTIwMTg2MH0.fpiYDehk0F2bLX8TVqGmVB1lIpR8ZgcLKbkPmo6PORk";

// Initialize Supabase client
let supabase;

// Wait for the document to load
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Supabase
  supabase = supabaseInit();
  
  // Initialize the page
  await initializePage();
  
  // Setup search functionality
  setupSearchFunctionality();
  
  // Setup mobile menu
  setupMobileMenu();
});

// Initialize Supabase client
function supabaseInit() {
  return supabase || window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Initialize the page
async function initializePage() {
  try {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    // Hide preloader
    hidePreloader();
    
    // Add cursor effects
    addCursorEffects();
    
    // Show back to top button on scroll
    setupBackToTopButton();
    
    // Load wishlist items
    if (session) {
      await loadWishlistItems(session.user.id);
    } else {
      showLoginPrompt();
    }
    
    // Update cart count
    await updateCartCount();
    
  } catch (error) {
    console.error('Error initializing page:', error);
    showToast('An error occurred while loading the page.', 'error');
  }
}

// Setup search functionality
function setupSearchFunctionality() {
  const searchToggle = document.getElementById('search-toggle');
  const searchContainer = document.querySelector('.search-container');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  
  if (searchToggle && searchContainer) {
    searchToggle.addEventListener('click', () => {
      searchContainer.classList.toggle('open');
      if (searchContainer.classList.contains('open')) {
        searchInput.focus();
      }
    });
  }
  
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
      const query = searchInput.value.trim();
      if (query) {
        window.location.href = `product.html?search=${encodeURIComponent(query)}`;
      }
    });
    
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
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const closeMenu = document.getElementById('mobile-menu-close');
  const mobileMenu = document.querySelector('.mobile-menu-overlay');
  
  if (menuToggle && closeMenu && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.add('active');
      document.body.classList.add('no-scroll');
    });
    
    closeMenu.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      document.body.classList.remove('no-scroll');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (mobileMenu.classList.contains('active') && 
          !e.target.closest('.mobile-menu-content') && 
          !e.target.closest('#mobile-menu-toggle')) {
        mobileMenu.classList.remove('active');
        document.body.classList.remove('no-scroll');
      }
    });
  }
}

// Hide preloader after page load
function hidePreloader() {
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add('hide');
    }, 500);
  }
}

// Add custom cursor effects
function addCursorEffects() {
  const cursor = document.querySelector('.custom-cursor');
  if (!cursor) return;
  
  // Update cursor position on mouse move
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });
  
  // Enlarge cursor on hover over links and buttons
  const interactiveElements = document.querySelectorAll('a, button, .product-card, .wishlist-item');
  
  interactiveElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
      cursor.style.width = '30px';
      cursor.style.height = '30px';
      cursor.style.opacity = '0.5';
    });
    
    element.addEventListener('mouseleave', () => {
      cursor.style.width = '15px';
      cursor.style.height = '15px';
      cursor.style.opacity = '0.7';
    });
  });
}

// Setup back to top button
function setupBackToTopButton() {
  const backToTopButton = document.querySelector('.back-to-top');
  if (!backToTopButton) return;
  
  // Show button when page is scrolled down
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopButton.classList.add('show');
    } else {
      backToTopButton.classList.remove('show');
    }
  });
  
  // Scroll to top when button is clicked
  backToTopButton.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// Show login prompt
function showLoginPrompt() {
  const wishlistEmpty = document.getElementById('wishlist-empty');
  const wishlistList = document.getElementById('wishlist-list');
  
  if (wishlistEmpty) {
    wishlistEmpty.innerHTML = `
      <i class="fas fa-user-lock wishlist-icon fa-4x"></i>
      <h2>Please log in to view your wishlist</h2>
      <p>You need to be logged in to save and view your wishlist items.</p>
      <a href="login.html" class="btn btn-primary">Login</a>
      <a href="signup.html" class="btn btn-outline">Sign Up</a>
    `;
    wishlistEmpty.style.display = 'flex';
  }
  
  if (wishlistList) {
    wishlistList.style.display = 'none';
  }
}

// Load wishlist items from Supabase
async function loadWishlistItems(userId) {
  try {
    const wishlistEmpty = document.getElementById('wishlist-empty');
    const wishlistList = document.getElementById('wishlist-list');
    
    // Show loading state
    if (wishlistList) {
      wishlistList.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
      wishlistList.style.display = 'block';
    }
    
    // Get wishlist items from Supabase
    const { data: wishlistItems, error: wishlistError } = await supabase
      .from('wishlist_items')
      .select('product_id')
      .eq('user_id', userId);
    
    if (wishlistError) throw wishlistError;
    
    // Update wishlist count
    updateWishlistCount(wishlistItems ? wishlistItems.length : 0);
    
    // Show empty state if no wishlist items
    if (!wishlistItems || wishlistItems.length === 0) {
      if (wishlistEmpty) wishlistEmpty.style.display = 'flex';
      if (wishlistList) wishlistList.style.display = 'none';
      return;
    }
    
    // Get product ids from wishlist items
    const productIds = wishlistItems.map(item => item.product_id);
    
    // Get product details for all wishlist items
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);
    
    if (productsError) throw productsError;
    
    // Show wishlist items
    if (wishlistEmpty) wishlistEmpty.style.display = 'none';
    if (wishlistList) {
      wishlistList.innerHTML = ''; // Clear loading spinner
      displayWishlistItems(products);
      wishlistList.style.display = 'grid';
    }
    
  } catch (error) {
    console.error('Error loading wishlist items:', error);
    showToast('Failed to load wishlist items', 'error');
  }
}

// Display wishlist items in the grid
function displayWishlistItems(products) {
  const wishlistList = document.getElementById('wishlist-list');
  if (!wishlistList) return;
  
  products.forEach(product => {
    const price = parseFloat(product.price);
    
    const wishlistItem = document.createElement('div');
    wishlistItem.className = 'wishlist-item';
    wishlistItem.dataset.id = product.id;
    
    wishlistItem.innerHTML = `
      <div class="wishlist-image">
        <img src="${product.image_url || 'https://via.placeholder.com/300x300?text=Product+Image'}" alt="${product.name}">
        <button class="remove-wishlist" onclick="removeFromWishlist('${product.id}')">
          <i class="fas fa-times"></i>
        </button>
        ${!product.in_stock ? '<span class="product-tag sale">Out of Stock</span>' : ''}
      </div>
      <div class="wishlist-content">
        <div class="wishlist-meta">
          <span class="wishlist-category">${product.category || 'Uncategorized'}</span>
        </div>
        <h3 class="wishlist-title">
          <a href="product-detail.html?id=${product.id}">${product.name}</a>
        </h3>
        <div class="wishlist-prices">
          <span class="wishlist-current-price">₦${price.toFixed(2)}</span>
        </div>
        <div class="wishlist-actions">
          <button class="btn btn-primary add-to-cart-btn" onclick="addToCart('${product.id}')" ${!product.in_stock ? 'disabled' : ''}>
            ${product.in_stock ? '<i class="fas fa-shopping-cart"></i> Add to Cart' : 'Out of Stock'}
          </button>
          <button class="share-wishlist" onclick="shareProduct('${product.id}', '${product.name}')">
            <i class="fas fa-share-alt"></i>
          </button>
        </div>
      </div>
    `;
    
    wishlistList.appendChild(wishlistItem);
  });
}

// Update wishlist count
function updateWishlistCount(count) {
  const wishlistCountElements = document.querySelectorAll('.wishlist-count');
  wishlistCountElements.forEach(element => {
    element.textContent = count || 0;
  });
}

// Add to cart function
async function addToCart(productId) {
  try {
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showToast('Please login to add items to your cart', 'error');
      return;
    }
    
    const userId = session.user.id;
    
    // Check if product is already in cart
    const { data: existingItems, error: checkError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId);
      
    if (checkError) throw checkError;
    
    if (existingItems && existingItems.length > 0) {
      // Product already in cart, update quantity
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: existingItems[0].quantity + 1 })
        .eq('id', existingItems[0].id);
        
      if (updateError) throw updateError;
      
      showToast('Cart updated successfully', 'success');
    } else {
      // Add new product to cart
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert([
          { user_id: userId, product_id: productId, quantity: 1 }
        ]);
        
      if (insertError) throw insertError;
      
      showToast('Product added to cart', 'success');
    }
    
    // Update cart count
    await updateCartCount();
    
  } catch (error) {
    console.error('Error adding to cart:', error);
    showToast('Failed to add product to cart', 'error');
  }
}

// Update cart count
async function updateCartCount() {
  try {
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const userId = session.user.id;
    
    // Get cart count from Supabase
    const { data, error, count } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);
      
    if (error) throw error;
    
    // Update cart count in UI
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
      element.textContent = count || 0;
    });
    
  } catch (error) {
    console.error('Error updating cart count:', error);
  }
}

// Remove from wishlist
async function removeFromWishlist(productId) {
  try {
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showToast('Please login to manage your wishlist', 'error');
      return;
    }
    
    const userId = session.user.id;
    
    // Remove from Supabase
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
      
    if (error) throw error;
    
    // Show toast message
    showToast('Product removed from wishlist', 'success');
    
    // Remove product from the DOM
    const wishlistItem = document.querySelector(`.wishlist-item[data-id="${productId}"]`);
    if (wishlistItem) {
      wishlistItem.remove();
    }
    
    // Update wishlist count
    const { data: updatedWishlist, error: countError, count } = await supabase
      .from('wishlist_items')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);
      
    if (!countError) {
      updateWishlistCount(count);
    }
    
    // Show empty state if no items left
    if (count === 0) {
      const wishlistEmpty = document.getElementById('wishlist-empty');
      const wishlistList = document.getElementById('wishlist-list');
      
      if (wishlistEmpty) wishlistEmpty.style.display = 'flex';
      if (wishlistList) wishlistList.style.display = 'none';
    }
    
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    showToast('Failed to remove product from wishlist', 'error');
  }
}

// Share product function
function shareProduct(productId, productName) {
  const shareUrl = `${window.location.origin}/product-detail.html?id=${productId}`;
  
  // Check if Web Share API is supported
  if (navigator.share) {
    navigator.share({
      title: productName,
      text: `Check out this product on E-Mall: ${productName}`,
      url: shareUrl
    })
    .then(() => {
      console.log('Product shared successfully');
    })
    .catch(error => {
      console.error('Error sharing product:', error);
      fallbackShare(shareUrl);
    });
  } else {
    fallbackShare(shareUrl);
  }
}

// Fallback share method (copy to clipboard)
function fallbackShare(url) {
  // Create a temporary input element
  const input = document.createElement('input');
  input.value = url;
  document.body.appendChild(input);
  
  // Select and copy the URL
  input.select();
  document.execCommand('copy');
  
  // Remove the temporary input
  document.body.removeChild(input);
  
  // Show toast message
  showToast('Product URL copied to clipboard!');
}

// Show toast message
function showToast(message, type = 'success') {
  // Remove existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    document.body.removeChild(existingToast);
  }
  
  // Create toast
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  // Add toast to the DOM
  document.body.appendChild(toast);
  
  // Show the toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Remove the toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Make functions globally available
window.addToCart = addToCart;
window.removeFromWishlist = removeFromWishlist;
window.shareProduct = shareProduct;
