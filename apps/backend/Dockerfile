# ======================================
# Stage 1: Build dependencies
# ======================================
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies for psycopg2 and other libs
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install dependencies into a wheel cache
RUN pip install --upgrade pip \
    && pip wheel --no-cache-dir --no-deps -r requirements.txt -w /wheels


# ======================================
# Stage 2: Runtime image
# ======================================
FROM python:3.11-slim

WORKDIR /app

# System dependencies for psycopg2-binary runtime
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy installed wheels from builder
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/*

# Copy project files
COPY . .

# Ensure logs show up immediately
ENV PYTHONUNBUFFERED=1
# Make port configurable (default 8000)
ENV PORT=8000

# Expose API port
EXPOSE $PORT

# Command to run the FastAPI app with Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
