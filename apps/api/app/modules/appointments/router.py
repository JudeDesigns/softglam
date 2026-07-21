from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlmodel import select

from app.core.deps import CurrentUser, DbSession
from app.modules.appointments.models import Appointment, AppointmentProduct, AppointmentStatus
from app.modules.appointments.schemas import (
    AppointmentCreate,
    AppointmentProductCreate,
    AppointmentProductRead,
    AppointmentRead,
    AppointmentUpdate,
)
from app.modules.users.models import UserRole

router = APIRouter(prefix="/appointments", tags=["appointments"])


def _serialize_product(p: AppointmentProduct) -> AppointmentProductRead:
    return AppointmentProductRead(
        id=p.id,
        appointment_id=p.appointment_id,
        product_id=p.product_id,
        product_name=p.product_name,
        brand=p.brand,
        quantity=p.quantity,
        unit_cost=p.unit_cost,
        cogs=round(p.quantity * p.unit_cost, 4),
        created_at=p.created_at,
    )


async def _serialize(
    appt: Appointment, session: DbSession
) -> AppointmentRead:
    products = (
        await session.execute(
            select(AppointmentProduct).where(
                AppointmentProduct.appointment_id == appt.id
            )
        )
    ).scalars().all()
    return AppointmentRead(
        id=appt.id,
        artist_id=appt.artist_id,
        client_id=appt.client_id,
        look_request_id=appt.look_request_id,
        scheduled_at=appt.scheduled_at,
        duration_minutes=appt.duration_minutes,
        location=appt.location,
        service_name=appt.service_name,
        notes=appt.notes,
        quoted_price=appt.quoted_price,
        final_price=appt.final_price,
        status=appt.status,
        created_at=appt.created_at,
        updated_at=appt.updated_at,
        completed_at=appt.completed_at,
        cancelled_at=appt.cancelled_at,
        products=[_serialize_product(p) for p in products],
    )


def _require_artist_or_admin(user: CurrentUser) -> None:
    if user.role not in (UserRole.artist, UserRole.admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Artists only",
        )


async def _get_appt_for_user(
    appointment_id: UUID, user: CurrentUser, session: DbSession
) -> Appointment:
    appt = (
        await session.execute(
            select(Appointment).where(Appointment.id == appointment_id)
        )
    ).scalar_one_or_none()
    if appt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found"
        )
    # Artist can only touch their own; clients can only read theirs.
    if user.role == UserRole.artist and appt.artist_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if user.role == UserRole.client and appt.client_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return appt


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=list[AppointmentRead])
async def list_appointments(
    user: CurrentUser,
    session: DbSession,
    upcoming_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
) -> list[AppointmentRead]:
    """
    Artists see all their appointments. Clients see their own.
    """
    if user.role == UserRole.artist:
        q = select(Appointment).where(Appointment.artist_id == user.id)
    elif user.role == UserRole.client:
        q = select(Appointment).where(Appointment.client_id == user.id)
    else:
        q = select(Appointment)

    if upcoming_only:
        q = q.where(Appointment.scheduled_at >= datetime.now(UTC))

    q = q.order_by(Appointment.scheduled_at).offset(skip).limit(limit)
    rows = (await session.execute(q)).scalars().all()
    return [await _serialize(r, session) for r in rows]


@router.post("", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    payload: AppointmentCreate, user: CurrentUser, session: DbSession
) -> AppointmentRead:
    _require_artist_or_admin(user)
    appt = Appointment(
        artist_id=user.id,
        **payload.model_dump(),
    )
    session.add(appt)
    await session.commit()
    await session.refresh(appt)
    return await _serialize(appt, session)


@router.get("/{appointment_id}", response_model=AppointmentRead)
async def get_appointment(
    appointment_id: UUID, user: CurrentUser, session: DbSession
) -> AppointmentRead:
    appt = await _get_appt_for_user(appointment_id, user, session)
    return await _serialize(appt, session)


