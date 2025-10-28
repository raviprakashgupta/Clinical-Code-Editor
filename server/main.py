import os
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    # llama-cpp-python is optional at dev-time; import may fail if not installed
    from llama_cpp import Llama
except Exception:
    Llama = None

app = FastAPI(title="Local LLM proxy")

# Allow the frontend (vite dev server / GH Pages) to call this API during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.environ.get("LLM_MODEL_PATH", "server/models/model.bin")

if Llama is not None and os.path.exists(MODEL_PATH):
    try:
        llm = Llama(model_path=MODEL_PATH)
    except Exception as e:
        llm = None
        print(f"Failed to load model at {MODEL_PATH}: {e}")
else:
    llm = None


class GenerateRequest(BaseModel):
    prompt: str
    max_tokens: Optional[int] = 256
    temperature: Optional[float] = 0.2


@app.get("/api/health")
def health():
    return {"ok": True, "model_path": MODEL_PATH if os.path.exists(MODEL_PATH) else None, "llm_loaded": llm is not None}


@app.post("/api/generate")
def generate(req: GenerateRequest):
    if llm is None:
        raise HTTPException(status_code=500, detail="LLM not available. Ensure llama-cpp-python is installed and MODEL_PATH exists.")
    try:
        resp = llm.create(prompt=req.prompt, max_tokens=req.max_tokens, temperature=req.temperature)
        # llama-cpp-python returns dict with choices
        text = ""
        if isinstance(resp, dict):
            choices = resp.get("choices") or []
            if choices:
                text = "".join([c.get("text", "") for c in choices])
            else:
                text = resp.get("text", "") or ""
        else:
            text = str(resp)
        return {"text": text, "raw": resp}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
