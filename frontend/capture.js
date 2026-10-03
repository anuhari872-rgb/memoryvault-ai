/**
 * MemoryVault AI — Capture Page Module
 */

(function () {
    'use strict';

    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];

    // Media states
    let currentCaptureType = 'photo';
    let currentPhotoFile = null;
    let currentVideoFile = null;
    let currentAudioFile = null; // Can be recorded blob or uploaded file

    // MediaRecorder state
    let mediaRecorder = null;
    let audioChunks = [];
    let recordStartTime = 0;
    let recordInterval = null;
    let isRecording = false;

    function initCapturePage() {
        if (!$('#page-capture')) return;

        initTypeSwitching();
        initPhotoUpload();
        initVideoUpload();
        initVoiceRecording();
        initStoryCounter();
        initSoundtrack();
        initSaveForm();
        initDateDefaults();

        console.log('[MemoryVault] Capture module initialized.');
    }

    // ── Type Switching ──
    function initTypeSwitching() {
        const radios = $$('input[name="capture-type"]');
        const stepTitle = $('#media-step-title');
        
        const panels = {
            photo: $('#panel-photo'),
            voice: $('#panel-voice'),
            video: $('#panel-video')
        };

        radios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (!e.target.checked) return;
                currentCaptureType = e.target.value;
                
                // Hide all panels
                Object.values(panels).forEach(p => {
                    if (p) p.classList.add('hidden');
                });
                
                // Show selected panel
                if (panels[currentCaptureType]) {
                    panels[currentCaptureType].classList.remove('hidden');
                }

                // Update title
                if (currentCaptureType === 'photo') stepTitle.textContent = '2. Add Photo';
                if (currentCaptureType === 'voice') stepTitle.textContent = '2. Record Your Memory';
                if (currentCaptureType === 'video') stepTitle.textContent = '2. Add Video';

                // Clear error if switching types
                $('#media-error').classList.remove('visible');
            });
        });
    }

    // ── Photo Upload ──
    function initPhotoUpload() {
        const dropzone = $('#photo-dropzone');
        const input = $('#photo-input');
        const previewArea = $('#photo-preview-area');
        const img = $('#photo-preview-img');
        const filename = $('#photo-filename');
        const filesize = $('#photo-filesize');
        const btnChange = $('#photo-change-btn');
        const btnRemove = $('#photo-remove-btn');

        if (!dropzone) return;

        dropzone.addEventListener('click', () => input.click());

        input.addEventListener('change', (e) => {
            if (e.target.files.length) handlePhotoFile(e.target.files[0]);
        });

        // Drag & drop
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                const file = e.dataTransfer.files[0];
                if (file.type.startsWith('image/')) handlePhotoFile(file);
            }
        });

        btnChange.addEventListener('click', () => input.click());
        btnRemove.addEventListener('click', () => {
            currentPhotoFile = null;
            input.value = '';
            img.src = '';
            previewArea.classList.add('hidden');
            dropzone.classList.remove('hidden');
        });

        function handlePhotoFile(file) {
            currentPhotoFile = file;
            img.src = URL.createObjectURL(file);
            filename.textContent = file.name;
            filesize.textContent = formatBytes(file.size);
            
            dropzone.classList.add('hidden');
            previewArea.classList.remove('hidden');
            $('#media-error').classList.remove('visible');
        }
    }

    // ── Video Upload ──
    function initVideoUpload() {
        const dropzone = $('#video-dropzone');
        const input = $('#video-input');
        const previewArea = $('#video-preview-area');
        const player = $('#video-player');
        const filename = $('#video-filename');
        const filesize = $('#video-filesize');
        const btnChange = $('#video-change-btn');
        const btnRemove = $('#video-remove-btn');

        if (!dropzone) return;

        dropzone.addEventListener('click', () => input.click());

        input.addEventListener('change', (e) => {
            if (e.target.files.length) handleVideoFile(e.target.files[0]);
        });

        // Drag & drop
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                const file = e.dataTransfer.files[0];
                if (file.type.startsWith('video/')) handleVideoFile(file);
            }
        });

        btnChange.addEventListener('click', () => input.click());
        btnRemove.addEventListener('click', () => {
            currentVideoFile = null;
            input.value = '';
            player.src = '';
            previewArea.classList.add('hidden');
            dropzone.classList.remove('hidden');
        });

        function handleVideoFile(file) {
            currentVideoFile = file;
            player.src = URL.createObjectURL(file);
            filename.textContent = file.name;
            filesize.textContent = formatBytes(file.size);
            
            dropzone.classList.add('hidden');
            previewArea.classList.remove('hidden');
            $('#media-error').classList.remove('visible');
        }
    }

    // ── Voice Recording & Upload ──
    function initVoiceRecording() {
        const btnStart = $('#btn-record-start');
        const btnStop = $('#btn-record-stop');
        const indicator = $('#voice-indicator');
        const timeDisplay = $('#voice-time');
        const uploadBtn = $('#btn-audio-upload');
        const fileInput = $('#audio-input');
        
        const controlsArea = $('.voice-controls');
        const previewArea = $('#audio-preview-area');
        const player = $('#audio-player');
        const btnRemove = $('#audio-remove-btn');

        if (!btnStart) return;

        // Record
        btnStart.addEventListener('click', async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                startRecording(stream);
            } catch (err) {
                console.error('Microphone access denied:', err);
                alert('Microphone access is required to record voice memories.');
            }
        });

        btnStop.addEventListener('click', stopRecording);

        function startRecording(stream) {
            isRecording = true;
            audioChunks = [];
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                handleAudioFile(audioBlob, true);
                
                // Stop all tracks to release mic
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            
            // UI updates
            btnStart.classList.add('hidden');
            btnStop.classList.remove('hidden');
            indicator.classList.add('recording');
            
            recordStartTime = Date.now();
            timeDisplay.textContent = '00:00';
            recordInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - recordStartTime) / 1000);
                const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
                const s = String(elapsed % 60).padStart(2, '0');
                timeDisplay.textContent = `${m}:${s}`;
            }, 1000);
        }

        function stopRecording() {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            clearInterval(recordInterval);
            isRecording = false;
            
            btnStart.classList.remove('hidden');
            btnStop.classList.add('hidden');
            indicator.classList.remove('recording');
            timeDisplay.textContent = '00:00';
        }

        // Upload alternative
        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) handleAudioFile(e.target.files[0], false);
        });

        // Remove
        btnRemove.addEventListener('click', () => {
            currentAudioFile = null;
            player.src = '';
            fileInput.value = '';
            previewArea.classList.add('hidden');
            controlsArea.classList.remove('hidden');
        });

        function handleAudioFile(file, isRecorded) {
            currentAudioFile = file;
            player.src = URL.createObjectURL(file);
            
            controlsArea.classList.add('hidden');
            previewArea.classList.remove('hidden');
            $('#media-error').classList.remove('visible');
        }
    }

    // ── Story & Utilities ──
    function initStoryCounter() {
        const textarea = $('#memory-story');
        const counter = $('#char-count');
        if (!textarea) return;

        textarea.addEventListener('input', () => {
            counter.textContent = textarea.value.length;
        });
    }

    function initDateDefaults() {
        const dateInput = $('#memory-date');
        if (dateInput) {
            const now = new Date();
            // Format YYYY-MM-DD for input[type="date"]
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            dateInput.value = `${now.getFullYear()}-${m}-${d}`;
        }
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // ── Save Form ──
    let currentSoundtrackFile = null;
    let currentSoundtrackUrl = '';
    let currentSoundtrackDuration = '';
    let currentSoundtrackFavorite = false;

    function initSoundtrack() {
        const btnAdd = $('#btn-add-soundtrack');
        const btnChange = $('#btn-change-soundtrack');
        const btnRemove = $('#btn-remove-soundtrack');
        const emptyState = $('#soundtrack-empty-state');
        const filledState = $('#soundtrack-filled-state');
        const player = $('#soundtrack-player');
        const filenameLabel = $('#soundtrack-filename');
        const durationLabel = $('#soundtrack-duration');

        if (!btnAdd) return;

        // Music Picker State
        let pickerLibrary = [];
        let selectedPickerTrack = null;
        const previewAudio = new Audio();
        
        const modal = $('#music-picker-modal');
        const btnCloseModal = $('#btn-close-music-picker');
        const listContainer = $('#music-picker-list');
        const btnConfirm = $('#btn-picker-confirm');
        const btnAddDevice = $('#btn-picker-add-device');
        const fileInput = $('#music-picker-file-input');
        const searchInput = $('#music-picker-search');

        // Extract existing unique soundtracks from memoryStore
        function loadLibraryFromStore() {
            pickerLibrary = [];
            if (!window.memoryStore) return;
            const memories = window.memoryStore.getAll();
            const seenNames = new Set();
            memories.forEach(m => {
                if (m.soundtrackBlob && m.soundtrackName && !seenNames.has(m.soundtrackName)) {
                    seenNames.add(m.soundtrackName);
                    pickerLibrary.push({
                        file: m.soundtrackBlob,
                        name: m.soundtrackName,
                        type: m.soundtrackType,
                        duration: m.soundtrackDuration,
                        url: m.soundtrackUrl || (typeof m.soundtrackBlob === 'string' ? m.soundtrackBlob : URL.createObjectURL(m.soundtrackBlob)),
                        isFavorite: m.soundtrackFavorite || false
                    });
                }
            });
        }

        function renderMusicList() {
            const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
            const filteredLibrary = pickerLibrary.filter(track => track.name.toLowerCase().includes(query));

            if (filteredLibrary.length === 0) {
                listContainer.innerHTML = `
                    <div style="text-align:center; padding:40px 20px; color:var(--color-text-muted);">
                        <div style="font-size:3rem; margin-bottom:10px;">🎵</div>
                        <h3 style="color:var(--color-text); margin-bottom:8px; font-weight:600;">${query ? 'No music found' : 'Your Music Library is empty'}</h3>
                        <p style="font-size:0.95rem;">${query ? 'Try a different search term.' : 'Add a song from your device to use it as a memory soundtrack.'}</p>
                    </div>
                `;
                btnConfirm.style.opacity = '0.5';
                btnConfirm.style.pointerEvents = 'none';
                return;
            }

            let html = '';
            filteredLibrary.forEach((track) => {
                const idx = pickerLibrary.indexOf(track);
                const isSelected = selectedPickerTrack && selectedPickerTrack.name === track.name;
                html += `
                <div class="music-track-item ${isSelected ? 'selected' : ''}" data-idx="${idx}" style="display:flex; align-items:center; padding:12px; border-radius:12px; margin-bottom:8px; background:${isSelected ? 'var(--color-sage-light)' : 'transparent'}; border:1px solid ${isSelected ? 'var(--color-green)' : 'transparent'}; cursor:pointer; transition:all 0.2s;">
                    <button type="button" class="btn-track-play" data-idx="${idx}" style="width:36px; height:36px; min-width:36px; border-radius:50%; background:var(--color-green); color:white; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; margin-right:12px;">
                        ▶
                    </button>
                    <div style="flex:1; overflow:hidden;">
                        <div style="font-weight:600; font-size:0.95rem; color:var(--color-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${track.name}</div>
                        <div style="font-size:0.85rem; color:var(--color-text-muted);">${track.name.split('.')[0]}</div>
                    </div>
                    <div style="font-size:0.85rem; color:var(--color-text-muted); margin:0 12px;">${track.duration || '--:--'}</div>
                    <button type="button" class="btn-track-fav" data-idx="${idx}" style="background:none; border:none; color:${track.isFavorite ? 'var(--color-pink)' : 'var(--color-text-muted)'}; cursor:pointer; font-size:1.3rem; min-width:24px;">${track.isFavorite ? '♥' : '♡'}</button>
                    ${isSelected ? '<span style="color:var(--color-green); font-size:0.85rem; font-weight:600; margin-left:8px;">✓ Selected</span>' : ''}
                </div>
                `;
            });
            listContainer.innerHTML = html;

            $$('.music-track-item', listContainer).forEach(item => {
                item.addEventListener('click', (e) => {
                    if (e.target.closest('.btn-track-play') || e.target.closest('.btn-track-fav')) return; 
                    const idx = item.getAttribute('data-idx');
                    selectedPickerTrack = pickerLibrary[idx];
                    btnConfirm.style.opacity = '1';
                    btnConfirm.style.pointerEvents = 'auto';
                    renderMusicList();
                });
            });

            $$('.btn-track-play', listContainer).forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const idx = btn.getAttribute('data-idx');
                    const track = pickerLibrary[idx];
                    if (previewAudio.src === track.url && !previewAudio.paused) {
                        previewAudio.pause();
                        btn.textContent = '▶';
                    } else {
                        previewAudio.src = track.url;
                        previewAudio.play().catch(e=>console.log(e));
                        $$('.btn-track-play', listContainer).forEach(b => b.textContent = '▶');
                        btn.textContent = '⏸';
                    }
                });
            });

            $$('.btn-track-fav', listContainer).forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const idx = btn.getAttribute('data-idx');
                    const track = pickerLibrary[idx];
                    track.isFavorite = !track.isFavorite;
                    
                    if (window.memoryStore) {
                        const memories = window.memoryStore.getAll();
                        for (const m of memories) {
                            if (m.soundtrackName === track.name) {
                                await window.memoryStore.update(m.id, { soundtrackFavorite: track.isFavorite });
                            }
                        }
                    }
                    renderMusicList();
                });
            });
        }

        function openMusicPicker() {
            loadLibraryFromStore();
            selectedPickerTrack = null;
            btnConfirm.style.opacity = '0.5';
            btnConfirm.style.pointerEvents = 'none';
            if (searchInput) searchInput.value = '';
            modal.classList.add('visible');
            modal.style.opacity = '1';
            modal.style.pointerEvents = 'auto';
            renderMusicList();
        }

        function closeMusicPicker() {
            modal.classList.remove('visible');
            modal.style.opacity = '0';
            modal.style.pointerEvents = 'none';
            previewAudio.pause();
        }

        btnAdd.addEventListener('click', openMusicPicker);
        btnChange.addEventListener('click', openMusicPicker);
        btnCloseModal.addEventListener('click', closeMusicPicker);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeMusicPicker();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.opacity === '1') {
                closeMusicPicker();
            }
        });

        if (searchInput) {
            searchInput.addEventListener('input', renderMusicList);
        }

        btnAddDevice.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const url = URL.createObjectURL(file);
            const tempAudio = new Audio(url);
            tempAudio.onloadedmetadata = () => {
                let durStr = 'Unknown';
                const totalSeconds = Math.floor(tempAudio.duration);
                if (!isNaN(totalSeconds) && isFinite(totalSeconds)) {
                    const m = Math.floor(totalSeconds / 60);
                    const s = String(totalSeconds % 60).padStart(2, '0');
                    durStr = `${m}:${s}`;
                }
                
                const newTrack = {
                    file: file,
                    name: file.name,
                    type: file.type,
                    duration: durStr,
                    url: url,
                    isFavorite: false
                };
                
                // Add to library session, select it, re-render
                pickerLibrary.unshift(newTrack);
                selectedPickerTrack = newTrack;
                btnConfirm.style.opacity = '1';
                btnConfirm.style.pointerEvents = 'auto';
                if (searchInput) searchInput.value = '';
                renderMusicList();
                fileInput.value = '';
            };
        });

        btnConfirm.addEventListener('click', () => {
            if (!selectedPickerTrack) return;
            
            currentSoundtrackFile = selectedPickerTrack.file;
            currentSoundtrackUrl = selectedPickerTrack.url;
            currentSoundtrackDuration = selectedPickerTrack.duration;
            currentSoundtrackFavorite = selectedPickerTrack.isFavorite;

            filenameLabel.textContent = selectedPickerTrack.name;
            player.src = currentSoundtrackUrl;
            durationLabel.textContent = `Duration: ${selectedPickerTrack.duration}`;

            emptyState.classList.add('hidden');
            filledState.classList.remove('hidden');

            closeMusicPicker();
        });

        btnRemove.addEventListener('click', () => {
            currentSoundtrackFile = null;
            if (currentSoundtrackUrl) {
                // Don't blindly revoke, it might be in library. We will let cleanup handle it or just GC
                currentSoundtrackUrl = '';
            }
            currentSoundtrackDuration = '';
            currentSoundtrackFavorite = false;
            player.src = '';
            filledState.classList.add('hidden');
            emptyState.classList.remove('hidden');
        });
    }

    function initSaveForm() {
        const form = $('#capture-form');
        const successMsg = $('#capture-success-msg');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // 1. Validate title
            const titleInput = $('#memory-title');
            const titleError = $('#title-error');
            if (!titleInput.value.trim()) {
                titleError.classList.add('visible');
                titleInput.focus();
                return;
            } else {
                titleError.classList.remove('visible');
            }

            // 2. Validate media
            const mediaError = $('#media-error');
            let hasMedia = false;
            let previewSrc = '';

            if (currentCaptureType === 'photo' && currentPhotoFile) {
                hasMedia = true;
                previewSrc = URL.createObjectURL(currentPhotoFile);
            } else if (currentCaptureType === 'video' && currentVideoFile) {
                hasMedia = true;
                previewSrc = ''; // Browser limits video thumbnail generation synchronously
            } else if (currentCaptureType === 'voice' && currentAudioFile) {
                hasMedia = true;
            }

            if (!hasMedia) {
                mediaError.classList.add('visible');
                return;
            }

            // 3. Save memory (via global store to IndexedDB)
            let rawMedia = null;
            if (currentCaptureType === 'photo') rawMedia = currentPhotoFile;
            else if (currentCaptureType === 'voice') rawMedia = currentAudioFile;
            else if (currentCaptureType === 'video') rawMedia = currentVideoFile;

            const memoryData = {
                title: titleInput.value.trim(),
                type: currentCaptureType,
                date: $('#memory-date').value,
                location: $('#memory-location') ? $('#memory-location').value.trim() : '',
                favorite: $('#memory-favorite') ? $('#memory-favorite').checked : false,
                reflection: $('#memory-story') ? $('#memory-story').value.trim() : '',
                mediaBlob: rawMedia,
                soundtrackBlob: currentSoundtrackFile,
                soundtrackName: currentSoundtrackFile ? currentSoundtrackFile.name : '',
                soundtrackType: currentSoundtrackFile ? currentSoundtrackFile.type : '',
                soundtrackDuration: currentSoundtrackDuration,
                soundtrackFavorite: currentSoundtrackFavorite
            };
            
            // memoryStore.add now handles async DB insert and URL generation
            window.memoryStore.add(memoryData);
            
            // Reset form
            form.reset();
            
            // Reset media panels
            if ($('#photo-remove-btn')) $('#photo-remove-btn').click();
            if ($('#video-remove-btn')) $('#video-remove-btn').click();
            if ($('#audio-remove-btn')) $('#audio-remove-btn').click();

            // Reset soundtrack
            if ($('#btn-remove-soundtrack')) $('#btn-remove-soundtrack').click();
            
            // Reset char counter
            $('#char-count').textContent = '0';
            initDateDefaults();
            
            // Show success
            successMsg.classList.remove('hidden');
            setTimeout(() => {
                successMsg.classList.add('hidden');
            }, 4000);
            
            // Scroll to top
            $('.main-area').scrollTo({ top: 0, behavior: 'smooth' });
        });
        
        // Live title validation clear
        const titleInput = $('#memory-title');
        if (titleInput) {
            titleInput.addEventListener('input', () => {
                if (titleInput.value.trim()) $('#title-error').classList.remove('visible');
            });
        }

        // Subscribe to memory updates for Recent Captures
        if (window.memoryStore) {
            window.memoryStore.subscribe(updateRecentCaptures);
        }
    }

    function updateRecentCaptures(allMemories) {
        const container = $('#recent-captures-container');
        if (!container) return;
        
        // Only show up to 3 recent captures
        const recent = allMemories.slice(0, 3);
        
        if (recent.length === 0) {
            container.innerHTML = '<p class="empty-state">No memories captured yet.</p>';
            return;
        }
        
        let html = '';
        recent.forEach(m => {
            // Format date string beautifully (e.g. Sep 29, 2026)
            let dateStr = '';
            if (m.date) {
                const d = new Date(m.date);
                if (!isNaN(d.getTime())) {
                    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                    dateStr = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
                }
            }
            
            let iconSvg = '';
            let mediaTypeStr = '';
            let thumbHtml = '';
            
            if (m.type === 'photo') {
                iconSvg = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;
                mediaTypeStr = 'Photo';
                if (m.mediaUrl) {
                    thumbHtml = `<img src="${m.mediaUrl}" class="r-thumb" alt="Thumbnail">`;
                } else {
                    thumbHtml = `<div class="r-thumb">${iconSvg}</div>`;
                }
            } else if (m.type === 'voice') {
                iconSvg = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`;
                mediaTypeStr = 'Voice';
                thumbHtml = `<div class="r-thumb"><svg viewBox="0 0 24 24" width="24" height="24" fill="var(--color-green)"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>`;
            } else {
                iconSvg = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`;
                mediaTypeStr = 'Video';
                thumbHtml = `<div class="r-thumb"><svg viewBox="0 0 24 24" width="24" height="24" fill="var(--color-green)"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>`;
            }

            html += `
            <div class="recent-capture-item">
                ${thumbHtml}
                <div class="r-info">
                    <p class="r-title">${m.title}</p>
                    <div class="r-meta">
                        ${dateStr}
                        <span style="margin: 0 4px">•</span>
                        ${iconSvg} ${mediaTypeStr}
                    </div>
                </div>
            </div>`;
        });
        
        container.innerHTML = html;
    }

    // Initialize module when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCapturePage);
    } else {
        initCapturePage();
    }

})();
