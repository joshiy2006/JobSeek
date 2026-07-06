# JobSeek

A workforce intelligence platform built for India's Tier-2/Tier-3 job market — combining a large aggregated jobs and courses database with a multilingual AI assistant to help users find relevant opportunities and upskilling paths.

## Overview

JobSeek aggregates job listings and course data at scale, then layers a conversational assistant on top so users can search, filter, and get guidance in the language they're most comfortable with — English, Hindi, or Hinglish. The goal is to make job discovery genuinely accessible beyond the metro-city, English-first job portals that dominate the space today.

## Features

- **Large-scale job aggregation** — 21,000+ live job listings sourced via an automated scraping pipeline
- **Course recommendations** — 7,000+ curated course entries to support upskilling alongside job search
- **Automated data refresh** — cron-driven scraper keeps listings and courses current without manual intervention
- **Multilingual AI chatbot** — RAG-based assistant that understands and responds in Hindi, English, and Hinglish
- **Fast, responsive UI** — clean React frontend with a unified layout and scalable typography
- **In-app chat drawer** — slide-out chat interface with a floating action button for quick access to the assistant

## Tech Stack

**Frontend**
- React
- CSS animations for interactive elements (floating action button, chat drawer)
- Design system: light theme with Indigo / Emerald / Orange accents

**Backend**
- FastAPI
- Supabase (database, Realtime, Row Level Security)

**Data Pipeline**
- Automated web scraper (cron-scheduled)
- Batched upsert pipelines into Supabase
- Analytical views for reporting/search

**AI / Chatbot**
- Retrieval-Augmented Generation (RAG) pipeline
- Multilingual support (Hindi / English / Hinglish)
- Deployed as a standalone Streamlit app, embedded into the main frontend via an iframe in the chat drawer

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Job/Course      │      │                  │      │                 │
│  Scraper (cron)  │─────▶│  Supabase        │◀────▶│  FastAPI        │
│                  │      │  (DB + RLS +     │      │  Backend        │
└─────────────────┘      │   Realtime)      │      └────────┬────────┘
                          └──────────────────┘               │
                                                               ▼
                                                     ┌─────────────────┐
                                                     │  React Frontend │
                                                     │  + RAG Chatbot  │
                                                     │  (multilingual) │
                                                     └─────────────────┘
```

## Deployment

- **Chatbot**: Deployed separately on Streamlit Community Cloud, with its own GitHub repo. It's embedded into the main JobSeek frontend via an iframe inside the chat drawer.
  - Chatbot repo: `https://github.com/joshiy2006/JobSeek-chatbot`
  - Live chatbot: `https://jobseek-chatbot-45v4kguaiqkkjj6kjqty7w.streamlit.app/`

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- Supabase account/project

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/jobseek.git
cd jobseek

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
GROQ_API_KEY=your_groq_api_key
```

### Running Locally

```bash
# Start backend
cd backend
uvicorn main:app --reload

# Start frontend (in a separate terminal)
cd frontend
npm run dev
```

## Roadmap

- [ ] Expand job source coverage beyond current scraper targets
- [ ] Add personalized job recommendations based on user profile/history
- [ ] Improve chatbot context retention across sessions
- [ ] Add employer-facing dashboard for direct postings

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License — see the LICENSE file for details.