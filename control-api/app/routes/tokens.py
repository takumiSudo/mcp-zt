import json
from datetime import datetime, timedelta
from functools import lru_cache
from fastapi import APIRouter, Depends
from jose import jwt
from ..deps import get_settings, Settings
from .. import schemas

router = APIRouter(tags=["tokens"])


@lru_cache()
def load_private_key(path: str) -> str:
  with open(path, "r", encoding="utf-8") as f:
    return f.read()


@lru_cache()
def load_jwks(path: str) -> dict:
  with open(path, "r", encoding="utf-8") as f:
    return json.load(f)


@router.get("/.well-known/jwks.json")
def jwks(settings: Settings = Depends(get_settings)):
  return load_jwks(settings.jwks_path)


@router.get("/tokens/mock", response_model=schemas.TokenResponse)
def mint_mock_token(settings: Settings = Depends(get_settings)):
  private_key = load_private_key(settings.private_key_path)
  now = datetime.utcnow()
  payload = {
    "iss": settings.oidc_issuer,
    "aud": settings.oidc_audience,
    "sub": "user-finance",
    "groups": ["finance"],
    "env": "dev",
    "dlp_profile": "standard",
    "iat": int(now.timestamp()),
    "exp": int((now + timedelta(minutes=30)).timestamp()),
  }
  token = jwt.encode(payload, private_key, algorithm="RS256", headers={"kid": "mock-key"})
  return {"token": token}
