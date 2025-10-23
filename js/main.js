"use strict";

import { loadIndex } from `./storage.js`;
import { renderLibrary } from `./library.js`;
import { setupAuthor } from `./author.js`;
import { setupLearn } from `./learn.js`;

// Global app state
let currentView = 'library';
let currentCapsuleId = null;

// Initialize the application
document.addEventListener(`DOMContentLoaded`, function () {
    initializeApp();
    setupEventListeners();
    setTheme(`night`);
});

function initializeApp() {
    // Show library view by default
    showView(`library`);
    renderLibrary();
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll(`[data-view]`).forEach(link => {
        link.addEventListener(`click`, (e) => {
            e.preventDefault();
            const view = e.target.getAttribute(`data-view`);
            showView(view);
        });
    });

    // Theme toggle
    document.getElementById(`themeToggle`).addEventListener(`click`, toggleTheme);
}

function showView(viewName) {
    // Hide all views
    document.querySelectorAll(`.view`).forEach(view => {
        view.style.display = `none`;
    });

    // Update navigation
    document.querySelectorAll(`.nav-link`).forEach(link => {
        link.classList.remove(`active`);
    });
    document.querySelector(`[data-view="${viewName}"]`).classList.add(`active`);

    // Show selected view
    document.getElementById(`${viewName}-view`).style.display = `block`;
    currentView = viewName;

    // Initialize view-specific functionality
    switch (viewName) {
        case `library`:
            renderLibrary();
            break;
        case `author`:
            setupAuthor();
            break;
        case `learn`:
            setupLearn();
            break;
    }
}

function setTheme(theme) {
    document.documentElement.setAttribute(`data-theme`, theme);
    localStorage.setItem(`pc_theme`, theme);

    const toggleBtn = document.getElementById(`themeToggle`);
    toggleBtn.innerHTML = theme === `night` ?
        `<i class="fas fa-sun"></i>` :
        `<i class="fas fa-moon"></i>`;

    // Add animation to theme toggle
    toggleBtn.style.transform = `rotate(180deg)`;
    setTimeout(() => {
        toggleBtn.style.transform = `rotate(0deg)`;
    }, 300);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute(`data-theme`) || `day`;
    const newTheme = currentTheme === `night` ? `day` : `night`;
    setTheme(newTheme);
}

// Export functions for other modules
export { currentView, currentCapsuleId, showView };