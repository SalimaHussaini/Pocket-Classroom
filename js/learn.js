"use strict";

import { loadIndex, loadCapsule, loadProgress, saveProgress } from `./storage.js`;

let currentLearnCapsule = null;
let currentFlashcardIndex = 0;
let quizState = {
    currentQuestion: 0,
    correctAnswers: 0,
    isActive: false
};

export function setupLearn() {
    populateCapsuleSelector();
    setupEventListeners();
    setupKeyboardShortcuts();
}

function populateCapsuleSelector() {
    const selector = document.getElementById(`capsuleSelector`);
    const capsules = loadIndex();
    
    selector.innerHTML = `<option value="">Select a capsule...</option>`
        capsules.map(capsule => 
            `<option value="${capsule.id}">${escapeHtml(capsule.title)}</option>`
        ).join('');
    
    selector.addEventListener(`change`, function() {
        const capsuleId = this.value;
        if (capsuleId) {
            loadCapsuleForLearning(capsuleId);
        } else {
            hideLearnContent();
        }
    });
}

function setupEventListeners() {
    // Export current capsule
    document.getElementById(`exportCurrentBtn`).addEventListener(`click`, () => {
        if (currentLearnCapsule) {
            exportCurrentCapsule();
        }
    });

    // Flashcards
    document.getElementById(`flipCardBtn`).addEventListener(`click`, flipFlashcard);
    document.getElementById(`prevCardBtn`).addEventListener(`click`, showPreviousFlashcard);
    document.getElementById(`nextCardBtn`).addEventListener(`click`, showNextFlashcard);
    document.getElementById(`markKnownBtn`).addEventListener(`click`, markCurrentFlashcardKnown);
    document.getElementById(`markUnknownBtn`).addEventListener(`click`, markCurrentFlashcardUnknown);

    // Quiz
    document.getElementById(`startQuizBtn`).addEventListener(`click`, startQuiz);
    document.getElementById(`restartQuizBtn`).addEventListener(`click`, startQuiz);

    // Notes search
    document.getElementById(`notesSearch`).addEventListener(`input`, filterNotes);
}

function setupKeyboardShortcuts() {
    document.addEventListener(`keydown`, (e) => {
        // Only process if we're in learn view with a capsule loaded
        if (!currentLearnCapsule) return;

        // Space to flip flashcard 
        if (e.code === `Space` && isFlashcardsTabActive()) {
            e.preventDefault();
            flipFlashcard();
        }

        // Bracket keys to cycle tabs
        if (e.code === `BracketLeft`) { // [
            e.preventDefault();
            cycleTabs(-1);
        } else if (e.code === `BracketRight`) { // ]
            e.preventDefault();
            cycleTabs(1);
        }
    });
}

// Checks flashcards tab is currently active
function isFlashcardsTabActive() {
    return document.getElementById(`flashcards`).classList.contains(`active`);
}

// Switches between tabs (notes, flashcards, quiz)
function cycleTabs(direction) {
    const tabs = [`notes-tab`, `flashcards-tab`, `quiz-tab`];
    const currentTab = document.querySelector(`.nav-link.active`).id;
    const currentIndex = tabs.indexOf(currentTab);
    const newIndex = (currentIndex + direction + tabs.length) % tabs.length;

    document.getElementById(tabs[newIndex]).click();
}

// Loads a capsule by ID and initializes all learning content
function loadCapsuleForLearning(capsuleId) {
    const capsule = loadCapsule(capsuleId);
    if (!capsule) {
        alert(`Capsule not found`);
        return;
    }

    currentLearnCapsule = capsule;
    showLearnContent();
    renderCapsuleMeta();
    renderNotes();
    setupFlashcards();
    setupQuiz();
}

// Shows the learning section and hides the "no capsule selected" message
function showLearnContent() {
    document.getElementById(`learnContent`).style.display = `block`;
    document.getElementById(`noCapsuleSelected`).style.display = `none`;
}

function hideLearnContent() {
    document.getElementById(`learnContent`).style.display = `none`;
    document.getElementById(`noCapsuleSelected`).style.display = `block`;
}

function renderCapsuleMeta() {
    const meta = currentLearnCapsule.meta;
    const progress = loadProgress(currentLearnCapsule.id);
    
    document.getElementById(`learnTitle`).textContent = meta.title;
    document.getElementById(`learnSubject`).textContent = meta.subject;
    document.getElementById(`learnLevel`).textContent = meta.level;
    document.getElementById(`learnDescription`).textContent = meta.desc;
    
    // Update progress bars
    document.getElementById(`quizProgressBar`).style.width = `${progress.bestScore || 0}%`;
    
    const knownCount = progress.knownFlashcards ? progress.knownFlashcards.length : 0;
    document.getElementById(`knownCardsCount`).textContent = `${knownCount} known card${knownCount !== 1 ? `s` : ``}`;
}

