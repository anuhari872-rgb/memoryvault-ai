/**
 * MemoryVault AI — Session Management
 * Handles localStorage-based demo authentication.
 */

(function () {
    'use strict';

    const SESSION_KEY = 'memoryvault_session';

    window.sessionService = {
        login(user, remember = false) {
            const session = {
                authenticated: true,
                user: user
            };
            const data = JSON.stringify(session);
            if (remember) {
                localStorage.setItem(SESSION_KEY, data);
            } else {
                sessionStorage.setItem(SESSION_KEY, data);
            }
        },

        logout() {
            localStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(SESSION_KEY);
            // Reload page to reset state safely and show login
            window.location.reload();
        },

        getSession() {
            const localData = localStorage.getItem(SESSION_KEY);
            if (localData) return JSON.parse(localData);
            const sessionData = sessionStorage.getItem(SESSION_KEY);
            if (sessionData) return JSON.parse(sessionData);
            return null;
        },

        isAuthenticated() {
            const session = this.getSession();
            return session && session.authenticated === true;
        }
    };

    // Check session synchronously since script is at end of body
    const loginPage = document.getElementById('login-page');
    const dashboardPage = document.getElementById('dashboard-page');
    const successScreen = document.getElementById('success-screen');

    if (window.sessionService.isAuthenticated()) {
        // Bypass login completely
        if (loginPage) loginPage.classList.add('hidden');
        if (successScreen) successScreen.classList.add('hidden');
        if (dashboardPage) dashboardPage.classList.remove('hidden');
        
        // Set greeting based on time of day
        const hour = new Date().getHours();
        let greeting = 'Good Morning,';
        if (hour >= 12 && hour < 17) greeting = 'Good Afternoon,';
        else if (hour >= 17) greeting = 'Good Evening,';
        
        const greetEl = document.getElementById('greeting-time');
        if (greetEl) greetEl.textContent = greeting;
    }
})();
