// Initialize Supabase client
const SUPABASE_URL = "https://rpusltqaadfbabzkcull.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwdXNsdHFhYWRmYmFiemtjdWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2MjU4NjAsImV4cCI6MjA1NTIwMTg2MH0.fpiYDehk0F2bLX8TVqGmVB1lIpR8ZgcLKbkPmo6PORk";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// DOM elements
const userNameElement = document.getElementById('user-name');
const mobileUserNameElement = document.getElementById('mobile-user-name');
const userBalanceElement = document.getElementById('user-balance');
const logoutButton = document.getElementById('logout-btn');
const mobileLogoutButton = document.getElementById('mobile-logout-btn');
const advertForm = document.getElementById('advert-form');
const formMessage = document.getElementById('form-message');
const advertsContainer = document.getElementById('adverts-container');
const cartCountElement = document.getElementById('cart-count');
const mobileCartCountElement = document.getElementById('mobile-cart-count');
const wishlistCountElement = document.getElementById('wishlist-count');
const mobileWishlistCountElement = document.getElementById('mobile-wishlist-count');
const userIcon = document.getElementById('user-icon');
const userDropdown = document.querySelector('.user-dropdown');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mobileMenuClose = document.getElementById('mobile-menu-close');
const mobileMenu = document.getElementById('mobile-menu');

// Variables
let currentUser = null;
let userProfile = null;
let advertsChannel = null;
let viewedAdvertIds = new Set(); // Track adverts that the user has already viewed
let viewTimeouts = {}; // Track timeouts for view duration tracking

// Minimum time in milliseconds that an ad must be visible to count as a view
const MIN_VIEW_TIME = 2000; // 2 seconds, similar to Instagram's approach

// Intersection Observer to detect when adverts come into view
let observer = null;

// Check if user is authenticated
async function checkAuth() {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error checking auth status:', error);
    return;
  }
  
  if (data.session) {
    currentUser = data.session.user;
    await fetchUserProfile();
    await fetchCartCount();
    await fetchWishlistCount();
    updateUI();
    
    // Set up the observer now that we have a user
    setupIntersectionObserver();
  } else {
    // Redirect to login page if not authenticated
    window.location.href = 'home.html';
  }
}

// Set up Intersection Observer to detect when adverts come into view
function setupIntersectionObserver() {
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const advertId = parseInt(entry.target.dataset.id);
      const isUserAd = entry.target.classList.contains('user-ad');
      
      if (entry.isIntersecting) {
        // Start timer when ad comes into view
        if (currentUser && !isUserAd && !viewedAdvertIds.has(advertId)) {
          // Clear any existing timeout for this ad
          if (viewTimeouts[advertId]) {
            clearTimeout(viewTimeouts[advertId]);
          }
          
          // Set a new timeout - only count view after MIN_VIEW_TIME
          viewTimeouts[advertId] = setTimeout(() => {
            recordAdvertView(advertId);
            viewedAdvertIds.add(advertId); // Mark as viewed
            delete viewTimeouts[advertId]; // Clean up timeout reference
          }, MIN_VIEW_TIME);
        }
      } else {
        // Ad went out of view before minimum time - clear the timeout
        if (viewTimeouts[advertId]) {
          clearTimeout(viewTimeouts[advertId]);
          delete viewTimeouts[advertId];
        }
      }
    });
  }, { threshold: 0.5 }); // At least 50% visible
}

// Fetch user profile from Supabase
async function fetchUserProfile() {
  if (!currentUser) return;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();
  
  if (error) {
    console.error('Error fetching user profile:', error);
    return;
  }
  
  userProfile = data;
}

// Fetch cart count
async function fetchCartCount() {
  if (!currentUser) return;
  
  const { count, error } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', currentUser.id);
  
  if (error) {
    console.error('Error fetching cart count:', error);
    return;
  }
  
  const countValue = count || 0;
  if (cartCountElement) cartCountElement.textContent = countValue;
  if (mobileCartCountElement) mobileCartCountElement.textContent = countValue;
}

