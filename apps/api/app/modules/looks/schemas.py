from typing import Literal

from pydantic import BaseModel

LookFinish = Literal["matte", "satin", "glow"]


class LookShades(BaseModel):
    lip: str
    cheek: str
    eye: str


class LookRead(BaseModel):
    id: str
    name: str
    caption: str
    finish: LookFinish
    shades: LookShades


class LookSectionRead(BaseModel):
    id: str
    title: str
    subtitle: str
    looks: list[LookRead]
