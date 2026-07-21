"""Central import point for all SQLModel tables.

Importing this module is enough to register every table with SQLModel's
metadata, which is what Alembic and `create_all` need at startup.
"""

from app.modules.appointments.models import Appointment, AppointmentProduct
from app.modules.artists.models import ArtistProfile
from app.modules.invites.models import Invite
from app.modules.look_requests.models import LookRequest
from app.modules.products.models import Product
from app.modules.skin_profiles.models import SkinProfile
from app.modules.users.models import User

__all__ = [
    "Appointment",
    "AppointmentProduct",
    "ArtistProfile",
    "Invite",
    "LookRequest",
    "Product",
    "SkinProfile",
    "User",
]
