from datetime import UTC, datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlmodel import select

from app.core.deps import CurrentUser, DbSession
from app.modules.products.models import Product
from app.modules.products.schemas import ProductCreate, ProductRead
from app.modules.users.models import UserRole

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductRead])
async def list_products(
    _user: CurrentUser,
    session: DbSession,
    brand: Optional[str] = Query(None),
    concern: Optional[str] = Query(None, description="Filter by skin concern target"),
    toxin_free: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
) -> list[ProductRead]:
    q = select(Product).where(Product.is_active == True)  # noqa: E712
    if brand:
        q = q.where(Product.brand.ilike(f"%{brand}%"))
    if toxin_free is not None:
        q = q.where(Product.is_toxin_free == toxin_free)
    q = q.offset(skip).limit(limit)
    rows = (await session.execute(q)).scalars().all()
    # Filter by concern in Python (JSON array containment varies by DB)
    if concern:
        rows = [r for r in rows if concern in (r.targets or [])]
    return [ProductRead.model_validate(r) for r in rows]


@router.get("/{product_id}", response_model=ProductRead)
async def get_product(_user: CurrentUser, product_id: UUID, session: DbSession) -> ProductRead:
    product = (
        await session.execute(select(Product).where(Product.id == product_id))
    ).scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return ProductRead.model_validate(product)


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate, user: CurrentUser, session: DbSession
) -> ProductRead:
    if user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins only")
    product = Product(**payload.model_dump())
    session.add(product)
    await session.commit()
    await session.refresh(product)
    return ProductRead.model_validate(product)
