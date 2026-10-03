/**
 * MemoryVault AI — Gallery Module
 * Handles Timeline, Memories, Favorites, and Modal logic.
 */

(function () {
    'use strict';

    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];

    // Shared State for each view
    const views = {
        timeline: { search: '', type: 'all', sort: 'newest', onlyFavorites: false },
        memories: { search: '', type: 'all', sort: 'newest', onlyFavorites: false, layout: 'grid' },
        favorites: { search: '', type: 'all', sort: 'newest', onlyFavorites: true, layout: 'grid' }
    };

    function initGallery() {
        if (!window.memoryStore) return;

        // Initialize UI controls for all 3 views
        initViewControls('timeline');
        initViewControls('memories');
        initViewControls('favorites');
        initModal();

        // Global click listener to close dropdowns
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.m-more-menu-wrapper')) {
                $$('.m-dropdown.show').forEach(m => m.classList.remove('show'));
            }
        });

        // Subscribe to global store updates
        window.memoryStore.subscribe(() => {
            renderTimeline();
            renderMemories();
            renderFavorites();
        });
        
        console.log('[MemoryVault] Gallery module initialized.');
    }

    // ── UI Controls Init ──
    function initViewControls(viewId) {
        const container = $(`#page-${viewId}`);
        if (!container) return;

        // Search
        const searchInput = $('.search-input', container);
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                views[viewId].search = e.target.value.trim();
                renderView(viewId);
            });
        }

        // Type Filters
        const filters = $$('.filter-btn', container);
        filters.forEach(btn => {
            btn.addEventListener('click', () => {
                filters.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                views[viewId].type = btn.getAttribute('data-type') || 'all';
                renderView(viewId);
            });
        });

        // Sort
        const sortSelect = $('.sort-select', container);
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                views[viewId].sort = e.target.value;
                renderView(viewId);
            });
        }

        // Layout Toggles (Grid/List)
        const layoutBtns = $$('.view-btn', container);
        layoutBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                layoutBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                views[viewId].layout = btn.getAttribute('data-layout') || 'grid';
                renderView(viewId);
            });
        });
    }

    function renderView(viewId) {
        if (viewId === 'timeline') renderTimeline();
        else if (viewId === 'memories') renderMemories();
        else if (viewId === 'favorites') renderFavorites();
    }

    // ── Render Timeline ──
    function renderTimeline() {
        const container = $('#timeline-container');
        if (!container) return;

        const data = window.memoryStore.getFilteredAndSorted(views.timeline);

        if (data.length === 0) {
            container.innerHTML = getEmptyStateHTML('timeline');
            return;
        }

        // Group by Month/Year
        const groups = {};
        data.forEach(m => {
            const d = new Date(m.date);
            const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(m);
        });

        let html = '';
        for (const [groupName, mems] of Object.entries(groups)) {
            html += `<div class="timeline-group">
                <div class="timeline-month-badge">${groupName}</div>
                <div class="timeline-items">`;
            
            mems.forEach(m => {
                html += getTimelineItemHTML(m);
            });

            html += `</div></div>`;
        }

        container.innerHTML = html;
        attachItemEvents(container);
    }

    function getTimelineItemHTML(m) {
        const d = new Date(m.date);
        const monthsShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const mStr = monthsShort[d.getMonth()];
        const dStr = String(d.getDate()).padStart(2, '0');

        let typeIcon = '';
        if (m.type === 'photo') typeIcon = '📷 Photo';
        if (m.type === 'voice') typeIcon = '🎙 Voice';
        if (m.type === 'video') typeIcon = '🎥 Video';

        return `
        <div class="timeline-item" data-id="${m.id}">
            <div class="timeline-date">
                <span class="timeline-date-m">${mStr}</span>
                <span class="timeline-date-d">${dStr}</span>
            </div>
            ${getThumbHTML(m, 't-thumb')}
            <div class="t-content">
                <div class="t-header">
                    <h4 class="t-title">${m.title}</h4>
                    <div class="t-actions">
                        <button class="btn-fav toggle-fav-btn ${m.favorite ? 'is-favorite' : ''}" data-id="${m.id}">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        </button>
                    </div>
                </div>
                <div class="t-meta">
                    <span class="t-type-badge">${typeIcon}</span>
                    ${m.location ? `<span class="t-meta-item">📍 ${m.location}</span>` : ''}
                </div>
                ${m.reflection ? `<p class="t-reflection">${m.reflection}</p>` : ''}
            </div>
        </div>`;
    }

    // ── Render Memories & Favorites ──
    function renderMemories() {
        renderGallery('memories', '#memories-container', views.memories);
    }
    
    function renderFavorites() {
        renderGallery('favorites', '#favorites-container', views.favorites);
    }

    function renderGallery(typeStr, containerSel, viewState) {
        const container = $(containerSel);
        if (!container) return;

        const data = window.memoryStore.getFilteredAndSorted(viewState);

        if (data.length === 0) {
            container.innerHTML = getEmptyStateHTML(typeStr);
            container.className = '';
            return;
        }

        container.className = viewState.layout === 'grid' ? 'gallery-grid' : 'gallery-list';
        
        let html = '';
        data.forEach(m => {
            html += getCardHTML(m);
        });
        
        container.innerHTML = html;
        attachItemEvents(container);
    }

    function getCardHTML(m) {
        const d = new Date(m.date);
        const monthsShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const dateStr = `${monthsShort[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

        let typeIcon = '';
        if (m.type === 'photo') typeIcon = '📷 Photo';
        if (m.type === 'voice') typeIcon = '🎙 Voice';
        if (m.type === 'video') typeIcon = '🎥 Video';

        return `
        <div class="memory-card" data-id="${m.id}">
            ${getThumbHTML(m, 'm-thumb', m.soundtrackBlob ? typeIcon + ' <span style="display:inline-flex; align-items:center; justify-content:center; background:white; color:var(--color-green); width:20px; height:20px; border-radius:4px; margin-left:4px; box-shadow:0 1px 3px rgba(0,0,0,0.2);">🎵</span>' : typeIcon)}
            <div class="m-info">
                <h4 class="m-title">${m.title}</h4>
                <span class="m-date">${dateStr}</span>
                <div class="m-actions">
                    <span class="t-type-badge" style="background:transparent; border:none; padding:0;">${typeIcon}</span>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <button class="btn-fav toggle-fav-btn ${m.favorite ? 'is-favorite' : ''}" data-id="${m.id}">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        </button>
                        <div class="m-more-menu-wrapper">
                            <button class="btn-more-menu" data-id="${m.id}" style="background:none; border:none; cursor:pointer; font-size:1.2rem; color:var(--color-text-muted); padding:4px;">&#8942;</button>
                            <div class="m-dropdown" id="dropdown-${m.id}">
                                <button class="m-dropdown-item btn-edit-mem" data-id="${m.id}">&#9999; Edit Memory</button>
                                <button class="m-dropdown-item btn-del-mem" data-id="${m.id}" style="color:var(--color-error)">&#128465; Delete Memory</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // ── Thumbnails & Empty States ──
    function getThumbHTML(m, wrapperClass, overlayHtml = '') {
        let content = '';
        if (m.type === 'photo') {
            if (m.mediaUrl) {
                content = `<img src="${m.mediaUrl}" alt="${m.title}" loading="lazy">`;
            } else {
                content = `<div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--color-text-muted); font-size:0.9rem; background:var(--color-bg);">Media unavailable</div>`;
            }
        } else if (m.type === 'voice') {
            if (m.mediaUrl) {
                const mime = (m.mediaBlob && m.mediaBlob.type) ? m.mediaBlob.type : 'audio/webm';
                content = `<div style="display:flex; align-items:center; justify-content:center; height:100%; width:100%; background:var(--color-sage-light); padding:10px;">
                    <audio controls style="width:100%;">
                        <source src="${m.mediaUrl}" type="${mime}">
                        Media unavailable
                    </audio>
                </div>`;
            } else {
                content = `<div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--color-text-muted); font-size:0.9rem; background:var(--color-bg);">Media unavailable</div>`;
            }
        } else if (m.type === 'video') {
            if (m.mediaUrl) {
                const mime = (m.mediaBlob && m.mediaBlob.type) ? m.mediaBlob.type : 'video/mp4';
                content = `<video controls playsinline style="width:100%; height:100%; object-fit:cover;">
                    <source src="${m.mediaUrl}" type="${mime}">
                    Media unavailable
                </video>`;
            } else {
                content = `<div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--color-text-muted); font-size:0.9rem; background:var(--color-bg);">Media unavailable</div>`;
            }
        } else {
            content = `<div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--color-text-muted); font-size:0.9rem; background:var(--color-bg);">Media unavailable</div>`;
        }

        const overlay = overlayHtml ? `<div class="m-type-icon" style="pointer-events:none;">${overlayHtml}</div>` : '';
        return `<div class="open-modal-trigger ${wrapperClass}" style="cursor:pointer;" data-id="${m.id}">${content}${overlay}</div>`;
    }

    function getEmptyStateHTML(type) {
        if (type === 'timeline' || type === 'memories') {
            return `
            <div class="empty-gallery">
                <div class="empty-gallery-icon">🌱</div>
                <h3>No memories yet</h3>
                <p>Capture your first beautiful moment.</p>
                <button type="button" class="btn-submit nav-to-capture" style="padding: 10px 24px;">Capture a Memory</button>
            </div>`;
        }
        return `
        <div class="empty-gallery">
            <div class="empty-gallery-icon">⭐</div>
            <h3>No favorite memories yet.</h3>
            <p>Mark a memory as favorite and it will appear here.</p>
            <button type="button" class="btn-secondary nav-to-memories">Explore Memories</button>
        </div>`;
    }

    // ── Events ──
    function attachItemEvents(container) {
        // Favorite toggle
        $$('.toggle-fav-btn', container).forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                window.memoryStore.toggleFavorite(id);
            });
        });

        // More Menu toggle
        $$('.btn-more-menu', container).forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close all other menus first
                $$('.m-dropdown.show').forEach(m => m.classList.remove('show'));
                const id = btn.getAttribute('data-id');
                const dropdown = $(`#dropdown-${id}`);
                if (dropdown) dropdown.classList.toggle('show');
            });
        });

        // Edit Memory Action
        $$('.btn-edit-mem', container).forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const dropdown = $(`#dropdown-${id}`);
                if (dropdown) dropdown.classList.remove('show');
                openModal(id, true); // true = isEditMode
            });
        });

        // Delete Memory Action
        $$('.btn-del-mem', container).forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const dropdown = $(`#dropdown-${id}`);
                if (dropdown) dropdown.classList.remove('show');
                
                const deleteModal = $('#custom-delete-modal');
                if (deleteModal) {
                    deleteModal.classList.add('visible');
                    
                    const confirmBtn = $('#btn-confirm-delete');
                    const cancelBtn = $('#btn-cancel-delete');
                    
                    const cleanup = () => {
                        deleteModal.classList.remove('visible');
                        if (confirmBtn) confirmBtn.onclick = null;
                        if (cancelBtn) cancelBtn.onclick = null;
                    };
                    
                    if (cancelBtn) cancelBtn.onclick = cleanup;
                    
                    if (confirmBtn) {
                        confirmBtn.onclick = () => {
                            window.memoryStore.remove(id);
                            cleanup();
                        };
                    }
                } else {
                    // Fallback if modal HTML is missing for some reason
                    if (confirm('Delete this memory?\n\nThis memory and its attached media will be removed permanently.')) {
                        window.memoryStore.remove(id);
                    }
                }
            });
        });

        // Open Modal
        $$('.open-modal-trigger, .t-content, .m-info', container).forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('.toggle-fav-btn')) return; // ignore fav click
                if (e.target.closest('.m-more-menu-wrapper')) return; // ignore more menu clicks
                if (e.target.tagName === 'AUDIO' || e.target.tagName === 'VIDEO') return; // ignore media controls
                const parent = el.closest('[data-id]');
                if (parent) {
                    const id = parent.getAttribute('data-id');
                    openModal(id);
                }
            });
        });

        // Empty state buttons
        $$('.nav-to-capture', container).forEach(btn => {
            btn.addEventListener('click', () => {
                const nav = $('[data-page="capture"]');
                if(nav) nav.click();
            });
        });
        $$('.nav-to-memories', container).forEach(btn => {
            btn.addEventListener('click', () => {
                const nav = $('[data-page="memories"]');
                if(nav) nav.click();
            });
        });
    }

    // ── Modal ──
    const modalOverlay = $('#global-modal-overlay');
    function initModal() {
        if (!modalOverlay) return;
        
        $('#modal-close-btn').addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalOverlay.classList.contains('visible')) closeModal();
        });
    }

    let selectedMemory = null;

    function openModal(id, isEditMode = false) {
        const mems = window.memoryStore.getAll();
        const m = mems.find(x => x.id === id);
        if (!m) return;
        selectedMemory = m;

        // View Mode Population
        $('#modal-title').textContent = m.title || '';
        
        const d = new Date(m.date);
        const monthsShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        if (!isNaN(d.getTime())) {
            $('#modal-date').innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${monthsShort[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
        }
        
        const locEl = $('#modal-location');
        if (m.location) {
            locEl.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${m.location}`;
            locEl.style.display = 'flex';
        } else {
            locEl.style.display = 'none';
        }

        const mediaContainer = $('#modal-media-container');
        mediaContainer.className = 'modal-media';
        if (m.type === 'photo') {
            mediaContainer.innerHTML = m.mediaUrl ? `<img src="${m.mediaUrl}" alt="Photo">` : '';
        } else if (m.type === 'video') {
            if (m.mediaUrl) {
                const mime = (m.mediaBlob && m.mediaBlob.type) ? m.mediaBlob.type : 'video/mp4';
                mediaContainer.innerHTML = `
                    <video controls playsinline style="max-width:100%; max-height:500px; border-radius:var(--radius-md);">
                        <source src="${m.mediaUrl}" type="${mime}">
                        <p>Unable to play this recording.</p>
                    </video>`;
            } else {
                mediaContainer.innerHTML = '<p>Unable to play this recording.</p>';
            }
        } else if (m.type === 'voice') {
            mediaContainer.className = 'modal-media audio';
            if (m.mediaUrl) {
                const mime = (m.mediaBlob && m.mediaBlob.type) ? m.mediaBlob.type : 'audio/webm';
                mediaContainer.innerHTML = `
                    <audio controls style="width:100%;">
                        <source src="${m.mediaUrl}" type="${mime}">
                        <p>Unable to play this recording.</p>
                    </audio>`;
            } else {
                mediaContainer.innerHTML = '<p>Unable to play this recording.</p>';
            }
        }

        const refEl = $('#modal-reflection');
        if (m.reflection) {
            refEl.innerHTML = `<h4>Story & Reflection</h4><p>${m.reflection}</p>`;
            refEl.style.display = 'block';
        } else {
            refEl.style.display = 'none';
        }

        const soundtrackEl = $('#modal-soundtrack');
        if (m.soundtrackUrl) {
            const stMime = m.soundtrackType || 'audio/mpeg';
            soundtrackEl.innerHTML = `
                <label style="display:flex; align-items:center; gap:6px; font-size:0.9rem; font-weight:600; color:var(--color-green); margin-bottom:12px;">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                    Memory Soundtrack
                </label>
                <div style="background:var(--color-sage-light); padding:10px; border-radius:8px;">
                    <p style="margin:0 0 8px 0; font-size:0.9rem; font-weight:500;">${m.soundtrackName}</p>
                    <audio controls style="width:100%; height:32px;">
                        <source src="${m.soundtrackUrl}" type="${stMime}">
                    </audio>
                </div>
            `;
            soundtrackEl.style.display = 'block';
        } else {
            soundtrackEl.style.display = 'none';
        }

        // Action Buttons
        const favBtn = $('#modal-fav-btn');
        favBtn.className = `btn-fav ${m.favorite ? 'is-favorite' : ''}`;
        favBtn.onclick = () => {
            if (selectedMemory) {
                window.memoryStore.toggleFavorite(selectedMemory.id);
                favBtn.classList.toggle('is-favorite');
                selectedMemory.favorite = !selectedMemory.favorite;
            }
        };

        const delBtn = $('#modal-del-btn');
        delBtn.onclick = () => {
            if (!selectedMemory) return;
            const deleteModal = $('#custom-delete-modal');
            if (deleteModal) {
                deleteModal.classList.add('visible');
                const confirmBtn = $('#btn-confirm-delete');
                const cancelBtn = $('#btn-cancel-delete');
                
                const cleanup = () => {
                    deleteModal.classList.remove('visible');
                    if (confirmBtn) confirmBtn.onclick = null;
                    if (cancelBtn) cancelBtn.onclick = null;
                };
                
                if (cancelBtn) cancelBtn.onclick = cleanup;
                if (confirmBtn) {
                    confirmBtn.onclick = () => {
                        window.memoryStore.remove(selectedMemory.id);
                        cleanup();
                        closeModal();
                    };
                }
            } else {
                if (confirm('Delete this memory?\n\nThis memory and its attached media will be removed permanently.')) {
                    window.memoryStore.remove(selectedMemory.id);
                    closeModal();
                }
            }
        };

        const editBtn = $('#modal-edit-btn');
        if (editBtn) {
            editBtn.onclick = () => {
                toggleEditMode(true);
            };
        }

        const cancelEditBtn = $('#modal-cancel-edit-btn');
        if (cancelEditBtn) {
            cancelEditBtn.onclick = () => toggleEditMode(false);
        }

        const saveEditBtn = $('#modal-save-edit-btn');
        if (saveEditBtn) {
            saveEditBtn.onclick = async () => {
                if (!selectedMemory) return;
                const newTitle = $('#edit-mem-title').value.trim();
                const newRefl = $('#edit-mem-reflection').value.trim();
                const newDate = $('#edit-mem-date').value;
                const newLoc = $('#edit-mem-location').value.trim();
                const mediaInput = $('#edit-mem-media');

                if (!newTitle || !newDate) {
                    alert('Title and Date are required.');
                    return;
                }

                const changes = {
                    title: newTitle,
                    reflection: newRefl,
                    date: newDate,
                    location: newLoc
                };

                if (mediaInput && mediaInput.files && mediaInput.files.length > 0) {
                    const file = mediaInput.files[0];
                    changes.mediaBlob = file;
                    if (file.type.startsWith('image/')) changes.type = 'photo';
                    else if (file.type.startsWith('video/')) changes.type = 'video';
                    else if (file.type.startsWith('audio/')) changes.type = 'voice';
                }
                
                const stInput = $('#edit-mem-soundtrack');
                if (stInput && stInput.files && stInput.files.length > 0) {
                    const stFile = stInput.files[0];
                    changes.soundtrackBlob = stFile;
                    changes.soundtrackName = stFile.name;
                    changes.soundtrackType = stFile.type;
                    changes.soundtrackDuration = 'Added'; // Simplified for edit
                } else if (window.__isSoundtrackRemoved) {
                    changes.soundtrackBlob = null;
                    changes.soundtrackName = '';
                    changes.soundtrackType = '';
                    changes.soundtrackDuration = '';
                }

                await window.memoryStore.update(selectedMemory.id, changes);
                
                // If media or soundtrack was changed, we reload location to update local URLs correctly
                if (changes.mediaBlob || changes.soundtrackBlob || window.__isSoundtrackRemoved) {
                    window.location.reload();
                } else {
                    closeModal();
                }
            };
        }

        window.__isSoundtrackRemoved = false;
        const rmvStBtn = $('#edit-soundtrack-remove');
        if (rmvStBtn) {
            rmvStBtn.onclick = () => {
                window.__isSoundtrackRemoved = true;
                const preview = $('#edit-soundtrack-preview');
                if (preview) preview.style.display = 'none';
                const stInput = $('#edit-mem-soundtrack');
                if (stInput) stInput.value = '';
            };
        }
        
        const stInput = $('#edit-mem-soundtrack');
        if (stInput) {
            stInput.onchange = () => {
                window.__isSoundtrackRemoved = false;
            };
        }

        toggleEditMode(isEditMode);
        modalOverlay.classList.add('visible');
    }

    function toggleEditMode(enable) {
        if (!selectedMemory) return;
        const viewMode = $('#modal-view-mode');
        const editForm = $('#modal-edit-form');
        const viewActions = $('#modal-view-actions');
        const editActions = $('#modal-edit-actions');
        const modalTitle = $('#modal-title');

        if (enable) {
            viewMode.style.display = 'none';
            editForm.style.display = 'flex';
            if (viewActions) viewActions.style.display = 'none';
            if (editActions) editActions.style.display = 'flex';
            modalTitle.textContent = 'Edit Memory';

            // Populate form
            $('#edit-mem-title').value = selectedMemory.title || '';
            $('#edit-mem-reflection').value = selectedMemory.reflection || '';
            $('#edit-mem-date').value = selectedMemory.date || '';
            $('#edit-mem-location').value = selectedMemory.location || '';
            
            // Populate soundtrack preview
            const previewEl = $('#edit-soundtrack-preview');
            const playerEl = $('#edit-soundtrack-player');
            const fileInput = $('#edit-mem-soundtrack');
            if (fileInput) fileInput.value = '';
            
            if (selectedMemory.soundtrackUrl) {
                if (previewEl) previewEl.style.display = 'flex';
                if (playerEl) playerEl.src = selectedMemory.soundtrackUrl;
            } else {
                if (previewEl) previewEl.style.display = 'none';
                if (playerEl) playerEl.src = '';
            }
        } else {
            viewMode.style.display = 'block';
            editForm.style.display = 'none';
            if (viewActions) viewActions.style.display = 'flex';
            if (editActions) editActions.style.display = 'none';
            modalTitle.textContent = selectedMemory.title || '';
        }
    }

    function closeModal() {
        modalOverlay.classList.remove('visible');
        selectedMemory = null;
        // Stop audio/video playing
        const media = $('#modal-media-container');
        if (media) {
            const v = media.querySelector('video');
            const a = media.querySelector('audio');
            if (v) v.pause();
            if (a) a.pause();
        }
    }


    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGallery);
    } else {
        initGallery();
    }

})();
