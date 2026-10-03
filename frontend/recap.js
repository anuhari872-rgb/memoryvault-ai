/**
 * MemoryVault - Monthly Recap Logic
 */
(function() {
    let currentMonth = new Date();

    function $el(id) { return document.getElementById(id); }

    function getMonthPrefix(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    function getMonthName(date) {
        return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }

    function getDaysInMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    }

    function initRecap() {
        // Nav hooks
        const prevBtn = $el('recap-prev-btn');
        const nextBtn = $el('recap-next-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentMonth.setMonth(currentMonth.getMonth() - 1);
                renderRecap();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentMonth.setMonth(currentMonth.getMonth() + 1);
                renderRecap();
            });
        }

        // View All Memories
        const viewAllBtn = $el('recap-view-all');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const memNav = document.querySelector('[data-page="memories"]');
                if (memNav) memNav.click();
            });
        }

        // Play/Share Buttons
        const shareBtn = $el('recap-share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', async () => {
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: 'My MemoryVault Recap',
                            text: `Check out my memory recap for ${getMonthName(currentMonth)}!`
                        });
                    } catch(err) {
                        console.log('Share canceled or failed', err);
                    }
                } else {
                    alert('Sharing is not supported on this browser.');
                }
            });
        }

        // Subscribe to changes if stores exist
        if (window.memoryStore) window.memoryStore.subscribe(() => renderRecap());
        
        

        // First render
        renderRecap();
        console.log('[MemoryVault] Monthly Recap initialized.');
    }

    function renderRecap() {
        if (!window.memoryStore) return;

        const prefix = getMonthPrefix(currentMonth);
        const nameStr = getMonthName(currentMonth);
        const shortMonth = currentMonth.toLocaleDateString(undefined, { month: 'long' });

        // Update Headers
        const heroName = $el('recap-month-name-hero');
        const dispName = $el('recap-month-display');
        const filmMonth = $el('recap-film-month');
        
        if(heroName) heroName.textContent = nameStr;
        if(dispName) dispName.textContent = nameStr;
        if(filmMonth) filmMonth.textContent = shortMonth;

        // Fetch Data
        const allMemories = window.memoryStore.getAll().filter(m => m.type !== 'special_day' && m.type !== 'reflection');
        const monthMemories = allMemories.filter(m => m.date && m.date.startsWith(prefix));
        
        const allReflections = window.memoryStore ? window.memoryStore.getAll().filter(m => m.type === 'reflection') : [];
        const monthReflections = allReflections.filter(r => r.date && r.date.startsWith(prefix));

        const specialDays = window.memoryStore ? window.memoryStore.getAll().filter(m => m.type === 'special_day') : [];
        const monthSpecial = specialDays.filter(s => {
            if (!s.date) return false;
            // Handle yearly repeating special days (e.g. 10-05 for Oct 5)
            if (s.date.length === 5) return s.date.startsWith(String(currentMonth.getMonth()+1).padStart(2,'0'));
            // Full date YYYY-MM-DD
            return s.date.startsWith(prefix);
        });

        // 1. Film
        renderFilm(monthMemories, monthSpecial.length);

        // 2. Moments Grid
        renderMomentsGrid(monthMemories);

        // 3. What You Felt (Mood)
        renderMoodChart(monthReflections);

        // 4. How You Grew (Stats)
        renderStats(allMemories, monthMemories, monthSpecial.length, prefix);

        // 5. Note From Your Month
        renderNote(monthMemories, monthReflections);
    }

    function renderFilm(memories, specialCount) {
        const container = $el('recap-video-container');
        const statsEl = $el('recap-film-stats');
        const downloadBtn = $el('recap-download-btn');
        const playBtn = $el('recap-play-btn');

        if (!container) return;

        // Calculate Active Days
        const activeDays = new Set(memories.filter(m => m.date).map(m => m.date)).size;

        if (statsEl) {
            statsEl.textContent = `${memories.length} memories • ${activeDays} active days • ${specialCount} special day${specialCount!==1?'s':''}`;
        }

        // Check if there is an actual video memory
        const videoMemories = memories.filter(m => m.type === 'video' && m.mediaUrl);

        if (videoMemories.length > 0) {
            const vid = videoMemories[0]; // Just pick the first video for the "recap" simulation
            container.innerHTML = `
                <video src="${vid.mediaUrl}" controls class="recap-video-el" style="height:100%; width:100%; object-fit:cover;" id="recap-main-vid"></video>
            `;
            if (downloadBtn) {
                downloadBtn.style.opacity = '1';
                downloadBtn.onclick = () => {
                    const a = document.createElement('a');
                    a.href = vid.mediaUrl;
                    a.download = `recap-${getMonthPrefix(currentMonth)}.mp4`;
                    a.click();
                };
            }
            if (playBtn) {
                playBtn.onclick = () => {
                    const v = $el('recap-main-vid');
                    if (v) v.play();
                };
            }
        } else if (memories.length > 0) {
            // Has memories but no videos -> simulated film waiting
            container.innerHTML = `
                <div class="recap-video-empty">
                    <div style="font-size:2rem; margin-bottom:12px;">🎞️</div>
                    <div style="font-weight:600; margin-bottom:8px;">Your memory film is waiting to be created.</div>
                    <button class="btn-submit" style="font-size:0.8rem; padding:8px 16px;">Create My Recap</button>
                </div>
            `;
            if (downloadBtn) {
                downloadBtn.style.opacity = '0.5';
                downloadBtn.onclick = () => alert("No video available to download yet.");
            }
            if (playBtn) playBtn.onclick = null;
        } else {
            // No memories
            container.innerHTML = `
                <div class="recap-video-empty">
                    <div style="font-size:2rem; margin-bottom:12px;">🌱</div>
                    <div style="font-weight:600;">No memories captured this month yet</div>
                    <div style="font-size:0.85rem; color:#aaa; margin-top:8px;">Start capturing little moments and your monthly story will grow here.</div>
                </div>
            `;
            if (downloadBtn) downloadBtn.style.opacity = '0.5';
            if (playBtn) playBtn.onclick = null;
        }
    }

    function renderMomentsGrid(memories) {
        const grid = $el('recap-moments-grid');
        if (!grid) return;

        if (memories.length === 0) {
            grid.innerHTML = `<div style="padding:16px; color:var(--color-text-muted); font-size:0.85rem;">Capture a memory to see it here.</div>`;
            return;
        }

        // Show favorites first, then newest
        const sorted = [...memories].sort((a, b) => {
            if (a.favorite && !b.favorite) return -1;
            if (!a.favorite && b.favorite) return 1;
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }).slice(0, 8);

        let html = '';
        sorted.forEach(m => {
            let thumb = '';
            if (m.type === 'photo' && m.mediaUrl) {
                thumb = `<div class="recap-moment-img" style="background-image:url(${m.mediaUrl})"></div>`;
            } else if (m.type === 'voice') {
                thumb = `<div class="recap-moment-img" style="background:var(--color-sage-light)">🎙</div>`;
            } else if (m.type === 'video') {
                thumb = `<div class="recap-moment-img" style="background:#222; color:white">🎥</div>`;
            } else {
                thumb = `<div class="recap-moment-img" style="background:var(--color-sage-light)">📝</div>`;
            }

            let dateStr = m.date || '';
            if (dateStr) {
                const parts = dateStr.split('-');
                const d = new Date(parts[0], parts[1]-1, parts[2]);
                dateStr = d.toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'});
            }

            // Simple tag based on type/favorite
            let tag = 'Memory';
            let tagIcon = '🌱';
            if (m.favorite) { tag = 'Favorite'; tagIcon = '❤️'; }
            else if (m.type === 'photo') { tag = 'Photo'; tagIcon = '📸'; }
            else if (m.type === 'voice') { tag = 'Voice'; tagIcon = '🎙'; }
            
            // Or try to infer from title
            const t = (m.title||'').toLowerCase();
            if(t.includes('work') || t.includes('study')) { tag = 'Study'; tagIcon = '🎓'; }
            else if(t.includes('food') || t.includes('coffee')) { tag = 'Food'; tagIcon = '🍴'; }
            else if(t.includes('walk') || t.includes('nature')) { tag = 'Nature'; tagIcon = '🍃'; }
            else if(t.includes('friend')) { tag = 'Friends'; tagIcon = '👥'; }

            html += `
                <div class="recap-moment-card" onclick="if(window.openModal) window.openModal('${m.id}')">
                    ${thumb}
                    <div class="recap-moment-info">
                        <div class="recap-moment-title">${m.title || 'Untitled'}</div>
                        <div class="recap-moment-date">${dateStr}</div>
                        <div class="recap-moment-tag"><span style="color:var(--color-forest)">${tagIcon}</span> ${tag}</div>
                    </div>
                </div>
            `;
        });
        grid.innerHTML = html;
    }

    function renderMoodChart(reflections) {
        const container = $el('recap-mood-content');
        if (!container) return;

        if (reflections.length === 0) {
            container.innerHTML = `<div style="font-size:0.85rem; color:var(--color-text-muted); padding:16px 0;">Save more reflections to discover your mood pattern.</div>`;
            return;
        }

        const counts = { Happy:0, Calm:0, Excited:0, Loved:0, Sad:0, Frustrated:0, Tired:0 };
        let total = 0;
        reflections.forEach(r => {
            if (r.mood && counts[r.mood] !== undefined) {
                counts[r.mood]++;
                total++;
            }
        });

        if (total === 0) {
            container.innerHTML = `<div style="font-size:0.85rem; color:var(--color-text-muted); padding:16px 0;">No mood data found for this month.</div>`;
            return;
        }

        const colors = {
            Happy: 'var(--color-forest)',
            Calm: 'var(--color-sage-light)',
            Excited: 'var(--color-gold)',
            Loved: 'var(--color-pink)',
            Sad: '#6a7e93',
            Frustrated: '#d97b7b',
            Tired: '#a8a2b5'
        };

        // Sort by count desc
        const sorted = Object.entries(counts).filter(x => x[1] > 0).sort((a,b) => b[1] - a[1]);
        
        let gradientStops = [];
        let currentPercent = 0;
        let legendHtml = '';

        sorted.forEach(([mood, count], index) => {
            const pct = (count / total) * 100;
            const nextPercent = currentPercent + pct;
            const c = colors[mood] || '#ccc';
            gradientStops.push(`${c} ${currentPercent}% ${nextPercent}%`);
            currentPercent = nextPercent;

            legendHtml += `
                <div class="recap-mood-legend-item">
                    <div><span class="dot" style="background:${c}"></span> ${mood}</div>
                    <div style="color:var(--color-text-secondary)">${Math.round(pct)}%</div>
                </div>
            `;
        });

        const topMood = sorted[0][0];
        let topLabel = topMood;
        if(topMood === 'Happy' || topMood === 'Excited' || topMood === 'Loved') topLabel = 'Positive';
        
        const topPct = Math.round((sorted[0][1] / total) * 100);

        container.innerHTML = `
            <div class="recap-mood-container">
                <div class="recap-mood-chart" style="background: conic-gradient(${gradientStops.join(', ')})">
                    <div class="recap-mood-inner">
                        <div style="font-size:1.4rem;">${topPct}%</div>
                        <div style="font-size:0.7rem; font-weight:normal; color:var(--color-text-secondary);">${topLabel}</div>
                    </div>
                </div>
                <div class="recap-mood-legend">
                    ${legendHtml}
                </div>
            </div>
        `;
    }

    function renderStats(allMemories, monthMemories, specialCount, prefix) {
        const grid = $el('recap-stats-grid');
        if (!grid) return;

        // Active Days this month
        const activeDates = new Set(monthMemories.filter(m => m.date).map(m => m.date));
        const activeDays = activeDates.size;
        const totalDays = getDaysInMonth(currentMonth);
        const activePct = Math.round((activeDays / totalDays) * 100);

        // Previous month difference
        const prevDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        const prevPrefix = getMonthPrefix(prevDate);
        const prevCount = allMemories.filter(m => m.date && m.date.startsWith(prevPrefix)).length;
        const diff = monthMemories.length - prevCount;
        let diffStr = diff > 0 ? `+${diff} from last month` : diff < 0 ? `${diff} from last month` : `Same as last month`;
        if (prevCount === 0 && monthMemories.length > 0) diffStr = `Great start!`;

        // Calculate a simple current streak by walking backward from today or end of month
        let streak = 0;
        const checkDate = new Date();
        // If checking a past month, calculate streak up to the last day of that month
        if (currentMonth.getFullYear() < checkDate.getFullYear() || 
           (currentMonth.getFullYear() === checkDate.getFullYear() && currentMonth.getMonth() < checkDate.getMonth())) {
            checkDate.setFullYear(currentMonth.getFullYear());
            checkDate.setMonth(currentMonth.getMonth());
            checkDate.setDate(totalDays);
        }
        
        let tempDate = new Date(checkDate);
        const allActiveSet = new Set(allMemories.filter(m => m.date).map(m => m.date));
        
        while(true) {
            const dStr = `${tempDate.getFullYear()}-${String(tempDate.getMonth()+1).padStart(2,'0')}-${String(tempDate.getDate()).padStart(2,'0')}`;
            if (allActiveSet.has(dStr)) {
                streak++;
                tempDate.setDate(tempDate.getDate() - 1);
            } else {
                // If checking today and it's missing, check yesterday just in case they haven't posted yet today
                if (streak === 0) {
                    const yesterday = new Date(tempDate);
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
                    if (allActiveSet.has(yStr)) {
                        streak++;
                        tempDate.setDate(tempDate.getDate() - 2);
                        continue;
                    }
                }
                break;
            }
        }

        grid.innerHTML = `
            <div class="recap-stat-box">
                <div class="recap-stat-icon" style="color:var(--color-green)">🌱</div>
                <div>
                    <div class="recap-stat-val">${monthMemories.length}</div>
                    <div class="recap-stat-label">Memories</div>
                    <div class="recap-stat-sub">${diffStr}</div>
                </div>
            </div>
            
            <div class="recap-stat-box">
                <div class="recap-stat-icon" style="color:#4a90e2">📅</div>
                <div>
                    <div class="recap-stat-val">${activeDays}</div>
                    <div class="recap-stat-label">Active Days</div>
                    <div class="recap-stat-sub">${activePct}% of the month</div>
                </div>
            </div>

            <div class="recap-stat-box">
                <div class="recap-stat-icon" style="color:#7A5135">🪴</div>
                <div>
                    <div class="recap-stat-val">${streak} Days</div>
                    <div class="recap-stat-label">Current Streak</div>
                    <div class="recap-stat-sub">Keep it going!</div>
                </div>
            </div>

            <div class="recap-stat-box">
                <div class="recap-stat-icon" style="color:var(--color-gold)">⭐</div>
                <div>
                    <div class="recap-stat-val">${specialCount}</div>
                    <div class="recap-stat-label">Special Days</div>
                    <div class="recap-stat-sub">Meaningful moments</div>
                </div>
            </div>
        `;
    }

    function renderNote(memories, reflections) {
        const content = $el('recap-note-text');
        if (!content) return;

        if (memories.length === 0) {
            content.innerHTML = `You've started creating your monthly story.<br>Keep capturing moments and your recap will grow with you.`;
            return;
        }

        let tags = new Set();
        memories.forEach(m => {
            const t = ((m.title||'') + ' ' + (m.reflection||'')).toLowerCase();
            if(t.includes('walk') || t.includes('nature') || t.includes('park')) tags.add('peaceful walks');
            if(t.includes('food') || t.includes('dinner') || t.includes('coffee')) tags.add('good food');
            if(t.includes('work') || t.includes('study') || t.includes('exam')) tags.add('productive sessions');
            if(t.includes('friend') || t.includes('meet')) tags.add('fun times with friends');
            if(t.includes('trip') || t.includes('travel')) tags.add('travel adventures');
        });

        let tagList = Array.from(tags);
        let tagStr = '';
        if (tagList.length === 1) tagStr = tagList[0];
        else if (tagList.length === 2) tagStr = `${tagList[0]} and ${tagList[1]}`;
        else if (tagList.length > 2) tagStr = `${tagList.slice(0,-1).join(', ')}, and ${tagList[tagList.length-1]}`;

        let html = `You captured ${memories.length} beautiful moments this month`;
        if (tagStr) html += ` — from ${tagStr}.<br><br>`;
        else html += `.<br><br>`;

        html += `You've been consistent, curious, and present.<br>Keep creating more moments that make you happy! 🌟`;

        content.innerHTML = html;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRecap);
    } else {
        initRecap();
    }

})();
