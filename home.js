// Supabase credentials
const SUPABASE_URL = "https://rpusltqaadfbabzkcull.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwdXNsdHFhYWRmYmFiemtjdWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2MjU4NjAsImV4cCI6MjA1NTIwMTg2MH0.fpiYDehk0F2bLX8TVqGmVB1lIpR8ZgcLKbkPmo6PORk";

// Check for authentication on page load
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Initialize Supabase client
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        storage: window.localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    });

    // Check if user is logged in
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error checking authentication:', error);
      window.location.href = 'welcome.html';
      return;
    }
    
    if (!session) {
      console.log('No active session found, redirecting to welcome page');
      window.location.href = 'welcome.html';
      return;
    }

    console.log('User is authenticated:', session.user.id);

    // Load cart and wishlist counts
    await updateCartCount(supabase, session.user.id);
    await updateWishlistCount(supabase, session.user.id);
    
    // Set up logout button
    setupLogoutButton(supabase);
    
    // Load products from Supabase
    await loadProducts(supabase);

    // Wait for DOM content to load
    // Initialize UI functionality
    initUI();

  } catch (error) {
    console.error('Error during initialization:', error);
    showToast('An error occurred during initialization. Please try again.', 'error');
  }
});

// Load products from Supabase
async function loadProducts(supabase) {
  try {
    const productsGrid = document.getElementById('products-grid');
    
    // Fetch products from Supabase
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .limit(4);
    
    if (error) {
      throw error;
    }
    
    // Clear loading indicator
    productsGrid.innerHTML = '';
    
    if (products.length === 0) {
      productsGrid.innerHTML = '<div class="no-products">No products found</div>';
      return;
    }
    
    // Add products to the grid
    products.forEach(product => {
      const productCard = createProductCard(product, supabase);
      productsGrid.appendChild(productCard);
    });
    
  } catch (error) {
    console.error('Error loading products:', error);
    document.getElementById('products-grid').innerHTML = '<div class="error-message">Failed to load products. Please try again later.</div>';
  }
}

// Create product card element
function createProductCard(product, supabase) {
  const card = document.createElement('div');
  card.className = 'product-card animate-item';
  card.setAttribute('data-product-id', product.id);
  
  // Format price
  const price = parseFloat(product.price);
  const formattedPrice = price.toFixed(2);
  
  card.innerHTML = `
    <div class="product-image">
      ${product.in_stock ? '' : '<span class="product-tag out-of-stock">Out of Stock</span>'}
      <img src="${product.image_url || 'https://via.placeholder.com/500?text=No+Image'}" alt="${product.name}" class="lazy-image">
      <div class="product-actions">
        <button class="product-action-btn add-to-wishlist" data-product-id="${product.id}">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </button>
        <button class="product-action-btn add-to-cart" data-product-id="${product.id}">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        </button>
      </div>
    </div>
    <div class="product-content">
      <div class="product-meta">
        <span class="product-category">${product.category || 'Uncategorized'}</span>
      </div>
      <h3 class="product-title">${product.name}</h3>
      <div class="product-prices">
        <span class="current-price">₦${formattedPrice}</span>
      </div>
      <button class="btn btn-primary btn-full add-to-cart-btn" data-product-id="${product.id}" ${product.in_stock ? '' : 'disabled'}>
        ${product.in_stock ? 'Add to Cart' : 'Out of Stock'}
      </button>
    </div>
  `;
  
  // Add event listeners
  setTimeout(() => {
    // Add to cart buttons
    const addToCartButtons = card.querySelectorAll('.add-to-cart, .add-to-cart-btn');
    addToCartButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!product.in_stock) return;
        
        const productId = button.getAttribute('data-product-id');
        await addToCart(supabase, productId);
      });
    });
    
    // Add to wishlist button
    const addToWishlistButton = card.querySelector('.add-to-wishlist');
    if (addToWishlistButton) {
      addToWishlistButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const productId = addToWishlistButton.getAttribute('data-product-id');
        await addToWishlist(supabase, productId);
      });
    }
  }, 0);
  
  return card;
}

// Add to cart
async function addToCart(supabase, productId) {
  try {
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showToast('Please login to add items to your cart', 'error');
      window.location.href = 'welcome.html';
      return;
    }
    
    const userId = session.user.id;
    
    // Check if product is already in cart
    const { data: existingItems, error: checkError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId);
      
    if (checkError) {
      throw checkError;
    }
    
    if (existingItems && existingItems.length > 0) {
      // Product already in cart, update quantity
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: existingItems[0].quantity + 1 })
        .eq('id', existingItems[0].id);
        
      if (updateError) {
        throw updateError;
      }
      
      showToast('Cart updated successfully', 'success');
    } else {
      // Add new product to cart
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert([
          { user_id: userId, product_id: productId, quantity: 1 }
        ]);
        
      if (insertError) {
        throw insertError;
      }
      
      showToast('Product added to cart', 'success');
    }
    
    // Update cart count
    await updateCartCount(supabase, userId);
    
  } catch (error) {
    console.error('Error adding to cart:', error);
    showToast('Failed to add product to cart', 'error');
  }
}

