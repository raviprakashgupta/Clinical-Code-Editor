This is a lightweight FastAPI mock server used for local testing and for creating a container image in CI.

Endpoints:
- GET /api/health — returns {"status":"ok"}
- POST /api/generate — accepts {"prompt": "..."} and returns {"text": "..."}

To run locally:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 5000
```

To build the Docker image:

```bash
docker build -t clinical-code-editor-server:local ./server
```
