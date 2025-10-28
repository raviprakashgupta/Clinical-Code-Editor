[![Deploy Pages](https://github.com/raviprakashgupta/Clinical-Code-Editor/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/raviprakashgupta/Clinical-Code-Editor/actions/workflows/deploy-pages.yml)

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1X_IkjHjlQkKJs8YmovmRBAU9JoXejdDg

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deployment (GitHub Pages)

This repository is configured to build and deploy to GitHub Pages automatically on pushes to `main` using the `deploy-pages.yml` workflow.

What to expect:
- Workflow name: "Build and deploy to GitHub Pages" (`.github/workflows/deploy-pages.yml`).
- The site will be published as a project site at:

  https://raviprakashgupta.github.io/Clinical-Code-Editor/

Steps you must complete:
1. Add the `GEMINI_API_KEY` repository secret (Settings → Secrets and variables → Actions → New repository secret) so the build can succeed.
2. After you deploy the backend (see Server deployment below), add a repository secret named `VITE_BACKEND_URL` with the public URL of your backend (for example `https://your-service.onrender.com`). The Pages build uses this value to point the frontend to the backend API.
2. Push to `main` (the workflow runs on push). The Actions tab will show progress.
3. When the workflow succeeds Pages will show the published site URL in Settings → Pages.

Notes:
- The API key is available at build time and will be embedded in the built assets. If you need to keep it private at runtime, consider proxying requests through a server.
- If you prefer a custom domain or a different provider, see the Hosting options section in the repository.

## Server deployment (recommended: Render)

This repo includes a small FastAPI server in `/server` that runs a local ggml model via `llama-cpp-python` and exposes `/api/generate` and `/api/health`.

Quick Render steps (summary):
1. Push your repo to GitHub (already done).
2. Create a Render account and connect the repository.
3. Create a new Web Service and point it to the `server` directory (or use the `server/Dockerfile` added to this repo).
   - If using the Dockerfile: Render will build the image and run the container.
   - Ensure the service exposes port 5000 and the start command runs `uvicorn server.main:app --host 0.0.0.0 --port 5000`.
4. Provide the model to the service:
   - Preferred: mount a persistent disk or provide a startup script that downloads the model into the container at `/app/server/models/model.bin`.
   - Alternatively, add the model to your container image (not recommended for very large models).
5. After deployment, note the public service URL (e.g., `https://your-service.onrender.com`).
6. Add `VITE_BACKEND_URL` as a repository secret with that URL (no trailing slash). Push to `main` to trigger the Pages build.

Notes on model hosting and cost:
- Running ggml models requires disk space and CPU; larger models may be slow on CPU-only hosts. Consider smaller quantized models for CPU-only environments.
- If you prefer to avoid hosting models yourself, replace `/server` logic with a proxy to a hosted inference API (Hugging Face / Replicate) and set that provider's API key as a secret instead.

