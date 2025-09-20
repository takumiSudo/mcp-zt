from functools import lru_cache
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from pydantic import BaseSettings


class Settings(BaseSettings):
  database_url: str = "postgresql+psycopg2://mcp:mcp@localhost:5432/mcp"
  oidc_issuer: str = "http://localhost:8000/mock-issuer"
  oidc_audience: str = "mcp-clients"
  private_key_path: str = "app/mock_rsa.pem"
  jwks_path: str = "app/mock_jwks.json"
  schema_dir: str = "./schemas"
  egress_allowlist: str = "*.corp.internal"
  minio_endpoint: str = "http://minio:9000"
  minio_access_key: str = "minioadmin"
  minio_secret_key: str = "minioadmin"
  minio_bucket: str = "mcp-audit"

  class Config:
    env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
  return Settings()


def get_engine():
  settings = get_settings()
  engine = create_engine(settings.database_url, future=True)
  return engine


SessionLocal = sessionmaker(bind=get_engine(), autoflush=False, autocommit=False, future=True)


def get_db() -> Generator:
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()
