/**
 * MemoryVault AI — Streaks & Insights Page
 */

(function() {
    'use strict';

    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];

    let currentDate = new Date(); // For the activity calendar
    let allStreaks = [];
    let uniqueActiveDates = new Set();
    let sortedActiveDates = [];
    let currentStreakDays = 0;
    let longestStreakDays = 0;
    
    // Milestones definition
    const MILESTONES = [
        { days: 3, title: 'Seed', icon: `<svg viewBox="0 0 60 60" width="60" height="60"><path d="M15,50 Q30,40 45,50 Z" fill="#B98255" /><path d="M10,50 L50,50" stroke="#B98255" stroke-width="4" stroke-linecap="round"/><ellipse cx="30" cy="45" rx="5" ry="3" fill="#7A5135" stroke="#123B32" stroke-width="1.5"/><path d="M28,44 Q30,45 32,44" fill="none" stroke="#D8A94E" stroke-width="1" stroke-linecap="round"/></svg>` },
        
        { days: 7, title: 'Sprout', icon: `<svg viewBox="0 0 60 60" width="60" height="60"><path d="M15,50 Q30,42 45,50 Z" fill="#B98255" /><path d="M10,50 L50,50" stroke="#B98255" stroke-width="4" stroke-linecap="round"/><path d="M30,45 Q28,32 30,28" fill="none" stroke="#7A5135" stroke-width="3" stroke-linecap="round"/><path d="M30,35 Q22,30 24,24 Q28,26 30,35 Z" fill="#79A96B" stroke="#123B32" stroke-width="1.5"/><path d="M30,31 Q38,26 36,20 Q32,22 30,31 Z" fill="#5F9F55" stroke="#123B32" stroke-width="1.5"/></svg>` },
        
        { days: 14, title: 'Young Plant', icon: `<svg viewBox="0 0 60 60" width="60" height="60"><path d="M20,55 L40,55 L42,42 L18,42 Z" fill="#D99A62" stroke="#123B32" stroke-width="2" stroke-linejoin="round"/><path d="M16,42 L44,42 L44,38 L16,38 Z" fill="#D8A94E" stroke="#123B32" stroke-width="2" stroke-linejoin="round"/><path d="M30,38 Q28,20 32,15" fill="none" stroke="#7A5135" stroke-width="3" stroke-linecap="round"/><path d="M30,32 Q22,28 20,22 Q26,24 30,32 Z" fill="#79A96B" stroke="#123B32" stroke-width="1.5"/><path d="M29,28 Q37,26 39,20 Q33,21 29,28 Z" fill="#5F9F55" stroke="#123B32" stroke-width="1.5"/><path d="M31,22 Q20,18 21,12 Q26,14 31,22 Z" fill="#9BBF8F" stroke="#123B32" stroke-width="1.5"/><path d="M31,18 Q40,15 38,9 Q33,12 31,18 Z" fill="#79A96B" stroke="#123B32" stroke-width="1.5"/><path d="M32,15 Q26,10 30,5 Q34,10 32,15 Z" fill="#5F9F55" stroke="#123B32" stroke-width="1.5"/></svg>` },
        
        { days: 30, title: 'Small Tree', icon: `<svg viewBox="0 0 60 60" width="60" height="60"><path d="M10,52 L50,52" stroke="#5F9F55" stroke-width="3" stroke-linecap="round"/><path d="M20,52 Q30,45 40,52 Z" fill="#79A96B"/><path d="M15,52 Q18,48 21,52 Z" fill="#9BBF8F"/><path d="M30,50 L30,25" fill="none" stroke="#7A5135" stroke-width="5" stroke-linecap="round"/><path d="M30,35 L22,25" fill="none" stroke="#7A5135" stroke-width="3" stroke-linecap="round"/><path d="M30,30 L38,20" fill="none" stroke="#7A5135" stroke-width="3" stroke-linecap="round"/><circle cx="22" cy="22" r="8" fill="#79A96B" stroke="#123B32" stroke-width="1.5"/><circle cx="38" cy="18" r="9" fill="#5F9F55" stroke="#123B32" stroke-width="1.5"/><circle cx="30" cy="14" r="10" fill="#9BBF8F" stroke="#123B32" stroke-width="1.5"/><path d="M28,12 Q30,14 32,12" fill="none" stroke="#1C5A48" stroke-width="1.5" stroke-linecap="round"/></svg>` },
        
        { days: 60, title: 'Growing Tree', icon: `<svg viewBox="0 0 60 60" width="60" height="60"><path d="M5,54 L55,54" stroke="#5F9F55" stroke-width="3" stroke-linecap="round"/><path d="M15,54 Q30,45 45,54 Z" fill="#79A96B"/><path d="M27,52 C28,30 27,20 27,20 L33,20 C33,20 32,30 33,52 Z" fill="#7A5135" stroke="#123B32" stroke-width="1.5" stroke-linejoin="round"/><path d="M30,40 L20,25" fill="none" stroke="#7A5135" stroke-width="3.5" stroke-linecap="round"/><path d="M30,32 L40,20" fill="none" stroke="#7A5135" stroke-width="3.5" stroke-linecap="round"/><path d="M25,29 L20,18" fill="none" stroke="#7A5135" stroke-width="2.5" stroke-linecap="round"/><path d="M15,25 Q10,15 20,10 Q25,5 35,8 Q45,5 50,15 Q55,25 45,30 Q30,35 15,30 Z" fill="#5F9F55" stroke="#123B32" stroke-width="1.5" stroke-linejoin="round"/><circle cx="20" cy="15" r="7" fill="#79A96B" /><circle cx="40" cy="15" r="8" fill="#9BBF8F" /><circle cx="30" cy="12" r="9" fill="#5F9F55" /><circle cx="28" cy="22" r="8" fill="#79A96B" /><circle cx="35" cy="22" r="7" fill="#9BBF8F" /><path d="M18,15 Q20,13 22,15 M38,15 Q40,13 42,15 M28,12 Q30,10 32,12" fill="none" stroke="#1C5A48" stroke-width="1.5" stroke-linecap="round"/></svg>` },
        
        { days: 100, title: 'Mature Tree', icon: `<svg viewBox="0 0 60 60" width="60" height="60"><path d="M5,54 L55,54" stroke="#5F9F55" stroke-width="3" stroke-linecap="round"/><path d="M12,54 Q30,42 48,54 Z" fill="#79A96B"/><path d="M35,54 Q45,46 52,54 Z" fill="#9BBF8F"/><path d="M25,52 C27,30 25,15 25,15 L35,15 C35,15 33,30 35,52 Z" fill="#7A5135" stroke="#123B32" stroke-width="1.5" stroke-linejoin="round"/><path d="M28,35 C20,25 15,20 12,15" fill="none" stroke="#7A5135" stroke-width="4" stroke-linecap="round"/><path d="M32,30 C40,20 45,18 48,12" fill="none" stroke="#7A5135" stroke-width="4" stroke-linecap="round"/><path d="M26,22 C22,15 20,10 20,8" fill="none" stroke="#7A5135" stroke-width="3" stroke-linecap="round"/><path d="M34,25 C38,15 40,12 40,8" fill="none" stroke="#7A5135" stroke-width="3" stroke-linecap="round"/><circle cx="15" cy="18" r="12" fill="#5F9F55" stroke="#123B32" stroke-width="1.5"/><circle cx="45" cy="16" r="13" fill="#5F9F55" stroke="#123B32" stroke-width="1.5"/><circle cx="30" cy="10" r="14" fill="#5F9F55" stroke="#123B32" stroke-width="1.5"/><circle cx="22" cy="22" r="10" fill="#79A96B" stroke="#123B32" stroke-width="1.5"/><circle cx="38" cy="24" r="11" fill="#9BBF8F" stroke="#123B32" stroke-width="1.5"/><circle cx="30" cy="18" r="11" fill="#79A96B" stroke="#123B32" stroke-width="1.5"/><path d="M12,15 Q15,13 18,16" fill="none" stroke="#1C5A48" stroke-width="1.5" stroke-linecap="round"/><path d="M42,14 Q45,11 48,15" fill="none" stroke="#1C5A48" stroke-width="1.5" stroke-linecap="round"/><path d="M28,8 Q31,5 34,9" fill="none" stroke="#1C5A48" stroke-width="1.5" stroke-linecap="round"/><path d="M20,20 Q22,18 24,21" fill="none" stroke="#1C5A48" stroke-width="1.5" stroke-linecap="round"/><path d="M36,22 Q38,19 40,23" fill="none" stroke="#1C5A48" stroke-width="1.5" stroke-linecap="round"/></svg>` }
    ];

    let memoryByDate = new Map();

    function calculateStreaks(memories) {
        memories = memories.filter(m => m.type !== 'special_day' && m.type !== 'reflection');
        // 1. Normalize dates
        uniqueActiveDates = new Set();
        memoryByDate = new Map();
        memories.forEach(m => {
            if (!m.date) return;
            
            let dateStr = '';
            // If date is already YYYY-MM-DD, use it directly to avoid UTC timezone shift bugs
            if (typeof m.date === 'string' && m.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                dateStr = m.date;
            } else {
                const d = new Date(m.date);
                const y = d.getFullYear();
                const mo = String(d.getMonth() + 1).padStart(2, '0');
                const da = String(d.getDate()).padStart(2, '0');
                dateStr = `${y}-${mo}-${da}`;
            }
            
            uniqueActiveDates.add(dateStr);
            // Save the latest memory ID for this date
            memoryByDate.set(dateStr, m.id);
        });

        sortedActiveDates = Array.from(uniqueActiveDates).sort((a, b) => new Date(a) - new Date(b));

        // 2. Build Streak History
        allStreaks = [];
        if (sortedActiveDates.length === 0) {
            currentStreakDays = 0;
            longestStreakDays = 0;
            return;
        }

        let currentStart = sortedActiveDates[0];
        let currentEnd = sortedActiveDates[0];
        let currentLen = 1;

        for (let i = 1; i < sortedActiveDates.length; i++) {
            const p1 = sortedActiveDates[i - 1].split('-');
            const p2 = sortedActiveDates[i].split('-');
            const prev = new Date(p1[0], p1[1]-1, p1[2]);
            const curr = new Date(p2[0], p2[1]-1, p2[2]);
            const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                currentEnd = sortedActiveDates[i];
                currentLen++;
            } else {
                allStreaks.push({ start: currentStart, end: currentEnd, length: currentLen });
                currentStart = sortedActiveDates[i];
                currentEnd = sortedActiveDates[i];
                currentLen = 1;
            }
        }
        allStreaks.push({ start: currentStart, end: currentEnd, length: currentLen });

        // Sort streaks longest first
        longestStreakDays = Math.max(...allStreaks.map(s => s.length));
        
        // Find if current streak is active (includes today or yesterday)
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const yStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        const yesStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
        
        const lastStreak = allStreaks[allStreaks.length - 1];
        if (lastStreak && (lastStreak.end === yStr || lastStreak.end === yesStr)) {
            currentStreakDays = lastStreak.length;
            lastStreak.isCurrent = true;
        } else {
            currentStreakDays = 0;
        }
        
        // Mark the first longest as best
        const bestStreak = [...allStreaks].sort((a, b) => b.length - a.length)[0];
        if (bestStreak) bestStreak.isBest = true;
    }

    function renderTopCards() {
        // Current Streak
        $('#str-current-val').textContent = currentStreakDays;
        
        // Render last 7 days
        const last7Html = [];
        const today = new Date();
        const daysArr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            const isActive = uniqueActiveDates.has(dateStr);
            const isToday = i === 0;
            const dayName = daysArr[d.getDay()];
            
            let circleColor = 'var(--color-bg)';
            if (isActive) circleColor = 'var(--color-green)';
            if (!isActive && isToday) circleColor = 'var(--color-forest)';
            
            const leafSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M12,22 C12,22 20,16 20,9 C20,5 15,3 10,7 C6,10 6,15 12,22 Z"/></svg>`;
            
            const memId = memoryByDate.get(dateStr);
            const clickHandler = isActive && memId ? `onclick="if(window.openModal) window.openModal('${memId}')" style="cursor:pointer;"` : '';

            last7Html.push(`
                <div class="str-day-indicator" ${clickHandler}>
                    <div class="str-day-circle" style="background:${circleColor}; border: ${isToday && !isActive ? '2px solid var(--color-green)' : 'none'};">
                        ${isActive ? leafSvg : ''}
                    </div>
                    <span class="str-day-name">${dayName}</span>
                </div>
            `);
        }
        $('#str-last-7').innerHTML = last7Html.join('');

        // Longest Streak
        $('#str-longest-val').textContent = longestStreakDays;
        const longestBadge = $('#str-longest-badge');
        if (longestBadge) longestBadge.textContent = `${longestStreakDays} days`;

        // This Month
        const currMonth = today.getMonth();
        const currYear = today.getFullYear();
        let daysActiveThisMonth = 0;
        sortedActiveDates.forEach(ds => {
            const parts = ds.split('-');
            if (parseInt(parts[1], 10) - 1 === currMonth && parseInt(parts[0], 10) === currYear) daysActiveThisMonth++;
        });
        const totalDaysThisMonth = new Date(currYear, currMonth + 1, 0).getDate();
        const percent = Math.round((daysActiveThisMonth / totalDaysThisMonth) * 100) || 0;
        
        $('#str-month-active').textContent = daysActiveThisMonth;
        $('#str-month-total').textContent = `You captured memories on ${daysActiveThisMonth} of ${totalDaysThisMonth} days.`;
        $('#str-month-percent').textContent = `${percent}%`;
        
        // Simple radial progress using conic gradient
        $('#str-month-radial').style.background = `conic-gradient(var(--color-green) ${percent}%, var(--color-sage-light) ${percent}%)`;
    }

    function renderActivityCalendar() {
        const monthYearEl = $('#str-cal-month');
        const gridEl = $('#str-cal-grid');
        if (!monthYearEl || !gridEl) return;

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        
        monthYearEl.textContent = `${months[month]} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

        let html = '';
        const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        dayNames.forEach(d => html += `<div class="str-cal-header">${d}</div>`);

        for (let i = 0; i < firstDay; i++) {
            html += `<div></div>`;
        }

        const specialDays = window.memoryStore ? window.memoryStore.getAll().filter(m => m.type === 'special_day') : [];

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const isActive = uniqueActiveDates.has(dateStr);
            const isToday = dateStr === todayStr;
            
            // Check for special days
            const mmdd = dateStr.substring(5);
            const isSpecial = specialDays.some(sd => sd.date === dateStr || (sd.repeat === 'Yearly' && sd.date.endsWith(mmdd)));
            
            let classes = 'str-cal-day';
            if (isActive) classes += ' active';
            if (isToday) classes += ' today';
            
            let dotHtml = '';
            if (isSpecial) {
                dotHtml += `<div class="str-cal-dot" style="background:var(--color-pink)"></div>`;
            }
            if (isActive) {
                dotHtml += `<div class="str-cal-dot bg-green"></div>`;
            } 
            if (!isActive && !isSpecial) {
                dotHtml += `<div class="str-cal-dot bg-empty"></div>`;
            }

            const memId = memoryByDate.get(dateStr);
            const clickHandler = isActive && memId ? `onclick="if(window.openModal) window.openModal('${memId}')" style="cursor:pointer;"` : '';

            html += `<div class="${classes}" data-date="${dateStr}" data-special="${isSpecial}" ${clickHandler}>
                <span class="str-cal-num">${d}</span>
                <div style="display:flex; gap:2px; margin-top:2px;">${dotHtml}</div>
            </div>`;
        }

        gridEl.innerHTML = html;
        
        // Attach events for minimal tooltip using native title
        $$('.str-cal-day', gridEl).forEach(el => {
            const dateStr = el.getAttribute('data-date');
            const isSpecial = el.getAttribute('data-special') === 'true';
            const memories = window.memoryStore.getAll().filter(m => m.type !== 'special_day' && m.type !== 'reflection' && m.date === dateStr);
            
            let titleText = '';
            if (isSpecial) titleText += '🔴 Special Day! \n';
            
            if (memories.length > 0) {
                titleText += `${memories.length} memor${memories.length > 1 ? 'ies' : 'y'} captured on ${dateStr}`;
                el.addEventListener('click', () => {
                    alert(`${isSpecial ? 'Special Day!\n' : ''}${memories.length} memor${memories.length > 1 ? 'ies' : 'y'} captured on ${dateStr}`);
                });
            } else {
                titleText += `No memory captured on ${dateStr}`;
            }
            el.setAttribute('title', titleText);
        });
    }


    function renderMilestones() {
        const container = $('#str-milestones-container');
        if (!container) return;
        
        let html = '';
        let highestUnlocked = -1;
        
        MILESTONES.forEach((m, i) => {
            if (longestStreakDays >= m.days) highestUnlocked = i;
        });

        MILESTONES.forEach((m, i) => {
            const isUnlocked = longestStreakDays >= m.days;
            const isCurrent = i === highestUnlocked;
            
            let statusHtml = '';
            if (isCurrent) statusHtml = `<span class="badge badge-gold" style="font-weight:600; padding:4px 8px; font-size:0.7rem; border-radius:12px;">Current</span>`;
            else if (isUnlocked) statusHtml = `<div class="ms-check"><svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="#fff" stroke-width="2"><polyline points="3 6 5 8 9 4"/></svg></div>`;
            else statusHtml = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-text-muted)"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

            html += `
                <div class="ms-node ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}">
                    <div class="ms-icon-wrap" style="display:flex; justify-content:center; align-items:center;">
                        ${m.icon}
                    </div>
                    <div class="ms-bar ${isUnlocked && i > 0 ? 'active' : ''}"></div>
                    <div class="ms-label">
                        <strong>${m.days} Days</strong>
                        <span>${m.title}</span>
                    </div>
                    <div class="ms-status" style="margin-top:8px;">
                        ${statusHtml}
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    function renderStatistics() {
        $('#stat-total').textContent = window.memoryStore.getAll().length;
        $('#stat-current').textContent = currentStreakDays;
        $('#stat-longest').textContent = longestStreakDays;
        
        const today = new Date();
        const currYear = today.getFullYear();
        const currMonth = today.getMonth();
        
        let activeThisYear = 0;
        let activeThisMonth = 0;
        let monthsWithMemories = new Set();
        
        sortedActiveDates.forEach(ds => {
            const parts = ds.split('-');
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // 0-indexed
            
            if (year === currYear) {
                activeThisYear++;
                if (month === currMonth) activeThisMonth++;
            }
            monthsWithMemories.add(`${year}-${month}`);
        });
        
        const monthActiveEl = $('#stat-month-active');
        if (monthActiveEl) monthActiveEl.textContent = activeThisMonth;
        
        $('#stat-year-active').textContent = activeThisYear;
        $('#stat-months').textContent = monthsWithMemories.size;
    }


    function renderInsights() {
        const container = $('#str-insights-list');
        if (!container) return;

        if (sortedActiveDates.length === 0) {
            container.innerHTML = `<div class="str-insight-item">
                <div class="insight-icon">💡</div>
                <div>
                    <strong>Capture more memories to discover your consistency patterns.</strong>
                </div>
            </div>`;
            return;
        }

        const today = new Date();
        
        // 1. Last 30 days active
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        let activeLast30 = 0;
        sortedActiveDates.forEach(d => {
            const parts = d.split('-');
            const localD = new Date(parts[0], parts[1]-1, parts[2]);
            if (localD >= thirtyDaysAgo) activeLast30++;
        });
        const percent30 = Math.round((activeLast30 / 30) * 100);

        // 2. Most active day
        const dayCounts = [0,0,0,0,0,0,0];
        sortedActiveDates.forEach(d => {
            const parts = d.split('-');
            const localD = new Date(parts[0], parts[1]-1, parts[2]);
            dayCounts[localD.getDay()]++;
        });
        let maxDayIdx = 0;
        for (let i=1; i<7; i++) {
            if (dayCounts[i] > dayCounts[maxDayIdx]) maxDayIdx = i;
        }
        const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        
        // 3. Trend (This month vs Last month)
        const currMonth = today.getMonth();
        const lastMonth = currMonth === 0 ? 11 : currMonth - 1;
        const currYear = today.getFullYear();
        const lastMonthYear = currMonth === 0 ? currYear - 1 : currYear;
        
        let thisMonthCount = 0;
        let lastMonthCount = 0;
        
        // Use all memories for trend, not just unique active days
        window.memoryStore.getAll().filter(m => m.type !== 'special_day' && m.type !== 'reflection').forEach(m => {
            if (!m.date) return;
            const d = new Date(m.date);
            if (d.getMonth() === currMonth && d.getFullYear() === currYear) thisMonthCount++;
            if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) lastMonthCount++;
        });
        
        let trendText = '';
        if (thisMonthCount > lastMonthCount) {
            const diff = thisMonthCount - lastMonthCount;
            trendText = `You captured ${diff} more memor${diff===1?'y':'ies'} this month than last month.`;
        } else if (thisMonthCount < lastMonthCount) {
            const diff = lastMonthCount - thisMonthCount;
            trendText = `You're trailing last month by ${diff} memor${diff===1?'y':'ies'}.`;
        } else {
            trendText = `You've captured the exact same number of memories as last month.`;
        }

        container.innerHTML = `
            <div class="str-insight-item">
                <div class="insight-icon" style="color:var(--color-forest)">🎯</div>
                <div>
                    <strong>You captured memories on ${activeLast30} of the last 30 days.</strong>
                    <p style="color:var(--color-text-secondary); font-size:0.85rem; margin-top:2px;">That's ${percent30}% consistency!</p>
                </div>
            </div>
            <div class="str-insight-item">
                <div class="insight-icon" style="color:#4a90e2">📅</div>
                <div>
                    <strong>Your most consistent day is ${dayNames[maxDayIdx]}.</strong>
                    <p style="color:var(--color-text-secondary); font-size:0.85rem; margin-top:2px;">You capture the most memories on ${dayNames[maxDayIdx]}s.</p>
                </div>
            </div>
            <div class="str-insight-item">
                <div class="insight-icon" style="color:var(--color-green)">📈</div>
                <div>
                    <strong>Your memory habit is ${thisMonthCount >= lastMonthCount ? 'growing!' : 'shifting.'}</strong>
                    <p style="color:var(--color-text-secondary); font-size:0.85rem; margin-top:2px;">${trendText}</p>
                </div>
            </div>
        `;
    }

    function initStreaks() {
        if (!window.memoryStore) return;
        
        // Bind calendar controls
        const btnPrev = $('#str-cal-prev');
        const btnNext = $('#str-cal-next');
        
        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                currentDate.setMonth(currentDate.getMonth() - 1);
                renderActivityCalendar();
            });
        }
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                currentDate.setMonth(currentDate.getMonth() + 1);
                renderActivityCalendar();
            });
        }
        
        // Subscribe to store
        window.memoryStore.subscribe((memories) => {
            calculateStreaks(memories);
            renderTopCards();
            renderActivityCalendar();
            renderMilestones();
            renderStatistics();
            renderInsights();
        });
        
        console.log('[MemoryVault] Streaks module initialized.');
    }
    
    // Export for Home Page
    window.streakService = {
        getStats: function() {
            if (!window.memoryStore) return null;
            calculateStreaks(window.memoryStore.getAll());
            
            let highestUnlocked = -1;
            MILESTONES.forEach((m, i) => {
                if (longestStreakDays >= m.days) highestUnlocked = i;
            });
            
            const currentMilestone = highestUnlocked >= 0 ? MILESTONES[highestUnlocked] : { days: 0, title: 'Seed' };
            const nextMilestone = highestUnlocked + 1 < MILESTONES.length ? MILESTONES[highestUnlocked + 1] : MILESTONES[MILESTONES.length - 1];
            
            // Health out of 100 based on next milestone progress, or simple metric
            let plantHealth = 0;
            if (longestStreakDays >= 100) {
                plantHealth = 100;
            } else {
                const prevDays = currentMilestone.days;
                const nextDays = nextMilestone.days;
                const progress = (longestStreakDays - prevDays) / (nextDays - prevDays);
                plantHealth = Math.floor(progress * 100);
            }
            // fallback if 0
            if (longestStreakDays > 0 && plantHealth < 10) plantHealth = 10;
            if (longestStreakDays === 0) plantHealth = 0;
            
            return {
                currentStreak: currentStreakDays,
                longestStreak: longestStreakDays,
                plantHealth: plantHealth,
                stageName: currentMilestone.title,
                nextStageName: nextMilestone.title,
                daysToGo: Math.max(0, nextMilestone.days - longestStreakDays)
            };
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStreaks);
    } else {
        initStreaks();
    }

})();

