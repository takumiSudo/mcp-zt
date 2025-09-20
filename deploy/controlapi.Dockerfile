FROM python:3.11-slim
WORKDIR /app
COPY control-api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY control-api/app ./app
COPY control-api/alembic ./alembic
COPY examples/schemas ./schemas
COPY control-api/.env.example .env
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
