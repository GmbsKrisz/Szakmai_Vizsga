// ===== PARTICLES REMOVED FOR LIGHTWEIGHT VERSION =====
// Particles.js removed to reduce resource usage

// ===== OPTIMIZED SCROLL HANDLING =====
// Consolidating all scroll events into one throttled listener using requestAnimationFrame
let isScrolling = false;
const navbar = document.getElementById('navbar');
const backToTop = document.getElementById('backToTop');
const serviceCardsAnim = document.querySelectorAll('.service-card');

function handleScroll() {
    const scrollY = window.scrollY;

    // 1. Navbar Effect
    if (scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // 2. Back to Top Button
    if (backToTop) {
        if (scrollY > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }

    // 3. Reveal on Scroll (Simplified)
    // Only check sections, not every element
    const sections = document.querySelectorAll('section:not(.in-viewport)');
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
            section.classList.add('in-viewport');
        }
    });

    isScrolling = false;
}

window.addEventListener('scroll', () => {
    if (!isScrolling) {
        window.requestAnimationFrame(handleScroll);
        isScrolling = true;
    }
}, { passive: true });

// ===== MOBILE MENU TOGGLE =====
menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Close menu when clicking on a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!navLinks.contains(e.target) && !menuToggle.contains(e.target) && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
    }
});

// ===== SMOOTH SCROLL WITH OFFSET =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 80;
            const targetPosition = target.offsetTop - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===== SCROLL ANIMATIONS =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');

            // Trigger counter animation when stats section is visible
            if (entry.target.classList.contains('stat-item')) {
                const numberElement = entry.target.querySelector('[data-target]');
                if (numberElement && !numberElement.classList.contains('counted')) {
                    animateCounter(numberElement);
                    numberElement.classList.add('counted');
                }
            }
        }
    });
}, observerOptions);

// Observe all fade-in elements
document.querySelectorAll('.fade-in').forEach(element => {
    observer.observe(element);
});

// Observe stat items individually for counter animation
document.querySelectorAll('.stat-item').forEach(element => {
    observer.observe(element);
});

// ===== COUNTER ANIMATION =====
function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    };

    updateCounter();
}

// ===== TESTIMONIAL CAROUSEL =====
let currentTestimonial = 0;
const testimonialTrack = document.getElementById('testimonialTrack');
const testimonials = document.querySelectorAll('.testimonial-card');
const testimonialDots = document.getElementById('testimonialDots');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// Create dots
testimonials.forEach((card, index) => {
    // Set initial active state
    if (index === 0) card.classList.add('active');

    const dot = document.createElement('div');
    dot.classList.add('testimonial-dot');
    if (index === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToTestimonial(index));
    testimonialDots.appendChild(dot);
});

function updateTestimonials() {
    // Simply toggle visibility via class
    testimonials.forEach((card, index) => {
        if (index === currentTestimonial) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });

    // Update dots
    document.querySelectorAll('.testimonial-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentTestimonial);
    });
}

function goToTestimonial(index) {
    currentTestimonial = index;
    updateTestimonials();
}

function nextTestimonial() {
    currentTestimonial = (currentTestimonial + 1) % testimonials.length;
    updateTestimonials();
}

function prevTestimonial() {
    currentTestimonial = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
    updateTestimonials();
}

if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', prevTestimonial);
    nextBtn.addEventListener('click', nextTestimonial);
}

// Auto-rotate testimonials
let testimonialInterval = setInterval(nextTestimonial, 5000);

// Pause auto-rotation on hover
const testimonialCarousel = document.querySelector('.testimonials-carousel');
if (testimonialCarousel) {
    testimonialCarousel.addEventListener('mouseenter', () => {
        clearInterval(testimonialInterval);
    });

    testimonialCarousel.addEventListener('mouseleave', () => {
        testimonialInterval = setInterval(nextTestimonial, 5000);
    });
}

// ===== TRACKING DEMO =====
const trackButton = document.getElementById('trackButton');
const trackingInput = document.getElementById('trackingInput');
const trackingDemo = document.getElementById('trackingDemo');
const truckMarker = document.getElementById('truckMarker');
const progressFill = document.getElementById('progressFill');

if (trackButton && trackingInput) {
    trackButton.addEventListener('click', () => {
        const input = trackingInput.value.trim();

        if (input === '') {
            // Show demo animation
            trackingDemo.style.display = 'block';
            animateTracking();
        } else {
            // Show demo with entered value
            trackingDemo.style.display = 'block';
            animateTracking();
        }
    });

    // Also trigger on Enter key
    trackingInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            trackButton.click();
        }
    });
}

function animateTracking() {
    // Animate truck position
    let position = 0;
    const targetPosition = 67;
    const duration = 2000;
    const startTime = Date.now();

    function updatePosition() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        position = progress * targetPosition;

        if (truckMarker) {
            truckMarker.style.left = `${position}%`;
        }

        if (progressFill) {
            progressFill.style.width = `${position}%`;
        }

        if (progress < 1) {
            requestAnimationFrame(updatePosition);
        }
    }

    updatePosition();
}

// ===== ENHANCED TRUCK DEMO WITH CLICK INTERACTION =====
if (trackingDemo) {
    trackingDemo.addEventListener('click', () => {
        animateTracking();
    });
}

// ===== SERVICE CARD TILT EFFECT DISABLED FOR LIGHTWEIGHT =====
// Tilt effect removed to save GPU resources

// ===== PARALLAX SCROLLING DISABLED FOR LIGHTWEIGHT =====
// Parallax effects removed for better performance

