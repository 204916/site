document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Supabase client
  if (!window.supabase) {
    // Load Supabase JS if not already loaded
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
      console.log('Supabase JS loaded');
      window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      console.log('Supabase client initialized');
      initializeApp();
    };
    document.head.appendChild(script);
  } else {
    // Initialize Supabase client if not already initialized
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase client initialized from existing library');
    initializeApp();
  }
});

function initializeApp() {
  // Initialize UI components
  setupSearchFunctionality();
  setupMobileMenu();
  setupCategoryFilters();
  setupPriceFilter();
  setupRatingFilter();
  setupSortingFunctionality();
  setupPagination();
  setupDarkModeToggle();

  // Fetch products
  fetchProducts().then(() => {
    // Update cart and wishlist counts
    updateCartCount();
    updateWishlistCount();
  });
}

// Global variables
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 8;

// Supabase configuration
const SUPABASE_URL = "https://rpusltqaadfbabzkcull.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwdXNsdHFhYWRmYmFiemtjdWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2MjU4NjAsImV4cCI6MjA1NTIwMTg2MH0.fpiYDehk0F2bLX8TVqGmVB1lIpR8ZgcLKbkPmo6PORk";

// Get current user session
async function getCurrentUser() {
  try {
    // Initialize Supabase client if not already initialized
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return null;
    }
    
    // Ensure we have a supabase client instance
    const supabaseClient = window.supabaseClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    window.supabaseClient = supabaseClient;
    
    // Get the session directly from supabase
    const { data, error } = await supabaseClient.auth.getSession();
    
    if (error) {
      console.error('Error getting auth session:', error);
      return null;
    }
    
    if (!data.session) {
      console.log('No session found, user not logged in');
      return null;
    }
    
    console.log('Current user session found:', data.session);
    return data.session.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null; // Return null if the fetch fails
  }
}

// Setup mobile menu
function setupMobileMenu() {
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenuClose = document.getElementById('mobile-menu-close');
  const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
  
  if (mobileMenuToggle && mobileMenuClose && mobileMenuOverlay) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenuOverlay.classList.add('active');
      document.body.classList.add('no-scroll');
    });
    
    mobileMenuClose.addEventListener('click', () => {
      mobileMenuOverlay.classList.remove('active');
      document.body.classList.remove('no-scroll');
    });
    
    // Close when clicking outside the menu content
    mobileMenuOverlay.addEventListener('click', (e) => {
      if (e.target === mobileMenuOverlay) {
        mobileMenuOverlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
      }
    });
  }
  
  // Back to top button
  const backToTopBtn = document.querySelector('.back-to-top');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    });
    
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
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
    // Search on button click
    searchBtn.addEventListener('click', () => {
      performSearch(searchInput.value);
    });
    
    // Search on Enter key
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch(searchInput.value);
      }
    });
  }
  
  // Check if there's a search query in URL
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('search');
  if (searchQuery) {
    searchInput.value = searchQuery;
    // Will perform search after products are loaded
  }
}

// Perform search on products
function performSearch(query) {
  if (!query.trim()) {
    filteredProducts = [...allProducts];
    displayProductPage(1);
    updateProductCount();
    updatePaginationNumbers();
    return;
  }
  
  query = query.toLowerCase().trim();
  
  filteredProducts = allProducts.filter(product => {
    const name = (product.name || '').toLowerCase();
    const description = (product.description || '').toLowerCase();
    const category = (product.category || '').toLowerCase();
    
    return name.includes(query) || 
           description.includes(query) || 
           category.includes(query);
  });
  
  // Reset to first page
  currentPage = 1;
  
  // Update product count
  updateProductCount();
  
  // Display filtered products
  displayProductPage(currentPage);
  
  // Update pagination
  updatePaginationNumbers();
  
  // Show toast with search results
  showToast(`Found ${filteredProducts.length} products for "${query}"`, 'info');
}

