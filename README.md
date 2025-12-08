# AI Ads Assets Generator

Generate polished advertising creatives from a single product photo. The web interface lets merchandisers choose from multiple art directions, select an aspect ratio, and instantly prompt Gemini to produce style-specific ads.

## Project layout

- `src/app` &mdash; Next.js frontend that provides the creative brief interface and displays generated results.
- `backend` &mdash; FastAPI service that wraps the Gemini image generation call.
- `backend/img` &mdash; Test fixtures used by the original notebooks (optional for the web flow).

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Google AI Studio API key with access to `gemini-2.5-flash-image`

## Backend setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create an `.env` file or export the key before running the server:

```powershell
$env:GOOGLE_API_KEY="YOUR_KEY"
```

Start the API (port 8000 by default):

```powershell
uvicorn app:app --reload --port 8000
```

## Frontend setup

Install dependencies once in the project root:

```powershell
npm install
```

If your backend is not running on `http://localhost:8000`, set the URL explicitly:

```powershell
$env:NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
```

Launch the Next.js dev server with Turbopack:

```powershell
npm run dev
```

Visit the printed URL (typically `http://localhost:3000`). The app will proxy API calls to the configured backend.

## User flow

1. **Select styles** &mdash; four presets (`product w CTA`, `model from bottom calf`, `comfort lifestyle`, `editorial power fashion`) are pre-selected but can be toggled individually.
2. **Choose an aspect ratio** from common ad formats (square, portrait, landscape, vertical).
3. **Upload a product image** in PNG, JPG, or WebP format.
4. **Generate** &mdash; a single click sends the selected styles to the backend, which makes a Gemini call per style and streams the rendered creatives back to the UI.
5. **Iterate per style** &mdash; once results appear, each card exposes a dedicated “Regenerate” action so you can fine-tune individual directions without re-running the full batch.

Downloads are available directly from each card, making it easy to collect the generated assets for downstream workflows.
