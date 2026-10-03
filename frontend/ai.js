/**
 * MemoryVault AI - AI Companion Logic
 */
(function() {
    // ----------------------------------------------------
    // CONSTANTS & HELPERS
    // ----------------------------------------------------
    const chatHistory = document.getElementById('ai-chat-history');
    const chatInput = document.getElementById('ai-chat-input');
    const sendBtn = document.getElementById('ai-chat-send');
    const quickPrompts = document.querySelectorAll('.ai-prompt-btn');
    const startReflectionBtn = document.getElementById('ai-start-reflection');

    const THEME_MAPPING = {
        'study': { icon: '🎓', name: 'Study' },
        'exam': { icon: '🎓', name: 'Study' },
        'read': { icon: '📖', name: 'Reading' },
        'book': { icon: '📖', name: 'Reading' },
        'friend': { icon: '👥', name: 'Friends' },
        'family': { icon: '👨‍👩‍👧', name: 'Family' },
        'food': { icon: '🍴', name: 'Food' },
        'dinner': { icon: '🍴', name: 'Food' },
        'lunch': { icon: '🍴', name: 'Food' },
        'coffee': { icon: '☕', name: 'Coffee' },
        'work': { icon: '💼', name: 'Work' },
        'nature': { icon: '🍃', name: 'Nature' },
        'walk': { icon: '🍃', name: 'Nature' },
        'park': { icon: '🍃', name: 'Nature' },
        'trip': { icon: '✈️', name: 'Travel' },
        'travel': { icon: '✈️', name: 'Travel' },
        'growth': { icon: '🌱', name: 'Personal Growth' },
        'learn': { icon: '🌱', name: 'Personal Growth' },
    };

    const REFLECTION_PROMPTS = [
        "What is one moment from this week that you're really grateful for?",
        "What was the most peaceful part of your day today?",
        "Did anything surprise you recently?",
        "What is something small that brought you joy?",
        "How have you grown over the past month?",
        "What is a challenge you faced and how did it make you stronger?"
    ];

    function $el(id) { return document.getElementById(id); }

    // ----------------------------------------------------
    // RIGHT SIDEBAR UPDATES
    // ----------------------------------------------------
    function updateSidebar() {
        if (!window.memoryStore) return;
        
        const memories = window.memoryStore.getAll();
        const reflections = memories.filter(m => m.type === 'reflection');
        
        const today = new Date();
        const currMonth = String(today.getMonth() + 1).padStart(2, '0');
        const currYear = String(today.getFullYear());
        const prefix = `${currYear}-${currMonth}`;
        
        // 1. Mood
        updateMood(reflections, prefix);
        
        // 2. Themes
        updateThemes(memories);
        
        // 3. Insights
        updateInsights(memories, prefix);

        // 4. Reflection Prompt
        updateReflectionPrompt();
    }

    function updateMood(reflections, prefix) {
        const container = $el('ai-mood-container');
        if (!container) return;

        const thisMonthRefs = reflections.filter(r => r.date && r.date.startsWith(prefix));
        
        if (thisMonthRefs.length === 0) {
            container.innerHTML = `<p style="color:var(--color-text-muted); font-size:0.85rem;">Save a few reflections to discover your mood patterns.</p>`;
            return;
        }

        const moodCounts = {};
        thisMonthRefs.forEach(r => {
            if (r.mood) moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1;
        });

        let topMood = null;
        let maxCount = 0;
        for (const [m, c] of Object.entries(moodCounts)) {
            if (c > maxCount) { maxCount = c; topMood = m; }
        }

        if (!topMood) {
            container.innerHTML = `<p style="color:var(--color-text-muted); font-size:0.85rem;">Save a few reflections to discover your mood patterns.</p>`;
            return;
        }

        // Map mood to emoji and summary text
        const moodMap = {
            'Happy': { icon: '😊', title: 'Mostly Positive', text: 'Your memories this month reflect joy and peace.' },
            'Calm': { icon: '😌', title: 'Deeply Calm', text: 'Your month has been grounded in tranquility.' },
            'Loved': { icon: '🥰', title: 'Feeling Loved', text: 'You have been surrounded by warmth and connection.' },
            'Excited': { icon: '🤩', title: 'High Energy', text: 'Your memories show excitement and drive.' },
            'Sad': { icon: '😔', title: 'A Reflective Month', text: 'You\'ve experienced some tough moments. Take care of yourself.' },
            'Frustrated': { icon: '😤', title: 'A Challenging Month', text: 'Things have been challenging, but you are growing.' },
            'Tired': { icon: '😴', title: 'Rest Needed', text: 'Your moments show you might need some well-deserved rest.' }
        };

        const mInfo = moodMap[topMood] || { icon: '🌱', title: topMood, text: `Your dominant mood this month is ${topMood}.` };

        container.innerHTML = `
            <div style="display:flex; gap:16px; align-items:center; background:var(--color-bg); padding:12px; border-radius:12px; position:relative; overflow:hidden;">
                <div style="font-size:2.5rem; position:relative; z-index:2;">${mInfo.icon}</div>
                <div style="position:relative; z-index:2;">
                    <div style="font-weight:600; color:var(--color-forest);">${mInfo.title}</div>
                    <div style="font-size:0.8rem; color:var(--color-text-secondary); margin-top:4px;">${mInfo.text}</div>
                </div>
                <svg viewBox="0 0 100 100" width="60" height="60" style="position:absolute; right:-10px; bottom:-10px; opacity:0.3;" fill="var(--color-green)"><path d="M50,100 Q80,50 100,20 L100,100 Z"/></svg>
            </div>
        `;
    }

    function updateThemes(memories) {
        const container = $el('ai-themes-container');
        if (!container) return;

        if (memories.length === 0) {
            container.innerHTML = `<p style="color:var(--color-text-muted); font-size:0.85rem;">Capture more memories to discover your common themes.</p>`;
            return;
        }

        const themeCounts = {};
        memories.forEach(m => {
            const text = ((m.title || '') + ' ' + (m.reflection || '')).toLowerCase();
            for (const [key, themeInfo] of Object.entries(THEME_MAPPING)) {
                if (text.includes(key)) {
                    themeCounts[themeInfo.name] = { icon: themeInfo.icon, count: (themeCounts[themeInfo.name]?.count || 0) + 1 };
                }
            }
        });

        const sortedThemes = Object.entries(themeCounts).sort((a,b) => b[1].count - a[1].count).slice(0, 6);

        if (sortedThemes.length === 0) {
            container.innerHTML = `<p style="color:var(--color-text-muted); font-size:0.85rem;">Capture more detailed memories to discover your common themes.</p>`;
            return;
        }

        let html = '';
        sortedThemes.forEach(([name, info]) => {
            html += `<div class="ai-theme-pill"><span>${info.icon}</span> ${name}</div>`;
        });
        container.innerHTML = html;
    }

    function updateInsights(memories, prefix) {
        const container = $el('ai-insights-list');
        if (!container) return;

        if (memories.length === 0) {
            container.innerHTML = `<p style="color:var(--color-text-muted); font-size:0.85rem;">Insufficient data to generate insights.</p>`;
            return;
        }

        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lmPrefix = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

        let thisMonthCount = 0;
        let lastMonthCount = 0;
        const dayCounts = [0,0,0,0,0,0,0];

        memories.forEach(m => {
            if (m.date && m.date.startsWith(prefix)) thisMonthCount++;
            if (m.date && m.date.startsWith(lmPrefix)) lastMonthCount++;
            if (m.date) {
                const parts = m.date.split('-');
                const d = new Date(parts[0], parts[1]-1, parts[2]);
                dayCounts[d.getDay()]++;
            }
        });

        const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        let bestDay = 0;
        for(let i=1; i<7; i++) { if(dayCounts[i] > dayCounts[bestDay]) bestDay = i; }

        let html = '';
        
        // Insight 1
        if (thisMonthCount > lastMonthCount) {
            html += `<div class="ai-insight-item"><span style="color:#4a90e2; font-size:1.1rem;">📅</span><div>You captured more memories this month than last month.</div></div>`;
        } else if (thisMonthCount > 0) {
            html += `<div class="ai-insight-item"><span style="color:#4a90e2; font-size:1.1rem;">📅</span><div>You have captured ${thisMonthCount} memories this month.</div></div>`;
        }

        // Insight 2
        html += `<div class="ai-insight-item"><span style="color:var(--color-gold); font-size:1.1rem;">☀️</span><div>Your most active day for capturing is ${dayNames[bestDay]}.</div></div>`;

        // Insight 3
        const themes = $el('ai-themes-container').innerText;
        if (themes && !themes.includes('Capture more')) {
            html += `<div class="ai-insight-item"><span style="color:var(--color-green); font-size:1.1rem;">📈</span><div>You've been capturing moments about your recurring themes.</div></div>`;
        } else {
             html += `<div class="ai-insight-item"><span style="color:var(--color-green); font-size:1.1rem;">📈</span><div>Keep capturing to uncover more patterns!</div></div>`;
        }

        container.innerHTML = html;
    }

    function updateReflectionPrompt() {
        const textEl = $el('ai-reflection-text');
        if (!textEl) return;
        const todayStr = new Date().toDateString();
        // Deterministic daily prompt
        let hash = 0;
        for (let i = 0; i < todayStr.length; i++) { hash = todayStr.charCodeAt(i) + ((hash << 5) - hash); }
        const idx = Math.abs(hash) % REFLECTION_PROMPTS.length;
        textEl.textContent = REFLECTION_PROMPTS[idx];
    }

    // ----------------------------------------------------
    // CHAT LOGIC
    // ----------------------------------------------------
    function addMessage(text, isUser, memoriesToDisplay = []) {
        if (!chatHistory) return;

        const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-msg ${isUser ? 'ai-msg-user' : 'ai-msg-companion'}`;

        let innerHtml = '';
        if (isUser) {
            innerHtml = `
                <div class="ai-avatar">A</div>
                <div>
                    <div class="ai-bubble"><p>${text}</p></div>
                    <span class="ai-time">${timeStr}</span>
                </div>
            `;
        } else {
            innerHtml = `
                <div class="ai-avatar">🌱</div>
                <div style="width:100%">
                    <div class="ai-bubble"><p>${text}</p></div>
            `;

            if (memoriesToDisplay && memoriesToDisplay.length > 0) {
                innerHtml += `<div class="ai-memory-results">`;
                memoriesToDisplay.forEach(m => {
                    let thumb = '';
                    if (m.type === 'photo' && m.mediaUrl) {
                        thumb = `<div class="ai-mem-card-img" style="background-image:url(${m.mediaUrl})"></div>`;
                    } else if (m.type === 'voice') {
                        thumb = `<div class="ai-mem-card-img bg-sage-light">🎙</div>`;
                    } else if (m.type === 'video') {
                        thumb = `<div class="ai-mem-card-img bg-card">🎥</div>`;
                    } else {
                        thumb = `<div class="ai-mem-card-img bg-sage-light">📝</div>`;
                    }
                    
                    let dateStr = m.date || '';
                    if (dateStr) {
                        const parts = dateStr.split('-');
                        const d = new Date(parts[0], parts[1]-1, parts[2]);
                        dateStr = d.toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'});
                    }

                    innerHtml += `
                        <div class="ai-mem-card" onclick="if(window.openModal) window.openModal('${m.id}')">
                            ${thumb}
                            <div class="ai-mem-card-info">
                                <div class="ai-mem-card-title">${m.title || 'Untitled'}</div>
                                <div class="ai-mem-card-date">${dateStr}</div>
                            </div>
                        </div>
                    `;
                });
                innerHtml += `</div>`;
            }

            innerHtml += `<span class="ai-time">${timeStr}</span></div>`;
        }

        msgDiv.innerHTML = innerHtml;
        chatHistory.appendChild(msgDiv);
        
        // Scroll to bottom safely
        setTimeout(() => {
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }, 50);
    }

    function generateAIResponse(userText) {
        const text = userText.toLowerCase();
        const memories = window.memoryStore ? window.memoryStore.getAll() : [];
        const reflections = memories.filter(m => m.type === 'reflection');

        if (memories.length === 0) {
            return {
                text: "Your memory story is just beginning 🌱 Capture a few moments and I'll help you explore them here.",
                memories: []
            };
        }

        // Happy memories this month
        if (text.includes("happiest") || text.includes("happy")) {
            const happyDates = reflections.filter(r => r.mood === 'Happy').map(r => r.date);
            const happyMemories = memories.filter(m => happyDates.includes(m.date));
            if (happyMemories.length > 0) {
                return {
                    text: "Here are some of the happy moments you captured. These memories seem to bring positive energy and joy to your journey! 🌟",
                    memories: happyMemories.slice(0, 5)
                };
            }
            // Fallback: search title
            const happySearch = memories.filter(m => (m.title||'').toLowerCase().includes('happy') || (m.reflection||'').toLowerCase().includes('happy'));
            if (happySearch.length > 0) {
                return { text: "Here are some happy moments I found:", memories: happySearch.slice(0,5) };
            }
            return { text: "I don't have enough saved memories marked as happy yet. Capture some joyful moments to see them here!", memories: [] };
        }

        // Summary this month
        if (text.includes("summary") || text.includes("month")) {
            const today = new Date();
            const prefix = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;
            const thisMonthMemories = memories.filter(m => m.date && m.date.startsWith(prefix));
            
            if (thisMonthMemories.length === 0) {
                return { text: "You haven't captured any memories this month yet. A great time to start!", memories: [] };
            }
            return {
                text: `You've captured ${thisMonthMemories.length} memor${thisMonthMemories.length===1?'y':'ies'} this month. Here are some of the recent ones to look back on.`,
                memories: thisMonthMemories.slice(0, 3)
            };
        }

        // Recent memories
        if (text.includes("recent") || text.includes("capture recently")) {
            return {
                text: "Here are the moments you captured most recently:",
                memories: memories.slice(0, 4)
            };
        }

        // Suggest reflection
        if (text.includes("reflect") || text.includes("suggest")) {
            const prompt = $el('ai-reflection-text')?.textContent || REFLECTION_PROMPTS[0];
            return {
                text: `Here is a thought to reflect on today: \n\n"${prompt}"\n\nYou can click the Start Reflection button on the right to dive into it!`,
                memories: []
            };
        }

        // Themes
        if (text.includes("theme")) {
            return {
                text: "Based on what you've captured, your themes are listed on the right sidebar. I look for recurring topics in your memory titles and reflections!",
                memories: []
            };
        }

        // Specific keyword searches (study, work, etc)
        for (const [key, info] of Object.entries(THEME_MAPPING)) {
            if (text.includes(key)) {
                const matches = memories.filter(m => ((m.title||'') + ' ' + (m.reflection||'')).toLowerCase().includes(key));
                if (matches.length > 0) {
                    return { text: `Here are some memories related to ${info.name}:`, memories: matches.slice(0,5) };
                }
            }
        }

        // Default fallback
        return {
            text: "That's a wonderful question. However, I don't have enough saved memories or context to answer that specifically yet. Try asking me about your recent memories, themes, or happy moments!",
            memories: []
        };
    }

    function handleSend() {
        const val = chatInput.value.trim();
        if (!val) return;
        
        // Remove quick prompts once user starts chatting
        const qp = document.querySelector('.ai-quick-prompts');
        if (qp) qp.style.display = 'none';

        // 1. Add User Message
        addMessage(val, true);
        chatInput.value = '';

        // 2. Generate and Add AI Response
        setTimeout(() => {
            const response = generateAIResponse(val);
            addMessage(response.text, false, response.memories);
        }, 600); // Small artificial delay for realism
    }

    // ----------------------------------------------------
    // INITIALIZATION
    // ----------------------------------------------------
    function initAI() {
        // Quick Prompts
        quickPrompts.forEach(btn => {
            btn.addEventListener('click', () => {
                chatInput.value = btn.getAttribute('data-prompt');
                handleSend();
            });
        });

        // Send Button & Enter Key
        if (sendBtn) sendBtn.addEventListener('click', handleSend);
        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleSend();
            });
        }

        // Start Reflection Button
        if (startReflectionBtn) {
            startReflectionBtn.addEventListener('click', () => {
                const calNav = document.querySelector('[data-page="calendar"]');
                if (calNav) calNav.click();
            });
        }

        // Initial Data Load & Subscribe
        if (window.memoryStore) {
            window.memoryStore.subscribe(() => updateSidebar());
        }
        

        updateSidebar();
        console.log('[MemoryVault] AI Companion initialized.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAI);
    } else {
        initAI();
    }

})();
