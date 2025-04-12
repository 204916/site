
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
const advertForm = document.getElementById('advert-form');
const advertTitle = document.getElementById('advert-title');
const advertContent = document.getElementById('advert-content');
const contactEmail = document.getElementById('contact-email');
const advertImage = document.getElementById('advert-image');
const imagePreview = document.getElementById('image-preview');
const tierRadios = document.querySelectorAll('input[name="tier"]');
const submitButton = document.getElementById('submit-advert');
const statusMessage = document.getElementById('status-message');
const advertsContainer = document.getElementById('adverts-container');
const userBalanceElement = document.getElementById('user-balance');
const wishlistCountElement = document.getElementById('wishlist-count');
const cartCountElement = document.getElementById('cart-count');
const notificationElement = document.getElementById('notification');

// Variables
let currentUser = null;
let userProfile = null;
let viewedAdvertIds = new Set(); // Track adverts that the user has already viewed
let viewTimeouts = {}; // Track timeouts for view duration tracking
let imageFile = null;
let freeAdvertCooldown = false; // Flag for checking if user is in cooldown period

// Minimum time in milliseconds that an ad must be visible to count as a view
const MIN_VIEW_TIME = 2000; // 2 seconds

// Intersection Observer to detect when adverts come into view
let observer = null;

// Polling interval for fetching updated view counts (in milliseconds)
const VIEW_COUNT_POLL_INTERVAL = 5000; // 5 seconds

// Tier pricing and durations
const tierConfig = {
  free: { price: 0, days: 1, priority: 1, cooldownDays: 7, cooldownPrice: 5000 },
  basic: { price: 3000, days: 3, priority: 3 },
  premium: { price: 7000, days: 7, priority: 7 },
  ultra: { price: 10000, days: 30, priority: 10 }
};

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupImagePreview();
  setupFormSubmission();
});

// Check if the user is authenticated
async function checkAuth() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      showNotification('Authentication error. Please log in again.', 'error');
      console.error('Error checking auth status:', error);
      redirectToLogin();
      return;
    }
    
    if (data.session) {
      currentUser = data.session.user;
      await getUserProfile();
      await fetchWishlistCount();
      await fetchCartCount();
      await fetchAdvertisements();
      setupIntersectionObserver();
      startViewCountPolling();
      
      // Check if user has used free advert recently
      await checkFreeAdvertCooldown();
    } else {
      redirectToLogin();
    }
  } catch (error) {
    console.error('Error in checkAuth:', error);
    showNotification('Error checking authentication.', 'error');
  }
}

// Redirect to login page
function redirectToLogin() {
  window.location.href = 'home.html';
}

// Get user profile data including balance
async function getUserProfile() {
  try {
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
    updateBalanceDisplay();
  } catch (error) {
    console.error('Error in getUserProfile:', error);
  }
}

// Update balance display in the header
function updateBalanceDisplay() {
  if (userProfile && userProfile.balance !== null) {
    userBalanceElement.textContent = `₦${userProfile.balance.toLocaleString()}`;
  } else {
    userBalanceElement.textContent = '₦0.00';
  }
}

// Fetch the number of wishlist items
async function fetchWishlistCount() {
  try {
    const { count, error } = await supabase
      .from('wishlist_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id);
    
    if (error) {
      console.error('Error fetching wishlist count:', error);
      return;
    }
    
    wishlistCountElement.textContent = count || '0';
  } catch (error) {
    console.error('Error in fetchWishlistCount:', error);
  }
}

// Fetch the number of cart items
async function fetchCartCount() {
  try {
    const { count, error } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id);
    
    if (error) {
      console.error('Error fetching cart count:', error);
      return;
    }
    
    cartCountElement.textContent = count || '0';
  } catch (error) {
    console.error('Error in fetchCartCount:', error);
  }
}

