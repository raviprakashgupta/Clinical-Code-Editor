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
2. (Optional) If you have a Gemini API key you can add it to `.env.local` for local dev:
   ```
   GEMINI_API_KEY=ya29....
   ```
3. Run the app in dev mode:
   `npm run dev`

## Deploying the frontend (GitHub Pages)

This repository already contains a GitHub Actions workflow that builds the app and deploys the `dist/` to GitHub Pages on pushes to `main`.

If you want AI features to be live (not mocked), one of the following is required at build-time:

- Set the repository secret `VITE_BACKEND_URL` to the public URL of your backend (recommended). The workflow will pass it into the build so the frontend will POST prompts to `${VITE_BACKEND_URL}/api/generate` at runtime.
- Or set the repository secret `GEMINI_API_KEY` (not recommended) so the build can call Gemini directly. Note this embeds the key in the built JS.

## Deploying the backend (recommended: Render)

I scaffolded a FastAPI-based local LLM server in the `server/` folder with a `Dockerfile`. You have two simple options to deploy it:

1) Deploy the Docker image to a free host (Render):
   - I added a workflow to build and push a Docker image to GitHub Container Registry (GHCR) on push to `main`.
   - The image will be available as `ghcr.io/<your-org-or-username>/clinical-code-editor-server:latest`.
   - To run on Render: create a new Web Service, select Docker, and point it to that image (or connect the repo and use the Dockerfile).
   - After deploying, set the repository secret `VITE_BACKEND_URL` to the public URL of your service (e.g., https://my-service.onrender.com).

2) Deploy directly from the `server/` Dockerfile (manual):
   - Build and push the image:
     ```bash
     docker build -t ghcr.io/${GITHUB_USER}/clinical-code-editor-server:latest -f server/Dockerfile ./server
     docker push ghcr.io/${GITHUB_USER}/clinical-code-editor-server:latest
     ```
   - Deploy to any container host you prefer and set `VITE_BACKEND_URL` as a repo secret.

## How to enable live AI features

1. Deploy your backend and set `VITE_BACKEND_URL` as a GitHub repo secret (Repository → Settings → Secrets → New repository secret).
2. Alternatively, add `GEMINI_API_KEY` as a secret (not recommended).
3. Push to `main`. The Pages workflow will rebuild the app including your backend URL and the live site will call your backend for generation.

## What I added for you

- `./.github/workflows/publish.yml` — builds and deploys the frontend to GitHub Pages on push to `main`.
- `./.github/workflows/push-server-image.yml` — builds the server Docker image and pushes it to GHCR on push to `main`.
- `server/` — FastAPI scaffold (already present) to run a local LLM server.

If you want, I can help you deploy the backend to Render (I can prepare a Render service template) and then set the repo secret for you — tell me and I’ll prepare the exact workflow and any extra files required.
