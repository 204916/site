document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI components
    initUI();
    
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId) {
      // Fetch and display product details
      fetchProductDetails(productId);
      
      // Fetch related products
      fetchRelatedProducts(productId);
    } else {
      // Redirect to products page if no ID is provided
      window.location.href = 'product.html';
    }
    
    // Setup tabs
    setupTabs();
  });
  
  // Supabase configuration
  const SUPABASE_URL = "https://rpusltqaadfbabzkcull.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwdXNsdHFhYWRmYmFiemtjdWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2MjU4NjAsImV4cCI6MjA1NTIwMTg2MH0.fpiYDehk0F2bLX8TVqGmVB1lIpR8ZgcLKbkPmo6PORk";
  
  function initUI() {
    // Show/hide preloader
    const preloader = document.querySelector('.preloader');
    if (preloader) {
      setTimeout(() => {
        preloader.classList.add('hide');
      }, 500);
    }
  
    // Mobile menu functionality
    const menuBtn = document.getElementById('menu-toggle');
    const closeMenuBtn = document.getElementById('close-menu');
    const mobileMenu = document.getElementById('mobile-menu');
  
    if (menuBtn && closeMenuBtn && mobileMenu) {
      menuBtn.addEventListener('click', () => {
        mobileMenu.classList.add('open');
        document.body.classList.add('no-scroll');
      });
  
      closeMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        document.body.classList.remove('no-scroll');
      });
    }
  
    // Back to top button
    const backToTopBtn = document.querySelector('.back-to-top');
    if (backToTopBtn) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
          backToTopBtn.classList.add('show');
        } else {
          backToTopBtn.classList.remove('show');
        }
      });
  
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }
  
    // Custom cursor
    const customCursor = document.querySelector('.custom-cursor');
    if (customCursor) {
      document.addEventListener('mousemove', (e) => {
        customCursor.style.left = `${e.clientX}px`;
        customCursor.style.top = `${e.clientY}px`;
      });
    }
    
    // Search toggle functionality
    const searchToggle = document.getElementById('search-toggle');
    const searchContainer = document.querySelector('.search-container');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    if (searchToggle && searchContainer) {
      // Initially hide search container
      searchContainer.style.display = 'none';
      
      searchToggle.addEventListener('click', () => {
        if (searchContainer.style.display === 'none') {
          searchContainer.style.display = 'block';
          searchInput.focus();
        } else {
          searchContainer.style.display = 'none';
        }
      });
    }
    
    if (searchBtn && searchInput) {
      searchBtn.addEventListener('click', () => {
        if (searchInput.value.trim()) {
          window.location.href = `product.html?search=${encodeURIComponent(searchInput.value.trim())}`;
        }
      });
      
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
          window.location.href = `product.html?search=${encodeURIComponent(searchInput.value.trim())}`;
        }
      });
    }
  }
  
  // Fetch product details
  async function fetchProductDetails(productId) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${productId}&select=*`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }
      
      const products = await response.json();
      
      if (products.length === 0) {
        throw new Error('Product not found');
      }
      
      const product = products[0];
      displayProductDetails(product);
      updateTabContent(product);
      
      // Update page title
      document.title = `${product.name} - E-Mall`;
      
      // Update breadcrumb
      document.getElementById('product-name-breadcrumb').textContent = product.name;
  
      // Update cart count
      updateCartCount();
    } catch (error) {
      console.error('Error fetching product details:', error);
      document.getElementById('product-detail').innerHTML = `
        <div class="error-message">
          <p>Failed to load product details. Please try again later.</p>
          <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
        </div>
      `;
    }
  }
  
  // Display product details
  function displayProductDetails(product) {
    const productDetail = document.getElementById('product-detail');
    
    productDetail.innerHTML = `
      <div class="product-detail-left">
        <div class="product-detail-image">
          <img src="${product.image_url || 'https://via.placeholder.com/500x500?text=Product+Image'}" alt="${product.name}">
          ${product.is_new ? '<span class="product-tag new">New</span>' : ''}
          ${product.discount > 0 ? `<span class="product-tag sale">-${product.discount}%</span>` : ''}
        </div>
        <div class="product-thumbnails">
          <div class="product-thumbnail active">
            <img src="${product.image_url || 'https://via.placeholder.com/100x100?text=Thumbnail'}" alt="Thumbnail 1">
          </div>
          ${product.gallery ? product.gallery.map((img, index) => `
            <div class="product-thumbnail">
              <img src="${img}" alt="Thumbnail ${index + 2}">
            </div>
          `).join('') : ''}
        </div>
      </div>
      <div class="product-detail-right">
        <h1 class="product-detail-title">${product.name}</h1>
        <div class="product-detail-meta">
          <div class="product-detail-rating">
            ${getStarRating(product.rating || 0)}
            <span>(${product.review_count || 0} reviews)</span>
          </div>
          <div class="product-detail-sku">SKU: ${product.sku || 'N/A'}</div>
          <div class="product-detail-availability">${product.stock > 0 ? `<span class="in-stock">In Stock (${product.stock})</span>` : '<span class="out-of-stock">Out of Stock</span>'}</div>
        </div>
        <div class="product-detail-prices">
          ${product.discount > 0 ? 
            `<span class="current-price">₦${calculateDiscountedPrice(product.price, product.discount).toFixed(2)}</span>
             <span class="old-price">₦${product.price.toFixed(2)}</span>` : 
            `<span class="current-price">₦${product.price.toFixed(2)}</span>`
          }
        </div>
        <div class="product-detail-short-description">
          ${product.short_description || product.description?.substring(0, 150) + '...' || 'No description available'}
        </div>
        <div class="product-detail-actions">
          <div class="quantity-selector">
            <button class="quantity-btn minus">-</button>
            <input type="number" value="1" min="1" class="quantity-input" id="product-quantity">
            <button class="quantity-btn plus">+</button>
          </div>
          <button class="btn btn-primary add-to-cart-btn" data-id="${product.id}" ${product.stock <= 0 ? 'disabled' : ''}>
            <i class="fas fa-shopping-cart"></i> Add to Cart
          </button>
          <button class="btn btn-outline wishlist-btn" data-id="${product.id}">
            <i class="fas fa-heart"></i>
          </button>
        </div>
        <div class="product-detail-categories">
          <span>Category:</span>
          <a href="product.html?category=${product.category}" class="category-link">${product.category || 'Uncategorized'}</a>
        </div>
        <div class="product-detail-share">
          <span>Share:</span>
          <div class="social-share">
            <a href="#" class="share-link"><i class="fab fa-facebook-f"></i></a>
            <a href="#" class="share-link"><i class="fab fa-twitter"></i></a>
            <a href="#" class="share-link"><i class="fab fa-pinterest"></i></a>
            <a href="#" class="share-link"><i class="fab fa-instagram"></i></a>
          </div>
        </div>
      </div>
    `;
    
    // Setup quantity buttons
    const quantityInput = document.querySelector('.quantity-input');
    
    document.querySelector('.minus').addEventListener('click', () => {
      if (parseInt(quantityInput.value) > 1) {
        quantityInput.value = parseInt(quantityInput.value) - 1;
      }
    });
    
    document.querySelector('.plus').addEventListener('click', () => {
      quantityInput.value = parseInt(quantityInput.value) + 1;
    });
    
    // Setup add to cart button
    document.querySelector('.add-to-cart-btn').addEventListener('click', function() {
      const productId = this.dataset.id;
      const quantity = parseInt(document.getElementById('product-quantity').value);
      addToCart(productId, quantity);
    });
    
    // Setup wishlist button
    document.querySelector('.wishlist-btn').addEventListener('click', function() {
      const productId = this.dataset.id;
      addToWishlist(productId);
      toggleWishlistButton(this);
    });
    
    // Check if product is in wishlist
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    if (wishlist.includes(product.id)) {
      const wishlistBtn = document.querySelector('.wishlist-btn');
      toggleWishlistButton(wishlistBtn);
    }
    
    // Setup product thumbnails
    setupProductThumbnails();
  }
  
  // Setup product thumbnails
  function setupProductThumbnails() {
    const thumbnails = document.querySelectorAll('.product-thumbnail');
    const mainImage = document.querySelector('.product-detail-image img');
    
    thumbnails.forEach(thumbnail => {
      thumbnail.addEventListener('click', function() {
        // Remove active class from all thumbnails
        thumbnails.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked thumbnail
        this.classList.add('active');
        
        // Update main image
        const thumbnailImg = this.querySelector('img');
        mainImage.src = thumbnailImg.src;
      });
    });
  }
  
  // Update tab content
  function updateTabContent(product) {
    // Description tab
    document.getElementById('description').innerHTML = `
      <div class="tab-content-inner">
        <p>${product.description || 'No detailed description available for this product.'}</p>
      </div>
    `;
    
    // Specification tab
    const specs = product.specifications || {};
    document.getElementById('specification').innerHTML = `
      <div class="tab-content-inner">
        <table class="specs-table">
          <tbody>
            ${Object.entries(specs).map(([key, value]) => `
              <tr>
                <th>${key}</th>
                <td>${value}</td>
              </tr>
            `).join('') || '<tr><td colspan="2">No specifications available for this product.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
    
    // Reviews tab
    const reviews = product.reviews || [];
    document.getElementById('reviews').innerHTML = `
      <div class="tab-content-inner">
        <div class="reviews-summary">
          <div class="reviews-average">
            <div class="average-rating">${product.rating?.toFixed(1) || '0.0'}</div>
            <div class="average-stars">${getStarRating(product.rating || 0)}</div>
            <div class="total-reviews">${product.review_count || 0} Reviews</div>
          </div>
          <div class="reviews-breakdown">
            <!-- In a real application, you'd have a breakdown of 5-star, 4-star, etc. -->
          </div>
        </div>
        <div class="reviews-list">
          ${reviews.length > 0 ? reviews.map(review => `
            <div class="review-item">
              <div class="review-header">
                <div class="review-author">${review.author || 'Anonymous'}</div>
                <div class="review-rating">${getStarRating(review.rating || 0)}</div>
                <div class="review-date">${new Date(review.date).toLocaleDateString()}</div>
              </div>
              <div class="review-content">
                <p>${review.content || 'No comment'}</p>
              </div>
            </div>
          `).join('') : '<p class="no-reviews">This product has no reviews yet. Be the first to leave a review!</p>'}
        </div>
        <div class="review-form">
          <h3>Add a Review</h3>
          <form id="review-form">
            <div class="form-group">
              <label for="review-name">Name</label>
              <input type="text" id="review-name" required>
            </div>
            <div class="form-group">
              <label for="review-email">Email</label>
              <input type="email" id="review-email" required>
            </div>
            <div class="form-group">
              <label>Rating</label>
              <div class="rating-select">
                <i class="far fa-star" data-rating="1"></i>
                <i class="far fa-star" data-rating="2"></i>
                <i class="far fa-star" data-rating="3"></i>
                <i class="far fa-star" data-rating="4"></i>
                <i class="far fa-star" data-rating="5"></i>
              </div>
              <input type="hidden" id="review-rating" value="0" required>
            </div>
            <div class="form-group">
              <label for="review-content">Your Review</label>
              <textarea id="review-content" rows="5" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Submit Review</button>
          </form>
        </div>
      </div>
    `;
    
    // Setup rating select
    setupRatingSelect();
    
    // Setup review form
    setupReviewForm(product.id);
  }
  
  // Setup rating select
  function setupRatingSelect() {
    const stars = document.querySelectorAll('.rating-select i');
    const ratingInput = document.getElementById('review-rating');
    
    stars.forEach(star => {
      star.addEventListener('mouseover', function() {
        const rating = parseInt(this.dataset.rating);
        
        // Update stars on hover
        stars.forEach((s, index) => {
          if (index < rating) {
            s.classList.remove('far');
            s.classList.add('fas');
          } else {
            s.classList.remove('fas');
            s.classList.add('far');
          }
        });
      });
      
      star.addEventListener('mouseout', function() {
        const currentRating = parseInt(ratingInput.value);
        
        // Restore selected rating when not hovering
        stars.forEach((s, index) => {
          if (index < currentRating) {
            s.classList.remove('far');
            s.classList.add('fas');
          } else {
            s.classList.remove('fas');
            s.classList.add('far');
          }
        });
      });
      
      star.addEventListener('click', function() {
        const rating = parseInt(this.dataset.rating);
        ratingInput.value = rating;
        
        // Update stars on click
        stars.forEach((s, index) => {
          if (index < rating) {
            s.classList.remove('far');
            s.classList.add('fas');
          } else {
            s.classList.remove('fas');
            s.classList.add('far');
          }
        });
      });
    });
  }
  
  // Setup review form
  function setupReviewForm(productId) {
    const reviewForm = document.getElementById('review-form');
    
    reviewForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      const name = document.getElementById('review-name').value;
      const email = document.getElementById('review-email').value;
      const rating = parseInt(document.getElementById('review-rating').value);
      const content = document.getElementById('review-content').value;
      
      if (rating === 0) {
        alert('Please select a rating');
        return;
      }
      
      // In a real application, you'd send this to your backend
      console.log('Review submitted:', { productId, name, email, rating, content });
      
      // Show success message
      showToast('Your review has been submitted and is pending approval. Thank you!');
      
      // Reset form
      reviewForm.reset();
      document.querySelectorAll('.rating-select i').forEach(star => {
        star.classList.remove('fas');
        star.classList.add('far');
      });
      document.getElementById('review-rating').value = 0;
    });
  }
  
  // Setup tabs
  function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        this.classList.add('active');
        
        // Hide all tab panes
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Show selected tab pane
        const tabId = this.dataset.tab;
        document.getElementById(tabId).classList.add('active');
      });
    });
  }
  
  // Fetch related products
  async function fetchRelatedProducts(productId) {
    try {
      // First, get the current product to get its category
      const productResponse = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${productId}&select=category`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (!productResponse.ok) {
        throw new Error('Failed to fetch product category');
      }
      
      const productData = await productResponse.json();
      
      if (productData.length === 0) {
        throw new Error('Product not found');
      }
      
      const category = productData[0].category;
      
      // Then, fetch products in the same category, excluding the current product
      const relatedResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/products?category=eq.${category}&id=neq.${productId}&select=*&limit=4`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (!relatedResponse.ok) {
        throw new Error('Failed to fetch related products');
      }
      
      const relatedProducts = await relatedResponse.json();
      displayRelatedProducts(relatedProducts);
    } catch (error) {
      console.error('Error fetching related products:', error);
      document.getElementById('related-products').innerHTML = '<p>Failed to load related products.</p>';
    }
  }
  
  // Display related products
  function displayRelatedProducts(products) {
    const relatedProductsContainer = document.getElementById('related-products');
    
    if (!products || products.length === 0) {
      relatedProductsContainer.innerHTML = '<p>No related products found.</p>';
      return;
    }
    
    relatedProductsContainer.innerHTML = products.map(product => `
      <div class="product-card">
        <div class="product-image">
          <a href="product-detail.html?id=${product.id}">
            <img src="${product.image_url || 'https://via.placeholder.com/300x300?text=Product+Image'}" alt="${product.name}">
          </a>
          ${product.is_new ? '<span class="product-tag new">New</span>' : ''}
          ${product.discount > 0 ? `<span class="product-tag sale">-${product.discount}%</span>` : ''}
          <div class="product-actions">
            <button class="product-action-btn" onclick="addToWishlist('${product.id}')">
              <i class="fas fa-heart"></i>
            </button>
            <button class="product-action-btn" onclick="window.location.href='product-detail.html?id=${product.id}'">
              <i class="fas fa-eye"></i>
            </button>
            <button class="product-action-btn" onclick="addToCart('${product.id}')">
              <i class="fas fa-shopping-cart"></i>
            </button>
          </div>
        </div>
        <div class="product-content">
          <div class="product-meta">
            <span class="product-category">${product.category || 'Uncategorized'}</span>
            <div class="product-rating">
              ${getStarRating(product.rating || 0)}
              <span>(${product.review_count || 0})</span>
            </div>
          </div>
          <h3 class="product-title">
            <a href="product-detail.html?id=${product.id}">${product.name}</a>
          </h3>
          <div class="product-prices">
            ${product.discount > 0 ? 
              `<span class="current-price">₦${calculateDiscountedPrice(product.price, product.discount).toFixed(2)}</span>
               <span class="old-price">₦${product.price.toFixed(2)}</span>` : 
              `<span class="current-price">₦${product.price.toFixed(2)}</span>`
            }
          </div>
          <button class="btn btn-primary btn-full" onclick="addToCart('${product.id}')">Add to Cart</button>
        </div>
      </div>
    `).join('');
  }
  
  // Toggle wishlist status