// Fetch wishlist count
async function fetchWishlistCount() {
  if (!currentUser) return;
  
  const { count, error } = await supabase
    .from('wishlist_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', currentUser.id);
  
  if (error) {
    console.error('Error fetching wishlist count:', error);
    return;
  }
  
  const countValue = count || 0;
  if (wishlistCountElement) wishlistCountElement.textContent = countValue;
  if (mobileWishlistCountElement) mobileWishlistCountElement.textContent = countValue;
}

// Update UI with user data
function updateUI() {
  if (userProfile) {
    const displayName = userProfile.full_name || userProfile.email || 'User';
    if (userNameElement) userNameElement.textContent = displayName;
    if (mobileUserNameElement) mobileUserNameElement.textContent = displayName;
    
    if (userBalanceElement) {
      userBalanceElement.textContent = userProfile.balance ? userProfile.balance.toLocaleString('en-NG') : '0.00';
    }
  }
}

// Fetch advertisements from Supabase
async function fetchAdvertisements() {
  try {
    console.log('Fetching advertisements...');
    
    // First get all approved ads that haven't expired
    const { data: approvedAds, error: approvedError } = await supabase
      .from('advertise')
      .select('*')
      .eq('is_approved', true)
      .gt('expiry_date', new Date().toISOString())
      .order('display_priority', { ascending: false })
      .order('date_created', { ascending: false });
    
    if (approvedError) {
      console.error('Error fetching approved advertisements:', approvedError);
      return;
    }
    
    // Then get user's own ads if they're logged in
    let userAds = [];
    if (currentUser) {
      const { data: myAds, error: myAdsError } = await supabase
        .from('advertise')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date_created', { ascending: false });
      
      if (myAdsError) {
        console.error('Error fetching user advertisements:', myAdsError);
      } else {
        userAds = myAds || [];
      }
    }
    
    // Combine and deduplicate ads
    const combinedAds = [...approvedAds];
    
    // Add user ads that aren't already in the approved list
    userAds.forEach(userAd => {
      if (!combinedAds.some(ad => ad.id === userAd.id)) {
        combinedAds.push(userAd);
      }
    });
    
    console.log(`Found ${combinedAds.length} advertisements`);
    displayAdvertisements(combinedAds);
  } catch (error) {
    console.error('Error in fetchAdvertisements:', error);
  }
}

// Display advertisements in the UI
function displayAdvertisements(adverts) {
  if (!advertsContainer) return;
  
  // Remove any existing observers
  if (observer) {
    document.querySelectorAll('.advert-card').forEach(ad => {
      observer.unobserve(ad);
    });
  }
  
  advertsContainer.innerHTML = '';
  
  if (!adverts || adverts.length === 0) {
    advertsContainer.innerHTML = `
      <div class="no-adverts">
        <p>No advertisements to display.</p>
        <p>Be the first to advertise your product or service!</p>
      </div>
    `;
    return;
  }
  
  adverts.forEach(advert => {
    const isUserAd = currentUser && advert.user_id === currentUser.id;
    const isPremiumTier = advert.tier === 'ultra';
    const expiryDate = new Date(advert.expiry_date);
    const now = new Date();
    const isExpired = expiryDate < now;
    
    const advertElement = document.createElement('div');
    advertElement.className = `advert-card ${isUserAd ? 'user-ad' : ''} ${isExpired ? 'expired' : ''}`;
    advertElement.dataset.id = advert.id;
    
    let statusLabel = '';
    if (isUserAd) {
      if (!advert.is_approved && !isExpired) {
        statusLabel = '<span class="status pending">Pending Approval</span>';
      } else if (isExpired) {
        statusLabel = '<span class="status expired">Expired</span>';
      } else {
        statusLabel = '<span class="status active">Active</span>';
      }
    }
    
    const contactSection = isPremiumTier && advert.contact_email && advert.is_approved 
      ? `<div class="advert-contact">Contact: ${advert.contact_email}</div>` 
      : '';
    
    const imageSection = advert.image_url 
      ? `<img src="${advert.image_url}" alt="${advert.title}" class="advert-image">` 
      : '';
    
    // Format view count to be more social media like
    const viewCount = advert.view_count || 0;
    const formattedViewCount = formatViewCount(viewCount);
    
    advertElement.innerHTML = `
      <div class="advert-header">
        ${statusLabel}
        <h3 class="advert-title">${advert.title}</h3>
        <div class="view-count">
          <i class="fas fa-eye"></i> <span class="view-number" data-raw-count="${viewCount}">${formattedViewCount}</span>
        </div>
      </div>
      ${imageSection}
      <div class="advert-content">${advert.content}</div>
      ${contactSection}
      <div class="advert-meta">
        <span>Tier: ${getTierName(advert.tier)}</span>
        <span>Expires: ${formatDate(advert.expiry_date)}</span>
      </div>
    `;
    
    advertsContainer.appendChild(advertElement);
    
    // Start observing this advert for visibility if not the user's own
    if (!isUserAd && !isExpired && advert.is_approved && observer) {
      observer.observe(advertElement);
    }
  });
}

