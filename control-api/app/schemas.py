from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ToolBase(BaseModel):
  tool_id: str
  name: str
  owner: str
  endpoint: str
  version: str
  scopes: List[str]
  data_class: str
  status: str
  signature_status: Optional[str] = None
  sbom_url: Optional[str] = None
  schema_ref: str
  egress_allow: List[str] = Field(default_factory=list)
  policy_profile: Optional[str] = None


class ToolCreate(ToolBase):
  pass


class ToolRead(ToolBase):
  created_at: datetime

  class Config:
    orm_mode = True


class GrantBase(BaseModel):
  group: str
  tool_id: str
  scopes: List[str]
  env: str
  expires_at: Optional[datetime] = None


class GrantCreate(GrantBase):
  pass


class GrantRead(GrantBase):
  id: int

  class Config:
    orm_mode = True


class PolicyProfileRead(BaseModel):
  name: str
  dlp_profile: str
  egress_allowlist: List[str]
  rate_limit: int

  class Config:
    orm_mode = True


class TokenResponse(BaseModel):
  token: str


class EgressResponse(BaseModel):
  hosts: List[str]


class ToolListResponse(BaseModel):
  items: List[ToolRead]


class GrantListResponse(BaseModel):
  items: List[GrantRead]