function renderNotes() {
    const notesList = document.getElementById(`notesList`);
    const notes = currentLearnCapsule.notes || [];
    
    notesList.innerHTML = notes
        .filter(note => note.trim())
        .map(note => `
            <li class="list-group-item">${escapeHtml(note)}</li>
        `).join('');
}

function filterNotes() {
    const searchTerm = document.getElementById(`notesSearch`).value.toLowerCase();
    const notes = currentLearnCapsule.notes || [];
    const notesList = document.getElementById(`notesList`);
    
    notesList.innerHTML = notes
        .filter(note => note.toLowerCase().includes(searchTerm))
        .map(note => `
            <li class="list-group-item">${escapeHtml(note)}</li>
        `).join('');
}

function setupFlashcards() {
    const flashcards = currentLearnCapsule.flashcards || [];
    currentFlashcardIndex = 0;
    
    if (flashcards.length > 0) {
        showFlashcard(0);
    } else {
        document.getElementById(`flashcardFront`).textContent = `No flashcards available`;
        document.getElementById(`flashcardBack`).textContent = `Add flashcards in Author mode`;
        document.getElementById(`prevCardBtn`).disabled = true;
        document.getElementById(`nextCardBtn`).disabled = true;
        document.getElementById(`markKnownBtn`).disabled = true;
        document.getElementById(`markUnknownBtn`).disabled = true;
    }
}

function showFlashcard(index) {
    const flashcards = currentLearnCapsule.flashcards || [];
    if (flashcards.length === 0) return;
    
    // Reset flip state
    document.getElementById(`flashcard`).classList.remove(`flipped`);
    const card = flashcards[index];
    document.getElementById(`flashcardFront`).textContent = card.front || 'Front';
    document.getElementById(`flashcardBack`).textContent = card.back || 'Back';
    
    // Update counter
    document.getElementById(`flashcardCounter`).textContent = `${index + 1}/${flashcards.length}`;
    
    // Update button states
    document.getElementById(`prevCardBtn`).disabled = index === 0;
    document.getElementById(`nextCardBtn`).disabled = index === flashcards.length - 1;
    
    // Update known state
    const progress = loadProgress(currentLearnCapsule.id);
    const isKnown = progress.knownFlashcards && progress.knownFlashcards.includes(index);
    updateKnownButtons(isKnown);
    
    currentFlashcardIndex = index;
}

function flipFlashcard() {
    document.getElementById(`flashcard`).classList.toggle(`flipped`);
}

function showPreviousFlashcard() {
    if (currentFlashcardIndex > 0) {
        showFlashcard(currentFlashcardIndex - 1);
    }
}

function showNextFlashcard() {
    const flashcards = currentLearnCapsule.flashcards || [];
    if (currentFlashcardIndex < flashcards.length - 1) {
        showFlashcard(currentFlashcardIndex + 1);
    }
}

function markCurrentFlashcardKnown() {
    markFlashcardKnown(currentFlashcardIndex, true);
}

function markCurrentFlashcardUnknown() {
    markFlashcardKnown(currentFlashcardIndex, false);
}

function markFlashcardKnown(index, known) {
    const progress = loadProgress(currentLearnCapsule.id);
    
    if (!progress.knownFlashcards) {
        progress.knownFlashcards = [];
    }
    
    if (known) {
        if (!progress.knownFlashcards.includes(index)) {
            progress.knownFlashcards.push(index);
        }
    } else {
        progress.knownFlashcards = progress.knownFlashcards.filter(i => i !== index);
    }
    
    saveProgress(currentLearnCapsule.id, progress);
    updateKnownButtons(known);
    
    // Update known count in meta
    const knownCount = progress.knownFlashcards.length;
    document.getElementById(`knownCardsCount`).textContent = `${knownCount} known card${knownCount !== 1 ? `s` : ``}`;
}

function updateKnownButtons(isKnown) {
    if (isKnown) {
        document.getElementById(`markKnownBtn`).classList.remove(`btn-success`);
        document.getElementById(`markKnownBtn`).classList.add(`btn-outline-success`);
        document.getElementById(`markUnknownBtn`).classList.remove(`btn-outline-danger`);
        document.getElementById(`markUnknownBtn`).classList.add(`btn-danger`);
    } else {
        document.getElementById(`markKnownBtn`).classList.remove(`btn-outline-success`);
        document.getElementById(`markKnownBtn`).classList.add(`btn-success`);
        document.getElementById(`markUnknownBtn`).classList.remove(`btn-danger`);
        document.getElementById(`markUnknownBtn`).classList.add(`btn-outline-danger`);
    }
}