// Check if the user is in a cooldown period for free adverts
async function checkFreeAdvertCooldown() {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { data, error } = await supabase
      .from('advertise')
      .select('id, date_created')
      .eq('user_id', currentUser.id)
      .eq('tier', 'free')
      .gt('date_created', oneWeekAgo.toISOString())
      .order('date_created', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error checking free advert cooldown:', error);
      return;
    }
    
    if (data && data.length > 0) {
      // User has posted a free advert in the last week
      const usageDays = Math.ceil((new Date() - new Date(data[0].date_created)) / (1000 * 60 * 60 * 24));
      
      if (usageDays <= 1) {
        // User has used their free ad within the last day
        freeAdvertCooldown = false;
      } else {
        // User is in cooldown period (must pay)
        freeAdvertCooldown = true;
        
        // Update the free tier label to show cooldown price
        const freeTierPriceElement = document.querySelector('label[for="tier-free"] .tier-price');
        if (freeTierPriceElement) {
          freeTierPriceElement.textContent = `₦${tierConfig.free.cooldownPrice.toLocaleString()}`;
          
          // Add cooldown note to the free tier details
          const freeTierDetails = document.querySelector('label[for="tier-free"] .tier-details ul');
          if (freeTierDetails) {
            const cooldownNote = document.createElement('li');
            cooldownNote.style.color = '#e41e3f';
            cooldownNote.textContent = 'Cooldown price applies';
            freeTierDetails.appendChild(cooldownNote);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in checkFreeAdvertCooldown:', error);
  }
}

// Set up image preview functionality
function setupImagePreview() {
  advertImage.addEventListener('change', function(event) {
    const file = event.target.files[0];
    
    if (file) {
      imageFile = file;
      const reader = new FileReader();
      
      reader.onload = function(e) {
        imagePreview.innerHTML = `<img src="${e.target.result}" alt="Advert image preview">`;
      };
      
      reader.readAsDataURL(file);
    } else {
      imagePreview.innerHTML = '';
      imageFile = null;
    }
  });
}

// Set up form submission
function setupFormSubmission() {
  advertForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    if (!currentUser) {
      showNotification('You must be logged in to post advertisements', 'error');
      return;
    }
    
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';
    
    try {
      // Get selected tier
      let selectedTier = '';
      for (const radio of tierRadios) {
        if (radio.checked) {
          selectedTier = radio.value;
          break;
        }
      }
      
      // Get tier information
      const tier = tierConfig[selectedTier];
      
      // Calculate price (accounting for free tier cooldown)
      let price = tier.price;
      if (selectedTier === 'free' && freeAdvertCooldown) {
        price = tierConfig.free.cooldownPrice;
      }
      
      // Check if user has enough balance
      if (price > 0 && (!userProfile || userProfile.balance < price)) {
        showStatusMessage('Insufficient balance to post this advertisement', 'error');
        return;
      }
      
      // Calculate expiry date based on tier
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + tier.days);
      
      // Upload image if provided
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      
      // Create the advertisement
      const advertData = {
        user_id: currentUser.id,
        title: advertTitle.value,
        content: advertContent.value,
        contact_email: contactEmail.value,
        tier: selectedTier,
        expiry_date: expiryDate.toISOString(),
        display_priority: tier.priority,
        image_url: imageUrl
      };
      
      const { data, error } = await supabase
        .from('advertise')
        .insert(advertData)
        .select();
      
      if (error) {
        console.error('Error creating advertisement:', error);
        showStatusMessage('Failed to create advertisement: ' + error.message, 'error');
        return;
      }
      
      // Update user's balance (deduct the price)
      if (price > 0) {
        const { data: updatedProfile, error: balanceError } = await supabase
          .from('profiles')
          .update({ balance: userProfile.balance - price })
          .eq('id', currentUser.id)
          .select();
        
        if (balanceError) {
          console.error('Error updating balance:', balanceError);
        } else {
          userProfile = updatedProfile[0];
          updateBalanceDisplay();
        }
      }
      
      showStatusMessage('Advertisement created successfully!', 'success');
      advertForm.reset();
      imagePreview.innerHTML = '';
      
      // Refresh advertisements list
      await fetchAdvertisements();
      
      // Check for consecutive months reward
      checkForConsecutiveMonthsReward();
      
    } catch (error) {
      console.error('Error submitting advertisement:', error);
      showStatusMessage('An unexpected error occurred', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Post Advertisement';
    }
  });
}

// Upload image to storage
async function uploadImage(file) {
  try {
    // Generate a unique file name based on timestamp and random string
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `adverts/${fileName}`;
    
    // Convert image to base64 string
    const reader = new FileReader();
    const imageBase64 = await new Promise((resolve) => {
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    
    // Store the image as a data URL in the database
    // In a production environment, you'd want to use proper storage
    return `data:image/${fileExt};base64,${imageBase64}`;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

// Check for consecutive months reward
async function checkForConsecutiveMonthsReward() {
  try {
    // Only check for paid tiers
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const { data, error } = await supabase
      .from('advertise')
      .select('tier, date_created')
      .eq('user_id', currentUser.id)
      .neq('tier', 'free')
      .gt('date_created', threeMonthsAgo.toISOString())
      .order('date_created', { ascending: false });
    
    if (error) {
      console.error('Error checking consecutive months:', error);
      return;
    }
    
    // Group advertisements by month
    const advertsByMonth = {};
    
    data.forEach(ad => {
      const date = new Date(ad.date_created);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!advertsByMonth[monthKey]) {
        advertsByMonth[monthKey] = [];
      }
      
      advertsByMonth[monthKey].push(ad);
    });
    
    // Check if we have adverts in 3 different months
    if (Object.keys(advertsByMonth).length >= 3) {
      // Get the most recent paid advertisement
      const recentAd = data[0];
      
      if (!recentAd) return;
      
      // Calculate reward based on tier
      let reward = 0;
      
      switch (recentAd.tier) {
        case 'basic':
          reward = 6000; // 2x the tier cost
          break;
        case 'premium':
          reward = 14000; // 2x the tier cost
          break;
        case 'ultra':
          reward = 20000; // 2x the tier cost
          break;
      }
      
      if (reward > 0) {
        // Update the user's balance with the reward
        const { data: updatedProfile, error: rewardError } = await supabase
          .from('profiles')
          .update({ balance: userProfile.balance + reward })
          .eq('id', currentUser.id)
          .select();
        
        if (rewardError) {
          console.error('Error updating balance with reward:', rewardError);
        } else {
          userProfile = updatedProfile[0];
          updateBalanceDisplay();
          showNotification(`Congratulations! You've earned a loyalty reward of ₦${reward.toLocaleString()} for advertising with us for 3 consecutive months!`, 'success');
        }
      }
    }
  } catch (error) {
    console.error('Error in checkForConsecutiveMonthsReward:', error);
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

// Start polling for view count updates
function startViewCountPolling() {
  setInterval(async () => {
    try {
      const { data: adverts, error } = await supabase
        .from('advertise')
        .select('id, view_count');
      
      if (error) {
        console.error('Error fetching view counts:', error);
        return;
      }
      
      // Update the view counts in the UI
      adverts.forEach(advert => {
        updateAdvertViewCount(advert.id, advert.view_count);
      });
    } catch (error) {
      console.error('Error during view count polling:', error);
    }
  }, VIEW_COUNT_POLL_INTERVAL);
}

// Record view for an advertisement
async function recordAdvertView(advertId) {
  try {
    if (!currentUser) {
      return;
    }
    
    // Call the increment_advert_view RPC function
    const { data, error } = await supabase.rpc('increment_advert_view', {
      advert_id: advertId
    });
    
    if (error) {
      console.error('Error recording view:', error);
      return;
    }
    
    updateAdvertViewCount(advertId, data);
  } catch (error) {
    console.error('Error in recordAdvertView:', error);
  }
}

// Update view count in UI
function updateAdvertViewCount(advertId, newCount) {
  const advertElement = document.querySelector(`.advert-card[data-id="${advertId}"]`);
  
  if (advertElement) {
    const viewCountElement = advertElement.querySelector('.view-number');
    if (viewCountElement) {
      viewCountElement.textContent = formatViewCount(newCount);
    }
  }
}

// Format view count for display
function formatViewCount(count) {
  if (!count) return '0';
  
  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
}

// Fetch advertisements from Supabase
async function fetchAdvertisements() {
  try {
    advertsContainer.innerHTML = '<div class="loading">Loading advertisements...</div>';
    
    // Fetch active advertisements
    const { data: adverts, error } = await supabase
      .from('advertise')
      .select('*')
      .eq('is_approved', true)
      .gt('expiry_date', new Date().toISOString())
      .order('display_priority', { ascending: false })
      .order('date_created', { ascending: false });
    
    if (error) {
      console.error('Error fetching advertisements:', error);
      advertsContainer.innerHTML = '<div class="error">Failed to load advertisements</div>';
      return;
    }
    
    if (!adverts || adverts.length === 0) {
      advertsContainer.innerHTML = '<div class="no-results">No active advertisements found</div>';
      return;
    }
    
    displayAdvertisements(adverts);
  } catch (error) {
    console.error('Error in fetchAdvertisements:', error);
    advertsContainer.innerHTML = '<div class="error">An error occurred while loading advertisements</div>';
  }
}

// Display advertisements in the UI
function displayAdvertisements(adverts) {
  advertsContainer.innerHTML = '';
  
  adverts.forEach(advert => {
    const isUserAd = currentUser && advert.user_id === currentUser.id;
    const hasContactInfo = advert.tier === 'ultra' && advert.contact_email;
    
    const advertElement = document.createElement('div');
    advertElement.className = `advert-card ${isUserAd ? 'user-ad' : ''}`;
    advertElement.dataset.id = advert.id;
    
    let imageHtml = '';
    if (advert.image_url) {
      imageHtml = `<img src="${advert.image_url}" alt="${advert.title}" class="advert-image">`;
    }
    
    let contactHtml = '';
    if (hasContactInfo) {
      contactHtml = `
        <div class="advert-contact">
          <strong>Contact:</strong> ${advert.contact_email}
        </div>
      `;
    }
    
    const createdDate = new Date(advert.date_created).toLocaleDateString();
    const expiryDate = new Date(advert.expiry_date).toLocaleDateString();
    
    advertElement.innerHTML = `
      ${imageHtml}
      <div class="advert-content">
        <h3 class="advert-title">${advert.title}</h3>
        <p class="advert-description">${advert.content}</p>
        ${contactHtml}
        <div class="advert-meta">
          <span class="advert-tier ${advert.tier}">${advert.tier.charAt(0).toUpperCase() + advert.tier.slice(1)}</span>
          <span class="view-count">
            <i class="fas fa-eye"></i>
            <span class="view-number">${formatViewCount(advert.view_count)}</span> views
          </span>
        </div>
        <div class="advert-dates">
          <small>Posted: ${createdDate} • Expires: ${expiryDate}</small>
        </div>
      </div>
    `;
    
    advertsContainer.appendChild(advertElement);
    
    // Observe this advert element for visibility
    if (observer) {
      observer.observe(advertElement);
    }
  });
}

// Show status message on the form
function showStatusMessage(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  
  // Hide after 5 seconds
  setTimeout(() => {
    statusMessage.className = 'status-message';
  }, 5000);
}

// Show notification
function showNotification(message, type = 'info') {
  notificationElement.textContent = message;
  notificationElement.className = `notification ${type} show`;
  
  // Hide after 5 seconds
  setTimeout(() => {
    notificationElement.className = 'notification';
  }, 5000);
}
