from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, JSON, ForeignKey, UniqueConstraint
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, JSON, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Tool(Base):
  __tablename__ = "tools"

  tool_id = Column(String, primary_key=True, index=True)
  name = Column(String, nullable=False)
  owner = Column(String, nullable=False)
  endpoint = Column(String, nullable=False)
  version = Column(String, nullable=False)
  scopes = Column(JSON, nullable=False, default=list)
  data_class = Column(String, nullable=False, default="internal")
  status = Column(String, nullable=False, default="sandbox")
  signature_status = Column(String, nullable=True)
  sbom_url = Column(String, nullable=True)
  schema_ref = Column(String, nullable=False)
  egress_allow = Column(JSON, nullable=False, default=list)
  policy_profile = Column(String, ForeignKey("policy_profiles.name"), nullable=True)
  created_at = Column(DateTime, default=datetime.utcnow)

  grants = relationship("Grant", back_populates="tool", cascade="all, delete-orphan")
  profile = relationship("PolicyProfile", back_populates="tools")


class Grant(Base):
  __tablename__ = "grants"
  __table_args__ = (UniqueConstraint('group', 'tool_id', 'env', name='uq_grant_identity'),)

  id = Column(Integer, primary_key=True, autoincrement=True)
  group = Column(String, nullable=False)
  tool_id = Column(String, ForeignKey("tools.tool_id"), nullable=False)
  scopes = Column(JSON, nullable=False, default=list)
  env = Column(String, nullable=False)
  expires_at = Column(DateTime, nullable=True)

  tool = relationship("Tool", back_populates="grants")


class PolicyProfile(Base):
  __tablename__ = "policy_profiles"

  id = Column(Integer, primary_key=True, autoincrement=True)
  name = Column(String, unique=True, nullable=False)
  dlp_profile = Column(String, nullable=False)
  egress_allowlist = Column(JSON, nullable=False, default=list)
  rate_limit = Column(Integer, nullable=False, default=60)

  tools = relationship("Tool", back_populates="profile")
