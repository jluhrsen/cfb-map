#!/usr/bin/env python3
"""Generate the FB MAP app icons (logo512.png, logo192.png, favicon.ico).

Design mashes up the three ideas the app is about:
  - map      -> green field background + faint street grid
  - schedule -> a dashed route linking waypoint "stops"
  - football -> a location pin whose head holds a laced football
"""
import io
import os
import cairosvg
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.normpath(os.path.join(HERE, "..", "public"))

DEFS = """
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2fbb6a"/>
      <stop offset="1" stop-color="#0d6c3b"/>
    </linearGradient>
    <radialGradient id="ball" cx="0.42" cy="0.34" r="0.8">
      <stop offset="0" stop-color="#a35d2a"/>
      <stop offset="1" stop-color="#6a350f"/>
    </radialGradient>
    <clipPath id="round"><rect x="0" y="0" width="512" height="512" rx="112" ry="112"/></clipPath>
  </defs>
"""

def football(cx, cy, a, r, lace_scale=1.0):
    """A horizontally-pointed football (lens of two arcs) with laces."""
    left, right = cx - a, cx + a
    spine = a * 0.52 * lace_scale
    tick = 12 * lace_scale
    lw = max(4, 7 * lace_scale)
    ticks = "".join(
        f'<line x1="{cx + dx:.1f}" y1="{cy - tick:.1f}" x2="{cx + dx:.1f}" y2="{cy + tick:.1f}"/>'
        for dx in (-spine, -spine/2, 0, spine/2, spine)
    )
    return f"""
    <g>
      <path d="M {left:.1f} {cy} A {r:.1f} {r:.1f} 0 0 1 {right:.1f} {cy} A {r:.1f} {r:.1f} 0 0 1 {left:.1f} {cy} Z" fill="url(#ball)"/>
      <g stroke="#ffffff" stroke-width="{lw:.1f}" stroke-linecap="round">
        <line x1="{cx - spine:.1f}" y1="{cy}" x2="{cx + spine:.1f}" y2="{cy}"/>
        {ticks}
      </g>
    </g>"""

def pin(cx, head_cy, R, tip_y):
    """White map pin: circular head + triangular tip, seamless (same fill)."""
    # tangent points on the circle so the triangle base is a chord
    dx, dy = R * 0.8, R * 0.6  # (0.8^2 + 0.6^2 = 1) -> points lie on the circle
    lx, rx = cx - dx, cx + dx
    ty = head_cy + dy
    return f"""
    <g>
      <path d="M {lx:.1f} {ty:.1f} L {cx} {tip_y} L {rx:.1f} {ty:.1f} Z" fill="#ffffff"/>
      <circle cx="{cx}" cy="{head_cy}" r="{R}" fill="#ffffff"/>
    </g>"""

MASTER = f"""<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
{DEFS}
  <g clip-path="url(#round)">
    <rect width="512" height="512" fill="url(#bg)"/>

    <!-- map: street grid -->
    <g stroke="#ffffff" stroke-width="3" opacity="0.10">
      <line x1="0" y1="128" x2="512" y2="128"/>
      <line x1="0" y1="256" x2="512" y2="256"/>
      <line x1="0" y1="384" x2="512" y2="384"/>
      <line x1="128" y1="0" x2="128" y2="512"/>
      <line x1="256" y1="0" x2="256" y2="512"/>
      <line x1="384" y1="0" x2="384" y2="512"/>
    </g>
    <path d="M -20 448 Q 210 320 540 392" stroke="#ffffff" stroke-width="16" opacity="0.10" fill="none" stroke-linecap="round"/>

    <!-- schedule: dashed route between stops -->
    <path d="M 78 356 Q 256 298 434 338" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" stroke-dasharray="2 22" opacity="0.92"/>
    <circle cx="78" cy="356" r="17" fill="#ffffff"/><circle cx="78" cy="356" r="7.5" fill="#0d6c3b"/>
    <circle cx="434" cy="338" r="17" fill="#ffffff"/><circle cx="434" cy="338" r="7.5" fill="#0d6c3b"/>

    <!-- pin + football -->
    <ellipse cx="256" cy="408" rx="70" ry="17" fill="#000000" opacity="0.18"/>
    {pin(256, 196, 120, 406)}
    {football(256, 196, 82, 100, lace_scale=1.0)}
  </g>
</svg>"""

FAVICON = f"""<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
{DEFS}
  <g clip-path="url(#round)">
    <rect width="512" height="512" fill="url(#bg)"/>
    <ellipse cx="256" cy="450" rx="96" ry="22" fill="#000000" opacity="0.18"/>
    {pin(256, 210, 158, 476)}
    {football(256, 210, 108, 132, lace_scale=1.35)}
  </g>
</svg>"""

def render(svg, size):
    png = cairosvg.svg2png(bytestring=svg.encode(), output_width=size, output_height=size)
    return Image.open(io.BytesIO(png)).convert("RGBA")

def main():
    render(MASTER, 512).save(os.path.join(PUBLIC, "logo512.png"))
    render(MASTER, 192).save(os.path.join(PUBLIC, "logo192.png"))
    with open(os.path.join(PUBLIC, "app-icon.svg"), "w") as f:
        f.write(MASTER)
    base = render(FAVICON, 256)
    base.save(os.path.join(PUBLIC, "favicon.ico"),
              sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64)])
    print("wrote logo512.png, logo192.png, favicon.ico, app-icon.svg to", PUBLIC)

if __name__ == "__main__":
    main()