// Fetch products from Supabase
async function fetchProducts() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    
    allProducts = await response.json();
    filteredProducts = [...allProducts];
    
    // Update product count
    updateProductCount();
    
    // Display first page of products
    displayProductPage(currentPage);
    
    // Check if there's a search query in URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery) {
      performSearch(searchQuery);
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    document.getElementById('products-grid').innerHTML = `
      <div class="error-message">
        <p>Failed to load products. Please try again later.</p>
        <button class="btn btn-primary" onclick="fetchProducts()">Retry</button>
      </div>
    `;
  }
}

// Update product count display
function updateProductCount() {
  const countElement = document.getElementById('products-count');
  if (countElement) {
    countElement.textContent = filteredProducts.length;
  }
}

// Display products for current page
function displayProductPage(page) {
  const start = (page - 1) * productsPerPage;
  const end = start + productsPerPage;
  const pageProducts = filteredProducts.slice(start, end);
  
  displayProducts(pageProducts);
  updatePaginationButtons();
}

// Display products in the grid
function displayProducts(products) {
  const productsGrid = document.getElementById('products-grid');
  if (!productsGrid) return;
  
  if (!products || products.length === 0) {
    productsGrid.innerHTML = '<p class="no-products">No products found</p>';
    return;
  }
  
  // Get current wishlist items to properly highlight favorited products
  const wishlistItems = JSON.parse(localStorage.getItem('wishlist') || '[]');
  
  productsGrid.innerHTML = products.map(product => {
    const isInWishlist = wishlistItems.includes(product.id);
    
    return `
      <div class="product-card" data-category="${product.category || ''}" data-id="${product.id}">
        <div class="product-image">
          <a href="product-detail.html?id=${product.id}">
            <img src="${product.image_url || 'https://via.placeholder.com/300x300?text=Product+Image'}" alt="${product.name}">
          </a>
          ${product.is_new ? '<span class="product-tag new">New</span>' : ''}
          ${product.discount > 0 ? `<span class="product-tag sale">-${product.discount}%</span>` : ''}
          <div class="product-actions">
            <button class="product-action-btn wishlist-btn ${isInWishlist ? 'active' : ''}" onclick="toggleWishlist('${product.id}')">
              <i class="fas fa-heart"></i>
            </button>
            <button class="product-action-btn" onclick="quickView('${product.id}')">
              <i class="fas fa-eye"></i>
            </button>
            <button class="product-action-btn add-cart-btn" onclick="addToCart('${product.id}')">
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
          <button class="btn btn-primary btn-full add-to-cart-btn" onclick="addToCart('${product.id}')">Add to Cart</button>
        </div>
      </div>
    `;
  }).join('');
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

// Setup category filters
function setupCategoryFilters() {
  const categoryFiltersElement = document.getElementById('category-filters');
  if (!categoryFiltersElement) return;

  fetch(`${SUPABASE_URL}/rest/v1/products?select=category`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    // Extract unique categories
    const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
    
    // Add categories to filter
    categoryFiltersElement.innerHTML = `
      <button class="category-filter active" data-category="all">All</button>
      ${categories.map(category => `
        <button class="category-filter" data-category="${category}">${category}</button>
      `).join('')}
    `;
    
    // Add event listeners to category filters
    document.querySelectorAll('.category-filter').forEach(button => {
      button.addEventListener('click', () => {
        // Update active class
        document.querySelectorAll('.category-filter').forEach(btn => {
          btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // Filter products
        filterProductsByCategory(button.dataset.category);
      });
    });
  })
  .catch(error => {
    console.error('Error fetching categories:', error);
    categoryFiltersElement.innerHTML = '<p class="error-message">Failed to load categories</p>';
  });
}

// Setup price filter
function setupPriceFilter() {
  const priceRange = document.getElementById('price-range');
  const minPrice = document.getElementById('min-price');
  const maxPrice = document.getElementById('max-price');
  const applyBtn = document.querySelector('.filter-price-btn');
  
  if (!priceRange || !minPrice || !maxPrice || !applyBtn) return;
  
  // Set initial values
  minPrice.value = 0;
  maxPrice.value = priceRange.value = 1000;
  
  // Update max price when slider changes
  priceRange.addEventListener('input', function() {
    maxPrice.value = this.value;
  });
  
  // Update slider when max price changes
  maxPrice.addEventListener('input', function() {
    priceRange.value = this.value;
  });
  
  // Apply price filter
  applyBtn.addEventListener('click', () => {
    filterProductsByPrice(Number(minPrice.value), Number(maxPrice.value));
  });
}

// Setup rating filter
function setupRatingFilter() {
  const ratingCheckboxes = document.querySelectorAll('.rating-option input');
  
  if (!ratingCheckboxes || ratingCheckboxes.length === 0) return;
  
  ratingCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      // Get all checked ratings
      const checkedRatings = Array.from(ratingCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => Number(cb.value));
      
      filterProductsByRating(checkedRatings);
    });
  });
}

