// Navigation and Interactive Features
document.addEventListener('DOMContentLoaded', function() {
    // Initialize navigation system
    initializeNavigation();
    
    // Initialize form handling
    initializeForms();
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Initialize scroll effects
    initializeScrollEffects();
    
    // Initialize animations
    initializeAnimations();
});

// Navigation System
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetPage = this.getAttribute('data-page');
            
            if (targetPage) {
                // Hide all pages with fade effect
                pages.forEach(page => {
                    if (page.classList.contains('active')) {
                        page.style.opacity = '0';
                        setTimeout(() => {
                            page.classList.remove('active');
                            page.style.opacity = '1';
                        }, 150);
                    }
                });
                
                // Show target page with fade effect
                setTimeout(() => {
                    const targetElement = document.getElementById(targetPage);
                    if (targetElement) {
                        targetElement.style.opacity = '0';
                        targetElement.classList.add('active');
                        setTimeout(() => {
                            targetElement.style.opacity = '1';
                        }, 50);
                    }
                }, 150);
                
                // Update active nav links
                navLinks.forEach(navLink => {
                    navLink.classList.remove('active');
                });
                
                // Add active class to all nav links with same data-page
                document.querySelectorAll(`[data-page="${targetPage}"]`).forEach(activeLink => {
                    activeLink.classList.add('active');
                });
                
                // Scroll to top smoothly
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Close mobile menu if open
                const mobileNav = document.querySelector('nav ul');
                if (mobileNav.classList.contains('show')) {
                    mobileNav.classList.remove('show');
                }
            }
        });
    });
}

// Form Handling
function initializeForms() {
    const contactForm = document.getElementById('contactForm');
    const bookingForm = document.getElementById('bookingForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
        setupFormValidation(contactForm);
    }
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingForm);
        setupFormValidation(bookingForm);
    }
}

// Handle Contact Form Submission
async function handleContactForm(e) {
    e.preventDefault();
    
    const form = e.target;
    const statusDiv = document.getElementById('form-status');
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    if (!validateForm(form)) {
        return;
    }
    
    // Show loading state
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitButton.disabled = true;
    showFormStatus(statusDiv, 'Sending your message...', 'loading');
    
    try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showFormStatus(statusDiv, 'Thank you for your message! We will get back to you shortly.', 'success');
            form.reset();
        } else {
            throw new Error('Failed to send message');
        }
    } catch (error) {
        showFormStatus(statusDiv, 'Sorry, there was an error sending your message. Please try again or contact us directly.', 'error');
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// Handle Booking Form Submission
async function handleBookingForm(e) {
    e.preventDefault();
    
    const form = e.target;
    const statusDiv = document.getElementById('booking-form-status');
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    if (!validateForm(form)) {
        return;
    }
    
    // Show loading state
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';
    submitButton.disabled = true;
    showFormStatus(statusDiv, 'Submitting your appointment request...', 'loading');
    
    try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const response = await fetch('/api/booking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showFormStatus(statusDiv, 'Your appointment request has been submitted! We will confirm your appointment within 24 hours.', 'success');
            form.reset();
        } else {
            throw new Error('Failed to submit booking');
        }
    } catch (error) {
        showFormStatus(statusDiv, 'Sorry, there was an error submitting your booking. Please try again or contact us directly.', 'error');
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// Setup Form Validation
function setupFormValidation(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
}

// Show Form Status
function showFormStatus(statusDiv, message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `form-status ${type}`;
    statusDiv.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

// Form Validation
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Check if required field is empty
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required.';
    }
    
    // Email validation
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address.';
        }
    }
    
    // Phone validation
    if (field.type === 'tel' && value) {
        const phoneRegex = /^[\+]?[\d\s\-\(\)]+$/;
        if (!phoneRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number.';
        }
    }
    
    // Date validation (must be future date)
    if (field.type === 'date' && value) {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            isValid = false;
            errorMessage = 'Please select a future date.';
        }
    }
    
    // Show/hide error
    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }
    
    return isValid;
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    field.style.borderColor = '#EF4444';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = '#EF4444';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '5px';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.style.borderColor = '';
    
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// Mobile Menu
function initializeMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const nav = document.querySelector('nav ul');
    const body = document.body;
    
    mobileMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        nav.classList.toggle('show');
        
        // Toggle body scroll lock
        if (nav.classList.contains('show')) {
            body.classList.add('menu-open');
        } else {
            body.classList.remove('menu-open');
        }
        
        // Update icon
        const icon = this.querySelector('i');
        if (nav.classList.contains('show')) {
            icon.className = 'fas fa-times';
        } else {
            icon.className = 'fas fa-bars';
        }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('nav') && !e.target.closest('.mobile-menu')) {
            nav.classList.remove('show');
            body.classList.remove('menu-open');
            const icon = mobileMenu.querySelector('i');
            icon.className = 'fas fa-bars';
        }
    });
    
    // Close menu when clicking on nav links
    const navLinks = document.querySelectorAll('nav ul a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                nav.classList.remove('show');
                document.body.classList.remove('menu-open');
                const icon = mobileMenu.querySelector('i');
                icon.className = 'fas fa-bars';
            }
        });
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            nav.classList.remove('show');
            body.classList.remove('menu-open');
            const icon = mobileMenu.querySelector('i');
            icon.className = 'fas fa-bars';
        }
    });
}