// Format view count for display in social media style
function formatViewCount(count) {
  if (count < 1000) {
    return count.toString(); // Show exact number for small counts
  } else if (count < 1000000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K'; // e.g., 5.1K
  } else {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'; // e.g., 2.4M
  }
}

// Record view for an advertisement
async function recordAdvertView(advertId) {
  try {
    console.log(`Recording view for advert ${advertId}`);
    
    if (!currentUser) {
      console.log('Cannot record view: User not logged in');
      return;
    }
    
    // Call the increment_advert_view function with user ID
    const { data, error } = await supabase.rpc('increment_advert_view', {
      advert_id: advertId,
      viewer_id: currentUser.id
    });
    
    if (error) {
      console.error('Error recording view:', error);
      return;
    }
    
    console.log(`View recorded for advert ${advertId}. New count: ${data}`);
    
    // Update view count in UI immediately
    updateAdvertViewCount(advertId, data);
  } catch (error) {
    console.error('Error recording view:', error);
  }
}

// Update view count in UI
function updateAdvertViewCount(advertId, newCount) {
  const advertElement = document.querySelector(`.advert-card[data-id="${advertId}"]`);
  
  if (advertElement) {
    const viewCountElement = advertElement.querySelector('.view-number');
    if (viewCountElement) {
      // Store the raw count as a data attribute for future reference
      viewCountElement.setAttribute('data-raw-count', newCount);
      // Display the formatted count
      viewCountElement.textContent = formatViewCount(newCount);
    }
  }
}

// Get tier name from tier value
function getTierName(tier) {
  switch (tier) {
    case 'free': return 'Free';
    case 'basic': return 'Basic';
    case 'premium': return 'Premium';
    case 'ultra': return 'Ultra Premium';
    default: return 'Unknown';
  }
}

// Get tier cost from tier value
function getTierCost(tier) {
  switch (tier) {
    case 'free': return 0;
    case 'basic': return 3000;
    case 'premium': return 7000;
    case 'ultra': return 10000;
    default: return 0;
  }
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-NG', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Handle advertisement form submission
async function handleAdvertSubmit(event) {
  event.preventDefault();
  
  if (!currentUser) {
    showMessage('You must be logged in to place an advertisement.', 'error');
    return;
  }
  
  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();
  const contactEmail = document.getElementById('contact-email').value.trim();
  const imageUrl = document.getElementById('image-url').value.trim();
  const tierRadios = document.querySelector('input[name="tier"]:checked');
  
  if (!title || !content) {
    showMessage('Please fill in all required fields.', 'error');
    return;
  }
  
  if (!tierRadios) {
    showMessage('Please select a tier.', 'error');
    return;
  }
  
  const tier = tierRadios.value;
  
  // Check if user has sufficient balance for selected tier
  const tierCost = getTierCost(tier);
  if (userProfile.balance < tierCost) {
    showMessage(`Insufficient balance. You need ₦${tierCost.toLocaleString('en-NG')} for this tier.`, 'error');
    return;
  }
  
  try {
    // Show loading message
    showMessage('Processing your advertisement...', 'info');
    
    // Call database functions for expiry date and display priority
    const { data: expiryData, error: expiryError } = await supabase.rpc('calculate_expiry_date', { tier });
    if (expiryError) throw expiryError;
    
    const { data: priorityData, error: priorityError } = await supabase.rpc('calculate_display_priority', { tier });
    if (priorityError) throw priorityError;
    
    // Prepare advertisement data
    const advertData = {
      user_id: currentUser.id,
      title,
      content,
      contact_email: contactEmail || null,
      image_url: imageUrl || null,
      tier,
      expiry_date: expiryData,
      display_priority: priorityData,
      is_approved: tier === 'free', // Auto-approve free tier for demo purposes
      viewed_by: [], // Empty array of users who viewed this ad
      view_count: 0 // Initialize view count to zero
    };
    
    // Submit to Supabase
    const { data, error } = await supabase
      .from('advertise')
      .insert(advertData)
      .select();
    
    if (error) throw error;
    
    // Show success message and reset form
    showMessage('Advertisement placed successfully!', 'success');
    if (advertForm) {
      advertForm.reset();
    }
    
    // Refresh user profile to get updated balance
    await fetchUserProfile();
    updateUI();
    
    // The new advertisement will be shown via the realtime subscription
  } catch (error) {
    console.error('Error submitting advertisement:', error);
    showMessage('Error placing advertisement: ' + error.message, 'error');
  }
}

// Show form message (success, error, info)
function showMessage(message, type) {
  if (!formMessage) return;
  
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
  
  // Hide message after 5 seconds
  setTimeout(() => {
    formMessage.textContent = '';
    formMessage.className = 'form-message';
  }, 5000);
}

// Handle logout
async function handleLogout() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error logging out:', error);
      return;
    }
    
    window.location.href = 'home.html';
  } catch (error) {
    console.error('Error during logout:', error);
  }
}

