import json
from pathlib import Path
import boto3
from fastapi import APIRouter, Depends, HTTPException
from ..deps import get_settings, Settings
from .. import schemas

router = APIRouter(tags=["policy"])


_s3_client = None


def get_s3_client(settings: Settings):
  global _s3_client
  if _s3_client is None:
    _s3_client = boto3.client(
      's3',
      endpoint_url=settings.minio_endpoint,
      aws_access_key_id=settings.minio_access_key,
      aws_secret_access_key=settings.minio_secret_key,
      region_name='us-east-1',
    )
  return _s3_client


@router.get("/policy/egress", response_model=schemas.EgressResponse)
def global_egress(settings: Settings = Depends(get_settings)):
  hosts = [h.strip() for h in settings.egress_allowlist.split(',') if h.strip()]
  return {"hosts": hosts}


@router.get("/schemas/{schema_id}")
def get_schema(schema_id: str, settings: Settings = Depends(get_settings)):
  base = Path(settings.schema_dir)
  path = base / f"{schema_id}.schema.json"
  if not path.exists():
    raise HTTPException(status_code=404, detail="schema not found")
  with open(path, "r", encoding="utf-8") as f:
    return json.load(f)


@router.get("/audit/records")
def list_audit_records(settings: Settings = Depends(get_settings)):
  s3 = get_s3_client(settings)
  try:
    resp = s3.list_objects_v2(Bucket=settings.minio_bucket, Prefix='records/')
  except Exception:
    return {"items": []}

  contents = resp.get('Contents', [])
  contents.sort(key=lambda obj: obj.get('LastModified'), reverse=True)
  records = []
  for obj in contents[:100]:
    try:
      data = s3.get_object(Bucket=settings.minio_bucket, Key=obj['Key'])
      body = data['Body'].read().decode('utf-8')
      records.append(json.loads(body))
    except Exception:
      continue
  return {"items": records}
