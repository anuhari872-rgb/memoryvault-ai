/**
 * MemoryVault AI — Calendar (Special Days) Module
 */

(function () {
    'use strict';

    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];

    // Modal state
    let editingSpecialDayId = null;

    function initCalendar() {
        if (!window.memoryStore) return;

        // Subscriptions
        window.memoryStore.subscribe((allMemories) => {
            const sd = allMemories.filter(m => m.type === 'special_day');
            sd.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            renderSpecialDays(sd);
            
            const refs = allMemories.filter(m => m.type === 'reflection');
            refs.sort((a,b) => b.createdAt - a.createdAt);
            renderReflections(refs);
            renderReflectionGarden(refs);
        });

        // Special Day Modal
        initSpecialDayModal();

        // Reflection Form
        initReflectionForm();
        
        console.log('[MemoryVault] Calendar module initialized.');
    }

    // ── Special Days Rendering ──
    function renderSpecialDays(days) {
        const container = $('#special-days-container');
        if (!container) return;

        if (days.length === 0) {
            container.innerHTML = `<div class="empty-gallery"><p>No special days added yet.</p></div>`;
            return;
        }

        let html = '';
        days.forEach(d => {
            const dateObj = new Date(d.date);
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const dateStr = `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;

            let iconHtml = '';
            let iconClass = '';
            let typeClass = '';

            switch(d.specialType || d.type) {
                case 'Birthday':
                    iconHtml = '🎂';
                    iconClass = 'bg-pink';
                    typeClass = 'bg-pink';
                    break;
                case 'Achievement':
                    iconHtml = '🏆';
                    iconClass = 'bg-gold';
                    typeClass = 'bg-gold';
                    break;
                case 'Anniversary':
                    iconHtml = '💍';
                    iconClass = 'bg-pink';
                    typeClass = 'bg-pink';
                    break;
                case 'Special Day':
                    iconHtml = '❤️';
                    iconClass = 'bg-sage';
                    typeClass = 'bg-sage';
                    break;
                default:
                    iconHtml = '⭐';
                    iconClass = 'bg-blue';
                    typeClass = 'bg-blue';
                    break;
            }

            const repeatBadge = d.repeat === 'Every Year' ? `<span class="sd-badge bg-sage">Every Year</span>` : `<span class="sd-badge bg-blue">One Time</span>`;

            html += `
            <div class="sd-item" data-id="${d.id}">
                <div class="sd-icon-wrapper ${iconClass}">${iconHtml}</div>
                <div class="sd-info">
                    <div class="sd-header-row">
                        <span class="sd-title">${d.name || d.title || 'Special Day'}</span>
                        <div class="sd-badges">
                            <span class="sd-badge ${typeClass}">${d.specialType || 'Special'}</span>
                            ${repeatBadge}
                        </div>
                    </div>
                    <div class="sd-meta-row">
                        <span class="sd-meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            ${dateStr}
                        </span>
                        <span class="sd-meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                            Reminder: ${d.reminder}
                        </span>
                    </div>
                </div>
                <div class="sd-actions">
                    <button class="btn-sd-edit" title="Edit"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button class="btn-sd-delete" title="Delete" style="color:var(--color-error)"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                </div>
            </div>`;
        });
        container.innerHTML = html;

        // Attach listeners
        $$('.btn-sd-edit', container).forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.sd-item').getAttribute('data-id');
                openSpecialDayModal(id);
            });
        });
        $$('.btn-sd-delete', container).forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.sd-item').getAttribute('data-id');
                if (confirm('Delete this special day?')) {
                    window.memoryStore.remove(id);
                }
            });
        });
    }

    // ── Special Day Modal ──
    function initSpecialDayModal() {
        const addBtn = $('#btn-add-special-day');
        if (addBtn) addBtn.addEventListener('click', () => openSpecialDayModal());

        const modal = $('#special-day-modal-overlay');
        if (!modal) return;
        
        $('#sd-close-btn').addEventListener('click', closeSpecialDayModal);
        $('#sd-cancel-btn').addEventListener('click', closeSpecialDayModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeSpecialDayModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('visible')) closeSpecialDayModal();
        });

        const form = $('#sd-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const data = {
                type: 'special_day',
                name: $('#sd-name').value.trim(),
                date: $('#sd-date').value,
                specialType: $('#sd-type').value,
                repeat: $('#sd-repeat').value,
                reminder: $('#sd-reminder').value
            };

            if (editingSpecialDayId) {
                window.memoryStore.update(editingSpecialDayId, data);
            } else {
                window.memoryStore.add(data);
            }

            closeSpecialDayModal();
        });
    }

    function openSpecialDayModal(id = null) {
        const modal = $('#special-day-modal-overlay');
        const titleEl = $('#sd-modal-title');
        const form = $('#sd-form');
        
        editingSpecialDayId = id;

        if (id) {
            titleEl.textContent = 'Edit Special Day';
            const d = window.memoryStore.getAll().find(x => x.id === id);
            if (d) {
$('#sd-name').value = d.name || d.title;
$('#sd-date').value = d.date;
$('#sd-type').value = d.specialType || d.type;
$('#sd-repeat').value = d.repeat;
$('#sd-reminder').value = d.reminder;
            }
        } else {
            titleEl.textContent = 'Add Special Day';
            form.reset();
        }

        modal.classList.add('visible');
    }

    function closeSpecialDayModal() {
$('#special-day-modal-overlay').classList.remove('visible');
        editingSpecialDayId = null;
    }

    // ==========================================
    // Reflection Form
    // ==========================================
    let selectedMood = null;
    let editingReflectionId = null;

    function initReflectionForm() {
        const moodBtns = $$('.mood-btn');
        moodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                moodBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedMood = {
                    name: btn.getAttribute('data-mood'),
                    emoji: btn.querySelector('span').textContent
                };
$('#mood-error').style.display = 'none';
            });
        });

        const textarea = $('#reflection-text');
        const charCount = $('#ref-char-count');
        if(textarea) {
            textarea.addEventListener('input', () => {
                if(charCount) charCount.textContent = textarea.value.length;
            });
        }

        const form = $('#reflection-form');
        if(form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const text = textarea.value.trim();
                if (!text) return;
                
                if (!selectedMood) {
$('#mood-error').style.display = 'block';
                    return;
                }

                const data = {
                    type: 'reflection',
                    text,
                    moodName: selectedMood.name,
                    moodEmoji: selectedMood.emoji,
                    date: new Date().toISOString()
                };

                if (editingReflectionId) {
                    window.memoryStore.update(editingReflectionId, data);
                    editingReflectionId = null;
                    const saveBtn = form.querySelector('button[type="submit"]');
                    if (saveBtn) saveBtn.textContent = 'Save Reflection';
                    const cancelBtn = $('#cancel-ref-edit');
                    if (cancelBtn) cancelBtn.remove();
                } else {
                    window.memoryStore.add(data);
                }

                // Reset
                textarea.value = '';
                if(charCount) charCount.textContent = '0';
                moodBtns.forEach(b => b.classList.remove('active'));
                selectedMood = null;

                // Success msg
                const msg = $('#reflection-success');
                if(msg) {
                    msg.classList.remove('hidden');
                    setTimeout(() => msg.classList.add('hidden'), 3000);
                }
            });
        }
    }

    function renderReflections(refs) {
        const container = $('#reflections-container');
        if (!container) return;

        if (refs.length === 0) {
            container.innerHTML = `
                <p style="color:var(--color-text-muted); font-size:0.9rem; text-align:center; padding: 20px 0;">
                    No reflections yet.<br>Your thoughts will appear here.
                </p>`;
            return;
        }

        let html = '';
        refs.forEach(r => {
            const d = new Date(r.date);
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            
            html += `
            <div class="ref-item" data-id="${r.id}">
                <div class="ref-date-col">
                    <span class="ref-date-m">${months[d.getMonth()]}</span>
                    <span class="ref-date-d">${d.getDate()}</span>
                    <span class="ref-mood">${r.moodEmoji}</span>
                    <span class="ref-mood-text">${r.moodName}</span>
                </div>
                <div class="ref-content">${r.text.replace(/\n/g, '<br>')}</div>
                <div class="ref-actions">
                    <button class="btn-ref-edit" title="Edit"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button class="btn-ref-delete" title="Delete" style="color:var(--color-error)"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                </div>
            </div>`;
        });
        container.innerHTML = html;

        // Attach actions
        $$('.btn-ref-edit', container).forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.ref-item').getAttribute('data-id');
                const r = window.memoryStore.getAll().find(x => x.id === id);
                if (r) {
                    $('#reflection-text').value = r.text;
                    $('#ref-char-count').textContent = r.text.length;
                    
                    $$('.mood-btn').forEach(b => {
                        if (b.getAttribute('data-mood') === r.moodName) {
                            b.click(); // Selects mood
                        }
                    });
                    editingReflectionId = id;
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });

        $$('.btn-ref-delete', container).forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.ref-item').getAttribute('data-id');
                if (confirm('Delete this reflection?')) {
                    window.memoryStore.remove(id);
                }
            });
        });
    }

    function renderReflectionGarden(refs) {
        const countEl = $('#rg-count');
        const emptyEl = $('#rg-empty');
        const container = $('#rg-container');
        
        if (!container) return;

        // Clear existing flowers, keeping the SVG ground, empty state, and popup
        const existingFlowers = $$('.rg-flower-container', container);
        existingFlowers.forEach(f => f.remove());

        if (countEl) countEl.textContent = `${refs.length} reflection${refs.length !== 1 ? 's' : ''}`;

        if (refs.length === 0) {
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }

        if (emptyEl) emptyEl.style.display = 'none';

        // Take up to 8 most recent reflections and reverse so oldest is on the left
        const displayRefs = refs.slice(0, 8).reverse();

        displayRefs.forEach((r, i) => {
            let flowerSvg = '';
            // Mood to Flower mapping
            switch(r.moodName) {
                case 'Happy': // Yellow flower
                    flowerSvg = `<svg viewBox="0 0 100 120" width="40" height="48" style="overflow:visible">
                        <path d="M50 120 Q 40 80 50 40" stroke="#719e5c" stroke-width="3" fill="none"/>
                        <path d="M50 80 Q 70 70 80 50 Q 60 60 50 80" fill="#719e5c"/>
                        <circle cx="50" cy="40" r="12" fill="#f4c430"/>
                        <circle cx="35" cy="30" r="10" fill="#ffdb58"/><circle cx="65" cy="30" r="10" fill="#ffdb58"/>
                        <circle cx="35" cy="50" r="10" fill="#ffdb58"/><circle cx="65" cy="50" r="10" fill="#ffdb58"/>
                        <circle cx="50" cy="20" r="10" fill="#ffdb58"/><circle cx="50" cy="60" r="10" fill="#ffdb58"/>
                    </svg>`; break;
                case 'Calm': // Lavender flower
                    flowerSvg = `<svg viewBox="0 0 100 120" width="30" height="48" style="overflow:visible">
                        <path d="M50 120 Q 55 70 50 30" stroke="#719e5c" stroke-width="3" fill="none"/>
                        <path d="M50 70 Q 30 50 20 60 Q 40 70 50 70" fill="#719e5c"/>
                        <ellipse cx="50" cy="25" rx="8" ry="12" fill="#E6E6FA"/>
                        <ellipse cx="40" cy="35" rx="8" ry="12" fill="#D8BFD8" transform="rotate(-30 40 35)"/>
                        <ellipse cx="60" cy="35" rx="8" ry="12" fill="#D8BFD8" transform="rotate(30 60 35)"/>
                    </svg>`; break;
                case 'Loved': // Pink flower
                    flowerSvg = `<svg viewBox="0 0 100 120" width="45" height="50" style="overflow:visible">
                        <path d="M50 120 Q 45 70 50 35" stroke="#719e5c" stroke-width="3" fill="none"/>
                        <circle cx="50" cy="35" r="8" fill="#e75480"/>
                        <path d="M50 35 C 30 15, 70 15, 50 35" fill="#ff69b4"/>
                        <path d="M50 35 C 20 40, 20 20, 50 35" fill="#ffb6c1"/>
                        <path d="M50 35 C 80 40, 80 20, 50 35" fill="#ffb6c1"/>
                    </svg>`; break;
                case 'Excited': // Red/orange flower
                    flowerSvg = `<svg viewBox="0 0 100 120" width="40" height="55" style="overflow:visible">
                        <path d="M50 120 Q 60 60 50 20" stroke="#719e5c" stroke-width="3" fill="none"/>
                        <polygon points="50,20 60,5 65,20 80,25 65,30 60,45 50,30 35,25 40,20" fill="#ff4500"/>
                        <circle cx="50" cy="22" r="6" fill="#ffd700"/>
                    </svg>`; break;
                case 'Sad': // Blue flower
                    flowerSvg = `<svg viewBox="0 0 100 120" width="35" height="50" style="overflow:visible">
                        <path d="M50 120 C 40 80, 70 60, 50 20" stroke="#719e5c" stroke-width="2" fill="none"/>
                        <path d="M50 20 C 30 0, 70 0, 50 20" fill="#4682b4"/>
                        <path d="M50 20 C 30 40, 70 40, 50 20" fill="#87cefa"/>
                    </svg>`; break;
                case 'Frustrated': // Red flower
                    flowerSvg = `<svg viewBox="0 0 100 120" width="35" height="45" style="overflow:visible">
                        <path d="M50 120 L 50 40" stroke="#719e5c" stroke-width="4" fill="none"/>
                        <polygon points="50,40 30,20 50,30 70,20" fill="#dc143c"/>
                        <polygon points="50,40 20,40 40,50 50,70 60,50 80,40" fill="#b22222"/>
                    </svg>`; break;
                case 'Tired': // Small green sprout
                default:
                    flowerSvg = `<svg viewBox="0 0 100 120" width="25" height="30" style="overflow:visible">
                        <path d="M50 120 Q 45 90 50 70" stroke="#719e5c" stroke-width="3" fill="none"/>
                        <path d="M50 70 C 20 60, 30 40, 50 70" fill="#90ee90"/>
                        <path d="M50 70 C 80 60, 70 40, 50 70" fill="#3cb371"/>
                    </svg>`; break;
            }

            const wrapper = document.createElement('div');
            wrapper.className = 'rg-flower-container rg-flower-grow';
            wrapper.style.position = 'absolute';
            // Distribute evenly across width (e.g. 10% to 90%)
            const percent = displayRefs.length === 1 ? 50 : 10 + (80 / (displayRefs.length - 1)) * i;
            wrapper.style.left = `${percent}%`;
            // Add a little randomness to bottom position
            wrapper.style.bottom = `${30 + (i % 2) * 10}px`;
            const ageIndex = displayRefs.length - 1 - i;
            let sizeScale = 1;
            if (ageIndex === 0) sizeScale = 0.55;
            else if (ageIndex === 1) sizeScale = 0.75;
            else sizeScale = Math.min(1.1, 0.9 + (ageIndex * 0.05));
            
            const dateObj = new Date(r.date);
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const dateStr = `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
            wrapper.setAttribute('data-tooltip', `${dateStr}\n${r.moodEmoji || ''} ${r.moodName}`);
            
            wrapper.innerHTML = `<div style="transform: scale(${sizeScale}); transform-origin: bottom center; transition: all 0.3s ease; display:flex; justify-content:center;">${flowerSvg}</div>`;
            
            wrapper.addEventListener('click', (e) => {
                e.stopPropagation();
                showGardenPopup(r, percent);
            });

            container.appendChild(wrapper);
        });
    }

    function showGardenPopup(r, leftPercent) {
        const popup = $('#rg-popup');
        if (!popup) return;
        
        const dateObj = new Date(r.date);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        $('#rg-popup-date').textContent = `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
        $('#rg-popup-mood').innerHTML = `${r.moodEmoji} ${r.moodName}`;
        $('#rg-popup-text').textContent = r.text;

        // Position popup near flower
        popup.style.left = `${leftPercent}%`;
        popup.classList.add('visible');
    }

    // Hide popup when clicking outside or on close button
    document.addEventListener('click', (e) => {
        const popup = $('#rg-popup');
        if (!popup || !popup.classList.contains('visible')) return;
        
        if (e.target.closest('#rg-popup-close')) {
            popup.classList.remove('visible');
            return;
        }
        
        if (!popup.contains(e.target)) {
            popup.classList.remove('visible');
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCalendar);
    } else {
        initCalendar();
    }

})();

