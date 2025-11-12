/**
 * Portfolio Analytics Tracker
 * Tracks visitor behavior, device types, and page interactions
 */

(function() {
    'use strict';

    const PortfolioTracker = {
        // Generate unique visitor ID
        getVisitorId() {
            let visitorId = localStorage.getItem('visitorId');
            if (!visitorId) {
                visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('visitorId', visitorId);
            }
            return visitorId;
        },

        // Detect device type
        getDeviceType() {
            const ua = navigator.userAgent;
            if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
                return 'tablet';
            }
            if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
                return 'mobile';
            }
            return 'desktop';
        },

        // Get approximate location (country/region)
        async getLocation() {
            try {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();
                return `${data.city || 'Unknown'}, ${data.country_name || 'Unknown'}`;
            } catch (error) {
                return 'Unknown Location';
            }
        },

        // Track page view
        trackPageView() {
            const data = this.loadAnalytics();
            data.pageViews.push({
                timestamp: Date.now(),
                page: window.location.pathname,
                device: this.getDeviceType(),
                visitorId: this.getVisitorId()
            });
            this.saveAnalytics(data);
        },

        // Track visitor
        async trackVisitor() {
            const data = this.loadAnalytics();
            const visitorId = this.getVisitorId();
            const device = this.getDeviceType();
            
            // Check if visitor already exists in current session
            const existingVisitor = data.visitors.find(v => v.id === visitorId);
            
            if (!existingVisitor) {
                const location = await this.getLocation();
                data.visitors.push({
                    id: visitorId,
                    device,
                    location,
                    timestamp: Date.now(),
                    firstVisit: Date.now()
                });
                this.saveAnalytics(data);
            }
        },

        // Track session duration
        trackSession() {
            const sessionStart = Date.now();
            const visitorId = this.getVisitorId();
            
            // Save session on page unload
            window.addEventListener('beforeunload', () => {
                const duration = Date.now() - sessionStart;
                const data = this.loadAnalytics();
                data.sessions.push({
                    visitorId,
                    duration,
                    timestamp: sessionStart
                });
                this.saveAnalytics(data);
            });
        },

        // Track section views (music, art, videos, blog, etc.)
        trackSectionViews() {
            const sections = document.querySelectorAll('section[id]');
            const data = this.loadAnalytics();
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const sectionId = entry.target.id;
                        if (sectionId && data.sections.hasOwnProperty(sectionId)) {
                            data.sections[sectionId]++;
                            this.saveAnalytics(data);
                        }
                    }
                });
            }, {
                threshold: 0.5
            });
            
            sections.forEach(section => observer.observe(section));
        },

        // Load analytics data
        loadAnalytics() {
            const defaultData = {
                visitors: [],
                pageViews: [],
                sessions: [],
                sections: {
                    music: 0,
                    art: 0,
                    videos: 0,
                    blog: 0,
                    about: 0
                }
            };
            
            const stored = localStorage.getItem('portfolioAnalytics');
            return stored ? JSON.parse(stored) : defaultData;
        },

        // Save analytics data
        saveAnalytics(data) {
            localStorage.setItem('portfolioAnalytics', JSON.stringify(data));
        },

        // Initialize tracker
        async init() {
            // Track page view
            this.trackPageView();
            
            // Track visitor (async for location)
            await this.trackVisitor();
            
            // Track session duration
            this.trackSession();
            
            // Track section views
            this.trackSectionViews();
            
            console.log('📊 Analytics tracking initialized');
            console.log('Device:', this.getDeviceType());
            console.log('Visitor ID:', this.getVisitorId());
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => PortfolioTracker.init());
    } else {
        PortfolioTracker.init();
    }

    // Make tracker available globally for debugging
    window.PortfolioTracker = PortfolioTracker;
})();
