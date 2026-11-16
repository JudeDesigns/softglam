import pytest
from pydantic import ValidationError

from app.core.config import DEV_JWT_SECRET, Settings

STRONG = "x" * 48


def _prod(**overrides) -> Settings:
    values = {
        "environment": "prod",
        "jwt_secret": STRONG,
        "cors_origins": ["https://admin.example.com"],
        "debug": False,
    }
    values.update(overrides)
    return Settings(_env_file=None, **values)


def test_safe_prod_config_loads():
    assert _prod().environment == "prod"


@pytest.mark.parametrize(
    ("overrides", "message"),
    [
        ({"jwt_secret": DEV_JWT_SECRET}, "JWT_SECRET"),
        ({"jwt_secret": "short"}, "JWT_SECRET"),
        ({"cors_origins": ["*"]}, "CORS_ORIGINS"),
        ({"cors_origins": []}, "CORS_ORIGINS"),
        ({"debug": True}, "DEBUG"),
    ],
)
def test_unsafe_prod_config_is_refused(overrides, message):
    with pytest.raises(ValidationError, match=message):
        _prod(**overrides)


def test_dev_defaults_still_allowed():
    assert Settings(_env_file=None, environment="dev").jwt_secret == DEV_JWT_SECRET
