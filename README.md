# 🎯 AI Interview Assistant

An intelligent AI-powered interview preparation system that conducts mock interviews through voice interaction. The system uses cutting-edge AI models to simulate real interview scenarios with natural speech recognition and generation.

## 📋 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- *🎙 Voice-Based Interviews*: Conduct mock interviews using voice input and output
- *🤖 AI-Powered Responses*: Leverages Google Generative AI to generate contextual interview questions and feedback
- *🔊 Speech Recognition*: Real-time transcription of user responses using OpenAI Whisper
- *📢 Text-to-Speech*: Natural-sounding audio responses using Google Text-to-Speech (gTTS)
- *💬 Conversation Continuity*: Maintains context across multiple interview questions for coherent interactions
- *🔄 Session Management*: Automatic session cleanup and state management
- *📱 Cross-Origin Support*: CORS-enabled for seamless frontend integration

## 📁 Project Structure

\\\`
AI-INTERVIEW/
├── app.py                 # Flask application and main server logic
├── requirements.txt       # Python dependencies
├── .gitignore            # Git ignore configuration
├── frontend/             # React/TypeScript frontend application
├── models/               # AI model integrations
│   ├── llm.py           # Language model (Google Generative AI)
│   ├── stt.py           # Speech-to-Text (OpenAI Whisper)
│   └── tts.py           # Text-to-Speech (gTTS)
├── templates/            # HTML templates for Flask
└── voice/               # Audio file storage (generated at runtime)
\\\`

## 🛠 Tech Stack

### Backend
- *Framework*: Flask 2.2.5
- *Language*: Python 3.8+
- *AI/ML Models*:
  - Google Generative AI (google-generative-ai==0.12.0)
  - OpenAI Whisper (openai-whisper==20230314)
  - Google Text-to-Speech (gTTS==2.3.1)

### Frontend
- JavaScript / TypeScript / React (See frontend/ directory)

### Additional Libraries
- flask-cors==3.1.1 - Cross-Origin Resource Sharing
- python-dotenv==1.0.0 - Environment variable management
- numpy==1.26.4 - Numerical computing

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- *Python 3.8 or higher*
- *FFmpeg* (required for audio processing)
  - *Windows*: choco install ffmpeg or download from [ffmpeg.org](https://ffmpeg.org)
  - *macOS*: brew install ffmpeg
  - *Linux*: sudo apt-get install ffmpeg
- *PyTorch* (platform/CUDA specific - see instructions below)
- *Node.js & npm* (for frontend development)

## 📥 Installation

### Step 1: Clone the Repository
\\\`bash
git clone https://github.com/Nitya131003/Interview_AI_Assistant.git
cd AI-INTERVIEW
\\\`

### Step 2: Set Up Python Environment
\\\`bash
# Create a virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
\\\`

### Step 3: Install PyTorch
Install a PyTorch wheel matching your system configuration:

\\\`bash
# CPU-only (Windows/PowerShell):
pip install --index-url https://download.pytorch.org/whl/cpu torch==2.2.0

# CUDA 11.8 (Linux):
pip install --index-url https://download.pytorch.org/whl/cu118 torch==2.2.0

# For other configurations, visit: https://pytorch.org/get-started/locally/
\\\`

### Step 4: Install Dependencies
\\\`bash
pip install -r requirements.txt
\\\`

### Step 5: Install Frontend Dependencies (Optional)
\\\`bash
cd frontend
npm install
cd ..
\\\`

## ⚙ Configuration

### Environment Variables

Create a .env file in the project root:

\\\`env
# Google Generative AI
GOOGLE_API_KEY=your_google_api_key_here

# Optional: OpenAI (if using Whisper via OpenAI)
OPENAI_API_KEY=your_openai_api_key_here

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
\\\`

### Obtaining API Keys

1. *Google Generative AI*:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add to .env file as GOOGLE_API_KEY

2. *OpenAI* (Optional):
   - Visit [OpenAI Platform](https://platform.openai.com/account/api-keys)
   - Create a new API key
   - Add to .env file as OPENAI_API_KEY

## 🚀 Usage

### Start the Backend Server
\\\`bash
python app.py
\\\`

The Flask server will start at http://localhost:5000

### Start the Frontend (Development)
\\\`bash
cd frontend
npm start
\\\`

### How to Use the Application

1. *Open the Application*: Navigate to http://localhost:5000 in your browser
2. *Start Interview*: Click the "Begin Interview" button
3. *Speak Your Response*: Use your microphone to answer interview questions
4. *Receive Feedback*: The AI will generate a response and read it back to you
5. *Continue*: The conversation maintains context for realistic interview scenarios

## 🔌 API Endpoints

### GET /
Returns the main interview interface (index.html)

*Response*: HTML page with interview interface

---

### POST /api/upload
Processes audio input, transcribes it, generates AI response, and converts to speech

*Request*:
\\\`json
{
  "audio": "<audio file (webm)>"
}
\\\`

*Response*:
\\\`json
{
  "message": "Audio processed successfully!",
  "teacher_text": "Transcribed user question",
  "assistant_response": "AI-generated answer",
  "tts_file": "/voice/assistant_response.mp3"
}
\\\`

*Status Codes*:
- 200: Success
- 400: No audio file provided
- 502: LLM processing error

---

### GET /voice/<filename>
Serves audio files with no-cache headers for fresh responses

*Parameters*:
- filename: Name of the audio file (e.g., assistant_response.mp3)

*Response*: Audio file (MP3)

## 🏗 Architecture

\\\`
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                 │
│              - Audio Recording                      │
│              - Response Display                     │
└────────────────────┬────────────────────────────────┘
                     │ Audio File Upload
                     ▼
┌─────────────────────────────────────────────────────┐
│              Flask Backend (Python)                 │
│         - Session Management                       │
│         - Request Routing                          │
└────┬──────────────────┬─────────────────┬───────────┘
     │                  │                 │
     ▼                  ▼                 ▼
┌─────────────────────────────────────────────────────┐
│           AI Model Pipeline                        │
│                                                     │
│  STT Model      LLM Model       TTS Model          │
│  (Whisper)  →  (Google AI)  →   (gTTS)            │
│                                                     │
│  Audio → Text → Response → Audio                   │
└─────────────────────────────────────────────────────┘
\\\`

## 📝 Model Details

### Speech-to-Text (STT)
- *Model*: OpenAI Whisper
- *Purpose*: Converts user voice input to text
- *File*: models/stt.py

### Large Language Model (LLM)
- *Provider*: Google Generative AI
- *Purpose*: Generates contextual interview responses
- *File*: models/llm.py

### Text-to-Speech (TTS)
- *Provider*: Google Text-to-Speech (gTTS)
- *Purpose*: Converts AI responses to natural speech
- *File*: models/tts.py

## 🔧 Troubleshooting

### FFmpeg Not Found
\\\`bash
# Install FFmpeg:
# Windows (PowerShell with Admin):
choco install ffmpeg

# macOS:
brew install ffmpeg

# Linux:
sudo apt-get install ffmpeg
\\\`

### PyTorch Installation Issues
Visit [PyTorch Installation Guide](https://pytorch.org/get-started/locally/) and select your OS, package manager, Python version, and CUDA version.

### API Key Errors
- Ensure .env file exists in the project root
- Verify API keys are correctly set in the .env file
- Check that API keys have appropriate permissions

### CORS Issues
CORS is already enabled in the Flask app. If issues persist, verify that the frontend is running on the allowed origin.

### Old TTS Files Playing
The application automatically removes old TTS files to ensure fresh responses. If issues persist, manually delete voice/assistant_response.mp3.

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

---
