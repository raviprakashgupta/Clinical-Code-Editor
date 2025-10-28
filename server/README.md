# Local LLM server (llama-cpp-python)

This folder contains a minimal FastAPI server that uses llama-cpp-python to run a local ggml model and exposes a small API the frontend can call:

- GET /api/health
- POST /api/generate { prompt, max_tokens, temperature }

Important notes
- You must download a compatible ggml model (quantized `.bin`) and place it at `server/models/model.bin`, or set the `LLM_MODEL_PATH` environment variable pointing to the model file.
- Models can be large (hundreds of MBs to many GBs). See TheBloke / Hugging Face model releases for ggml builds.
- `llama-cpp-python` may require a C toolchain and appropriate system libraries. On Ubuntu you may need to install `build-essential`, `cmake`, and optional libraries for AVX/ARM.

Quick start (Ubuntu / dev container)
```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Download a ggml model and place it at server/models/model.bin
export LLM_MODEL_PATH=server/models/model.bin
uvicorn server.main:app --host 0.0.0.0 --port 5000
```

Frontend notes
- The project `vite.config.ts` is configured to proxy `/api` to `http://localhost:5000` during development. Start the server above and then run the frontend with `npm run dev`.

Troubleshooting
- If `llama-cpp-python` fails to install, ensure you have a C toolchain and `cmake` installed. See https://github.com/abetlen/llama-cpp-python for platform-specific install instructions.
