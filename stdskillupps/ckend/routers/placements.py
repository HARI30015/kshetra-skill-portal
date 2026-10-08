"""Placement listing (authenticated) and management (lecturers)."""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from supabase import Client

from deps import get_current_profile, get_supabase, require_lecturer

router = APIRouter(prefix="/placements", tags=["placements"])


class PlacementCreate(BaseModel):
    company: str
    role: str
    job_field: str
    languages: list[str] = []
    skills: list[str] = []
    notes: str | None = None
    package_lpa: float | None = None
    location: str | None = None
    drive_date: str | None = None  # ISO date string, e.g. "2027-01-15"


class PlacementUpdate(BaseModel):
    company: str | None = None
    role: str | None = None
    job_field: str | None = None
    languages: list[str] | None = None
    skills: list[str] | None = None
    notes: str | None = None
    package_lpa: float | None = None
    location: str | None = None
    drive_date: str | None = None


@router.get("")
def list_placements(
    q: str | None = Query(default=None, description="Search company/role/notes"),
    field: str | None = Query(default=None, description="Filter by job field"),
    _user: dict = Depends(get_current_profile),
    db: Client = Depends(get_supabase),
):
    query = db.table("placements").select("*")
    if field:
        query = query.eq("job_field", field)
    if q:
        # case-insensitive search across company, role and notes
        query = query.or_(f"company.ilike.%{q}%,role.ilike.%{q}%,notes.ilike.%{q}%")
    resp = query.order("company").execute()
    return resp.data


@router.post("")
def create_placement(
    body: PlacementCreate,
    _lecturer: dict = Depends(require_lecturer),
    db: Client = Depends(get_supabase),
):
    resp = db.table("placements").insert(body.model_dump()).execute()
    return resp.data[0] if resp.data else body.model_dump()


@router.put("/{placement_id}")
def update_placement(
    placement_id: str,
    body: PlacementUpdate,
    _lecturer: dict = Depends(require_lecturer),
    db: Client = Depends(get_supabase),
):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    resp = db.table("placements").update(updates).eq("id", placement_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Placement not found")
    return resp.data[0]


@router.delete("/{placement_id}")
def delete_placement(
    placement_id: str,
    _lecturer: dict = Depends(require_lecturer),
    db: Client = Depends(get_supabase),
):
    resp = db.table("placements").delete().eq("id", placement_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Placement not found")
    return {"deleted": True, "id": placement_id}
