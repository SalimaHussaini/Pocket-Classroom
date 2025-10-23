"use strict";

// Storage utility fumctions
export const IDX_KEY = 'pc_capsules_index';
export const CAP_KEY = id => `pc_capsule_${id}`;
export const PROG_KEY = id => `pc_progress_${id}`;

export const loadIndex = () => {
    try {
        return JSON.parse(localStorage.getItem(IDX_KEY)) || [];   
    } catch (error) {
        console.error('Error loading capsules index:', error);
        return [];
    }
};

export const saveIndex = (index) => {
    try {
        localStorage.setItem(IDX_KEY, JSON.stringify(index));
        return true;
    } catch (error) {
        console.error('Error saving capsules index:', error);
        return false;
    }
};

export const loadCapsule = (id) => {
    try {
        return JSON.parse(localStorage.getItem(CAP_KEY(id))) || null;
    } catch (error) {
        console.error(`Error loading capsule ${id}:`, error);
        return null;
    }
};

export const saveCapsule = (capsule) => {
    try {
        localStorage.setItem(CAP_KEY(capsule.id), JSON.stringify(capsule));
        return true;
    } catch (error) {
        console.error(`Error saving capsule ${capsule.id}:`, error);
        return false;
    }
};

export const loadProgress = (id) => {
    try {
        return JSON.parse(localStorage.getItem(PROG_KEY(id))) || { bestScore: 0, knownFlashcards: []};
    } catch (error) {
        console.error(`Error loading progress for ${id}:`, error);
        return { bestScore: 0, knownFlashcards: []};
    }
};

export const saveProgress = (id, progress) => {
    try {
        localStorage.setItem(PROG_KEY(id), JSON.stringify(progress));
        return true;
    } catch (error) {
        console.error(`Error saving progress for ${id}:`, error);
        return false;
    }
};

export const deleteCapsule = (id) => {
    try {
        localStorage.removeItem(CAP_KEY(id));
        localStorage.removeItem(PROG_KEY(id));

        const index = loadIndex();
        const updatedIndex = index.filter(capsule => capsule.id !== id);
        saveIndex(updatedIndex);

        return true;
    } catch (error) {
        console.error(`Error deleting capsule ${id}:`, error);
        return false;
    }
};

// function to generate unique ID
export const generateId = () => {
    return ' cap_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// function to format date
export const timeAgo = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
};