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
2. Push to `main` (the workflow runs on push). The Actions tab will show progress.
3. When the workflow succeeds Pages will show the published site URL in Settings → Pages.

Notes:
- The API key is available at build time and will be embedded in the built assets. If you need to keep it private at runtime, consider proxying requests through a server.
- If you prefer a custom domain or a different provider, see the Hosting options section in the repository.
