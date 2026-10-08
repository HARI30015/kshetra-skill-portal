#!/usr/bin/env bash
# Replit entrypoint: runs the FastAPI backend and the Vite frontend together.
# Set SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_KEY in Replit Secrets.
set -e
pip install -q -r backend/requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
cd frontend
npm install -q
VITE_API_URL="http://localhost:8000" npm run dev -- --host 0.0.0.0 --port "${PORT:-5173}"