// ===== CONTACT FORM HANDLING =====
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form data
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            service: document.getElementById('service')?.value || '',
            message: document.getElementById('message').value.trim()
        };

        // Simple validation
        if (!formData.name || !formData.email || !formData.message) {
            showMessage('Kérjük, töltse ki az összes kötelező mezőt!', 'error');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            showMessage('Kérjük, adjon meg egy érvényes email címet!', 'error');
            return;
        }

        // Simulate form submission with loading state
        const submitBtn = contactForm.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Küldés...</span>';
        submitBtn.disabled = true;

        try {
            await simulateFormSubmission(formData);

            showMessage('Köszönjük! Üzenetét sikeresen elküldtük. Hamarosan felvesszük Önnel a kapcsolatot.', 'success');
            contactForm.reset();

            // Log to console (in production, this would be sent to a server)
            console.log('Form submitted:', formData);

        } catch (error) {
            showMessage('Hiba történt az üzenet küldése során. Kérjük, próbálja újra később.', 'error');
        } finally {
            // Restore button
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 1000);
        }
    });
}

// Helper function to show messages
function showMessage(message, type) {
    if (formMessage) {
        formMessage.textContent = message;
        formMessage.className = `form-message ${type}`;
        formMessage.style.display = 'block';

        // Hide message after 5 seconds
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 5000);
    }
}

// Simulate form submission (in production, replace with actual API call)
function simulateFormSubmission(data) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ success: true });
        }, 1500);
    });
}

// ===== BACK TO TOP BUTTON =====
// const backToTop = document.getElementById('backToTop'); // Already declared at top

// ===== BACK TO TOP BUTTON CLICK HANDLER =====
if (backToTop) {
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===== DYNAMIC YEAR IN FOOTER =====
const yearElement = document.getElementById('year');
if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

// ===== ACCESSIBILITY IMPROVEMENTS =====
// Add keyboard navigation for service cards
const focusableElements = document.querySelectorAll('.service-card, .cta-button, .submit-btn, .testimonial-btn');
focusableElements.forEach(element => {
    element.setAttribute('tabindex', '0');
    element.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            element.click();
        }
    });
});

// ===== FORM ENHANCEMENTS =====
// Add real-time validation feedback
const formInputs = document.querySelectorAll('#contactForm input, #contactForm textarea, #contactForm select');
formInputs.forEach(input => {
    input.addEventListener('blur', () => {
        if (input.hasAttribute('required') && !input.value.trim()) {
            input.style.borderColor = 'rgba(239, 68, 68, 0.5)';
        } else {
            input.style.borderColor = '';
        }
    });

    input.addEventListener('input', () => {
        if (input.style.borderColor) {
            input.style.borderColor = '';
        }
    });
});

// ===== CUSTOM CURSOR REMOVED =====
// Native browser cursor is used for better performance and compatibility

// ===== ENHANCED ANIMATIONS SIMPLIFIED =====
// Variables for smooth reveal and simplified animations
// Already declared at the top of the file
// const serviceCardsAnim = document.querySelectorAll('.service-card');
serviceCardsAnim.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.15}s`;
});

// CTA pulse effect disabled for lightweight version

// ===== PERFORMANCE OPTIMIZATION =====
// Lazy load images (if any)
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ===== PRELOADER (OPTIONAL) =====
window.addEventListener('load', () => {
    document.body.classList.add('loaded');

    // Add a smooth fade-in animation to the whole page
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// ===== ANALYTICS PLACEHOLDER =====
console.log('%c🚚 RizseRR Fuvarozás - Website Loaded!', 'color: #ff6b35; font-size: 20px; font-weight: bold;');
console.log('%cPremium Transport Solutions', 'color: #0099ff; font-size: 14px;');
console.log('%cWebsite by Antigravity AI', 'color: #888; font-size: 12px;');

// ===== LOADING PERFORMANCE OPTIMIZED =====
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

// ===== SMOOTH REVEAL ON SCROLL (Handled in main scroll loop) =====

// ===== EASTER EGG =====
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;

document.addEventListener('keydown', (e) => {
    if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            activateEasterEgg();
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0;
    }
});

function activateEasterEgg() {
    // Create confetti effect
    const colors = ['#ff6b35', '#0099ff', '#ffd23f'];
    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: -10px;
                left: ${Math.random() * 100}vw;
                border-radius: 50%;
                pointer-events: none;
                z-index: 10000;
                animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
            `;
            document.body.appendChild(confetti);

            setTimeout(() => confetti.remove(), 4000);
        }, i * 30);
    }

    // Add confetti animation
    if (!document.getElementById('confetti-style')) {
        const confettiStyle = document.createElement('style');
        confettiStyle.id = 'confetti-style';
        confettiStyle.textContent = `
            @keyframes confettiFall {
                to {
                    transform: translateY(100vh) rotate(${Math.random() * 360}deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(confettiStyle);
    }

    console.log('%c🎉 Konami Code Activated! 🎉', 'color: #ffd23f; font-size: 24px; font-weight: bold;');
}

// ===== NETWORK STATUS INDICATOR =====
window.addEventListener('offline', () => {
    const offlineMsg = document.createElement('div');
    offlineMsg.id = 'offline-indicator';
    offlineMsg.innerHTML = '<i class="fas fa-wifi"></i> Nincs internetkapcsolat';
    offlineMsg.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(239, 68, 68, 0.95);
        color: white;
        padding: 1rem 2rem;
        border-radius: 2rem;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    document.body.appendChild(offlineMsg);
});

window.addEventListener('online', () => {
    const offlineMsg = document.getElementById('offline-indicator');
    if (offlineMsg) {
        offlineMsg.style.background = 'rgba(34, 197, 94, 0.95)';
        offlineMsg.innerHTML = '<i class="fas fa-wifi"></i> Kapcsolat helyreállt';
        setTimeout(() => offlineMsg.remove(), 3000);
    }
});
