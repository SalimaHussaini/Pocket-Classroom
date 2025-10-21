# 🎓 Pocket Classroom – Offline Learning Capsules

**Pocket Classroom** is a fully offline, single-page web application (SPA) built with **Vanilla JavaScript (ES Modules)**, **Bootstrap 5**, and custom **CSS**. It allows students to author, study, and share personalized "learning capsules" — consisting of notes, flashcards, and quizzes — all stored locally and sharable via JSON.

---

## ✨ Features

### 📚 Library View
- Browse all saved capsules with:
  - Title, subject, level, last updated time
  - Progress indicators: best quiz score & known flashcards
  - Actions: **Learn**, **Edit**, **Export**, **Delete**

### ✍️ Author Mode
- Create and edit learning capsules with:
  - **Metadata**: title, subject, level, description
  - **Notes**: multi-line or markdown-lite
  - **Flashcards**: dynamic front/back rows with flip animation
  - **Quiz**: multiple-choice (4 options) with correct answer and explanation
- Auto-save on change, with validation rules

### 🎓 Learn Mode
- Three interactive tabs:
  - **Notes**: searchable, clean list display
  - **Flashcards**: flip animation, known/unknown tracking, counter
  - **Quiz**: sequential questions, instant feedback, score calculation

### 💾 Offline Persistence
- Uses **LocalStorage** for capsule data, progress, and app state — fully functional without internet.

### 🔁 Export & Import Capsules
- Capsules follow a custom JSON schema:  
  `"schema": "pocket-classroom/v1"`
- Export capsules as `.json` files for peer-to-peer sharing.
- Import feature with validation and collision-safe IDs.

### 🌙 Light/Dark Mode
- Elegant **gradient-based theme toggle**
- Fully responsive and accessible design

---

## 📁 Tech Stack

- Vanilla JavaScript (ES Modules)
- Bootstrap 5 (CDN)
- HTML5 / CSS3
- LocalStorage

---

## 📂 Folder Structure

```plaintext
/
├── index.html
├── /css
│   └── styles.css
├── /js
│   ├── main.js        # App initialization & routing
│   ├── storage.js     # LocalStorage helpers
│   ├── library.js     # Capsule rendering, import/export
│   ├── author.js      # Authoring form & logic
│   └── learn.js       # Learn mode: notes, flashcards, quiz
├── /assets            # (Optional) Icons or images
└── README.md

🧑‍💻 Developed by: [Salima Hussaini]

Built with passion for offline-first, peer-to-peer learning tools.
