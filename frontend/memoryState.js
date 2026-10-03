/**
 * MemoryVault AI - Global Memory State (Persistent via IndexedDB)
 */

(function () {
    'use strict';

    const DB_NAME = 'MemoryVaultDB';
    const DB_VERSION = 1;

    let db = null;
    let memories = [];
    let specialDays = [];
    let reflections = [];

    const memoryListeners = [];
    const specialDayListeners = [];
    const reflectionListeners = [];

    function generateId() {
        return 'mv_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    }

    function initDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('memories')) {
                    db.createObjectStore('memories', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('specialDays')) {
                    db.createObjectStore('specialDays', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('reflections')) {
                    db.createObjectStore('reflections', { keyPath: 'id' });
                }
            };

            req.onsuccess = (e) => {
                db = e.target.result;
                resolve(db);
            };

            req.onerror = (e) => reject(e.target.error);
        });
    }

    function getAllFromStore(storeName) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    }

    function saveToStore(storeName, item) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.put(item);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    function deleteFromStore(storeName, id) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    function cleanupMediaUrls() {
        // We could track and revoke URLs if memory is tight, but 
        // typically a reload clears them. We'll just generate new ones.
    }

    function enrichMemory(m) {
        // Convert Blob to URL for UI binding
        if (m.mediaBlob && !m.mediaUrl) {
            try {
                if (typeof m.mediaBlob === 'string') {
                    m.mediaUrl = m.mediaBlob; // fallback for improperly stored data
                } else {
                    m.mediaUrl = URL.createObjectURL(m.mediaBlob);
                }
            } catch (e) {
                console.error('Failed to parse blob:', e);
            }
        }
        if (m.soundtrackBlob && !m.soundtrackUrl) {
            try {
                if (typeof m.soundtrackBlob === 'string') {
                    m.soundtrackUrl = m.soundtrackBlob;
                } else {
                    m.soundtrackUrl = URL.createObjectURL(m.soundtrackBlob);
                }
            } catch (e) {
                console.error('Failed to parse soundtrack:', e);
            }
        }
        return m;
    }

    // -----------------------------------------------------------------------
    // MEMORY STORE
    // -----------------------------------------------------------------------
    window.memoryStore = {
        getAll() { return [...memories]; },
        
        async add(memoryData) {
            const m = { ...memoryData, id: generateId(), createdAt: Date.now() };
            
            // Wait! The old code might have stripped blobs if they were redundant, 
            // but the payload itself is saved.
            await saveToStore('memories', m);
            
            // restore ephemeral urls for the in-memory array so UI doesn't break
            const enriched = enrichMemory(m);
            memories.unshift(enriched);
            this.notify();
            return enriched;
        },

        async update(id, changes) {
            const idx = memories.findIndex(m => m.id === id);
            if (idx !== -1) {
                const updated = { ...memories[idx], ...changes };
                await saveToStore('memories', updated);
                memories[idx] = enrichMemory(updated);
                this.notify();
            }
        },

        async remove(id) {
            await deleteFromStore('memories', id);
            memories = memories.filter(m => m.id !== id);
            this.notify();
        },

        async clearAll() {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(['memories', 'specialDays', 'reflections'], 'readwrite');
                tx.objectStore('memories').clear();
                tx.objectStore('specialDays').clear();
                tx.objectStore('reflections').clear();
                tx.oncomplete = () => {
                    memories = [];
                    specialDays = [];
                    reflections = [];
                    this.notify();
                    resolve();
                };
                tx.onerror = (e) => reject(e.target.error);
            });
        },

        async toggleFavorite(id) {
            const m = memories.find(x => x.id === id);
            if (m) {
                await this.update(id, { favorite: !m.favorite });
            }
        },

        subscribe(fn) {
            memoryListeners.push(fn);
            fn(this.getAll()); 
        },

        notify() {
            const data = this.getAll();
            memoryListeners.forEach(fn => fn(data));
        },

        getFilteredAndSorted(options) {
            let result = this.getAll();
            if (options.type && options.type !== 'all') {
                result = result.filter(m => m.type === options.type);
            } else {
                result = result.filter(m => m.type !== 'special_day' && m.type !== 'reflection');
            }
            if (options.onlyFavorites) {
                result = result.filter(m => m.favorite === true);
            }
            if (options.search) {
                const q = options.search.toLowerCase();
                result = result.filter(m => 
                    (m.title && m.title.toLowerCase().includes(q)) || 
                    (m.reflection && m.reflection.toLowerCase().includes(q)) ||
                    (m.location && m.location.toLowerCase().includes(q))
                );
            }
            const sortOrder = options.sort || 'newest';
            result.sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                if (dateA === dateB) {
                    return sortOrder === 'newest' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
                }
                return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
            });
            return result;
        }
    };

    // -----------------------------------------------------------------------
    // STARTUP & MIGRATION
    // -----------------------------------------------------------------------
    async function boot() {
        try {
            await initDB();
            
            // Load all data
            const dbMemories = await getAllFromStore('memories');
            const dbSpecialDays = await getAllFromStore('specialDays');
            const dbReflections = await getAllFromStore('reflections');

            let modified = false;

            // 1. MIGRATION: Unify Special Days and Reflections into Memories
            for (const sd of dbSpecialDays) {
                if (!dbMemories.find(m => m.id === sd.id)) {
                    const newMem = {
                        ...sd,
                        type: 'special_day',
                        specialType: sd.type,
                        createdAt: sd.createdAt || Date.now()
                    };
                    await saveToStore('memories', newMem);
                    dbMemories.push(newMem);
                    modified = true;
                }
            }
            
            for (const r of dbReflections) {
                if (!dbMemories.find(m => m.id === r.id)) {
                    const newMem = {
                        ...r,
                        type: 'reflection',
                        createdAt: r.createdAt || Date.now()
                    };
                    await saveToStore('memories', newMem);
                    dbMemories.push(newMem);
                    modified = true;
                }
            }

            // Enrich memories with object URLs and sort
            memories = dbMemories.map(enrichMemory);
            memories.sort((a, b) => b.createdAt - a.createdAt);

            // Notify everyone that data is ready
            window.memoryStore.notify();

            console.log('[MemoryVault] IndexedDB initialized, loaded, and unified.');
        } catch (err) {
            console.error('[MemoryVault] Failed to initialize DB:', err);
        }
    }

    // Boot immediately
    boot();

})();