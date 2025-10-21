"use strict";

import { loadCapsule, saveCapsule, generateId, loadIndex, saveIndex } from './storage.js';
import { showView } from './main.js';

let currentEditingCapsuleId = null;

export function setupAuthor() {
    setupEventListeners();
    
    // If no capsule edited, start  a new one
    if (!currentEditingCapsuleId) {
        loadCapsuleForEditing(null);
    }
}

function setupEventListeners() {
    // Form submission
    document.getElementById('capsuleForm').addEventListener('submit', saveCapsuleForm);
    
    // Cancel button
    document.getElementById('cancelEditBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel? Unsaved changes will be lost.')) {
            showView('library');
        }
    });
    
    // Add flashcard button
    document.getElementById('addFlashcardBtn').addEventListener('click', () => {
        addFlashcardRow();
    });
    
    // Add question button
    document.getElementById('addQuestionBtn').addEventListener('click', () => {
        addQuestionBlock();
    });
}

export function loadCapsuleForEditing(capsuleId) {
    currentEditingCapsuleId = capsuleId;
    
    if (capsuleId) {
        // Load existing capsule
        const capsule = loadCapsule(capsuleId);
        if (capsule) {
            populateForm(capsule);
        }
    } else {
        // New capsule
        resetForm();
    }
}

function resetForm() {
    document.getElementById('title').value = '';
    document.getElementById('subject').value = '';
    document.getElementById('level').value = 'Beginner';
    document.getElementById('description').value = '';
    document.getElementById('notes').value = '';
    
    // Clear dynamic sections
    document.getElementById('flashcardsEditor').innerHTML = '';
    document.getElementById('quizEditor').innerHTML = '';
    
    // Add one flashcard and question by default
    addFlashcardRow();
    addQuestionBlock();
}

function populateForm(capsule) {
    const meta = capsule.meta;
    
    document.getElementById('title').value = meta.title || '';
    document.getElementById('subject').value = meta.subject || '';
    document.getElementById('level').value = meta.level || 'Beginner';
    document.getElementById('description').value = meta.desc || '';
    document.getElementById('notes').value = (capsule.notes || []).join('\n');
    
    // Populate flashcards
    const flashcardsEditor = document.getElementById('flashcardsEditor');
    flashcardsEditor.innerHTML = '';
    if (capsule.flashcards && capsule.flashcards.length > 0) {
        capsule.flashcards.forEach(card => {
            addFlashcardRow(card.front, card.back);
        });
    } else {
        addFlashcardRow();
    }
    
    // Populate quiz questions
    const quizEditor = document.getElementById('quizEditor');
    quizEditor.innerHTML = '';
    if (capsule.quiz && capsule.quiz.length > 0) {
        capsule.quiz.forEach(question => {
            addQuestionBlock(question);
        });
    } else {
        addQuestionBlock();
    }
}

function addFlashcardRow(front = '', back = '') {
    const row = document.createElement('div');
    row.className = 'row g-2 align-items-end mb-3';
    row.innerHTML = `
        <div class="col-md-5">
            <label class="form-label">Front</label>
            <input type="text" class="form-control fc-front" value="${escapeHtml(front)}" placeholder="Front of card">
        </div>
        <div class="col-md-5">
            <label class="form-label">Back</label>
            <input type="text" class="form-control fc-back" value="${escapeHtml(back)}" placeholder="Back of card">
        </div>
        <div class="col-md-2">
            <button type="button" class="btn btn-outline-danger btn-sm w-100 btnDel">×</button>
        </div>
    `;
    
    row.querySelector('.btnDel').addEventListener('click', () => {
        if (document.querySelectorAll('#flashcardsEditor .row').length > 1) {
            row.remove();
        } else {
            alert('At least one flashcard is required');
        }
    });
    
    document.getElementById('flashcardsEditor').appendChild(row);
}

