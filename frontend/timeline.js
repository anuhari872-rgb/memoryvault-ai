/**
 * MemoryVault - Timeline Page Logic
 */
(function() {
    function $el(id) { return document.getElementById(id); }
    function $$el(sel, root = document) { return root.querySelectorAll(sel); }

    let currentFilters = {
        type: 'all',     // all, photo, video, voice, favorites
        search: '',
        year: '2026',    // "all" or specific year
        dateRange: 'all' // all, today, week, month, year
    };

    function initTimeline() {
        // Bind Filters
        const typeBtns = $$el('.tl-filters-left .tl-filter-btn');
        typeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                typeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilters.type = btn.getAttribute('data-type');
                renderTimeline();
            });
        });

        const dateBtns = $$el('.tl-filters-right .tl-filter-btn');
        dateBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // toggle off if already active
                if (btn.classList.contains('active')) {
                    btn.classList.remove('active');
                    currentFilters.dateRange = 'all';
                } else {
                    dateBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentFilters.dateRange = btn.getAttribute('data-date');
                }
                renderTimeline();
            });
        });

        // Search
        const searchInput = $el('tl-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                currentFilters.search = e.target.value.toLowerCase();
                renderTimeline();
            });
        }

        // Year Select
        const yearSelect = $el('tl-year-select');
        if (yearSelect) {
            // Populate years dynamically from existing data
            if (window.memoryStore) {
                const mems = window.memoryStore.getAll();
                const years = new Set(mems.filter(m => m.date).map(m => m.date.substring(0,4)));
                years.add(new Date().getFullYear().toString());
                const sortedYears = Array.from(years).sort().reverse();
                yearSelect.innerHTML = `<option value="all">All Years</option>` + 
                                       sortedYears.map(y => `<option value="${y}">${y}</option>`).join('');
                yearSelect.value = new Date().getFullYear().toString();
                currentFilters.year = yearSelect.value;
            }

            yearSelect.addEventListener('change', (e) => {
                currentFilters.year = e.target.value;
                renderTimeline();
            });
        }

        // Subscribe to store updates
        if (window.memoryStore) {
            window.memoryStore.subscribe(renderTimeline);
        }

        // Close dropdowns on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.tl-btn-more') && !e.target.closest('.tl-more-menu')) {
                $$el('.tl-more-menu.show').forEach(m => m.classList.remove('show'));
            }
        });

        renderTimeline();
    }

    function isDateInRange(dateStr, range) {
        if (!dateStr || range === 'all') return true;
        const today = new Date();
        const parts = dateStr.split('-');
        const d = new Date(parts[0], parts[1]-1, parts[2]);
        
        if (range === 'today') {
            return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
        }
        if (range === 'week') {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            startOfWeek.setHours(0,0,0,0);
            return d >= startOfWeek && d <= today;
        }
        if (range === 'month') {
            return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
        }
        if (range === 'year') {
            return d.getFullYear() === today.getFullYear();
        }
        return true;
    }

    function renderTimeline() {
        const container = $el('tl-main-container');
        if (!container) return;

        if (!window.memoryStore) {
            container.innerHTML = '<div class="tl-empty">Unable to load memory store.</div>';
            return;
        }

        let memories = window.memoryStore.getAll();

        // 1. Filter by Type
        if (currentFilters.type !== 'all') {
            if (currentFilters.type === 'favorites') {
                memories = memories.filter(m => m.favorite);
            } else {
                memories = memories.filter(m => m.type === currentFilters.type);
            }
        }

        // 2. Filter by Search
        if (currentFilters.search) {
            const s = currentFilters.search;
            memories = memories.filter(m => {
                const text = `${m.title||''} ${m.reflection||''} ${m.location||''} ${(m.tags||[]).join(' ')}`.toLowerCase();
                return text.includes(s);
            });
        }

        // 3. Filter by Year Dropdown
        if (currentFilters.year !== 'all') {
            memories = memories.filter(m => m.date && m.date.startsWith(currentFilters.year));
        }

        // 4. Filter by Date Range (Today/Week/Month)
        if (currentFilters.dateRange !== 'all') {
            memories = memories.filter(m => isDateInRange(m.date, currentFilters.dateRange));
        }

        // 5. Sort newest first
        memories.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        if (memories.length === 0) {
            container.innerHTML = `
                <div class="tl-empty">
                    <div class="tl-empty-icon">🌱</div>
                    <div class="tl-empty-title">Your memory journey is just beginning</div>
                    <div class="tl-empty-subtitle">Capture your first moment and it will appear here.</div>
                    <button class="btn-submit" onclick="document.querySelector('[data-page=\\'capture\\']').click()">Capture a Memory</button>
                </div>
            `;
            return;
        }

        // Group by Date
        const grouped = {};
        memories.forEach(m => {
            const dateStr = m.date || 'Unknown Date';
            if (!grouped[dateStr]) grouped[dateStr] = [];
            grouped[dateStr].push(m);
        });

        // Sort grouped dates descending
        const sortedDates = Object.keys(grouped).sort((a, b) => {
            if (a === 'Unknown Date') return 1;
            if (b === 'Unknown Date') return -1;
            return new Date(b) - new Date(a);
        });

        let html = '';

        sortedDates.forEach(dateStr => {
            let displayDate = dateStr;
            let displayDay = '';
            if (dateStr !== 'Unknown Date') {
                const parts = dateStr.split('-');
                const d = new Date(parts[0], parts[1]-1, parts[2]);
                displayDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                displayDay = d.toLocaleDateString(undefined, { weekday: 'long' });
            }

            html += `
                <div class="tl-date-group">
                    <div class="tl-date-header">
                        <div class="tl-date-dot-outline"></div>
                        <div class="tl-date-dot"></div>
                        <div class="tl-date-title">${displayDate} <span style="font-weight:400; color:var(--color-text-secondary); font-size:0.9rem;">• ${displayDay}</span></div>
                    </div>
            `;

            grouped[dateStr].forEach(m => {
                html += generateMemoryCard(m);
            });

            html += `</div>`;
        });

        container.innerHTML = html;
    }

    function generateMemoryCard(m) {
        let typeIcon = '📝';
        let typeClass = 'text';
        let mediaHtml = '';

        // Time format
        let timeStr = m.time || '';
        if (timeStr) {
            const parts = timeStr.split(':');
            let h = parseInt(parts[0], 10);
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            if (h === 0) h = 12;
            timeStr = `${h}:${parts[1]} ${ampm}`;
        }

        if (m.type === 'photo') {
            typeIcon = '📷'; typeClass = 'photo';
            if (m.mediaUrl) {
                mediaHtml = `<img loading="lazy" src="${m.mediaUrl}" class="tl-thumbnail" onclick="if(window.openModal) window.openModal('${m.id}')">`;
            }
        } else if (m.type === 'voice') {
            typeIcon = '🎙'; typeClass = 'voice';
            if (m.mediaUrl) {
                mediaHtml = `
                    <div class="tl-voice-player">
                        <audio src="${m.mediaUrl}" controls style="width:140px; height:32px; outline:none;"></audio>
                        <div style="font-size:0.75rem; margin-top:8px; color:var(--color-text-secondary);">Voice Note</div>
                    </div>
                `;
            }
        } else if (m.type === 'video') {
            typeIcon = '🎥'; typeClass = 'video';
            if (m.mediaUrl) {
                mediaHtml = `
                    <div class="tl-thumbnail" style="display:flex;align-items:center;justify-content:center;background:#222;color:white;font-size:2rem;position:relative;" onclick="if(window.openModal) window.openModal('${m.id}')">
                        <img loading="lazy" src="${m.mediaUrl}" style="position:absolute;width:100%;height:100%;object-fit:cover;opacity:0.5;">
                        <span style="z-index:2;">▶</span>
                    </div>
                `;
            }
        } else {
            typeIcon = '📝'; typeClass = 'text';
        }

        let tagsHtml = '';
        const allTags = [];
        if (m.location) allTags.push({ icon: '📍', label: m.location });
        if (m.tags && Array.isArray(m.tags)) {
            m.tags.forEach(t => allTags.push({ icon: '🏷️', label: t }));
        } else {
            // Auto-infer for visual richness if no tags exist
            const txt = ((m.title||'') + ' ' + (m.reflection||'')).toLowerCase();
            if (txt.includes('nature') || txt.includes('walk') || txt.includes('park')) allTags.push({icon:'🍃', label:'Nature'});
            if (txt.includes('food') || txt.includes('coffee') || txt.includes('eat')) allTags.push({icon:'☕', label:'Food'});
            if (txt.includes('friend') || txt.includes('people') || txt.includes('meet')) allTags.push({icon:'👥', label:'Friends'});
            if (txt.includes('work') || txt.includes('study')) allTags.push({icon:'🎓', label:'Study'});
            if (txt.includes('trip') || txt.includes('travel')) allTags.push({icon:'✈️', label:'Travel'});
        }

        if (allTags.length > 0) {
            tagsHtml = `<div class="tl-tags">` + allTags.map(t => `<span class="tl-tag"><span>${t.icon}</span> ${t.label}</span>`).join('') + `</div>`;
        } else {
            tagsHtml = `<div class="tl-tags"><span class="tl-tag"><span>${typeIcon}</span> ${m.type.charAt(0).toUpperCase() + m.type.slice(1)}</span></div>`;
        }

        const favClass = m.favorite ? 'active' : '';
        const favIcon = m.favorite ? '❤️' : '♡';

        return `
            <div class="tl-card">
                <div class="tl-card-left">
                    <div class="tl-type-icon ${typeClass}">${typeIcon}</div>
                    <div class="tl-time">${timeStr}</div>
                </div>
                <div class="tl-card-center">
                    ${mediaHtml}
                    <div class="tl-content">
                        <div class="tl-memory-title">${m.title || 'Untitled Memory'}</div>
                        <div class="tl-memory-preview">${m.reflection || 'No reflection added.'}</div>
                        ${tagsHtml}
                    </div>
                </div>
                <div class="tl-card-right">
                    <button class="tl-btn-fav ${favClass}" onclick="window.tlToggleFav('${m.id}')">${favIcon}</button>
                    <div style="position:relative;">
                        <button class="tl-btn-more" onclick="window.tlToggleMenu(event, '${m.id}')">⋮</button>
                        <div class="tl-more-menu" id="tl-menu-${m.id}">
                            <button class="tl-menu-item" onclick="if(window.openModal) window.openModal('${m.id}')">View Memory</button>
                            <button class="tl-menu-item" onclick="window.tlEditTitle('${m.id}')">Edit Title</button>
                            <button class="tl-menu-item danger" onclick="window.tlDeleteMemory('${m.id}')">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Expose global handlers for inline onclick usage
    window.tlToggleFav = function(id) {
        if (!window.memoryStore) return;
        const mem = window.memoryStore.getAll().find(m => m.id === id);
        if (mem) {
            window.memoryStore.update(id, { favorite: !mem.favorite });
        }
    };

    window.tlToggleMenu = function(e, id) {
        e.stopPropagation();
        $$el('.tl-more-menu.show').forEach(m => m.classList.remove('show'));
        const menu = $el(`tl-menu-${id}`);
        if (menu) menu.classList.add('show');
    };

    window.tlEditTitle = function(id) {
        if (!window.memoryStore) return;
        const mem = window.memoryStore.getAll().find(m => m.id === id);
        if (mem) {
            const newTitle = prompt('Edit memory title:', mem.title);
            if (newTitle !== null && newTitle.trim() !== '') {
                window.memoryStore.update(id, { title: newTitle.trim() });
            }
        }
    };

    window.tlDeleteMemory = function(id) {
        if (!window.memoryStore) return;
        if (confirm('Are you sure you want to delete this memory? This action cannot be undone.')) {
            window.memoryStore.remove(id);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTimeline);
    } else {
        initTimeline();
    }
})();
