from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas
from ..deps import get_db

router = APIRouter(prefix="/grants", tags=["grants"])


@router.get("/", response_model=schemas.GrantListResponse)
def list_grants(db: Session = Depends(get_db)):
  grants = db.query(models.Grant).all()
  return {"items": [schemas.GrantRead.from_orm(grant) for grant in grants]}


@router.post("/", response_model=schemas.GrantRead)
def upsert_grant(payload: schemas.GrantCreate, db: Session = Depends(get_db)):
  grant = db.query(models.Grant).filter_by(group=payload.group, tool_id=payload.tool_id, env=payload.env).first()
  if grant:
    for key, value in payload.dict().items():
      setattr(grant, key, value)
  else:
    grant = models.Grant(**payload.dict())
    db.add(grant)
  db.commit()
  db.refresh(grant)
  return schemas.GrantRead.from_orm(grant)