// Setup sorting functionality
function setupSortingFunctionality() {
  const sortSelect = document.getElementById('sort-by');
  if (!sortSelect) return;
  
  sortSelect.addEventListener('change', () => {
    const sortValue = sortSelect.value;
    sortProducts(sortValue);
  });
}

// Setup pagination
function setupPagination() {
  const prevBtn = document.querySelector('.pagination-btn.prev');
  const nextBtn = document.querySelector('.pagination-btn.next');
  const paginationNumbers = document.querySelector('.pagination-numbers');
  
  if (!prevBtn || !nextBtn || !paginationNumbers) return;
  
  // Update pagination on page load
  updatePaginationButtons();
  
  // Previous page button
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      displayProductPage(currentPage);
      updatePaginationNumbers();
    }
  });
  
  // Next page button
  nextBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      displayProductPage(currentPage);
      updatePaginationNumbers();
    }
  });
  
  // Create pagination numbers
  updatePaginationNumbers();
}

// Update pagination numbers
function updatePaginationNumbers() {
  const paginationNumbers = document.querySelector('.pagination-numbers');
  if (!paginationNumbers) return;
  
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  
  let numbersHtml = '';
  
  // Determine which page numbers to show
  const visiblePages = [];
  
  // Always include first page, current page, and last page
  visiblePages.push(1);
  if (currentPage > 1 && currentPage < totalPages) {
    visiblePages.push(currentPage);
  }
  if (totalPages > 1) {
    visiblePages.push(totalPages);
  }
  
  // Add one page before and after current if possible
  if (currentPage > 2) {
    visiblePages.push(currentPage - 1);
  }
  if (currentPage < totalPages - 1) {
    visiblePages.push(currentPage + 1);
  }
  
  // Sort and deduplicate
  const uniquePages = [...new Set(visiblePages)].sort((a, b) => a - b);
  
  // Generate HTML
  for (let i = 0; i < uniquePages.length; i++) {
    const pageNum = uniquePages[i];
    
    // Add dots if there's a gap
    if (i > 0 && uniquePages[i] - uniquePages[i-1] > 1) {
      numbersHtml += '<span class="pagination-dots">...</span>';
    }
    
    const isActive = pageNum === currentPage ? 'active' : '';
    numbersHtml += `<button class="pagination-number ${isActive}" data-page="${pageNum}">${pageNum}</button>`;
  }
  
  paginationNumbers.innerHTML = numbersHtml;
  
  // Add click events to page numbers
  document.querySelectorAll('.pagination-number').forEach(button => {
    button.addEventListener('click', () => {
      currentPage = parseInt(button.dataset.page);
      displayProductPage(currentPage);
      updatePaginationNumbers();
    });
  });
}

