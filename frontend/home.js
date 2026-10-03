/**
 * MemoryVault AI — Home Page Module
 *
 * Handles:
 *   - Compact calendar (generation, navigation)
 *   - Sidebar navigation & mobile toggle
 *   - Page switching (home ↔ placeholders)
 *   - Capture Now navigation
 *
 * All data is demo-only. No database, no real functionality.
 */

(function () {
    'use strict';

    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];

    // ═══════════════════════════════════════════════════════════════════════
    //  DEMO DATA
    // ═══════════════════════════════════════════════════════════════════════



    // ═══════════════════════════════════════════════════════════════════════
    //  CALENDAR
    // ═══════════════════════════════════════════════════════════════════════

    let calYear  = 2026;
    let calMonth = 8; // 0-indexed → September

    const MONTH_NAMES = [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
    ];
    const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    function renderCalendar() {
        const label = $('#cal-month-label');
        const grid  = $('#cal-grid');
        if (!label || !grid) return;

        label.textContent = `${MONTH_NAMES[calMonth]} ${calYear}`;

        // Build header row
        let html = DAY_NAMES.map(d =>
            `<span class="cal-day-name">${d}</span>`
        ).join('');

        // Build actual events mapping
        const actualEvents = {};
        if (window.memoryStore) {
            window.memoryStore.getAll().forEach(m => {
                if (!m.date) return;
                let y, mo, da;
                if (typeof m.date === 'string' && m.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const parts = m.date.split('-');
                    y = parseInt(parts[0], 10);
                    mo = parseInt(parts[1], 10);
                    da = parseInt(parts[2], 10);
                } else {
                    const dObj = new Date(m.date);
                    y = dObj.getFullYear();
                    mo = dObj.getMonth() + 1;
                    da = dObj.getDate();
                }
                const k = `${y}-${mo}-${da}`;
                if (m.type === 'special_day') {
                    actualEvents[k] = 'birthday';
                } else if (m.type !== 'reflection') {
                    actualEvents[k] = 'memory';
                }
            });
        }

        // First day of month & total days
        const firstDay  = new Date(calYear, calMonth, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const prevMonthDays = new Date(calYear, calMonth, 0).getDate();

        // Today
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

        // Previous month fill
        for (let i = firstDay - 1; i >= 0; i--) {
            const d = prevMonthDays - i;
            html += `<span class="cal-day outside">${d}</span>`;
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const key = `${calYear}-${calMonth + 1}-${d}`;
            const dateStr = `${calYear}-${calMonth}-${d}`;
            const isToday = dateStr === todayStr;
            const event = actualEvents[`${calYear}-${calMonth + 1}-${d}`];

            let cls = 'cal-day';
            if (isToday) cls += ' today';

            let dot = '';
            if (event) {
                dot = `<span class="cal-dot dot-${event}"></span>`;
            }

            html += `<span class="${cls}">${d}${dot}</span>`;
        }

        // Next month fill (complete the grid to 6 rows × 7 cols = 42 cells)
        const totalCells = firstDay + daysInMonth;
        const remaining = (7 - (totalCells % 7)) % 7;
        for (let d = 1; d <= remaining; d++) {
            html += `<span class="cal-day outside">${d}</span>`;
        }

        grid.innerHTML = html;
    }

    function initCalendar() {
        const prevBtn  = $('#cal-prev');
        const nextBtn  = $('#cal-next');
        const todayBtn = $('#cal-today');

        if (prevBtn) prevBtn.addEventListener('click', () => {
            calMonth--;
            if (calMonth < 0) { calMonth = 11; calYear--; }
            renderCalendar();
        });

        if (nextBtn) nextBtn.addEventListener('click', () => {
            calMonth++;
            if (calMonth > 11) { calMonth = 0; calYear++; }
            renderCalendar();
        });

        if (todayBtn) todayBtn.addEventListener('click', () => {
            const now = new Date();
            calYear  = now.getFullYear();
            calMonth = now.getMonth();
            renderCalendar();
        });

        renderCalendar();
        if (window.memoryStore) window.memoryStore.subscribe(renderCalendar);
        
    }


    // ═══════════════════════════════════════════════════════════════════════
    //  SIDEBAR NAVIGATION
    // ═══════════════════════════════════════════════════════════════════════

    function initSidebar() {
        const navItems       = $$('.nav-item');
        const homeContent    = $('#page-home');
        const placeholderEl  = $('#page-placeholder');
        const placeholderTitle = $('#placeholder-title');
        const hamburger      = $('#hamburger-btn');
        const sidebar        = $('.sidebar');
        const overlay        = $('#sidebar-overlay');

        // Nav click → switch pages
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');

                // Update active state
                navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');

                // Generic hide all pages
                $$('.page-content').forEach(p => p.classList.add('hidden'));

                const targetPage = document.getElementById(`page-${page}`);
                if (targetPage) {
                    targetPage.classList.remove('hidden');
                } else {
                    // Fallback to placeholder for unbuilt pages
                    const placeholderEl = document.getElementById('page-placeholder');
                    if (placeholderEl) {
                        placeholderEl.classList.remove('hidden');
                        
                        const placeholderTitle = document.getElementById('placeholder-title');
                        if (placeholderTitle) {
                            placeholderTitle.textContent = page.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                        }

                        // Re-trigger animation
                        placeholderEl.style.animation = 'none';
                        void placeholderEl.offsetHeight;
                        placeholderEl.style.animation = '';
                    }
                }

                // Close mobile sidebar
                closeMobileSidebar();
            });
        });

        // Mobile hamburger
        if (hamburger) {
            hamburger.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                if (overlay) overlay.classList.toggle('visible');
            });
        }

        // Overlay click closes sidebar
        if (overlay) {
            overlay.addEventListener('click', closeMobileSidebar);
        }

        function closeMobileSidebar() {
            if (sidebar) sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('visible');
        }
    }


    // ═══════════════════════════════════════════════════════════════════════
    //  CAPTURE NOW BUTTON
    // ═══════════════════════════════════════════════════════════════════════

    function initCaptureButton() {
        const btn = $('#capture-now-btn');
        if (!btn) return;

        btn.addEventListener('click', () => {
            // Simulate clicking the Capture nav item
            const captureNav = $('[data-page="capture"]');
            if (captureNav) captureNav.click();
        });
    }


    // ═══════════════════════════════════════════════════════════════════════
    //  GREETING (time-based)
    // ═══════════════════════════════════════════════════════════════════════

    function updateGreeting() {
        const el = $('#greeting-time');
        if (!el) return;

        const hour = new Date().getHours();
        let greeting = 'Good Morning,';
        if (hour >= 12 && hour < 17) greeting = 'Good Afternoon,';
        else if (hour >= 17) greeting = 'Good Evening,';

        el.textContent = greeting;
    }


    // ═══════════════════════════════════════════════════════════════════════
    //  RECENT MEMORIES
    // ═══════════════════════════════════════════════════════════════════════
    
    function initRecentMemories() {
        if (!window.memoryStore) return;
        
        // Use a delegated event listener for favorites so we don't duplicate on re-renders
        const container = $('#home-recent-grid');
        if (container && !container.dataset.eventsAttached) {
            container.addEventListener('click', (e) => {
                const favBtn = e.target.closest('.toggle-fav-btn');
                if (favBtn) {
                    e.stopPropagation();
                    const id = favBtn.getAttribute('data-id');
                    window.memoryStore.toggleFavorite(id);
                }
            });
            container.dataset.eventsAttached = 'true';
        }

        window.memoryStore.subscribe(() => {
            if (!container) return;
            
            // Get latest 4 memories
            const allMemories = window.memoryStore.getFilteredAndSorted({ type: 'all', sort: 'newest' });
            const recent = allMemories.slice(0, 4);
            
            if (recent.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1/-1; text-align:center; padding: 20px; background:var(--color-bg); border-radius:var(--radius-sm)">
                        <p style="color:var(--color-text-secondary); margin-bottom:12px">Your recent memories will appear here 🌱<br>Capture a moment and it will show up here.</p>
                        <button type="button" class="btn-submit" onclick="document.querySelector('[data-page=capture]').click()">Capture a Memory</button>
                    </div>`;
                return;
            }
            
            let html = '';
            recent.forEach(m => {
                const dateObj = new Date(m.date);
                const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const dateStr = `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
                
                let thumbHtml = '';
                if (m.type === 'photo') {
                    thumbHtml = `<div class="memory-thumb" style="background-image:url(${m.mediaUrl || ''}); background-size:cover; background-position:center; position:relative;"></div>`;
                } else if (m.type === 'voice') {
                    thumbHtml = `<div class="memory-thumb" style="background:var(--color-sage-light); display:flex; align-items:center; justify-content:center; color:var(--color-forest); position:relative;"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg></div>`;
                } else if (m.type === 'video') {
                    thumbHtml = `<div class="memory-thumb" style="background:var(--color-card); display:flex; align-items:center; justify-content:center; color:var(--color-forest); position:relative; overflow:hidden;"><video src="${m.mediaUrl || ''}" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; pointer-events:none"></video><div style="z-index:2; background:rgba(0,0,0,0.4); width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></div></div>`;
                }
                
                const typeIcon = m.type === 'voice' ? '🎤' : (m.type === 'video' ? '🎥' : '');
                const titleText = m.title || 'Untitled Memory';
                
                // Favorite Button Overlay
                const favBtnHtml = `
                    <button class="btn-fav toggle-fav-btn ${m.favorite ? 'is-favorite' : ''}" data-id="${m.id}" style="position:absolute; top:8px; right:8px; z-index:10; background:var(--color-bg); border-radius:50%; padding:4px; border:none; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </button>
                `;
                
                html += `
                    <div class="memory-item" style="cursor:pointer; position:relative;" onclick="if(window.openModal) window.openModal('${m.id}')">
                        ${thumbHtml}
                        ${favBtnHtml}
                        <p class="memory-title" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:8px;">${typeIcon} ${titleText}</p>
                        <p class="memory-date" style="color:var(--color-text-muted); font-size:0.85rem;">${dateStr}</p>
                    </div>
                `;
            });
            
            container.innerHTML = html;
            
            // Bind fav buttons
            $$('.toggle-fav-btn', container).forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation(); // Prevent opening modal
                    const id = btn.getAttribute('data-id');
                    const isFav = btn.classList.contains('is-favorite');
                    await window.memoryStore.update(id, { favorite: !isFav });
                    // Memory store notify will trigger re-render
                });
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function getHomePlantSVG(streak) {
        const potHtml = `
            <rect x="36" y="126" width="68" height="10" rx="3" fill="#D8A94E"/>
            <path d="M40 136 L48 172 Q52 178 70 178 Q88 178 92 172 L100 136Z" fill="#C49A3C"/>
            <path d="M44 136 L50 168 Q52 172 62 172 L62 136Z" fill="#D8A94E" opacity="0.3"/>
            <ellipse cx="70" cy="131" rx="30" ry="6" fill="#8B7355"/>
        `;
        const groundHtml = `
            <ellipse cx="70" cy="160" rx="50" ry="12" fill="#8B7355"/>
            <ellipse cx="70" cy="160" rx="45" ry="10" fill="#79A96B" opacity="0.8"/>
        `;
        let innerSvg = '';
        if (streak >= 100) {
            innerSvg = groundHtml + `
                <path d="M70 160 L70 60" stroke="#7A5135" stroke-width="20" fill="none" stroke-linecap="round"/>
                <path d="M70 130 C50 110 25 95 15 85" stroke="#7A5135" stroke-width="10" fill="none" stroke-linecap="round"/>
                <path d="M70 115 C90 95 115 80 125 70" stroke="#7A5135" stroke-width="10" fill="none" stroke-linecap="round"/>
                <path d="M70 90 C55 70 45 50 40 40" stroke="#7A5135" stroke-width="8" fill="none" stroke-linecap="round"/>
                <path d="M70 80 C85 60 95 45 100 35" stroke="#7A5135" stroke-width="8" fill="none" stroke-linecap="round"/>
                <circle cx="15" cy="75" r="40" fill="#79A96B"/>
                <circle cx="125" cy="65" r="40" fill="#5F9F55"/>
                <circle cx="40" cy="35" r="35" fill="#9BBF8F"/>
                <circle cx="100" cy="30" r="35" fill="#79A96B"/>
                <circle cx="70" cy="20" r="50" fill="#DDEBD8"/>
                <circle cx="70" cy="60" r="30" fill="#5F9F55" opacity="0.8"/>
                <circle cx="30" cy="30" r="3" fill="#FFF" opacity="0.8"/>
                <circle cx="110" cy="20" r="4" fill="#FFF" opacity="0.8"/>
                <circle cx="70" cy="5" r="2" fill="#FFF" opacity="0.8"/>
            `;
        } else if (streak >= 60) {
            innerSvg = groundHtml + `
                <path d="M70 160 L70 70" stroke="#7A5135" stroke-width="16" fill="none" stroke-linecap="round"/>
                <path d="M70 130 C60 110 40 90 30 80" stroke="#7A5135" stroke-width="8" fill="none" stroke-linecap="round"/>
                <path d="M70 120 C80 100 100 85 110 75" stroke="#7A5135" stroke-width="8" fill="none" stroke-linecap="round"/>
                <path d="M70 95 L55 60" stroke="#7A5135" stroke-width="6" fill="none" stroke-linecap="round"/>
                <path d="M70 85 L85 55" stroke="#7A5135" stroke-width="6" fill="none" stroke-linecap="round"/>
                <circle cx="25" cy="70" r="35" fill="#79A96B"/>
                <circle cx="115" cy="65" r="35" fill="#5F9F55"/>
                <circle cx="70" cy="40" r="45" fill="#9BBF8F"/>
                <circle cx="50" cy="35" r="30" fill="#DDEBD8" opacity="0.5"/>
                <circle cx="90" cy="40" r="25" fill="#79A96B" opacity="0.8"/>
            `;
        } else if (streak >= 30) {
            innerSvg = groundHtml + `
                <path d="M70 160 L70 80" stroke="#7A5135" stroke-width="12" fill="none" stroke-linecap="round"/>
                <path d="M70 130 L45 95" stroke="#7A5135" stroke-width="6" fill="none" stroke-linecap="round"/>
                <path d="M70 110 L95 80" stroke="#7A5135" stroke-width="6" fill="none" stroke-linecap="round"/>
                <path d="M70 95 L60 70" stroke="#7A5135" stroke-width="5" fill="none" stroke-linecap="round"/>
                <circle cx="40" cy="85" r="30" fill="#79A96B"/>
                <circle cx="100" cy="75" r="32" fill="#5F9F55"/>
                <circle cx="70" cy="55" r="38" fill="#9BBF8F"/>
                <circle cx="55" cy="50" r="25" fill="#DDEBD8" opacity="0.6"/>
            `;
        } else if (streak >= 14) {
            innerSvg = groundHtml + `
                <path d="M70 160 L70 90" stroke="#7A5135" stroke-width="8" fill="none" stroke-linecap="round"/>
                <path d="M70 120 L55 95" stroke="#7A5135" stroke-width="4" fill="none" stroke-linecap="round"/>
                <path d="M70 105 L85 85" stroke="#7A5135" stroke-width="4" fill="none" stroke-linecap="round"/>
                <circle cx="50" cy="85" r="25" fill="#79A96B" opacity="0.9"/>
                <circle cx="90" cy="75" r="22" fill="#5F9F55" opacity="0.9"/>
                <circle cx="70" cy="65" r="28" fill="#9BBF8F" opacity="0.9"/>
            `;
        } else if (streak >= 7) {
            innerSvg = potHtml + `
                <path d="M70 126 C66 100 74 75 68 45" stroke="#1C5A48" stroke-width="3" fill="none" stroke-linecap="round"/>
                <path d="M70 115 C55 105 45 100 35 95" stroke="#1C5A48" stroke-width="2" fill="none" stroke-linecap="round"/>
                <path d="M69 95 C85 85 95 80 105 75" stroke="#1C5A48" stroke-width="2" fill="none" stroke-linecap="round"/>
                <path d="M68 75 C55 65 48 60 40 55" stroke="#1C5A48" stroke-width="2" fill="none" stroke-linecap="round"/>
                <path d="M68 60 C80 50 88 45 95 40" stroke="#1C5A48" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                <ellipse cx="30" cy="90" rx="18" ry="9" transform="rotate(-35 30 90)" fill="#9BBF8F"/>
                <ellipse cx="110" cy="70" rx="18" ry="9" transform="rotate(35 110 70)" fill="#DDEBD8"/>
                <ellipse cx="35" cy="50" rx="15" ry="7.5" transform="rotate(-25 35 50)" fill="#DDEBD8"/>
                <ellipse cx="100" cy="35" rx="14" ry="7" transform="rotate(25 100 35)" fill="#9BBF8F"/>
                <ellipse cx="65" cy="35" rx="15" ry="7.5" transform="rotate(-15 65 35)" fill="#9BBF8F"/>
            `;
        } else if (streak >= 3) {
            innerSvg = potHtml + `
                <path d="M70 126 C68 108 72 92 68 68" stroke="#1C5A48" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                <path d="M70 110 C62 102 54 98 46 96" stroke="#1C5A48" stroke-width="1.8" fill="none" stroke-linecap="round"/>
                <path d="M69 94 C78 86 86 83 96 82" stroke="#1C5A48" stroke-width="1.8" fill="none" stroke-linecap="round"/>
                <path d="M69 78 C62 74 56 72 50 70" stroke="#1C5A48" stroke-width="1.4" fill="none" stroke-linecap="round"/>
                <ellipse cx="42" cy="92" rx="16" ry="8" transform="rotate(-32 42 92)" fill="#9BBF8F"/>
                <ellipse cx="100" cy="78" rx="14" ry="7" transform="rotate(28 100 78)" fill="#DDEBD8"/>
                <ellipse cx="46" cy="66" rx="12" ry="6" transform="rotate(-20 46 66)" fill="#DDEBD8"/>
                <ellipse cx="68" cy="54" rx="14" ry="7" transform="rotate(-10 68 54)" fill="#9BBF8F"/>
                <path d="M82 95 C83 92 85 92 85 95 C85 98 82 102 82 102 C82 102 79 98 79 95 C79 92 81 92 82 95Z" fill="#E9A6A6" opacity="0.8"/>
            `;
        } else if (streak >= 1) {
            innerSvg = potHtml + `
                <path d="M70 126 C69 120 71 115 70 110" stroke="#1C5A48" stroke-width="2" fill="none" stroke-linecap="round"/>
                <ellipse cx="64" cy="116" rx="6" ry="3" transform="rotate(-30 64 116)" fill="#9BBF8F"/>
                <ellipse cx="76" cy="114" rx="5" ry="2.5" transform="rotate(30 76 114)" fill="#DDEBD8"/>
            `;
        } else {
            innerSvg = potHtml + `
                <ellipse cx="70" cy="128" rx="4" ry="2" fill="#5F9F55"/>
            `;
        }
        return `<svg viewBox="0 0 140 190" width="120">${innerSvg}</svg>`;
    }

    function getStageLabel(streak) {
        if (streak >= 100) return 'Life Tree';
        if (streak >= 60) return 'Mature Tree';
        if (streak >= 30) return 'Growing Tree';
        if (streak >= 14) return 'Small Tree';
        if (streak >= 7) return 'Growing Plant';
        if (streak >= 3) return 'Young Plant';
        if (streak >= 1) return 'Sprout';
        return 'Seed';
    }

    function updateHomeStats() {
        if (!window.streakService) return;
        const stats = window.streakService.getStats();
        if (!stats) return;

        const healthEl = $('#home-plant-health');
        if (healthEl) healthEl.innerHTML = `${stats.plantHealth} <span>/ 100</span>`;
        
        const healthBarEl = $('#home-plant-health-bar');
        if (healthBarEl) healthBarEl.style.width = `${stats.plantHealth}%`;

        const streakEl = $('#home-day-streak');
        if (streakEl) streakEl.innerHTML = `${stats.currentStreak} <span class="stat-unit">Days</span>`;

        const streakBarEl = $('#home-day-streak-bar');
        if (streakBarEl) streakBarEl.style.width = `${Math.min(100, (stats.currentStreak / 30) * 100)}%`;

        const actualStage = getStageLabel(stats.currentStreak);
        const stageEl = $('#home-plant-stage');
        if (stageEl) stageEl.innerHTML = `🌱 ${actualStage}`;

        const visualEl = $('.plant-visual');
        if (visualEl) {
            visualEl.innerHTML = getHomePlantSVG(stats.currentStreak);
        }

        const progressTextEl = $('#home-plant-progress-text');
        if (progressTextEl) progressTextEl.innerHTML = `${stats.daysToGo} days to go<br>for ${stats.nextStageName}`;

        const progressFillEl = $('#home-plant-progress-fill');
        if (progressFillEl) progressFillEl.style.width = `${stats.plantHealth}%`;

        const progressValEl = $('#home-plant-progress-value');
        if (progressValEl) progressValEl.innerHTML = `${stats.plantHealth} / 100`;

        const favCountEl = $('#home-fav-count');
        if (favCountEl && window.memoryStore) {
            const favCount = window.memoryStore.getAll().filter(m => m.favorite === true).length;
            favCountEl.textContent = favCount;
        }

        if (typeof updateUpcomingDays === 'function') {
            updateUpcomingDays();
        }
    }

    function updateUpcomingDays() {
        const listEl = $('#home-upcoming-list');
        if (!listEl || !window.memoryStore) return;

        const all = window.memoryStore.getAll();
        const specialDays = all.filter(m => m.type === 'special_day' && m.date);

        const today = new Date();
        today.setHours(0,0,0,0);

        function getNextOccurrence(dateStr) {
            const parts = dateStr.split('-');
            if (parts.length !== 3) return new Date(9999, 0, 1);
            let y = parseInt(parts[0], 10);
            let m = parseInt(parts[1], 10) - 1;
            let d = parseInt(parts[2], 10);
            let dateObj = new Date(today.getFullYear(), m, d);
            if (dateObj < today) {
                dateObj.setFullYear(today.getFullYear() + 1);
            }
            return dateObj;
        }

        specialDays.sort((a, b) => getNextOccurrence(a.date) - getNextOccurrence(b.date));

        if (specialDays.length === 0) {
            listEl.innerHTML = '<div style="padding:16px; color:var(--color-text-muted); font-size:0.9rem; text-align:center;">No upcoming special days.</div>';
            return;
        }

        const icons = {
            'birthday': '🎂',
            'anniversary': '❤️',
            'holiday': '🌟',
            'achievement': '🏆',
            'memory': '📸'
        };

        const shortMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

        listEl.innerHTML = specialDays.slice(0, 4).map(s => {
            const parts = s.date.split('-');
            let dateStr = s.date;
            if (parts.length === 3) {
                const m = parseInt(parts[1], 10) - 1;
                const d = parseInt(parts[2], 10);
                const nextOccur = getNextOccurrence(s.date);
                dateStr = `${shortMonths[m]} ${d}, ${nextOccur.getFullYear()}`;
            }
            
            const cat = (s.specialType || s.category || 'special').toLowerCase();
            const icon = icons[cat] || '📅';
            return `
                <div class="upcoming-item">
                    <span class="upcoming-icon type-${cat}">${icon}</span>
                    <div>
                        <p class="upcoming-title">${s.name || s.title || 'Special Day'}</p>
                        <p class="upcoming-date">${dateStr}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    function init() {
        initCalendar();
        initSidebar();
        initCaptureButton();
        updateGreeting();
        initRecentMemories();
        
        setTimeout(updateHomeStats, 100);
        if (window.memoryStore) {
            window.memoryStore.subscribe(() => {
                setTimeout(updateHomeStats, 50);
            });
        }

        console.log('[MemoryVault] Home module initialized.');
    }

    document.addEventListener('DOMContentLoaded', init);

})();
