
document.addEventListener('DOMContentLoaded', function() {
    // Handle Help Section Expansion
    const expandButtons = document.querySelectorAll('.expand-btn');
    const expandedContent = document.getElementById('expanded-content');
    
    // Help section content
    const helpContent = {
      'shopping-guide': {
        title: 'Shopping Guide',
        content: `
          <h2>Shopping Guide</h2>
          <p>Welcome to our E-Mall Shopping Guide! Here you'll find everything you need to know about shopping on our platform.</p>
          
          <h3>Finding Stores and Products</h3>
          <p>Our E-Mall features a variety of stores organized by categories. Here's how to navigate:</p>
          <ul>
            <li><a href="welcome.html">Login/Sign-up</a> an account.</li>
            <li>Access products by clicking <a href="update.html">Products</a> in the header</li>
            <li>Use the search bar at the top to find specific products.</li>
            <li>Browse categories from the menu to explore products by type.</li>
            <li>Check out <a href="home.html#products">featured products</a> on our homepage for popular options.</li>
            <li>Use <a href="product.html#category-filters">filters</a> to narrow down products by price, rating, or features.</li>
          </ul>
          
          <h3>Making a Purchase</h3>
          <p>Once you've found items you want to buy:</p>
          <ul>
            <li>Add items to <a href="cart.html#cart-items">your cart</a> by clicking the "Add to Cart" button.</li>
            <li>Review <a href="cart.html#cart-items">your cart</a> by clicking the cart icon in the top right or below on mobile view.</li>
            <li>Proceed to checkout when ready to complete your purchase.</li>
            <li>Enter shipping and payment information.</li>
            <li>Review your order and submit.</li>
            <li>Review your order and submit.</li>
          </ul>
          
          <h3>Saving Items for Later</h3>
          <p>Found something you like but not ready to buy? Add it to <a href="wishlist.html#wishlist-list">your wishlist</a> by clicking the heart icon on any product. You can access your wishlist from <a href="user.html#wishlist">your account</a> dashboard.</p>
          
          <button class="back-btn" id="back-btn">Back to Help Topics</button>
        `
      },
      'account-management': {
        title: 'Account Management',
        content: `
          <h2>Account Management</h2>
          <p>Managing your E-Mall account is easy and gives you access to personalized shopping experiences, order tracking, and more.</p>
          
          <h3>Creating an Account</h3>
          <p>To create a new account:</p>
          <ul>
            <li>Click "Sign Up" in the top right corner of any page.</li>
            <li>Enter your email address, create a password, and provide basic information.</li>
            <li>Verify your email address by clicking the link sent to your inbox.</li>
            <li>Complete your profile with additional details (optional but recommended).</li>
          </ul>
          
          <h3>Managing Your Profile</h3>
          <p>To update your account information:</p>
          <ul>
            <li>Log in to your account.</li>
            <li>Click on your profile picture or name in the top right.</li>
            <li>Select "Account Settings" from the dropdown menu.</li>
            <li>Update your personal information, address, or preferences.</li>
            <li>Click "Save Changes" when done.</li>
          </ul>
          
          <h3>Privacy and Security</h3>
          <p>We take your privacy seriously. You can manage your privacy settings in your account:</p>
          <ul>
            <li>Control what information is visible to others.</li>
            <li>Manage email preferences and notifications.</li>
            <li>Update your password regularly for better security.</li>
            <li>Enable two-factor authentication for added protection.</li>
          </ul>
          
          <button class="back-btn" id="back-btn">Back to Help Topics</button>
        `
      },
      'payment-options': {
        title: 'Payment Options',
        content: `
          <h2>Payment Options</h2>
          <p>E-Mall offers a variety of secure payment methods to make your shopping experience convenient and safe.</p>
          
          <h3>Accepted Payment Methods</h3>
          <p>We currently accept the following payment options:</p>
          <ul>
            <li><strong>Credit/Debit Cards:</strong> Visa, MasterCard, American Express, Discover</li>
            <li><strong>Digital Wallets:</strong> PayPal, Apple Pay, Google Pay, Samsung Pay</li>
            <li><strong>Bank Transfers:</strong> Direct bank transfers for select regions</li>
            <li><strong>Buy Now, Pay Later:</strong> Afterpay, Klarna, Affirm (where available)</li>
            <li><strong>Gift Cards:</strong> E-Mall gift cards and store-specific gift cards</li>
          </ul>
          
          <h3>Secure Payments</h3>
          <p>All payments on E-Mall are processed through secure, encrypted connections. We never store your full credit card details on our servers. Our payment processing meets the highest security standards, including PCI DSS compliance.</p>
          
          <h3>Billing Information</h3>
          <p>Your billing information is safely stored in your account for convenient checkout. You can:</p>
          <ul>
            <li>Save multiple payment methods</li>
            <li>Set a default payment method</li>
            <li>Update or remove payment methods anytime</li>
            <li>View billing history for all purchases</li>
          </ul>
          
          <button class="back-btn" id="back-btn">Back to Help Topics</button>
        `
      },
      'shipping-delivery': {
        title: 'Shipping & Delivery',
        content: `
          <h2>Shipping & Delivery</h2>
          <p>Find all the information you need about our shipping methods, delivery times, and order tracking.</p>
          
          <h3>Shipping Methods</h3>
          <p>We offer various shipping options to fit your needs:</p>
          <ul>
            <li><strong>Standard Shipping:</strong> 5-7 business days</li>
            <li><strong>Express Shipping:</strong> 2-3 business days</li>
            <li><strong>Next Day Delivery:</strong> Order by 2pm for delivery the next business day</li>
            <li><strong>International Shipping:</strong> Available to select countries (7-14 business days)</li>
          </ul>
          
          <h3>Delivery Times</h3>
          <p>Delivery times vary based on:</p>
          <ul>
            <li>Your selected shipping method</li>
            <li>Your location relative to our distribution centers</li>
            <li>Product availability (some items may require additional processing time)</li>
            <li>Time of order placement (orders placed after 2pm may process the next business day)</li>
          </ul>
          
          <h3>Tracking Your Order</h3>
          <p>Once your order ships, you'll receive tracking information via email. You can also:</p>
          <ul>
            <li>Log in to your account and view order status in "Order History"</li>
            <li>Click on any order to see detailed tracking information</li>
            <li>Set up text notifications for delivery updates</li>
            <li>Contact our customer service if you have any questions about your delivery</li>
          </ul>
          
          <button class="back-btn" id="back-btn">Back to Help Topics</button>
        `
      },
      'returns-refunds': {
        title: 'Returns & Refunds',
        content: `
          <h2>Returns & Refunds</h2>
          <p>We want you to be completely satisfied with your purchases. If you're not, here's how to return items and get a refund.</p>
          
          <h3>Return Policy</h3>
          <p>Our standard return policy includes:</p>
          <ul>
            <li>30-day return window for most items</li>
            <li>Items must be in original condition with tags attached</li>
            <li>Original packaging should be included whenever possible</li>
            <li>Some items may not be eligible for return (noted on product pages)</li>
            <li>Special return policies may apply during holiday seasons</li>
          </ul>
          
          <h3>How to Return an Item</h3>
          <p>To initiate a return:</p>
          <ul>
            <li>Log in to your account and go to "Order History"</li>
            <li>Select the order containing the item(s) you want to return</li>
            <li>Click "Return Items" and follow the prompts</li>
            <li>Print the provided return shipping label</li>
            <li>Package your items securely and attach the label</li>
            <li>Drop off the package at the designated carrier location</li>
          </ul>
          
          <h3>Refund Process</h3>
          <p>Once we receive your return:</p>
          <ul>
            <li>Our team will inspect the items to ensure they meet return conditions</li>
            <li>Approved returns will be processed within 3-5 business days</li>
            <li>Refunds will be issued to your original payment method</li>
            <li>You'll receive an email notification when your refund is processed</li>
            <li>Allow 5-10 business days for the refund to appear in your account</li>
          </ul>
          
          <button class="back-btn" id="back-btn">Back to Help Topics</button>
        `
      },
      'contact-us': {
        title: 'Contact Us',
        content: `
          <h2>Contact Us</h2>
          <p>We're here to help! Reach out to our customer service team through any of the following channels:</p>
          
          <h3>Customer Service Hours</h3>
          <p>Our team is available:</p>
          <ul>
            <li>Monday - Friday: 9:00 AM - 8:00 PM EST</li>
            <li>Saturday: 10:00 AM - 6:00 PM EST</li>
            <li>Sunday: 12:00 PM - 5:00 PM EST</li>
            <li>Extended hours during holiday seasons</li>
          </ul>
          
          <h3>Contact Methods</h3>
          <p>Choose the option that works best for you:</p>
          <ul>
            <li><strong>Email:</strong> support@emall.com (response within 24 hours)</li>
            <li><strong>Phone:</strong> 1-800-EMALL-HELP (1-800-362-5543)</li>
            <li><strong>Live Chat:</strong> Available on our website during business hours</li>
            <li><strong>Social Media:</strong> Message us on Facebook, Twitter, or Instagram</li>
          </ul>
          
          <h3>For Specific Inquiries</h3>
          <p>For faster assistance, please use these dedicated channels:</p>
          <ul>
            <li><strong>Order Issues:</strong> orders@emall.com</li>
            <li><strong>Technical Support:</strong> tech@emall.com</li>
            <li><strong>Billing Questions:</strong> billing@emall.com</li>
            <li><strong>Partnership Opportunities:</strong> partners@emall.com</li>
          </ul>
          
          <button class="back-btn" id="back-btn">Back to Help Topics</button>
        `
      }
    };
    
    expandButtons.forEach(button => {
      button.addEventListener('click', function() {
        const section = this.getAttribute('data-section');
        if (helpContent[section]) {
          expandedContent.innerHTML = helpContent[section].content;
          expandedContent.classList.add('active');
          
          // Scroll to expanded content
          expandedContent.scrollIntoView({ behavior: 'smooth' });
          
          // Add event listener to back button (dynamically created)
          setTimeout(() => {
            const backBtn = document.getElementById('back-btn');
            if (backBtn) {
              backBtn.addEventListener('click', function() {
                expandedContent.classList.remove('active');
                // Scroll back to help sections
                document.querySelector('.help-sections').scrollIntoView({ behavior: 'smooth' });
              });
            }
          }, 100);
        }
      });
    });
    
    // Handle FAQ accordion
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      
      question.addEventListener('click', function() {
        // Toggle active class on current item
        item.classList.toggle('active');
        
        // Close other open FAQs
        faqItems.forEach(otherItem => {
          if (otherItem !== item && otherItem.classList.contains('active')) {
            otherItem.classList.remove('active');
          }
        });
      });
    });
    
    // Handle search functionality
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    const performSearch = () => {
      const searchTerm = searchInput.value.toLowerCase().trim();
      if (searchTerm.length < 2) return;
      
      // Simple search - highlight cards that match the search term
      const helpCards = document.querySelectorAll('.help-card');
      let found = false;
      
      helpCards.forEach(card => {
        const cardTitle = card.querySelector('h3').textContent.toLowerCase();
        const cardContent = card.querySelector('p').textContent.toLowerCase();
        
        if (cardTitle.includes(searchTerm) || cardContent.includes(searchTerm)) {
          card.style.transform = 'scale(1.05)';
          card.style.boxShadow = '0 15px 30px rgba(74, 0, 224, 0.2)';
          card.style.border = '2px solid var(--primary-color)';
          found = true;
        } else {
          card.style.transform = 'scale(1)';
          card.style.boxShadow = 'var(--shadow)';
          card.style.border = 'none';
        }
      });
      
      // Also search FAQs
      const faqItems = document.querySelectorAll('.faq-item');
      
      faqItems.forEach(item => {
        const question = item.querySelector('h4').textContent.toLowerCase();
        const answer = item.querySelector('.faq-answer p').textContent.toLowerCase();
        
        if (question.includes(searchTerm) || answer.includes(searchTerm)) {
          item.classList.add('active');
          item.style.boxShadow = '0 10px 20px rgba(74, 0, 224, 0.2)';
          item.style.border = '2px solid var(--primary-color)';
          
          // Scroll to first match in FAQs if no card matches were found
          if (!found && item === Array.from(faqItems).find(i => 
            i.querySelector('h4').textContent.toLowerCase().includes(searchTerm) || 
            i.querySelector('.faq-answer p').textContent.toLowerCase().includes(searchTerm)
          )) {
            setTimeout(() => {
              item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
          }
          
          found = true;
        } else {
          if (item.classList.contains('active')) item.classList.remove('active');
          item.style.boxShadow = 'var(--shadow)';
          item.style.border = 'none';
        }
      });
      
      // Show a message if no results were found
      if (!found) {
        alert('No results found for "' + searchTerm + '". Please try different keywords.');
      }
    };
    
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
    
    // Reset styling when search input is cleared
    searchInput.addEventListener('input', () => {
      if (searchInput.value === '') {
        const helpCards = document.querySelectorAll('.help-card');
        helpCards.forEach(card => {
          card.style.transform = 'scale(1)';
          card.style.boxShadow = 'var(--shadow)';
          card.style.border = 'none';
        });
        
        const faqItems = document.querySelectorAll('.faq-item');
        faqItems.forEach(item => {
          item.style.boxShadow = 'var(--shadow)';
          item.style.border = 'none';
        });
      }
    });
  });
  