from fastapi import FastAPI
from sqlalchemy.orm import Session
from .deps import get_settings, get_engine
from .models import Base, PolicyProfile
from .routes import tools, grants, tokens, policies

app = FastAPI(title="MCP Control API")
app.include_router(tokens.router)
app.include_router(tools.router)
app.include_router(grants.router)
app.include_router(policies.router)


@app.on_event("startup")
def startup_event():
  engine = get_engine()
  Base.metadata.create_all(bind=engine)
  with Session(engine) as session:
    if not session.query(PolicyProfile).filter_by(name="default").first():
      profile = PolicyProfile(
        name="default",
        dlp_profile="standard",
        egress_allowlist=["*.corp.internal"],
        rate_limit=60,
      )
      session.add(profile)
      session.commit()


@app.get("/healthz")
def healthz():
  settings = get_settings()
  return {"status": "ok", "issuer": settings.oidc_issuer}
