# AI LifeOS 🚀

AI LifeOS is a modern, all-in-one productivity operating system that brings together task management, goal tracking, notes, calendar events, and deep-work study sessions — all powered by an integrated AI assistant.

Built with the MERN stack (MongoDB, Express, React, Node.js) and optimized for a blazing-fast, app-like experience.

## ✨ Features

- **Smart Dashboard**: A central hub summarizing your tasks, goals, upcoming events, and recent notes.
- **Task Management**: Create, edit, and organize tasks. Drag-and-drop support, priority levels, and subtasks.
- **Goal Tracking**: Set long-term objectives with milestones and progress tracking.
- **Calendar & Events**: Manage your schedule with Month, Week, and Day views.
- **Knowledge Base (Notes)**: Rich text editing, folder organization, tagging, and pinning.
- **Study & Focus Module**: Pomodoro timer, deep-work sessions, analytics, and flashcards with spaced repetition.
- **AI Assistant**: Context-aware AI powered by Groq. Can summarize notes, generate study quizzes, and draft task roadmaps.
- **Global Search**: Instantly find anything across tasks, notes, goals, and events using `Cmd/Ctrl + K`.
- **Keyboard Shortcuts**: Power-user navigation built-in (`Shift + ?` to view).

## 🛠 Tech Stack

- **Frontend**: React (Vite), React Router, Context API, Vanilla CSS (BEM methodology), Lucide Icons
- **Backend**: Node.js, Express
- **Database**: MongoDB (Mongoose)
- **AI**: Groq API (LLaMA 3)
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs

## 📸 Screenshots

*(Replace these with links to your actual screenshots)*

![Dashboard](./docs/dashboard.png)
![AI Assistant](./docs/ai-assistant.png)
![Calendar](./docs/calendar.png)

## 🚀 Live Demo

**[View Live Application](https://your-vercel-url.vercel.app)** *(Replace with your Vercel URL)*

## 💻 Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/AILifeOS.git
   cd AILifeOS
   ```

2. **Backend Setup:**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in the `/server` directory:
   ```env
   PORT=5001
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   GROQ_API_KEY=your_groq_api_key
   ```
   Start the backend:
   ```bash
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd client
   npm install
   ```
   Start the frontend:
   ```bash
   npm run dev
   ```

## 🌐 API Endpoints (Overview)

- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- **Tasks**: `GET /api/tasks`, `POST /api/tasks`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id`
- **Goals**: `GET /api/goals`, `POST /api/goals`
- **Notes**: `GET /api/notes`, `POST /api/notes`
- **Calendar**: `GET /api/events`
- **Study**: `POST /api/study/sessions`, `GET /api/study/stats`
- **AI**: `POST /api/ai/chat`, `POST /api/ai/summarize-note`

## 📝 License

This project is licensed under the MIT License.
