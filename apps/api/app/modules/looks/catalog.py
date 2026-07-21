from app.modules.looks.schemas import LookRead, LookSectionRead, LookShades

# Mirrors apps/mobile/src/try-on/looks.ts. Will be generated from a single
# source of truth once the asset pipeline lands. Keep ids stable; the mobile
# app references them in look-share requests.
LOOK_SECTIONS: list[LookSectionRead] = [
    LookSectionRead(
        id="editorial",
        title="Editorial",
        subtitle="Magazine-cover finishes",
        looks=[
            LookRead(id="bronze-couture", name="Bronze Couture", caption="Warm contour, glazed lip",
                     finish="glow", shades=LookShades(lip="#A85B3A", cheek="#B96A4E", eye="#7C4B2A")),
            LookRead(id="liquid-gold", name="Liquid Gold", caption="Gilded lid, nude lip",
                     finish="glow", shades=LookShades(lip="#C9876A", cheek="#D89570", eye="#C99A3A")),
            LookRead(id="smoke-mirrors", name="Smoke & Mirrors", caption="Charcoal smoke, neutral mouth",
                     finish="matte", shades=LookShades(lip="#9C6450", cheek="#A77762", eye="#3D3530")),
            LookRead(id="velvet-plum", name="Velvet Plum", caption="Deep plum lip, satin lid",
                     finish="satin", shades=LookShades(lip="#6F2840", cheek="#A35C68", eye="#5A3A4A")),
        ],
    ),
    LookSectionRead(
        id="bridal",
        title="Bridal",
        subtitle="Romantic, luminous, all-day",
        looks=[
            LookRead(id="rose-veil", name="Rose Veil", caption="Soft rose halo",
                     finish="satin", shades=LookShades(lip="#C77074", cheek="#E0A0A4", eye="#B58C8E")),
            LookRead(id="champagne-glow", name="Champagne Glow", caption="Pearl shimmer, peach lip",
                     finish="glow", shades=LookShades(lip="#D89478", cheek="#EBB89C", eye="#D9B984")),
            LookRead(id="soft-sculpt", name="Soft Sculpt", caption="Subtle contour, nude rose",
                     finish="satin", shades=LookShades(lip="#B97A6E", cheek="#C68B80", eye="#A88474")),
            LookRead(id="pearl-lustre", name="Pearl Lustre", caption="Iridescent lid, mauve lip",
                     finish="glow", shades=LookShades(lip="#B0717C", cheek="#D29DA6", eye="#C7B9C2")),
        ],
    ),
    LookSectionRead(
        id="everyday",
        title="Everyday",
        subtitle="Polished, low-effort, your skin only better",
        looks=[
            LookRead(id="bare-plus", name="Bare+", caption="Tinted balm, fresh cheek",
                     finish="satin", shades=LookShades(lip="#C58177", cheek="#D9988E", eye="#B59586")),
            LookRead(id="coffee-shop", name="Coffee Shop", caption="Cocoa lip, soft warmth",
                     finish="matte", shades=LookShades(lip="#8E5340", cheek="#A37665", eye="#6F4C3A")),
            LookRead(id="office-polish", name="Office Polish", caption="Mauve lip, defined brow",
                     finish="satin", shades=LookShades(lip="#A06A6E", cheek="#BD8689", eye="#80645E")),
        ],
    ),
    LookSectionRead(
        id="bold",
        title="Bold",
        subtitle="Statement looks for night",
        looks=[
            LookRead(id="crimson-statement", name="Crimson Statement", caption="Red lip, clean lid",
                     finish="matte", shades=LookShades(lip="#9C2A2A", cheek="#B05A52", eye="#5C4036")),
            LookRead(id="midnight-wing", name="Midnight Wing", caption="Liner wing, mauve lip",
                     finish="matte", shades=LookShades(lip="#7F4F58", cheek="#9E6D70", eye="#161616")),
            LookRead(id="berry-bomb", name="Berry Bomb", caption="Berry stain, bronzed lid",
                     finish="satin", shades=LookShades(lip="#6B2638", cheek="#A65265", eye="#7A4534")),
        ],
    ),
]


def find_look(look_id: str) -> LookRead | None:
    for section in LOOK_SECTIONS:
        for look in section.looks:
            if look.id == look_id:
                return look
    return None
