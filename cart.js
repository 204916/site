  // Supabase configuration
  const SUPABASE_URL = "https://rpusltqaadfbabzkcull.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwdXNsdHFhYWRmYmFiemtjdWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2MjU4NjAsImV4cCI6MjA1NTIwMTg2MH0.fpiYDehk0F2bLX8TVqGmVB1lIpR8ZgcLKbkPmo6PORk";
  
  // EmailJS configuration
  const EMAIL_SERVICE_ID = "service_e9z4wt8";
  const EMAIL_TEMPLATE_ID = "template_7359jla"; 
  const EMAIL_PUBLIC_KEY = "RdvIt3TQ0uXJyqbdI";
  const ADMIN_EMAIL = "ecommerxe01@gmail.com";
  
  // Nigerian states with delivery fees
  const nigerianStates = [
    { name: "Abia", fee: 6500 },
    { name: "Adamawa", fee: 6500 },
    { name: "Akwa Ibom", fee: 7000 },
    { name: "Anambra", fee: 6500 },
    { name: "Bauchi", fee: 7500 },
    { name: "Bayelsa", fee: 7500 },
    { name: "Benue", fee: 8500 },
    { name: "Borno", fee: 8500 },
    { name: "Cross River", fee: 7500 },
    { name: "Delta", fee: 7500 },
    { name: "Ebonyi", fee: 7500 },
    { name: "Edo", fee: 6500 },
    { name: "Ekiti", fee: 5500 },
    { name: "Enugu", fee: 6500 },
    { name: "FCT Abuja", fee: 6800 },
    { name: "Gombe", fee: 10000 },
    { name: "Imo", fee: 6400 },
    { name: "Jigawa", fee: 8200 },
    { name: "Kaduna", fee: 8800 },
    { name: "Kano", fee: 9000 },
    { name: "Katsina", fee: 9200 },
    { name: "Kebbi", fee: 9300 },
    { name: "Kogi", fee: 7500 },
    { name: "Kwara", fee: 5300 },
    { name: "Lagos", fee: 7000 },
    { name: "Nasarawa", fee: 8600 },
    { name: "Niger", fee: 8700 },
    { name: "Ogun", fee: 4800 },
    { name: "Ondo", fee: 6000 },
    { name: "Osun", fee: 6000 },
    { name: "Oyo", fee: 5900 },
    { name: "Plateau", fee: 10000 },
    { name: "Rivers", fee: 8300 },
    { name: "Sokoto", fee: 9500 },
    { name: "Taraba", fee: 12000 },
    { name: "Yobe", fee: 9500 },
    { name: "Zamfara", fee: 10800 }
  ];
  
  // Global variable to track selected state and fee
  let selectedStateData = { name: "Lagos", fee: 7000 }; // Default to Lagos
  
  // Initialize Supabase client
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  
  document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM loaded - initializing cart page");
    
    // Initialize EmailJS if available
    if (typeof emailjs !== 'undefined') {
      emailjs.init(EMAIL_PUBLIC_KEY);
      console.log("EmailJS initialized with public key");
    } else {
      console.warn("EmailJS not available - make sure to include the EmailJS script");
    }
  
    // Load cart items
    await loadCartItems();
    
    // Update cart and wishlist counts
    updateCartCount();
    updateWishlistCount();
    
    // Setup clear cart button
    const clearCartBtn = document.querySelector('.clear-cart-btn');
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear your cart?')) {
          await clearCart();
          // Reload cart
          await loadCartItems();
        }
      });
    }
    
    // Setup checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', async () => {
        await processCheckout();
      });
    }
    
    // Setup menu toggle for mobile
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenu = document.getElementById('close-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (menuToggle && mobileMenu) {
      menuToggle.addEventListener('click', () => {
        mobileMenu.classList.add('open');
        document.body.classList.add('no-scroll');
      });
    }
    
    if (closeMenu && mobileMenu) {
      closeMenu.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        document.body.classList.remove('no-scroll');
      });
    }
    
    // Create and add state dropdown for delivery location
    const cartSummary = document.getElementById('cart-summary');
    if (cartSummary) {
      // Create state dropdown element
      const stateDropdownHTML = `
        <div class="delivery-state">
          <label for="state-dropdown" class="delivery-label">Delivery State:</label>
          <select id="state-dropdown" class="state-dropdown">
            ${nigerianStates.map(state => 
              `<option value="${state.name}" data-fee="${state.fee}" ${state.name === 'Lagos' ? 'selected' : ''}>
                ${state.name} - ₦${state.fee.toLocaleString()}
              </option>`
            ).join('')}
          </select>
        </div>
      `;
      
      // Check if there's a shipping section or create one
      let shippingElement = cartSummary.querySelector('.shipping');
      if (shippingElement) {
        // Insert dropdown before the shipping element
        shippingElement.insertAdjacentHTML('beforebegin', stateDropdownHTML);
      } else {
        // If no shipping element, add it after the subtotal
        const subtotalElement = cartSummary.querySelector('.subtotal-value');
        if (subtotalElement) {
          const parentElement = subtotalElement.parentElement;
          if (parentElement) {
            parentElement.insertAdjacentHTML('afterend', stateDropdownHTML);
          }
        }
      }
      
      // Add event listener to dropdown
      const stateDropdown = document.getElementById('state-dropdown');
      if (stateDropdown) {
        stateDropdown.addEventListener('change', function() {
          const selectedOption = this.options[this.selectedIndex];
          const stateName = selectedOption.value;
          const stateFee = parseInt(selectedOption.dataset.fee);
          
          selectedStateData = { name: stateName, fee: stateFee };
          console.log(`Selected state: ${stateName} with fee: ₦${stateFee}`);
          
          // Update the cart summary with new shipping fee
          updateCartSummary();
        });
      }
    }
  });
  
  // Get current user session
  async function getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting current user:', error);
        return null;
      }
      
      if (!user) {
        console.log('No user is currently logged in');
        return null;
      }
      
      // Get user balance from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error getting user profile:', profileError);
      }
      
      // Return user with balance
      return {
        id: user.id,
        email: user.email,
        balance: profileData ? profileData.balance : 0
      };
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
    }
  }
  
  // Load cart items
  async function loadCartItems() {
    try {
      const cartItemsContainer = document.getElementById('cart-items');
      const cartSummary = document.getElementById('cart-summary');
      const emptyCart = document.getElementById('cart-empty');
      
      if (!cartItemsContainer || !cartSummary || !emptyCart) {
        console.error('Required DOM elements are missing.');
        return;
      }
      
      // Check if user is logged in
      const user = await getCurrentUser();
      console.log('Current user:', user);
  
      let cartItems = [];
      
      if (user) {
        try {
          // First get cart items
          const { data: cartData, error: cartError } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', user.id);
            
          if (cartError) {
            console.error('Error fetching cart items:', cartError);
            throw cartError;
          }
          
          console.log('Cart items from database:', cartData);
          
          if (!cartData || cartData.length === 0) {
            console.log('No cart items found for this user');
            cartItems = [];
          } else {
            // Now fetch product details separately for each cart item
            cartItems = await Promise.all(cartData.map(async (item) => {
              const { data: productData, error: productError } = await supabase
                .from('products')
                .select('*')
                .eq('id', item.product_id)
                .single();
                
              if (productError) {
                console.error(`Error fetching product ${item.product_id}:`, productError);
                return null;
              }
              
              return {
                id: item.product_id,
                name: productData.name,
                price: productData.price,
                discount: productData.discount || 0,
                image: productData.image_url,
                quantity: item.quantity
              };
            }));
            
            // Filter out any null values from products that couldn't be fetched
            cartItems = cartItems.filter(item => item !== null);
          }
        } catch (error) {
          console.error('Error fetching cart data:', error);
          cartItems = [];
        }
        
        // Update localStorage to match Supabase
        localStorage.setItem('cart', JSON.stringify(cartItems));
      } else {
        // Get cart from localStorage
        try {
          cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
          console.log('Cart data from localStorage:', cartItems);
        } catch (error) {
          console.error('Error parsing cart data from localStorage:', error);
          cartItems = []; // Reset to empty cart if parsing fails
          localStorage.setItem('cart', JSON.stringify(cartItems));
        }
      }
      
      // Display cart items or empty message
      if (cartItems.length === 0) {
        cartItemsContainer.style.display = 'none';
        cartSummary.style.display = 'none';
        emptyCart.style.display = 'flex';
      } else {
        cartItemsContainer.style.display = 'block';
        
        // Calculate total
        const subtotal = cartItems.reduce((total, item) => {
          const itemPrice = item.price - (item.price * (item.discount / 100));
          return total + (itemPrice * item.quantity);
        }, 0);
        
        const shipping = selectedStateData.fee;
        const tax = subtotal * 0.05;
        const total = subtotal + shipping + tax;
        
        // Display cart items
        cartItemsContainer.innerHTML = cartItems.map(item => {
          const itemPrice = item.price - (item.price * (item.discount / 100));
          const itemTotal = itemPrice * item.quantity;
          
          return `
            <div class="cart-item">
              <div class="item-image">
                <img src="${item.image || 'https://via.placeholder.com/100x100?text=Product'}" alt="${item.name}">
              </div>
              <div class="item-details">
                <h3 class="item-name">${item.name}</h3>
                <div class="item-price">₦${itemPrice.toFixed(2)}</div>
                <div class="item-quantity">
                  <button class="quantity-btn minus" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                  <span class="quantity">${item.quantity}</span>
                  <button class="quantity-btn plus" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                </div>
              </div>
              <div class="item-total">
                <div class="total-price">₦${itemTotal.toFixed(2)}</div>
                <button class="remove-item" onclick="removeCartItem('${item.id}')">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          `;
        }).join('');
        
        // Display cart summary
        cartSummary.style.display = 'block';
        
        const subtotalElement = cartSummary.querySelector('.subtotal-value');
        const shippingElement = cartSummary.querySelector('.shipping-value');
        const taxElement = cartSummary.querySelector('.tax-value');
        const totalElement = cartSummary.querySelector('.total-value');
        
        if (subtotalElement) subtotalElement.textContent = `₦${subtotal.toFixed(2)}`;
        if (shippingElement) shippingElement.textContent = `₦${shipping.toFixed(2)}`;
        if (taxElement) taxElement.textContent = `₦${tax.toFixed(2)}`;
        if (totalElement) totalElement.textContent = `₦${total.toFixed(2)}`;
        
        // Save total in data attribute for checkout
        cartSummary.dataset.total = total.toFixed(2);
        
        // Store cart items for checkout
        localStorage.setItem('checkoutItems', JSON.stringify(cartItems));
        localStorage.setItem('checkoutTotal', total.toFixed(2));
        
        emptyCart.style.display = 'none';
      }
    } catch (error) {
      console.error('Error loading cart items:', error);
      showToast('Failed to load cart items', 'error');
    }
  }
  
  // Update cart summary based on cart items and selected state
  async function updateCartSummary() {
    const cartSummary = document.getElementById('cart-summary');
    if (!cartSummary) return;
    
    try {
      // Get cart items
      const cartItems = JSON.parse(localStorage.getItem('checkoutItems') || '[]');
      
      // Calculate subtotal
      const subtotal = cartItems.reduce((total, item) => {
        const itemPrice = item.price - (item.price * (item.discount / 100));
        return total + (itemPrice * item.quantity);
      }, 0);
      
      // Get shipping fee from selected state
      const shipping = selectedStateData.fee;
      
      // Calculate tax (5% of subtotal)
      const tax = subtotal * 0.05;
      
      // Calculate total
      const total = subtotal + shipping + tax;
      
      // Update display elements
      const subtotalElement = cartSummary.querySelector('.subtotal-value');
      const shippingElement = cartSummary.querySelector('.shipping-value');
      const taxElement = cartSummary.querySelector('.tax-value');
      const totalElement = cartSummary.querySelector('.total-value');
      
      if (subtotalElement) subtotalElement.textContent = `₦${subtotal.toFixed(2)}`;
      if (shippingElement) shippingElement.textContent = `₦${shipping.toFixed(2)}`;
      if (taxElement) taxElement.textContent = `₦${tax.toFixed(2)}`;
      if (totalElement) totalElement.textContent = `₦${total.toFixed(2)}`;
      
      // Save total in data attribute for checkout
      cartSummary.dataset.total = total.toFixed(2);
      localStorage.setItem('checkoutTotal', total.toFixed(2));
      
      console.log(`Cart summary updated: Subtotal=${subtotal}, Shipping=${shipping}, Tax=${tax}, Total=${total}`);
    } catch (error) {
      console.error('Error updating cart summary:', error);
    }
  }
  
  // Update item quantity
  async function updateQuantity(itemId, newQuantity) {
    try {
      // Validate quantity
      if (newQuantity < 1) {
        // Remove item if quantity is less than 1
        await removeCartItem(itemId);
        return;
      }
      
      // Check if user is logged in
      const user = await getCurrentUser();
      
      if (user) {
        // Update quantity in Supabase
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('user_id', user.id)
          .eq('product_id', itemId);
        
        if (error) throw error;
      }
      
      // Update quantity in localStorage
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const itemIndex = cart.findIndex(item => item.id === itemId);
      
      if (itemIndex !== -1) {
        cart[itemIndex].quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
      }
      
      // Reload cart
      await loadCartItems();
      
      // Update cart count
      updateCartCount();
    } catch (error) {
      console.error('Error updating quantity:', error);
      showToast('Failed to update quantity', 'error');
    }
  }
  
  // Remove item from cart
  async function removeCartItem(itemId) {
    try {
      // Check if user is logged in
      const user = await getCurrentUser();
      
      if (user) {
        // Remove from Supabase
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', itemId);
        
        if (error) throw error;
      }
      
      // Remove from localStorage
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');
      cart = cart.filter(item => item.id !== itemId);
      localStorage.setItem('cart', JSON.stringify(cart));
      
      // Reload cart
      await loadCartItems();
      
      // Update cart count
      updateCartCount();
      
      showToast('Item removed from cart');
    } catch (error) {
      console.error('Error removing cart item:', error);
      showToast('Failed to remove item', 'error');
    }
  }
  
  // Clear entire cart
  async function clearCart() {
    try {
      // Check if user is logged in
      const user = await getCurrentUser();
      
      if (user) {
        // Clear cart in Supabase
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);
        
        if (error) throw error;
      }
      
      // Clear cart in localStorage
      localStorage.setItem('cart', '[]');
      
      // Update cart count
      updateCartCount();
      
      showToast('Cart cleared');
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      showToast('Failed to clear cart', 'error');
      return false;
    }
  }
  
  // Process checkout with improved EmailJS integration
  async function processCheckout() {
    try {
      // Check if user is logged in
      const user = await getCurrentUser();
      
      if (!user || !user.id) {
        showToast('Please sign in to checkout', 'error');
        return;
      }
      
      // Get cart items and total
      const cartItems = JSON.parse(localStorage.getItem('checkoutItems') || '[]');
      const total = parseFloat(localStorage.getItem('checkoutTotal') || '0');
      
      if (cartItems.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
      }
      
      // Check if user has enough balance
      const userBalance = user.balance || 0;
      
      if (userBalance < total) {
        showToast(`Insufficient balance. You need ₦${(total - userBalance).toFixed(2)} more.`, 'error');
        return;
      }
      
      // Show confirmation dialog
      const modal = document.createElement('div');
      modal.className = 'checkout-modal';
      modal.innerHTML = `
        <div class="checkout-dialog">
          <h2>Confirm Checkout</h2>
          <p>Once you proceed with this checkout, the amount of ₦${total.toFixed(2)} will be deducted from your account balance. This action cannot be reversed.</p>
          <p>Current Balance: ₦${userBalance.toFixed(2)}</p>
          <p>New Balance: ₦${(userBalance - total).toFixed(2)}</p>
          <p>Delivery State: ${selectedStateData.name} (₦${selectedStateData.fee.toFixed(2)})</p>
          <div class="checkout-actions">
            <button class="btn-cancel">Cancel</button>
            <button class="btn-confirm">Confirm</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Add event listeners to buttons
      const cancelBtn = modal.querySelector('.btn-cancel');
      const confirmBtn = modal.querySelector('.btn-confirm');
      
      cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      confirmBtn.addEventListener('click', async () => {
        // Remove modal
        document.body.removeChild(modal);
        
        // Show loading toast
        showToast('Processing checkout...', 'info');
        
        try {
          // Get user profile information
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (profileError) throw profileError;
          
          const userProfile = profileData || {};
          
          // Format cart items for email
          const formattedCartItems = cartItems.map(item => {
            const itemPrice = item.price - (item.price * (item.discount / 100));
            return `${item.name} x ${item.quantity} - ₦${(itemPrice * item.quantity).toFixed(2)}`;
          }).join('\n');
          
          // Calculate subtotal (before shipping and tax)
          const subtotal = cartItems.reduce((total, item) => {
            const itemPrice = item.price - (item.price * (item.discount / 100));
            return total + (itemPrice * item.quantity);
          }, 0);
          
          const shippingFee = selectedStateData.fee;
          const tax = subtotal * 0.05;
          
          // Create an order record in Supabase
          const { error: orderError } = await supabase
            .from('orders')
            .insert({
              user_id: user.id,
              user_email: user.email,
              user_full_name: userProfile.full_name || 
                `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim(),
              user_address: userProfile.address || 'No address provided',
              order_items: JSON.stringify({
                items: cartItems,
                delivery_state: selectedStateData.name,
                delivery_fee: selectedStateData.fee
              }),
              order_total: total,
              status: 'processing'
            });
          
          if (orderError) throw orderError;
          
          // Update user balance
          const newBalance = userBalance - total;
          
          const { error: balanceError } = await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', user.id);
          
          if (balanceError) throw balanceError;
          
          // Format date nicely
          const orderDate = new Date().toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
          });
          
          const userName = userProfile.full_name || 
            `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 
            'Customer';
          
          const userAddress = userProfile.address || 'Address not provided';
          
          // Send email notification using EmailJS
          if (typeof emailjs !== 'undefined') {
            // Prepare EmailJS parameters - match exactly with template variables
            const emailParams = {
              user_id: user.id,
              user_name: userName,
              user_email: user.email,
              user_address: userAddress,
              order_items: formattedCartItems,
              order_total: `₦${total.toFixed(2)} (Subtotal: ₦${subtotal.toFixed(2)}, Shipping: ₦${shippingFee.toFixed(2)}, Tax: ₦${tax.toFixed(2)})`,
              order_date: orderDate,
              delivery_state: selectedStateData.name
            };
            
            try {
              console.log('Sending email via EmailJS with parameters:', emailParams);
              const emailResponse = await emailjs.send(
                EMAIL_SERVICE_ID,
                EMAIL_TEMPLATE_ID,
                emailParams,
                EMAIL_PUBLIC_KEY
              );
              
              console.log('Email notification sent successfully:', emailResponse);
            } catch (emailError) {
              console.error('Error sending email notification:', emailError);
              // Continue with checkout even if email fails
            }
          } else {
            console.warn('EmailJS not available - email notification not sent');
          }
          
          // Clear cart after successful checkout
          await clearCart();
          
          // Show success message
          showToast('Checkout complete! Thank you for your order.', 'success');
          
          // Redirect to home page after 3 seconds
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 3000);
          
        } catch (checkoutError) {
          console.error('Checkout error:', checkoutError);
          showToast('Checkout failed: ' + checkoutError.message, 'error');
        }
      });
    } catch (error) {
      console.error('Error processing checkout:', error);
      showToast('Checkout failed. Please try again.', 'error');
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
        // Get cart items from Supabase
        const { data, error } = await supabase
          .from('cart_items')
          .select('quantity')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        count = data ? data.reduce((total, item) => total + item.quantity, 0) : 0;
      } else {
        // Get cart items from localStorage
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        count = cart.reduce((total, item) => total + item.quantity, 0);
      }
      
      // Update all cart count elements on the page
      cartCountElements.forEach(element => {
        element.textContent = count.toString();
      });
    } catch (error) {
      console.error('Error updating cart count:', error);
      // Fallback: Set cart count to 0
      document.querySelectorAll('.cart-count').forEach(el => (el.textContent = '0'));
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
        // Get wishlist items from Supabase
        const { data, error } = await supabase
          .from('wishlist_items')
          .select('id')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        count = data ? data.length : 0;
      } else {
        // Get wishlist items from localStorage
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        count = wishlist.length;
      }
      
      // Update all wishlist count elements on the page
      wishlistCountElements.forEach(element => {
        element.textContent = count.toString();
      });
    } catch (error) {
      console.error('Error updating wishlist count:', error);
      // Fallback: Set wishlist count to 0
      document.querySelectorAll('.wishlist-count').forEach(el => (el.textContent = '0'));
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
  
  // Expose functions globally
  window.updateQuantity = updateQuantity;
  window.removeCartItem = removeCartItem;
  window.clearCart = clearCart;
  window.processCheckout = processCheckout;
  window.updateCartCount = updateCartCount;
  window.updateWishlistCount = updateWishlistCount;
  window.showToast = showToast;
