from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..deps import get_db

router = APIRouter(prefix="/tools", tags=["tools"])


@router.get("/", response_model=schemas.ToolListResponse)
def list_tools(db: Session = Depends(get_db)):
  tools = db.query(models.Tool).order_by(models.Tool.created_at.desc()).all()
  return {"items": [schemas.ToolRead.from_orm(tool) for tool in tools]}


@router.post("/", response_model=schemas.ToolRead)
def create_tool(payload: schemas.ToolCreate, db: Session = Depends(get_db)):
  existing = db.query(models.Tool).filter_by(tool_id=payload.tool_id).first()
  if existing:
    raise HTTPException(status_code=400, detail="tool already exists")
  tool = models.Tool(**payload.dict())
  db.add(tool)
  db.commit()
  db.refresh(tool)
  return schemas.ToolRead.from_orm(tool)


@router.get("/{tool_id}")
def get_tool(tool_id: str, db: Session = Depends(get_db)):
  tool = db.query(models.Tool).filter_by(tool_id=tool_id).first()
  if not tool:
    raise HTTPException(status_code=404, detail="tool not found")
  grants = db.query(models.Grant).filter_by(tool_id=tool_id).all()
  profile = None
  if tool.policy_profile:
    profile = db.query(models.PolicyProfile).filter_by(name=tool.policy_profile).first()
  return {
    "tool": schemas.ToolRead.from_orm(tool),
    "grants": [schemas.GrantRead.from_orm(grant) for grant in grants],
    "policy_profile": schemas.PolicyProfileRead.from_orm(profile) if profile else None,
  }
