FROM python:3.11-slim

# Install build deps required by llama-cpp-python
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential cmake git libopenblas-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY server/requirements.txt /app/server/requirements.txt
RUN python -m pip install --upgrade pip
RUN pip install -r /app/server/requirements.txt

COPY server /app/server
WORKDIR /app

EXPOSE 5000

# Default command; model should be provided via LLM_MODEL_PATH env or mounted into /app/server/models
CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "5000"]
