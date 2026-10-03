/**
 * MemoryVault AI — Main Application Script
 *
 * Handles all login-page interactions:
 *   - Email & password validation (login + register)
 *   - Show/hide password toggle
 *   - Remember-me checkbox
 *   - Forgot-password modal
 *   - Login ↔ Register card switching
 *   - Success animation → dashboard transition
 *
 * All logic is frontend-only (demo mode).
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    //  CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const API_BASE = 'http://localhost:5000';
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const MIN_PASSWORD = 6;

    // ═══════════════════════════════════════════════════════════════════════
    //  DOM CACHE
    // ═══════════════════════════════════════════════════════════════════════

    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];

    // Pages / screens
    const loginPage     = $('#login-page');
    const successScreen = $('#success-screen');
    const dashboardPage = $('#dashboard-page');

    // Cards
    const loginCard    = $('#login-card');
    const registerCard = $('#register-card');

    // Forms
    const loginForm    = $('#login-form');
    const registerForm = $('#register-form');
    const forgotForm   = $('#forgot-form');

    // Modal
    const forgotModal   = $('#forgot-modal');
    const forgotSuccess = $('#forgot-success');

    // ═══════════════════════════════════════════════════════════════════════
    //  UTILITY HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    /** Show a field-level error. */
    function showError(inputId, message) {
        const input   = $('#' + inputId);
        const errorEl = $('#' + inputId + '-error');
        const wrapper = input.closest('.input-wrapper');

        errorEl.textContent = message;
        errorEl.classList.add('visible');
        wrapper.classList.add('has-error');
    }

    /** Clear a field-level error. */
    function clearError(inputId) {
        const input   = $('#' + inputId);
        const errorEl = $('#' + inputId + '-error');
        const wrapper = input.closest('.input-wrapper');

        errorEl.textContent = '';
        errorEl.classList.remove('visible');
        wrapper.classList.remove('has-error');
    }

    /** Clear all errors inside a form. */
    function clearFormErrors(form) {
        $$('.field-error', form).forEach(el => {
            el.textContent = '';
            el.classList.remove('visible');
        });
        $$('.input-wrapper', form).forEach(el => {
            el.classList.remove('has-error');
        });
    }

    /** Validate an email value — returns error string or null. */
    function validateEmail(value) {
        if (!value.trim()) return 'Email address is required.';
        if (!EMAIL_RE.test(value.trim())) return 'Please enter a valid email address.';
        return null;
    }

    /** Validate a password value — returns error string or null. */
    function validatePassword(value) {
        if (!value) return 'Password is required.';
        if (value.length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters.`;
        return null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSWORD VISIBILITY TOGGLE
    // ═══════════════════════════════════════════════════════════════════════

    function initPasswordToggles() {
        $$('.toggle-password-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                const input    = $('#' + targetId);
                const eyeOn    = $('.icon-eye', btn);
                const eyeOff   = $('.icon-eye-off', btn);

                if (input.type === 'password') {
                    input.type = 'text';
                    eyeOn.classList.add('hidden');
                    eyeOff.classList.remove('hidden');
                    btn.setAttribute('aria-label', 'Hide password');
                } else {
                    input.type = 'password';
                    eyeOn.classList.remove('hidden');
                    eyeOff.classList.add('hidden');
                    btn.setAttribute('aria-label', 'Show password');
                }

                input.focus();
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  LIVE FIELD VALIDATION (clear errors on correction)
    // ═══════════════════════════════════════════════════════════════════════

    function initLiveValidation() {
        // Login email
        $('#login-email').addEventListener('input', () => {
            if (!validateEmail($('#login-email').value)) clearError('login-email');
        });
        // Login password
        $('#login-password').addEventListener('input', () => {
            if (!validatePassword($('#login-password').value)) clearError('login-password');
        });

        // Register fields
        $('#reg-name').addEventListener('input', () => {
            if ($('#reg-name').value.trim()) clearError('reg-name');
        });
        $('#reg-email').addEventListener('input', () => {
            if (!validateEmail($('#reg-email').value)) clearError('reg-email');
        });
        $('#reg-password').addEventListener('input', () => {
            if (!validatePassword($('#reg-password').value)) clearError('reg-password');
            // Also re-check confirm if it has a value
            const confirm = $('#reg-confirm');
            if (confirm.value && confirm.value === $('#reg-password').value) {
                clearError('reg-confirm');
            }
        });
        $('#reg-confirm').addEventListener('input', () => {
            const pw = $('#reg-password').value;
            const cf = $('#reg-confirm').value;
            if (cf && cf === pw) clearError('reg-confirm');
        });

        // Forgot email
        $('#forgot-email').addEventListener('input', () => {
            if (!validateEmail($('#forgot-email').value)) clearError('forgot-email');
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  LOGIN FORM
    // ═══════════════════════════════════════════════════════════════════════

    function initLoginForm() {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clearFormErrors(loginForm);

            const email    = $('#login-email').value;
            const password = $('#login-password').value;
            let valid = true;

            const emailErr = validateEmail(email);
            if (emailErr) { showError('login-email', emailErr); valid = false; }

            const pwErr = validatePassword(password);
            if (pwErr) { showError('login-password', pwErr); valid = false; }

            if (!valid) {
                // Focus first invalid field
                const firstErr = loginForm.querySelector('.input-wrapper.has-error input');
                if (firstErr) firstErr.focus();
                return;
            }

            // Demo success
            if (window.sessionService) {
                const remember = $('#remember-me') ? $('#remember-me').checked : false;
                window.sessionService.login({ name: "Anu", email: email }, remember);
            }
            transitionToSuccess();
        });
    }

    function initRegisterForm() {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clearFormErrors(registerForm);

            const name     = $('#reg-name').value;
            const email    = $('#reg-email').value;
            const password = $('#reg-password').value;
            const confirm  = $('#reg-confirm').value;
            let valid = true;

            if (!name.trim()) {
                showError('reg-name', 'Full name is required.');
                valid = false;
            }

            const emailErr = validateEmail(email);
            if (emailErr) { showError('reg-email', emailErr); valid = false; }

            const pwErr = validatePassword(password);
            if (pwErr) { showError('reg-password', pwErr); valid = false; }

            if (!confirm) {
                showError('reg-confirm', 'Please confirm your password.');
                valid = false;
            } else if (confirm !== password) {
                showError('reg-confirm', 'Passwords do not match.');
                valid = false;
            }

            if (!valid) {
                const firstErr = registerForm.querySelector('.input-wrapper.has-error input');
                if (firstErr) firstErr.focus();
                return;
            }

            // ── Demo success ──
            if (window.sessionService) {
                window.sessionService.login({ name: "Anu", email: email }, true);
            }
            transitionToSuccess();
        });

        // Logout
        const btnLogout = $('#btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.sessionService) window.sessionService.logout();
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  CARD SWITCHING (login ↔ register)
    // ═══════════════════════════════════════════════════════════════════════

    function switchCard(hideCard, showCard) {
        // Animate out
        hideCard.classList.add('card-exit');

        hideCard.addEventListener('animationend', function handler() {
            hideCard.removeEventListener('animationend', handler);
            hideCard.classList.remove('card-exit');
            hideCard.classList.add('hidden');

            // Reset form errors in the card being hidden
            const form = $('form', hideCard);
            if (form) {
                form.reset();
                clearFormErrors(form);
            }
            // Reset any password visibility toggles
            $$('.toggle-password-btn', hideCard).forEach(btn => {
                const targetId = btn.getAttribute('data-target');
                const input = $('#' + targetId);
                if (input) input.type = 'password';
                const eyeOn  = $('.icon-eye', btn);
                const eyeOff = $('.icon-eye-off', btn);
                if (eyeOn)  eyeOn.classList.remove('hidden');
                if (eyeOff) eyeOff.classList.add('hidden');
                btn.setAttribute('aria-label', 'Show password');
            });

            // Show the other card
            showCard.classList.remove('hidden');
            // Re-trigger entry animation
            showCard.style.animation = 'none';
            // Force reflow
            void showCard.offsetHeight;
            showCard.style.animation = '';

            // Focus the first input in the new card
            const firstInput = showCard.querySelector('input');
            if (firstInput) firstInput.focus();
        }, { once: true });
    }

    function initCardSwitching() {
        // Login → Register
        $('#goto-register-btn').addEventListener('click', () => {
            switchCard(loginCard, registerCard);
        });
        $('#goto-register-link').addEventListener('click', () => {
            switchCard(loginCard, registerCard);
        });

        // Register → Login
        $('#back-to-login').addEventListener('click', () => {
            switchCard(registerCard, loginCard);
        });
        $('#goto-login-link').addEventListener('click', () => {
            switchCard(registerCard, loginCard);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  FORGOT PASSWORD MODAL
    // ═══════════════════════════════════════════════════════════════════════

    let previousFocus = null;

    function openForgotModal() {
        previousFocus = document.activeElement;

        // Reset state
        forgotForm.reset();
        clearFormErrors(forgotForm);
        forgotSuccess.classList.add('hidden');
        forgotForm.classList.remove('hidden');

        forgotModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Focus the email input
        setTimeout(() => $('#forgot-email').focus(), 100);
    }

    function closeForgotModal() {
        forgotModal.classList.add('hidden');
        document.body.style.overflow = '';

        // Restore focus
        if (previousFocus) {
            previousFocus.focus();
            previousFocus = null;
        }
    }

    function initForgotModal() {
        // Open
        $('#forgot-btn').addEventListener('click', openForgotModal);

        // Close button
        $('#forgot-close-btn').addEventListener('click', closeForgotModal);

        // Click backdrop
        forgotModal.addEventListener('click', (e) => {
            if (e.target === forgotModal) closeForgotModal();
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !forgotModal.classList.contains('hidden')) {
                closeForgotModal();
            }
        });

        // Trap focus inside modal
        forgotModal.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;
            const focusable = $$('input, button, [tabindex]:not([tabindex="-1"])', forgotModal)
                .filter(el => !el.closest('.hidden') && !el.disabled);
            if (!focusable.length) return;

            const first = focusable[0];
            const last  = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        });

        // Submit
        forgotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clearFormErrors(forgotForm);

            const email = $('#forgot-email').value;
            const emailErr = validateEmail(email);

            if (emailErr) {
                showError('forgot-email', emailErr);
                $('#forgot-email').focus();
                return;
            }

            // Show success message
            forgotForm.classList.add('hidden');
            forgotSuccess.classList.remove('hidden');
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SUCCESS TRANSITION
    // ═══════════════════════════════════════════════════════════════════════

    function transitionToSuccess() {
        // Hide login page
        loginPage.classList.add('hidden');

        // Show success screen
        successScreen.classList.remove('hidden');

        // Re-trigger animations
        successScreen.style.animation = 'none';
        void successScreen.offsetHeight;
        successScreen.style.animation = '';

        // Focus the continue button after animations finish
        setTimeout(() => $('#continue-btn').focus(), 1400);
    }

    function initSuccessScreen() {
        $('#continue-btn').addEventListener('click', () => {
            successScreen.classList.add('hidden');
            dashboardPage.classList.remove('hidden');

            // Update greeting based on time of day
            const hour = new Date().getHours();
            let greeting = 'Good Morning,';
            if (hour >= 12 && hour < 17) greeting = 'Good Afternoon,';
            else if (hour >= 17) greeting = 'Good Evening,';

            const greetEl = $('#greeting-time');
            if (greetEl) greetEl.textContent = greeting;
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  BACKEND HEALTH CHECK (for development)
    // ═══════════════════════════════════════════════════════════════════════

    async function checkBackendHealth() {
        try {
            const res  = await fetch(`${API_BASE}/api/health`);
            const data = await res.json();
            console.log('[MemoryVault] Backend health:', data);
        } catch (err) {
            console.warn('[MemoryVault] Backend not reachable:', err.message);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function init() {
        initPasswordToggles();
        initLiveValidation();
        initLoginForm();
        initRegisterForm();
        initCardSwitching();
        initForgotModal();
        initSuccessScreen();
        checkBackendHealth();

        console.log('[MemoryVault] App initialized.');
    }

    document.addEventListener('DOMContentLoaded', init);

})();