async function toggleWishlist(productId) {
  try {
    // Get current wishlist from localStorage
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    let isAdding = !wishlist.includes(productId);
    
    // Check if user is logged in
    const user = await getCurrentUser();
    
    if (user) {
      if (isAdding) {
        // Add to Supabase wishlist
        const { error } = await window.supabaseClient
          .from('wishlist_items')
          .insert({
            user_id: user.id,
            product_id: productId
          });
        
        if (error) {
          console.error('Error adding to wishlist:', error);
          throw new Error('Failed to add product to wishlist');
        }
      } else {
        // Remove from Supabase wishlist
        const { error } = await window.supabaseClient
          .from('wishlist_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        
        if (error) {
          console.error('Error removing from wishlist:', error);
          throw new Error('Failed to remove product from wishlist');
        }
      }
    }
    
    // Update localStorage wishlist for all users
    if (isAdding) {
      // Add to wishlist
      wishlist.push(productId);
      showToast('Product added to wishlist!');
      
      // Toggle active class on button if it exists
      const wishlistBtn = document.querySelector(`.product-card[data-id="${productId}"] .wishlist-btn`);
      if (wishlistBtn) {
        wishlistBtn.classList.add('active');
      }
    } else {
      // Remove from wishlist
      wishlist = wishlist.filter(id => id !== productId);
      showToast('Product removed from wishlist!');
      
      // Toggle active class on button if it exists
      const wishlistBtn = document.querySelector(`.product-card[data-id="${productId}"] .wishlist-btn`);
      if (wishlistBtn) {
        wishlistBtn.classList.remove('active');
      }
    }
    
    // Update localStorage
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    
    // Update wishlist count
    updateWishlistCount();
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    showToast('Failed to update wishlist', 'error');
  }
}

// Add to cart function
async function addToCart(productId) {
  try {
    // Get product details first
    const productResponse = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${productId}&select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!productResponse.ok) {
      throw new Error('Failed to fetch product details');
    }
    
    const productData = await productResponse.json();
    if (!productData || productData.length === 0) {
      throw new Error('Product not found');
    }
    
    const product = productData[0];
    
    // Get current user session
    const user = await getCurrentUser();
    
    if (user) {
      console.log('User authenticated:', user.id);
      
      // Ensure we have a supabase client instance
      const supabaseClient = window.supabaseClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      window.supabaseClient = supabaseClient;
      
      // Check if item already in cart using the supabase client
      const { data: existingItems, error: checkError } = await supabaseClient
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId);
      
      if (checkError) {
        console.error('Error checking cart:', checkError);
        throw new Error('Failed to check if product is in cart');
      }
      
      console.log('Existing items in cart:', existingItems);
      
      if (existingItems && existingItems.length > 0) {
        // Update quantity
        const existingItem = existingItems[0];
        const newQuantity = existingItem.quantity + 1;
        
        console.log('Updating quantity for item:', existingItem.id, 'to', newQuantity);
        
        const { error: updateError } = await supabaseClient
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id);
        
        if (updateError) {
          console.error('Error updating cart:', updateError);
          throw new Error('Failed to update cart item quantity');
        }
        
        console.log('Item quantity updated successfully');
        showToast(`${product.name} quantity updated in cart!`);
      } else {
        // Add new item
        console.log('Adding new item to cart:', {
          user_id: user.id,
          product_id: productId,
          quantity: 1
        });
        
        const { error: insertError } = await supabaseClient
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity: 1
          });
        
        if (insertError) {
          console.error('Error adding to cart:', insertError);
          throw new Error('Failed to add item to cart');
        }
        
        console.log('Item added to cart successfully');
        showToast(`${product.name} added to cart!`);
      }
    } else {
      console.log('User not logged in, storing in localStorage only');
      showToast(`${product.name} added to cart!`);
    }
    
    // Always update localStorage cart for fallback and offline use
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if product already in cart
    const existingItemIndex = cart.findIndex(item => item.id === productId);
    
    if (existingItemIndex >= 0) {
      // Update quantity
      cart[existingItemIndex].quantity += 1;
    } else {
      // Add new item
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        discount: product.discount || 0,
        image: product.image_url,
        quantity: 1
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count
    updateCartCount();
    
    return true;
  } catch (error) {
    console.error('Error adding to cart:', error);
    showToast('Failed to add product to cart', 'error');
    return false;
  }
}