function setupQuiz() {
    const quiz = currentLearnCapsule.quiz || [];
    document.getElementById(`quizQuestionsCount`).textContent = `${quiz.length} question${quiz.length !== 1 ? `s` : ``}`;
    
    if (quiz.length === 0) {
        document.getElementById(`startQuizBtn`).disabled = true;
        document.getElementById(`quiz-tab`).classList.add(`disabled`);
    } else {
        document.getElementById(`startQuizBtn`).disabled = false;
        document.getElementById(`quiz-tab`).classList.remove(`disabled`);
    }
}

function startQuiz() {
    const quiz = currentLearnCapsule.quiz || [];
    if (quiz.length === 0) return;
    
    quizState = {
        currentQuestion: 0,
        correctAnswers: 0,
        isActive: true
    };
    
    document.getElementById(`quizStart`).style.display = `none`;
    document.getElementById(`quizActive`).style.display = `block`;
    document.getElementById(`quizResults`).style.display = `none`;
    
    renderQuestion();
}

function renderQuestion() {
    const quiz = currentLearnCapsule.quiz || [];
    const question = quiz[quizState.currentQuestion];
    
    document.getElementById(`quizQuestionNumber`).textContent = `Question ${quizState.currentQuestion + 1}`;
    document.getElementById(`quizProgress`).textContent = `${quizState.currentQuestion + 1}/${quiz.length}`;
    document.getElementById(`quizQuestionText`).textContent = question.q;
    
    const choicesContainer = document.getElementById(`quizChoices`);
    choicesContainer.innerHTML = ``;
    
    question.choices.forEach((choice, index) => {
        const button = document.createElement(`button`);
        button.type = 'button';
        button.className = `list-group-item list-group-item-action`;
        button.textContent = `${String.fromCharCode(65 + index)}. ${choice}`;
        button.onclick = () => handleAnswer(index);
        choicesContainer.appendChild(button);
    });
    
    document.getElementById(`quizFeedback`).style.display = `none`;
}

function handleAnswer(selectedIndex) {
    const quiz = currentLearnCapsule.quiz || [];
    const question = quiz[quizState.currentQuestion];
    const isCorrect = selectedIndex === question.answerIndex;
    
    if (isCorrect) {
        quizState.correctAnswers++;
    }
    
    // Show feedback
    const feedback = document.getElementById(`quizFeedback`);
    const alert = document.getElementById(`feedbackAlert`);
    const feedbackText = document.getElementById(`feedbackText`);
    const explanation = document.getElementById(`feedbackExplanation`);
    
    if (isCorrect) {
        alert.className = `alert alert-success`;
        feedbackText.textContent = `Correct!`;
    } else {
        alert.className = `alert alert-danger`;
        feedbackText.textContent = `Incorrect. The correct answer is ${String.fromCharCode(65 + question.answerIndex)}.`;
    }
    
    if (question.explain) {
        explanation.textContent = question.explain;
        explanation.style.display = `block`;
    } else {
        explanation.style.display = `none`;
    }
    
    feedback.style.display = `block`;
    
    // Move to next question after delay
    setTimeout(() => {
        quizState.currentQuestion++;
        if (quizState.currentQuestion < quiz.length) {
            renderQuestion();
        } else {
            finishQuiz();
        }
    }, 2000);
}

function finishQuiz() {
    const quiz = currentLearnCapsule.quiz || [];
    const score = Math.round((quizState.correctAnswers / quiz.length) * 100);
    
    // Update best score
    const progress = loadProgress(currentLearnCapsule.id);
    const bestScore = Math.max(score, progress.bestScore || 0);
    progress.bestScore = bestScore;
    saveProgress(currentLearnCapsule.id, progress);
    
    // Update progress bar
    document.getElementById(`quizProgressBar`).style.width = `${bestScore}%`;
    
    // Show results
    document.getElementById(`quizActive`).style.display = `none`;
    document.getElementById(`quizResults`).style.display = `block`;
    document.getElementById(`quizScore`).textContent = `${score}%`;
    
    let message = ``;
    if (score === 100) {
        message = `Perfect! You nailed it!`;
    } else if (score >= 80) {
        message = `Great job! You know this material well.`;
    } else if (score >= 60) {
        message = `Good effort! Keep practicing.`;
    } else {
        message = `Keep studying! You will get better.`;
    }
    document.getElementById(`quizMessage`).textContent = message;
    
    quizState.isActive = false;
}

function exportCurrentCapsule() {
    if (!currentLearnCapsule) return;
    
    const dataStr = JSON.stringify(currentLearnCapsule, null, 2);
    const dataBlob = new Blob([dataStr], { type: `application/json` });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement(`a`);
    link.href = url;
    link.download = `${currentLearnCapsule.meta.title.replace(/[^a-z0-9]/gi, `_`).toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return ``;
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Global function for library to call
window.selectCapsuleInLearn = function(capsuleId) {
    document.getElementById(`capsuleSelector`).value = capsuleId;
    loadCapsuleForLearning(capsuleId);
};