// Add to wishlist
async function addToWishlist(supabase, productId) {
  try {
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showToast('Please login to add items to your wishlist', 'error');
      window.location.href = 'welcome.html';
      return;
    }
    
    const userId = session.user.id;
    
    // Check if product is already in wishlist
    const { data: existingItems, error: checkError } = await supabase
      .from('wishlist_items')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId);
      
    if (checkError) {
      throw checkError;
    }
    
    if (existingItems && existingItems.length > 0) {
      showToast('Product is already in your wishlist', 'info');
      return;
    }
    
    // Add new product to wishlist
    const { error: insertError } = await supabase
      .from('wishlist_items')
      .insert([
        { user_id: userId, product_id: productId }
      ]);
      
    if (insertError) {
      throw insertError;
    }
    
    showToast('Product added to wishlist', 'success');
    
    // Update wishlist count
    await updateWishlistCount(supabase, userId);
    
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    showToast('Failed to add product to wishlist', 'error');
  }
}

// Update cart count
async function updateCartCount(supabase, userId) {
  try {
    // Get cart count from Supabase
    const { data, error, count } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);
      
    if (error) {
      throw error;
    }
    
    // Update cart count in UI
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
      element.textContent = count || 0;
      // Add pulse animation
      element.classList.add('pulse');
      setTimeout(() => {
        element.classList.remove('pulse');
      }, 300);
    });
    
  } catch (error) {
    console.error('Error updating cart count:', error);
  }
}

// Update wishlist count
async function updateWishlistCount(supabase, userId) {
  try {
    // Get wishlist count from Supabase
    const { data, error, count } = await supabase
      .from('wishlist_items')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);
      
    if (error) {
      throw error;
    }
    
    // Update wishlist count in UI
    const wishlistCountElements = document.querySelectorAll('.wishlist-count');
    wishlistCountElements.forEach(element => {
      element.textContent = count || 0;
      // Add pulse animation
      element.classList.add('pulse');
      setTimeout(() => {
        element.classList.remove('pulse');
      }, 300);
    });
    
  } catch (error) {
    console.error('Error updating wishlist count:', error);
  }
}

// Setup logout button
function setupLogoutButton(supabase) {
  const logoutButton = document.getElementById('mobile-logout-btn');
  if (logoutButton) {
    logoutButton.addEventListener('click', async (e) => {
      e.preventDefault();
      await handleLogout(supabase);
    });
  }
}

// Handle logout
async function handleLogout(supabase) {
  try {
    showToast('Logging out...', 'info');
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear all cookies
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Clear local storage
    localStorage.clear();
    
    // Redirect to welcome page
    window.location.href = 'welcome.html';
  } catch (error) {
    console.error('Error during logout:', error);
    showToast('Failed to logout. Please try again.', 'error');
  }
}

