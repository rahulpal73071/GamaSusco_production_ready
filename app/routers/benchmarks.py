"""Benchmarks Router - Placeholder"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/benchmarks", tags=["Benchmarks"])

class Message(BaseModel):
    message: str

@router.get("/", response_model=Message)
async def benchmarks_root():
    return {"message": "Benchmarks endpoints - under construction"}