// Scroll Effects
function initializeScrollEffects() {
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.backdropFilter = 'blur(20px)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
        }
    });
}

// Animations
function initializeAnimations() {
    // Intersection Observer for fade-in animations
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        },
        { threshold: 0.1 }
    );
    
    // Observe cards and content sections
    const animateElements = document.querySelectorAll('.card, .content-section, .founder-section');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
}

// Notification System
function showNotification(title, message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    const typeColors = {
        success: '#10B981',
        error: '#EF4444',
        info: '#3B82F6',
        warning: '#F59E0B'
    };
    
    const typeIcons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        info: 'fas fa-info-circle',
        warning: 'fas fa-exclamation-triangle'
    };
    
    notification.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
            <i class="${typeIcons[type]}" style="color: ${typeColors[type]}; font-size: 1.25rem; margin-top: 2px;"></i>
            <div>
                <div style="font-weight: 600; color: #1F2937; margin-bottom: 4px;">${title}</div>
                <div style="color: #6B7280; font-size: 0.9rem; line-height: 1.4;">${message}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: #9CA3AF; cursor: pointer; font-size: 1.1rem; padding: 0; margin-left: auto;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        
        // Only handle valid selectors (not just '#')
        if (href && href !== '#' && href.length > 1) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Keyboard navigation support
document.addEventListener('keydown', function(e) {
    // Escape key closes mobile menu
    if (e.key === 'Escape') {
        const nav = document.querySelector('nav ul');
        if (nav.classList.contains('show')) {
            nav.classList.remove('show');
            document.body.classList.remove('menu-open');
            const mobileMenu = document.querySelector('.mobile-menu');
            const icon = mobileMenu.querySelector('i');
            icon.className = 'fas fa-bars';
        }
    }
});

// Performance optimization: Lazy loading for images
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img[src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.classList.add('loading');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => {
            imageObserver.observe(img);
        });
    }
});

// Initialize tooltips for icons (optional enhancement)
function initializeTooltips() {
    const iconElements = document.querySelectorAll('[data-tooltip]');
    
    iconElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.getAttribute('data-tooltip');
            tooltip.style.cssText = `
                position: absolute;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 0.8rem;
                z-index: 1000;
                pointer-events: none;
                transform: translateX(-50%);
                white-space: nowrap;
            `;
            
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = rect.left + rect.width / 2 + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
            
            this.addEventListener('mouseleave', () => {
                tooltip.remove();
            }, { once: true });
        });
    });
}

// Initialize all enhancements
document.addEventListener('DOMContentLoaded', function() {
    // Add loading class to body for initial animation
    document.body.classList.add('loading');
    
    // Initialize tooltips
    initializeTooltips();
    
    // Performance: Debounce scroll events
    let scrollTimeout;
    const originalScrollHandler = window.onscroll;
    
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (originalScrollHandler) {
                originalScrollHandler();
            }
        }, 10);
    });
});