// Initialize UI
function initUI() {
  // DOM Elements
  const preloader = document.querySelector('.preloader');
  const customCursor = document.querySelector('.custom-cursor');
  const navbar = document.querySelector('.navbar');
  const menuBtn = document.querySelector('#menu-toggle');
  const mobileMenu = document.querySelector('#mobile-menu');
  const closeMenuBtn = document.querySelector('#close-menu');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
  const backToTopBtn = document.querySelector('.back-to-top');
  const lazyImages = document.querySelectorAll('.lazy-image');
  const animatedItems = document.querySelectorAll('.animate-item');
  
  // Functions
  function hidePreloader() {
    setTimeout(() => {
      if (preloader) {
        preloader.classList.add('hide');
      }
      animateOnScroll();
      showInitialAnimations();
    }, 500);
  }
  
  function updateCustomCursor(e) {
    if (customCursor) {
      customCursor.style.left = `${e.clientX}px`;
      customCursor.style.top = `${e.clientY}px`;
      
      // Scale effect when hovering over clickable elements
      const target = e.target;
      if (target.tagName === 'BUTTON' || 
          target.tagName === 'A' || 
          target.closest('button') || 
          target.closest('a')) {
        customCursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
        customCursor.style.mixBlendMode = 'overlay';
      } else {
        customCursor.style.transform = 'translate(-50%, -50%) scale(1)';
        customCursor.style.mixBlendMode = 'difference';
      }
    }
  }
  
  function handleScroll() {
    // Navbar scroll effect
    if (navbar) {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
    
    // Back to top button visibility
    if (backToTopBtn) {
      if (window.scrollY > 500) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    }
    
    // Animate elements on scroll
    animateOnScroll();
  }
  
  function toggleMobileMenu() {
    if (mobileMenu && menuBtn) {
      mobileMenu.classList.toggle('open');
      menuBtn.classList.toggle('active');
      document.body.classList.toggle('no-scroll');
    }
  }
  
  function closeMobileMenu() {
    if (mobileMenu && menuBtn) {
      mobileMenu.classList.remove('open');
      menuBtn.classList.remove('active');
      document.body.classList.remove('no-scroll');
    }
  }
  
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
  
  function loadLazyImages() {
    if (lazyImages && lazyImages.length) {
      lazyImages.forEach(img => {
        if (img.getAttribute('src') && !img.classList.contains('loaded')) {
          img.classList.add('loaded');
        }
      });
    }
  }
  
  function animateOnScroll() {
    if (animatedItems && animatedItems.length) {
      animatedItems.forEach(item => {
        const itemTop = item.getBoundingClientRect().top;
        const itemBottom = item.getBoundingClientRect().bottom;
        const windowHeight = window.innerHeight;
        
        // Check if item is in viewport
        if (itemTop < windowHeight - 100 && itemBottom > 0) {
          item.classList.add('show');
        }
      });
    }
  }
  
  function showInitialAnimations() {
    // Animate hero section elements with staggered delay
    const heroItems = document.querySelectorAll('.hero .animate-item');
    if (heroItems && heroItems.length) {
      heroItems.forEach((item, index) => {
        setTimeout(() => {
          item.classList.add('show');
        }, 200 * index);
      });
    }
  }
  
  // Add 3D tilt effect to product cards
  function addTiltEffect() {
    const productCards = document.querySelectorAll('.product-card');
    
    if (productCards && productCards.length) {
      productCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
          const cardRect = card.getBoundingClientRect();
          const cardCenterX = cardRect.left + cardRect.width / 2;
          const cardCenterY = cardRect.top + cardRect.height / 2;
          
          const mouseX = e.clientX - cardCenterX;
          const mouseY = e.clientY - cardCenterY;
          
          const rotateY = mouseX * 0.05;
          const rotateX = -mouseY * 0.05;
          
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        });
        
        card.addEventListener('mouseleave', () => {
          card.style.transform = '';
        });
      });
    }
  }
  
  // Event Listeners
  window.addEventListener('load', hidePreloader);
  window.addEventListener('mousemove', updateCustomCursor);
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('scroll', loadLazyImages);
  window.addEventListener('resize', animateOnScroll);
  
  if (menuBtn) {
    menuBtn.addEventListener('click', toggleMobileMenu);
  }
  
  if (closeMenuBtn) {
    closeMenuBtn.addEventListener('click', closeMobileMenu);
  }
  
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', scrollToTop);
  }
  
  if (mobileNavLinks && mobileNavLinks.length) {
    mobileNavLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        // Don't close menu if it's the logout button
        if (this.id !== 'mobile-logout-btn') {
          closeMobileMenu();
        }
      });
    });
  }
  
  // Initialize tilt effect
  setTimeout(addTiltEffect, 1000);
  
  // Add CSS for animations
  (function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .particle {
        position: absolute;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.3);
        pointer-events: none;
        z-index: 0;
      }
      
      @keyframes float {
        0% {
          transform: translateY(0) translateX(0) rotate(0deg);
        }
        25% {
          transform: translateY(-20px) translateX(10px) rotate(90deg);
        }
        50% {
          transform: translateY(0) translateX(20px) rotate(180deg);
        }
        75% {
          transform: translateY(20px) translateX(10px) rotate(270deg);
        }
        100% {
          transform: translateY(0) translateX(0) rotate(360deg);
        }
      }
      
      .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.4);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
      }
      
      @keyframes ripple {
        to {
          transform: scale(2);
          opacity: 0;
        }
      }
      
      .pulse {
        animation: pulse 0.3s ease-in-out;
      }
      
      @keyframes pulse {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.5);
        }
        100% {
          transform: scale(1);
        }
      }
    `;
    document.head.appendChild(style);
  })();
  
  // Load images now that DOM is ready
  loadLazyImages();
}

// Show toast message
function showToast(message, type = 'success') {
  // Remove existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Create toast
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Animate toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Make function available globally
window.showToast = showToast;
// Ensure the preloader is hidden after the page loads
document.addEventListener('DOMContentLoaded', () => {
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    preloader.classList.add('hide'); // Add the 'hide' class to hide the preloader
  }
});
