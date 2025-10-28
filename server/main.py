from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import uvicorn

app = FastAPI()

class GenerateRequest(BaseModel):
    prompt: str
    max_tokens: Optional[int] = 512
    temperature: Optional[float] = 0.2

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.post("/api/generate")
async def generate(req: GenerateRequest):
    # Lightweight mock implementation for hosting without a model.
    # Replace this with llama-cpp, GPT4All, or a hosted LLM integration for real usage.
    text = f"Mock response for prompt: {req.prompt[:200]}"
    return {"text": text}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
