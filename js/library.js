"use strict";

import { loadIndex, deleteCapsule, loadProgress, timeAgo, loadCapsule, saveCapsule, saveIndex, generateId } from './storage.js';
import { showView } from './main.js';
import { loadCapsuleForEditing } from './author.js';

export function renderLibrary() {
    const capsulesGrid = document.getElementById('capsulesGrid');
    const emptyState = document.getElementById('emptyState');
    const capsules = loadIndex();

    if (capsules.length === 0) {
        capsulesGrid.style.display = 'none';
        emptyState.style.display = 'block';
        setupLibraryEventListeners();
        return;
    }

    capsulesGrid.style.display = 'flex';
    emptyState.style.display = 'none';

    capsulesGrid.innerHTML = capsules.map(capsule => {
        const progress = loadProgress(capsule.id);
        const knownCount = progress.knownFlashcards ? progress.knownFlashcards.length : 0;
        
        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${escapeHtml(capsule.title)}</h5>
                        <div class="mb-2">
                            <span class="badge bg-secondary">${escapeHtml(capsule.subject)}</span>
                            <span class="badge bg-primary">${escapeHtml(capsule.level)}</span>
                        </div>
                        <p class="card-text text-muted small">Updated ${timeAgo(capsule.updatedAt)}</p>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between text-muted small mb-1">
                                <span>Quiz Score</span>
                                <span>${progress.bestScore || 0}%</span>
                            </div>
                            <div class="progress" style="height: 4px;">
                                <div class="progress-bar" style="width: ${progress.bestScore || 0}%"></div>
                            </div>
                        </div>
                        
                        <div class="small text-muted mb-3">
                            ${knownCount} known card${knownCount !== 1 ? 's' : ''}
                        </div>
                    </div>
                    <div class="card-footer bg-transparent">
                       <div class="btn-group w-100" role="group">
                            <button type="button" class="btn btn-outline-info mx-1 btn-sm" onclick="learnCapsule('${capsule.id}')">
                                Learn
                            </button>
                            <button type="button" class="btn btn-outline-secondary mx-1 btn-sm" onclick="editCapsule('${capsule.id}')">
                                Edit
                            </button>
                            <button type="button" class="btn btn-outline-warning mx-1 btn-sm" onclick="exportCapsule('${capsule.id}')">
                                Export
                            </button>
                            <button type="button" class="btn btn-outline-danger mx-1 btn-sm" onclick="deleteCapsuleConfirm('${capsule.id}')">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    setupLibraryEventListeners();
}

function setupLibraryEventListeners() {
    // New capsule button
    document.getElementById('newCapsuleBtn').addEventListener('click', () => {
        showView('author');
        loadCapsuleForEditing(null); // Create new
    });

    document.getElementById('emptyNewCapsuleBtn').addEventListener('click', () => {
        showView('author');
        loadCapsuleForEditing(null); // Create new
    });

    // Import functionality 
    document.getElementById('importBtn').addEventListener('click', () => {

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const capsuleData = JSON.parse(e.target.result);
                    
                    // Validate schema
                    if (capsuleData.schema !== 'pocket-classroom/v1') {
                        alert('Invalid capsule format: schema mismatch');
                        return;
                    }

                    if (!capsuleData.meta || !capsuleData.meta.title) {
                        alert('Invalid capsule: title is required');
                        return;
                    }

                    if ((!capsuleData.notes || capsuleData.notes.length === 0) &&
                        (!capsuleData.flashcards || capsuleData.flashcards.length === 0) &&
                        (!capsuleData.quiz || capsuleData.quiz.length === 0)) {
                        alert('Invalid capsule: must contain at least notes, flashcards, or quiz questions');
                        return;
                    }

                    // Generate new ID to avoid collisions
                    capsuleData.id = generateId();
                    capsuleData.meta.createdAt = capsuleData.meta.createdAt || new Date().toISOString();
                    capsuleData.meta.updatedAt = new Date().toISOString();

                    // Save capsule
                    saveCapsule(capsuleData);

                    // Update index
                    const index = loadIndex();
                    index.push({
                        id: capsuleData.id,
                        title: capsuleData.meta.title,
                        subject: capsuleData.meta.subject,
                        level: capsuleData.meta.level,
                        updatedAt: capsuleData.meta.updatedAt
                    });
                    saveIndex(index);

                    // Refresh library
                    renderLibrary();
                    alert('Capsule imported successfully!');

                } catch (error) {
                    console.error('Import error:', error);
                    alert('Error importing capsule: Invalid JSON format');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    });
}

// Utility functions
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Global functions for onclick handlers
window.learnCapsule = function(capsuleId) {
    showView('learn');
    setTimeout(() => {
        if (window.selectCapsuleInLearn) {
            window.selectCapsuleInLearn(capsuleId);
        }
    }, 100);
};

window.editCapsule = function(capsuleId) {
    showView('author');
    loadCapsuleForEditing(capsuleId);
};

window.exportCapsule = function(capsuleId) {
    const capsule = loadCapsule(capsuleId);
    if (!capsule) {
        alert('Capsule not found');
        return;
    }

    const dataStr = JSON.stringify(capsule, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${capsule.meta.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

window.deleteCapsuleConfirm = function(capsuleId) {
    const capsules = loadIndex();
    const capsule = capsules.find(c => c.id === capsuleId);
    
    if (!capsule) {
        alert('Capsule not found');
        return;
    }

    if (confirm(`Are you sure you want to delete "${capsule.title}"?`)) {
        if (deleteCapsule(capsuleId)) {
            renderLibrary();
        } else {
            alert('Error deleting capsule');
        }
    }
};