// Update pagination button states
function updatePaginationButtons() {
  const prevBtn = document.querySelector('.pagination-btn.prev');
  const nextBtn = document.querySelector('.pagination-btn.next');
  if (!prevBtn || !nextBtn) return;
  
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

// Filter products by category
function filterProductsByCategory(category) {
  if (category === 'all') {
    filteredProducts = [...allProducts];
  } else {
    filteredProducts = allProducts.filter(product => product.category === category);
  }
  
  // Reset to first page
  currentPage = 1;
  
  // Update product count
  updateProductCount();
  
  // Update display
  displayProductPage(currentPage);
  updatePaginationNumbers();
}

// Filter products by price
function filterProductsByPrice(min, max) {
  filteredProducts = allProducts.filter(product => {
    const price = product.discount > 0 
      ? calculateDiscountedPrice(product.price, product.discount) 
      : product.price;
    
    return price >= min && price <= max;
  });
  
  // Reset to first page
  currentPage = 1;
  
  // Update product count
  updateProductCount();
  
  // Update display
  displayProductPage(currentPage);
  updatePaginationNumbers();
  
  // Show toast with filter results
  showToast(`Found ${filteredProducts.length} products in price range ₦${min} - ₦${max}`);
}

// Filter products by rating
function filterProductsByRating(ratings) {
  if (ratings.length === 0) {
    // If no ratings selected, show all products
    filteredProducts = [...allProducts];
  } else {
    filteredProducts = allProducts.filter(product => {
      const productRating = Math.floor(product.rating || 0);
      return ratings.some(rating => productRating >= rating);
    });
  }
  
  // Reset to first page
  currentPage = 1;
  
  // Update product count
  updateProductCount();
  
  // Update display
  displayProductPage(currentPage);
  updatePaginationNumbers();
}

// Sort products
function sortProducts(sortBy) {
  switch (sortBy) {
    case 'latest':
      // Assuming products have a 'created_at' field
      filteredProducts.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      break;
    case 'price-low':
      filteredProducts.sort((a, b) => {
        const priceA = a.discount > 0 ? calculateDiscountedPrice(a.price, a.discount) : a.price;
        const priceB = b.discount > 0 ? calculateDiscountedPrice(b.price, b.discount) : b.price;
        return priceA - priceB;
      });
      break;
    case 'price-high':
      filteredProducts.sort((a, b) => {
        const priceA = a.discount > 0 ? calculateDiscountedPrice(a.price, a.discount) : a.price;
        const priceB = b.discount > 0 ? calculateDiscountedPrice(b.price, b.discount) : b.price;
        return priceB - priceA;
      });
      break;
    case 'rating':
      filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    default:
      // Default to latest
      filteredProducts.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }
  
  // Update display (staying on current page)
  displayProductPage(currentPage);
}

// Setup dark mode toggle
function setupDarkModeToggle() {
  // Check for saved theme preference or default to light
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.body.classList.toggle('dark-theme', currentTheme === 'dark');
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

// Update wishlist count
async function updateWishlistCount() {
  try {
    const wishlistCountElements = document.querySelectorAll('.wishlist-count');
    if (!wishlistCountElements || wishlistCountElements.length === 0) return;
    
    // Check if logged in
    const user = await getCurrentUser();
    
    let count = 0;
    
    if (user) {
      // Ensure we have a supabase client instance
      const supabaseClient = window.supabaseClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      window.supabaseClient = supabaseClient;
      
      // Get wishlist items from Supabase
      const { data: wishlistItems, error } = await supabaseClient
        .from('wishlist_items')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching wishlist count:', error);
      } else {
        count = wishlistItems.length;
      }
    } else {
      // Get wishlist from localStorage when not logged in
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      count = wishlist.length;
    }
    
    wishlistCountElements.forEach(element => {
      element.textContent = count;
    });
  } catch (error) {
    console.error('Error updating wishlist count:', error);
  }
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

// Define the quickView function
function quickView(productId) {
  showToast(`Quick view for product ID: ${productId} is not implemented yet.`, 'info');
}

// Export global functions
window.toggleWishlist = toggleWishlist;
window.addToCart = addToCart;
window.quickView = quickView;
window.updateCartCount = updateCartCount;
window.updateWishlistCount = updateWishlistCount;
window.filterProductsByCategory = filterProductsByCategory;
window.filterProductsByPrice = filterProductsByPrice;
window.filterProductsByRating = filterProductsByRating;
window.sortProducts = sortProducts;
window.fetchProducts = fetchProducts;
window.showToast = showToast;
window.performSearch = performSearch;