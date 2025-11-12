/**
 * Image Optimization & Progressive Loading
 * Handles lazy loading, compression, and performance for mobile devices
 */

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        rootMargin: '50px', // Start loading 50px before image is visible
        threshold: 0.01,
        quality: 0.85, // Image quality for compression
        maxWidth: 1200, // Max image width for display
        placeholderColor: '#0a0a0a' // Dark placeholder matching site
    };

    /**
     * Create low-quality placeholder for images
     */
    function createPlaceholder(img) {
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';
        placeholder.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${CONFIG.placeholderColor};
            animation: pulse 1.5s infinite;
        `;
        
        // Insert placeholder before image
        if (img.parentNode) {
            img.parentNode.style.position = 'relative';
            img.parentNode.insertBefore(placeholder, img);
        }
        
        return placeholder;
    }

    /**
     * Remove placeholder after image loads
     */
    function removePlaceholder(placeholder, img) {
        if (placeholder) {
            placeholder.style.opacity = '0';
            setTimeout(() => {
                if (placeholder.parentNode) {
                    placeholder.parentNode.removeChild(placeholder);
                }
            }, 300);
        }
        
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            img.style.opacity = '1';
        }, 10);
    }

    /**
     * Load image with optimization
     */
    function loadImage(img) {
        return new Promise((resolve, reject) => {
            // Create placeholder
            const placeholder = createPlaceholder(img);
            
            // Get image source
            const src = img.dataset.src || img.getAttribute('data-src') || img.src;
            
            if (!src) {
                console.warn('No image source found');
                reject(new Error('No source'));
                return;
            }
            
            // Create new image for loading
            const tempImg = new Image();
            
            tempImg.onload = function() {
                // Set the actual image source
                img.src = src;
                img.removeAttribute('data-src');
                img.classList.add('loaded');
                
                // Remove placeholder
                removePlaceholder(placeholder, img);
                
                resolve(img);
            };
            
            tempImg.onerror = function(err) {
                console.error('Image load error:', src, err);
                if (placeholder) {
                    placeholder.innerHTML = '<span style="color: #666; font-size: 0.8rem;">⚠️ Load error</span>';
                }
                reject(err);
            };
            
            // Start loading
            tempImg.src = src;
        });
    }

    /**
     * Initialize Intersection Observer for lazy loading
     */
    function initLazyLoading() {
        // Check for Intersection Observer support
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported, loading all images');
            document.querySelectorAll('img[loading="lazy"]').forEach(img => {
                loadImage(img);
            });
            return;
        }

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    // Load image
                    loadImage(img)
                        .then(() => {
                            console.log('✅ Loaded:', img.alt || img.src);
                        })
                        .catch(err => {
                            console.error('❌ Failed:', img.alt || img.src, err);
                        });
                    
                    // Stop observing this image
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: CONFIG.rootMargin,
            threshold: CONFIG.threshold
        });

        // Observe all lazy-load images
        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            // Set up image wrapper if needed
            if (!img.parentNode.classList.contains('image-wrapper')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'image-wrapper';
                img.parentNode.insertBefore(wrapper, img);
                wrapper.appendChild(img);
            }
            
            imageObserver.observe(img);
        });
    }

    /**
     * Add responsive image sources based on device
     */
    function optimizeForDevice() {
        const isMobile = window.innerWidth <= 768;
        const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
        
        // Set loading priority based on device
        document.querySelectorAll('img').forEach(img => {
            // Skip hero images
            if (img.closest('.hero')) return;
            
            // Lower quality for mobile to save bandwidth
            if (isMobile) {
                img.setAttribute('decoding', 'async');
            }
        });
        
        console.log(`📱 Device detected: ${isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}`);
    }

    /**
     * Monitor image loading performance
     */
    function monitorPerformance() {
        if (!window.performance) return;
        
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('resource')
                .filter(entry => entry.initiatorType === 'img');
            
            const totalSize = perfData.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
            const avgLoadTime = perfData.reduce((sum, entry) => sum + entry.duration, 0) / perfData.length;
            
            console.log('📊 Image Performance:');
            console.log(`   Images loaded: ${perfData.length}`);
            console.log(`   Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   Avg load time: ${avgLoadTime.toFixed(0)} ms`);
        });
    }

    /**
     * Initialize everything
     */
    function init() {
        console.log('🖼️ Image Optimizer initialized');
        
        // Optimize for current device
        optimizeForDevice();
        
        // Set up lazy loading
        initLazyLoading();
        
        // Monitor performance in dev mode
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            monitorPerformance();
        }
        
        // Re-optimize on resize (debounced)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(optimizeForDevice, 250);
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Add CSS for placeholders and loading animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .image-placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            transition: opacity 0.3s ease;
        }
        
        img {
            transition: opacity 0.3s ease;
        }
        
        img.loaded {
            opacity: 1;
        }
        
        .image-wrapper {
            position: relative;
            overflow: hidden;
        }
    `;
    document.head.appendChild(style);
    
})();