// Set up realtime subscription for advertisement changes
function setupRealtimeSubscription() {
  advertsChannel = supabase
    .channel('adverts-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'advertise' },
      (payload) => {
        console.log('Advertisement change detected:', payload);
        
        // If this is a view count update, just update that specific element
        if (payload.eventType === 'UPDATE' && 
            payload.new && payload.old && 
            payload.new.view_count !== payload.old.view_count) {
          
          updateAdvertViewCount(payload.new.id, payload.new.view_count);
        } else {
          // For other changes, refresh the full list
          fetchAdvertisements();
        }
      }
    )
    .subscribe();
  
  console.log('Realtime subscription set up for advertisements');
  return advertsChannel;
}

// Toggle user dropdown
function toggleUserDropdown() {
  if (userDropdown) {
    userDropdown.classList.toggle('show');
  }
}

// Toggle mobile menu
function toggleMobileMenu() {
  if (mobileMenu) {
    mobileMenu.classList.toggle('show');
  }
}

// Close dropdown when clicking outside
function handleOutsideClick(event) {
  if (userIcon && userDropdown && !userIcon.contains(event.target) && !userDropdown.contains(event.target)) {
    userDropdown.classList.remove('show');
  }
}

// Clean up function for page unload
function cleanupResources() {
  // Clear all view timeouts
  Object.keys(viewTimeouts).forEach(id => {
    clearTimeout(viewTimeouts[id]);
  });
  
  // Remove realtime subscription
  if (advertsChannel) {
    supabase.removeChannel(advertsChannel);
  }
  
  // Disconnect the observer
  if (observer) {
    document.querySelectorAll('.advert-card').forEach(ad => {
      observer.unobserve(ad);
    });
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('Document loaded, setting up event listeners...');
  
  // Check authentication status and set up UI
  checkAuth();
  
  // Fetch advertisements
  fetchAdvertisements();
  
  // Set up realtime subscription
  setupRealtimeSubscription();
  
  // Form submission
  if (advertForm) {
    advertForm.addEventListener('submit', handleAdvertSubmit);
  }
  
  // User dropdown toggle
  if (userIcon) {
    userIcon.addEventListener('click', function(e) {
      e.preventDefault();
      toggleUserDropdown();
    });
  }
  
  // Mobile menu toggle
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
  }
  
  // Mobile menu close
  if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', toggleMobileMenu);
  }
  
  // Logout buttons
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }
  
  if (mobileLogoutButton) {
    mobileLogoutButton.addEventListener('click', handleLogout);
  }
  
  // Close dropdown when clicking outside
  document.addEventListener('click', handleOutsideClick);
  
  // Clean up on page unload
  window.addEventListener('beforeunload', cleanupResources);
  
  console.log('Event listeners set up successfully');
});