@router.patch("/{appointment_id}", response_model=AppointmentRead)
async def update_appointment(
    appointment_id: UUID,
    payload: AppointmentUpdate,
    user: CurrentUser,
    session: DbSession,
) -> AppointmentRead:
    _require_artist_or_admin(user)
    appt = await _get_appt_for_user(appointment_id, user, session)
    now = datetime.now(UTC)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(appt, field, value)
    appt.updated_at = now
    session.add(appt)
    await session.commit()
    await session.refresh(appt)
    return await _serialize(appt, session)


@router.post("/{appointment_id}/confirm", response_model=AppointmentRead)
async def confirm_appointment(
    appointment_id: UUID, user: CurrentUser, session: DbSession
) -> AppointmentRead:
    _require_artist_or_admin(user)
    appt = await _get_appt_for_user(appointment_id, user, session)
    appt.status = AppointmentStatus.confirmed
    appt.updated_at = datetime.now(UTC)
    session.add(appt)
    await session.commit()
    await session.refresh(appt)
    return await _serialize(appt, session)


@router.post("/{appointment_id}/complete", response_model=AppointmentRead)
async def complete_appointment(
    appointment_id: UUID, user: CurrentUser, session: DbSession
) -> AppointmentRead:
    _require_artist_or_admin(user)
    appt = await _get_appt_for_user(appointment_id, user, session)
    now = datetime.now(UTC)
    appt.status = AppointmentStatus.completed
    appt.completed_at = now
    appt.updated_at = now
    session.add(appt)
    await session.commit()
    await session.refresh(appt)
    return await _serialize(appt, session)


@router.post("/{appointment_id}/cancel", response_model=AppointmentRead)
async def cancel_appointment(
    appointment_id: UUID, user: CurrentUser, session: DbSession
) -> AppointmentRead:
    appt = await _get_appt_for_user(appointment_id, user, session)
    now = datetime.now(UTC)
    appt.status = AppointmentStatus.cancelled
    appt.cancelled_at = now
    appt.updated_at = now
    session.add(appt)
    await session.commit()
    await session.refresh(appt)
    return await _serialize(appt, session)


# ---------------------------------------------------------------------------
# COGS — appointment products
# ---------------------------------------------------------------------------

@router.post(
    "/{appointment_id}/products",
    response_model=AppointmentProductRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_product(
    appointment_id: UUID,
    payload: AppointmentProductCreate,
    user: CurrentUser,
    session: DbSession,
) -> AppointmentProductRead:
    _require_artist_or_admin(user)
    appt = await _get_appt_for_user(appointment_id, user, session)
    product = AppointmentProduct(
        appointment_id=appt.id,
        **payload.model_dump(),
    )
    session.add(product)
    await session.commit()
    await session.refresh(product)
    return _serialize_product(product)


@router.delete(
    "/{appointment_id}/products/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_product(
    appointment_id: UUID,
    product_id: UUID,
    user: CurrentUser,
    session: DbSession,
) -> None:
    _require_artist_or_admin(user)
    await _get_appt_for_user(appointment_id, user, session)
    product = (
        await session.execute(
            select(AppointmentProduct).where(
                AppointmentProduct.id == product_id,
                AppointmentProduct.appointment_id == appointment_id,
            )
        )
    ).scalar_one_or_none()
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product usage record not found"
        )
    await session.delete(product)
    await session.commit()


@router.get("/{appointment_id}/cogs-summary")
async def cogs_summary(
    appointment_id: UUID, user: CurrentUser, session: DbSession
) -> dict:
    """
    Returns total COGS for the appointment alongside each line item.
    Useful for the artist dashboard and eventually for COGS reporting.
    """
    _require_artist_or_admin(user)
    appt = await _get_appt_for_user(appointment_id, user, session)
    products = (
        await session.execute(
            select(AppointmentProduct).where(
                AppointmentProduct.appointment_id == appt.id
            )
        )
    ).scalars().all()
    total_cogs = sum(p.quantity * p.unit_cost for p in products)
    gross_margin = (
        round((appt.final_price - total_cogs) / appt.final_price * 100, 2)
        if appt.final_price
        else None
    )
    return {
        "appointment_id": str(appointment_id),
        "total_cogs": round(total_cogs, 2),
        "final_price": appt.final_price,
        "gross_margin_pct": gross_margin,
        "products": [_serialize_product(p).model_dump() for p in products],
    }
