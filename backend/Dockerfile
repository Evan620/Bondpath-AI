FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
# libpq-dev and gcc are often needed for psycopg2
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Command to run the application
# Railway provides the PORT environment variable
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
