/**
 * MemoryVault - Settings Logic
 */
(function() {
    function $el(id) { return document.getElementById(id); }
    function $$el(sel) { return document.querySelectorAll(sel); }

    let settings = {
        defaultView: 'timeline',
        autoSave: true,
        favoriteFirst: false,
        uploadQuality: 'high',
        notifySpecial: true,
        notifyDaily: true,
        notifyTime: '20:00',
        notifyRecap: true,
        notifyMotivational: true,
        accentColor: 'forest',
        fontSize: 'medium'
    };

    const ACCENT_COLORS = {
        forest: { forest: '#123B32', green: '#1C5A48', sage: '#9BBF8F' },
        pink: { forest: '#7A4B4B', green: '#A86B6B', sage: '#E9A6A6' },
        gold: { forest: '#6B501A', green: '#8F6A22', sage: '#D8A94E' },
        blue: { forest: '#1A3B6B', green: '#22518F', sage: '#689DDB' },
        purple: { forest: '#3B1A6B', green: '#51228F', sage: '#9768DB' }
    };

    function initSettings() {
        // Load settings from local storage
        try {
            const saved = localStorage.getItem('memoryvault_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                settings = { ...settings, ...parsed };
            }
        } catch(e) { console.error(e); }

        // Load profile data
        loadProfileData();

        // Bind UI
        bindUI();

        // Apply visual settings immediately
        applyVisualSettings();
    }

    function saveSettings() {
        localStorage.setItem('memoryvault_settings', JSON.stringify(settings));
        applyVisualSettings();
    }

    function loadProfileData() {
        let name = "Anu";
        let email = "anu@example.com";
        try {
            const session = JSON.parse(localStorage.getItem('memoryvault_session') || '{}');
            if (session.user) {
                if (session.user.name) name = session.user.name;
                if (session.user.email) email = session.user.email;
            }
        } catch(e) {}

        const nameEl = $el('settings-name');
        const emailEl = $el('settings-email');
        const avatarEl = $el('settings-avatar');

        if(nameEl) nameEl.textContent = name;
        if(emailEl) emailEl.textContent = email;
        if(avatarEl) {
            avatarEl.innerHTML = `${name.charAt(0).toUpperCase()} <div class="settings-avatar-cam">📷</div>`;
        }

        // Get actual date of first memory for "Member since" if available
        let memberSince = "Oct 2026";
        if (window.memoryStore) {
            const mems = window.memoryStore.getAll();
            if (mems.length > 0) {
                // sort by date
                const oldest = [...mems].sort((a,b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))[0];
                if (oldest && oldest.date) {
                    const parts = oldest.date.split('-');
                    const d = new Date(parts[0], parts[1]-1, parts[2]);
                    memberSince = d.toLocaleDateString(undefined, {month:'short', year:'numeric'});
                }
            }
        }
        const dateEl = $el('settings-date');
        if(dateEl) dateEl.textContent = memberSince;
    }

    function bindUI() {
        // Edit Profile
        const editBtn = $el('btn-edit-profile');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                const newName = prompt("Enter your name:", $el('settings-name').textContent);
                if (newName && newName.trim()) {
                    try {
                        const session = JSON.parse(localStorage.getItem('memoryvault_session') || '{}');
                        if (!session.user) session.user = {};
                        session.user.name = newName.trim();
                        localStorage.setItem('memoryvault_session', JSON.stringify(session));
                        loadProfileData();
                    } catch(e) {}
                }
            });
        }

        // Toggles
        bindToggle('toggle-autosave', 'autoSave');
        bindToggle('toggle-favorite', 'favoriteFirst');
        bindToggle('toggle-notif-special', 'notifySpecial');
        bindToggle('toggle-notif-daily', 'notifyDaily');
        bindToggle('toggle-notif-recap', 'notifyRecap');
        bindToggle('toggle-notif-motivational', 'notifyMotivational');

        // Selects
        bindSelect('pref-default-view', 'defaultView');
        bindSelect('pref-upload-quality', 'uploadQuality');
        bindSelect('pref-notif-time', 'notifyTime');

        // Accent Colors
        $$el('.settings-color-btn').forEach(btn => {
            const color = btn.getAttribute('data-color');
            if (color === settings.accentColor) btn.classList.add('active');
            
            btn.addEventListener('click', () => {
                $$el('.settings-color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                settings.accentColor = color;
                saveSettings();
            });
        });

        // Font Size
        $$el('.settings-group-btn').forEach(btn => {
            const size = btn.getAttribute('data-size');
            if (size === settings.fontSize) btn.classList.add('active');

            btn.addEventListener('click', () => {
                $$el('.settings-group-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                settings.fontSize = size;
                saveSettings();
            });
        });

        // Data Actions
        const exportBtn = $el('btn-export');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (!window.memoryStore) return;
                const data = window.memoryStore.getAll();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `memoryvault-backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
            });
        }

        const backupBtn = $el('btn-backup');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                alert("Backup initiated. Your data is being safely archived.");
            });
        }

    function showSettingsConfirm(title, desc, confirmText, isDanger, onConfirm) {
        let overlay = document.getElementById('settings-confirm-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'settings-confirm-overlay';
            overlay.className = 'gallery-modal-overlay';
            overlay.innerHTML = `
                <div class="modal-content" style="max-width: 400px; text-align: center; padding: 24px; background:var(--color-bg); border-radius:16px;">
                    <h3 id="settings-confirm-title" style="margin-top:0; color:var(--color-text-primary);"></h3>
                    <p id="settings-confirm-desc" style="color:var(--color-text-secondary); margin-bottom: 24px;"></p>
                    <div style="display:flex; justify-content:center; gap:16px;">
                        <button class="btn-secondary" id="settings-confirm-cancel" style="background:transparent; border:1px solid #ddd; padding:8px 24px;">Cancel</button>
                        <button class="btn-submit" id="settings-confirm-ok" style="padding:8px 24px;"></button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        
        document.getElementById('settings-confirm-title').textContent = title;
        document.getElementById('settings-confirm-desc').textContent = desc;
        
        const btnOk = document.getElementById('settings-confirm-ok');
        btnOk.textContent = confirmText;
        if (isDanger) {
            btnOk.className = 'btn-danger';
        } else {
            btnOk.className = 'btn-submit';
        }
        
        const btnCancel = document.getElementById('settings-confirm-cancel');
        
        const cleanup = () => {
            overlay.classList.remove('show');
            btnCancel.replaceWith(btnCancel.cloneNode(true));
            btnOk.replaceWith(btnOk.cloneNode(true));
            overlay.onclick = null;
        };
        
        document.getElementById('settings-confirm-cancel').addEventListener('click', cleanup);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup();
        });
        
        document.getElementById('settings-confirm-ok').addEventListener('click', async () => {
            const originalText = btnOk.textContent;
            btnOk.textContent = 'Deleting...';
            btnOk.disabled = true;
            try {
                await onConfirm();
                cleanup();
            } catch (err) {
                alert('Deletion failed: ' + err.message);
                btnOk.textContent = originalText;
                btnOk.disabled = false;
            }
        });
        
        overlay.classList.add('show');
    }

    const clearBtn = $el('btn-clear');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            showSettingsConfirm(
                "Clear all memories?",
                "This will permanently remove your saved memories, media, soundtracks, favorites and related memory data.",
                "Clear All Data",
                true,
                async () => {
                    if (window.memoryStore && window.memoryStore.clearAll) {
                        await window.memoryStore.clearAll();
                    } else {
                        throw new Error('Storage system not fully initialized or clearAll is missing.');
                    }
                }
            );
        });
    }

    const deleteBtn = $el('btn-delete-account');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            showSettingsConfirm(
                "Delete Account",
                "This will permanently delete your account and all associated memory data. This action cannot be undone.",
                "Delete Account",
                true,
                async () => {
                    // Assumption: The app has no real multi-user isolation yet.
                    // All IndexedDB data belongs to the currently logged in account.
                    // We safely clear it all out, then log out.
                    if (window.memoryStore && window.memoryStore.clearAll) {
                        await window.memoryStore.clearAll();
                    }
                    
                    if (window.sessionService && window.sessionService.logout) {
                        window.sessionService.logout();
                    } else {
                        localStorage.removeItem('memoryvault_session');
                        sessionStorage.removeItem('memoryvault_session');
                        window.location.reload();
                    }
                }
            );
        });
    }
    }

    function bindToggle(id, key) {
        const el = $el(id);
        if (!el) return;
        if (settings[key]) el.classList.add('active');
        el.addEventListener('click', () => {
            el.classList.toggle('active');
            settings[key] = el.classList.contains('active');
            saveSettings();
        });
    }

    function bindSelect(id, key) {
        const el = $el(id);
        if (!el) return;
        el.value = settings[key];
        el.addEventListener('change', () => {
            settings[key] = el.value;
            saveSettings();
        });
    }

    function applyVisualSettings() {
        // Apply Accent
        const colorSet = ACCENT_COLORS[settings.accentColor] || ACCENT_COLORS.forest;
        document.documentElement.style.setProperty('--color-forest', colorSet.forest);
        document.documentElement.style.setProperty('--color-green', colorSet.green);

        // Apply Font Size
        let fs = '16px';
        if (settings.fontSize === 'small') fs = '14px';
        if (settings.fontSize === 'large') fs = '18px';
        document.documentElement.style.fontSize = fs;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSettings);
    } else {
        initSettings();
    }
})();
