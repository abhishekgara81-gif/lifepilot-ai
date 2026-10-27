# LifePilot AI — Your Personal AI Action Planner

LifePilot AI is an action planning and task management web application built for university students, software engineers, job seekers, and self-directed learners. It turns open-ended goals and study ambitions into realistic schedules, daily focus blocks, and measurable progress milestones.

---

## 🌟 Key Pages & Features

1. **Dashboard (`/`)**:
   - Personalized greeting and student profile overview.
   - Core metrics: Today's Progress %, Active Goals count, Habit Consistency streak, Daily Focus Target.
   - Today's Priorities: Direct actionable checklist with priorities (High/Medium/Low), durations, and completion toggles.
   - Upcoming Deadlines: 7-day chronological alert radar.
   - Daily Schedule: Time-blocked timeline from morning planning to evening review.
   - Quick launch for Pomodoro study blocks and AI planning.

2. **AI Action Planner (`AI Planner`)**:
   - Natural language prompt intake (e.g. *"I want to prepare for my C++ exam, practice DSA daily, and complete my AI project in 30 days."*).
   - Presets for students and developers (C++ Exam & LeetCode, Software Internship sprint, Operating Systems midterm, Full-Stack AI sprint).
   - Parameter controls: Target timeframe (7 to 60 days), daily available focus hours (2h to 8h), domain orientation.
   - Structured plan review before saving: Phased breakdown with tasks, subtasks, priorities, and estimated minutes.
   - **Approve Plan**: Immediately creates a linked goal and injects all phase tasks into My Tasks and Calendar.
   - **Edit Plan**: Inline editing of task titles, instructions, checklists, and deletion.
   - **Export Blueprint**: Download structured plan as JSON.
   - **AI Connectivity**: Sends plan requests to Google Gemini 3.8 Flash (`@google/genai`) through the server. Missing keys, invalid requests, API failures, and rate limits are reported to the user; the planner does not fabricate replacement plans.

3. **My Tasks**:
   - Full CRUD: Add, edit, complete, delete tasks.
   - Dual views: Dense **List View** with subtask checklists and **Kanban Board** with drag/move lanes (To Do, In Progress, Completed).
   - Live filtering by search query, status, priority, and category (Study, Coding, Project, Revision, Personal).
   - Multi-field sorting (due date, priority weight, estimated duration, title).

4. **Timeblocked Calendar**:
   - Interactive **Week View** (7-day timeblocked matrix from 08:00 to 22:00) and **Day View**.
   - Transparent legend clearly distinguishing **Actual Saved Tasks** (editable) from **Sample Study Routine** blocks.
   - Click empty time slots to schedule focus blocks directly.

5. **Goals & Habits**:
   - **Strategic Goals**: Target dates, milestone progress bars, checklist completion.
   - **Habit Tracker**: 7-day streak matrix with interactive check-ins, automatic streak calculation, and category tags.

6. **Projects**:
   - Workspace isolation for courses and software repositories.
   - Completion progress bars, deadlines, and associated tasks filtered per project.

7. **Student Learning Center**:
   - **Pomodoro Study Engine**: 25m Focus, 5m Short Break, 15m Long Break with Web Audio API chime tone and session counter.
   - **Spaced Repetition & Leitner Roadmap**: 5-box active recall system with review intervals (1, 2, 4, 7, 14 days) and 5-star confidence ratings.

8. **Documents & Notes**:
   - Personal knowledge vault for study cheat-sheets and interview guides.
   - Pre-loaded with C++ RAII cheat-sheet, 14 DSA patterns guide, and LifePilot architecture briefs.
   - Markdown viewer, raw copy button, tags, category filters, and draft editor.

9. **Productivity Analytics**:
   - Real-time SVG weekly velocity bar chart.
   - Focus time distribution by domain (Study, Coding, Project, Revision).
   - High vs Medium vs Low priority fulfillment ratios.

10. **Settings**:
    - User profile customization (name, major, institution, email).
    - Schedule constraints (day start/end time, daily target hours).
    - Transparent server-side Gemini API key status indicator.
    - Portable JSON backup export, import with file picker or manual paste, sample data restore, and clear.

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Web Audio API
- **Backend**: Node.js, Express, tsx
- **AI Integration**: `@google/genai` (Google Gemini 3.8 Flash)
- **Local Persistence**: Browser `localStorage` with JSON export/import

---

## 🚀 How to Run Locally

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Gemini
Copy `.env.example` to `.env` in the project root if it does not already exist, then replace the placeholder with your key from [Google AI Studio](https://aistudio.google.com/apikey):
```env
GEMINI_API_KEY=your_actual_gemini_api_key
```
Keep `.env` local; it is excluded from Git. Restart the server after changing the key. The browser never receives the key.

### 4. Start the Application
```bash
npm.cmd run dev
```
Open your browser at `http://localhost:3000`.

### 5. Production Build
```bash
npm.cmd run build
npm.cmd start
```
