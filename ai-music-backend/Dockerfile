FROM python:3.11-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
# CPU-only torch wheels keep the image far smaller than the default CUDA build.
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# Pre-download Demucs model weights at build time so the first request isn't
# slow or dependent on outbound network access in production.
RUN python -c "from demucs.pretrained import get_model; get_model('htdemucs')"

COPY app ./app

ENV STORAGE_DIR=/data/storage
RUN mkdir -p /data/storage

EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