// Update cart count
async function updateCartCount() {
  try {
    const cartCountElements = document.querySelectorAll('.cart-count');
    if (!cartCountElements || cartCountElements.length === 0) return;
    
    // Check if logged in
    const user = await getCurrentUser();
    
    let count = 0;
    
    if (user) {
      // Ensure we have a supabase client instance
      const supabaseClient = window.supabaseClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      window.supabaseClient = supabaseClient;
      
      // Get cart items from Supabase
      const { data: cartItems, error } = await supabaseClient
        .from('cart_items')
        .select('quantity')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching cart items:', error);
      } else if (cartItems) {
        count = cartItems.reduce((acc, item) => acc + item.quantity, 0);
      }
    } else {
      // Get cart from localStorage when not logged in
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      count = cart.reduce((acc, item) => acc + item.quantity, 0);
    }
    
    cartCountElements.forEach(countElement => {
      countElement.textContent = count;
    });
  } catch (error) {
    console.error('Error updating cart count:', error);
  }
}
  
  // Generate star rating HTML
  function getStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '';
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      starsHtml += '<i class="fas fa-star"></i>';
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
      starsHtml += '<i class="far fa-star"></i>';
    }
    
    return starsHtml;
  }
  
  // Calculate discounted price
  function calculateDiscountedPrice(price, discount) {
    return price - (price * (discount / 100));
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
  
  // Initialize cart and wishlist counts on page load
  document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    updateWishlistCount();
  });
