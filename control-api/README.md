# Control API

FastAPI application providing tool catalog management, grants, policy profiles, and mock OIDC token minting.

## Development

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