function addQuestionBlock(question = null) {
    const q = question || {
        q: '',
        choices: ['', '', '', ''],
        answerIndex: 0,
        explain: ''
    };
    
    const block = document.createElement('div');
    block.className = 'card mb-3 question-block';
    block.innerHTML = `
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="card-title mb-0">Question</h6>
                <button type="button" class="btn btn-outline-danger btn-sm btnDelQ">Delete</button>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Question Text</label>
                <input type="text" class="form-control q-text" value="${escapeHtml(q.q)}" placeholder="Enter your question">
            </div>
            
            <div class="mb-3">
                <label class="form-label">Choices</label>
                ${[0, 1, 2, 3].map(i => `
                    <div class="input-group mb-2">
                        <span class="input-group-text">${String.fromCharCode(65 + i)}</span>
                        <input type="text" class="form-control q-choice" data-index="${i}" 
                               value="${escapeHtml(q.choices[i] || '')}" 
                               placeholder="Choice ${String.fromCharCode(65 + i)}">
                        <div class="input-group-text">
                            <input class="form-check-input mt-0 q-answer" type="radio" 
                                   name="answer_${Date.now()}" value="${i}" 
                                   ${i === q.answerIndex ? 'checked' : ''}>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div>
                <label class="form-label">Explanation (Optional)</label>
                <input type="text" class="form-control q-explain" value="${escapeHtml(q.explain || '')}" 
                       placeholder="Explanation for the correct answer">
            </div>
        </div>
    `;
    
    block.querySelector('.btnDelQ').addEventListener('click', () => {
        if (document.querySelectorAll('.question-block').length > 1) {
            block.remove();
        } else {
            alert('At least one question is required');
        }
    });
    
    document.getElementById('quizEditor').appendChild(block);
}

function saveCapsuleForm(event) {
    event.preventDefault();
    
    // Validate form
    const title = document.getElementById('title').value.trim();
    if (!title) {
        alert('Title is required');
        return;
    }
    
    // Collect data
    const capsule = {
        schema: 'pocket-classroom/v1',
        id: currentEditingCapsuleId || generateId(),
        meta: {
            title: title,
            subject: document.getElementById('subject').value.trim(),
            level: document.getElementById('level').value,
            desc: document.getElementById('description').value.trim(),
            createdAt: currentEditingCapsuleId ? loadCapsule(currentEditingCapsuleId)?.meta?.createdAt || new Date().toISOString() : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        notes: document.getElementById('notes').value.split('\n').filter(line => line.trim()),
        flashcards: [],
        quiz: []
    };
    
    // Collect flashcards
    document.querySelectorAll('#flashcardsEditor .row').forEach(row => {
        const front = row.querySelector('.fc-front').value.trim();
        const back = row.querySelector('.fc-back').value.trim();
        if (front || back) {
            capsule.flashcards.push({ front, back });
        }
    });
    
    // Collect quiz questions
    document.querySelectorAll('.question-block').forEach(block => {
        const questionText = block.querySelector('.q-text').value.trim();
        const choices = Array.from(block.querySelectorAll('.q-choice')).map(input => input.value.trim());
        const answerIndex = parseInt(block.querySelector('.q-answer:checked')?.value || '0');
        const explain = block.querySelector('.q-explain').value.trim();
        
        if (questionText && choices.some(choice => choice)) {
            capsule.quiz.push({
                q: questionText,
                choices: choices,
                answerIndex: answerIndex,
                explain: explain
            });
        }
    });
    
    // Validate at least one content type exists
    if (capsule.notes.length === 0 && capsule.flashcards.length === 0 && capsule.quiz.length === 0) {
        alert('Please add at least one note, flashcard, or quiz question');
        return;
    }
    
    // Save capsule
    if (saveCapsule(capsule)) {
        // Update index
        const index = loadIndex();
        const existingIndex = index.findIndex(item => item.id === capsule.id);
        
        const indexItem = {
            id: capsule.id,
            title: capsule.meta.title,
            subject: capsule.meta.subject,
            level: capsule.meta.level,
            updatedAt: capsule.meta.updatedAt
        };
        
        if (existingIndex >= 0) {
            index[existingIndex] = indexItem;
        } else {
            index.push(indexItem);
        }
        
        saveIndex(index);
        
        alert('Capsule saved successfully!');
        showView('library');
    } else {
        alert('Error saving capsule');
    }
}

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