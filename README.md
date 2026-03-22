# foos (AI Companion)

## Overview

Foos (formerly StudyCraft) is an advanced, AI-powered learning companion prototype designed to elevate the preparation experience for competitive exams and continuous learning. It is built upon a philosophy of **"Refined Editorial Minimalism,"** combining premium UI components with powerful generative workflows utilizing Google's Gemini API.

The platform transforms passive study materials (videos, PDFs, notes) into interactive, adaptive learning experiences through features like semantic conversational tutoring, spaced repetition, video transcript analysis, and automatic quiz generation.

## 🚀 Key Features

*   **AI Tutor (RAG-powered conversational interface):** Chat with your study materials. Upload PDF files via the refined `FileUploadModal`, and the system extracts, parses, and provides context-aware tutoring using Google's Gemini Models.
*   **Adaptive Practice (Quiz Generator):** Automatically generate custom quizzes from your notes or PDFs. Test your knowledge in real-time with granular feedback on your strengths and weaknesses.
*   **Video Library & Processor:** Paste any YouTube video URL. The app automatically fetches the real-time transcript (via a dedicated proxy server), summarizes the content, and allows you to chat directly with the video's concepts—turning passive watching into active studying.
*   **Spaced Repetition System:** Powered by `ts-fsrs` (Free Spaced Repetition Scheduler), this module tracks your memory retention and schedules reviews at the optimal time to reinforce long-term learning.
*   **Refined Editorial UI:** The user interface is driven by Tailwind CSS, `framer-motion`, and beautifully crafted components. It ensures an absolutely distraction-free and aesthetically pleasing, premium learning environment.

## 🛠 Tech Stack

**Frontend:**
*   **React 18** & **Vite**: Ultra-fast development server and optimized build tool.
*   **Tailwind CSS** & **Framer Motion**: For rapid styling, layout management, and buttery-smooth micro-animations.
*   **Zustand**: Lightweight, hook-based state management structure.
*   **React Router v6**: Client-side routing for seamless transitions.
*   **react-markdown**: Parsing and rendering markdown responses from Gemini.
*   **pdfjs-dist**: Client-side parsing and text extraction from PDF documents.

**Backend Services / Proxy:**
*   **Express.js**: Lightweight Node server (`server.js`) specifically built to bypass YouTube caption CORS issues using the `youtube-transcript` package.

**AI Integration:**
*   **Google Generative AI SDK (`@google/generative-ai`)**: Direct communication with the Gemini models for summaries, reasoning, UI structuring, and text generation.

## ⚙️ Setup and Installation

### Prerequisites
*   Node.js (v18+ recommended)
*   npm or yarn
*   A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### 1. Clone the Repository

```bash
git clone https://github.com/pnnv/foos.git
cd foos
```

### 2. Install Dependencies
You need to install dependencies for both the main app and the proxy server if it hasn't been done yet:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory (where `package.json` is located) and add your Gemini API Key:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Start the Application
To run the full suite (the Vite frontend React app and the Express proxy server for YouTube captions), you'll need to run both:

**Start the Express Proxy Server**:
In a terminal instance, run:
```bash
npm run server
# OR
node server.js
```
*(This will run the proxy on port `3001` handling `youtube-transcript` logic).*

**Start the Frontend**:
In another terminal instance, run:
```bash
npm run dev
```
*(This starts the Vite dev server, typically on `localhost:3000` or `5173`).*

Access the application in your browser and start crafting your study sessions!

## 📂 Project Structure Snapshot
```text
foos/
├── src/
│   ├── components/            # Main React UI components
│   │   ├── AITutor.jsx        # Conversational RAG interface
│   │   ├── Dashboard.jsx      # Home landing page with metrics
│   │   ├── FileUploadModal.jsx# Reusable PDF parser uploader
│   │   ├── QuizGenerator.jsx  # Generative MCQ quizzes
│   │   ├── SpacedRepetition.jsx # FSRS scheduling hub
│   │   ├── VideoProcessor.jsx # YouTube URL -> Transcript -> AI summary
│   │   └── ui/                # Shared stateless UI atoms
│   ├── lib/                   # Utility functions (e.g., tailwind merge utils)
│   ├── App.jsx                # Layout Shell and Routing definitions
│   └── main.jsx               # React DOM Entry
├── server.js                  # Express Proxy server for YouTube subtitles
├── tailwind.config.js         # Design token mapping & aesthetics
└── vite.config.js             # Vite core configuration
```

## 🤝 Philosophy
“StudyCraft” was imagined as part of a Hackathon project aimed at redefining the competitive exam prep scene with modern Generative AI tooling. It proves that learning software doesn’t have to look cluttered—it can be smart, performant, and beautifully minimalistic.

---
**Happy learning!**
