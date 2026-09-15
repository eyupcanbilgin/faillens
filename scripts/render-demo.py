"""Optional maintainer utility: render actual CLI output as a 30-second GIF.

Requires Python and Pillow, plus an existing npm build. This is a rendered
terminal walkthrough, not a video recording of a live terminal session.
Run from the repository root: python scripts/render-demo.py
"""

import os
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def font(size):
    candidates = [
        Path(os.environ.get("WINDIR", "/nonexistent")) / "Fonts" / "consola.ttf",
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"),
        Path("/System/Library/Fonts/Menlo.ttc"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default(size=size)


command = [
    "node", "dist/cli.js", "analyze",
    "fixtures/product-bug/backend-500/input.json",
]
output = subprocess.run(command, capture_output=True, text=True, encoding="utf-8", check=True).stdout
assert "PRODUCT_BUG" in output and "network-1" in output
body_font, title_font, label_font = font(21), font(30), font(17)


def frame(title, lines, progress):
    image = Image.new("RGB", (1240, 840), "#0b1020")
    draw = ImageDraw.Draw(image)
    draw.text((42, 25), "FailLens", font=title_font, fill="#edf2ff")
    draw.text((42, 68), "Evidence-first failure triage for Playwright", font=label_font, fill="#9aaaca")
    draw.rounded_rectangle((30, 113, 1210, 770), radius=16, fill="#111a2c", outline="#29364c", width=2)
    for i, color in enumerate(["#ff6b6b", "#ffd166", "#64d98b"]):
        draw.ellipse((52 + 24*i, 132, 64 + 24*i, 144), fill=color)
    draw.text((155, 126), title, font=label_font, fill="#a8b8d5")
    y = 175
    for line in lines:
        color = "#edf2ff"
        if "PRODUCT_BUG" in line or "network-1" in line:
            color = "#ffcf76"
        elif line.startswith("$"):
            color = "#79e6bc"
        elif line in ["Observations", "Hypothesis", "Suggested next investigation", "Missing evidence"]:
            color = "#83b8ff"
        draw.text((54, y), line, font=body_font, fill=color)
        y += 25
    draw.text((42, 792), "Rendered CLI walkthrough | synthetic fixture | AI off | no confirmed root-cause claim", font=label_font, fill="#9aaaca")
    draw.rectangle((30, 830, 30 + int(1180*progress), 836), fill="#79e6bc")
    return image


frames = []
durations = []
frames.append(frame("1 / 4  The symptom", [
    "Playwright: checkout > creates an order", "", "Assertion failed:",
    "Expected order confirmation to be visible", "", "What should we investigate first?",
    "A locator, the service, the runner, or timing?", "",
    "Use the evidence already captured by the test.",
], 0.16))
durations.append(5000)
visible_command = "$ node dist/cli.js analyze fixtures/product-bug/backend-500/input.json"
for i in range(1, 11):
    frames.append(frame("2 / 4  One local command", [visible_command[:len(visible_command)*i//10] + "_"], 0.16 + i*0.017))
    durations.append(500)
# Keep the real result verbatim, wrapping only long lines for the image width.
import textwrap
result_lines = []
for line in output.strip().splitlines()[2:]:
    result_lines.extend(textwrap.wrap(line, width=87) or [""])
# Remove only redundant blank lines so all output fits the terminal panel.
result_lines = [line for line in result_lines if line]
frames.append(frame("3 / 4  Observations, then a hypothesis", result_lines, 0.83))
durations.append(15000)
frames.append(frame("4 / 4  Built for review", [
    "Playwright JSON", "  -> normalized evidence", "  -> redaction", "  -> deterministic signals",
    "  -> optional bounded AI", "  -> validated console / JSON / Markdown", "",
    "No shell. No autonomous code edits. Unknown is valid.", "",
    "$ npm run demo", "github.com/eyupcanbilgin/faillens",
], 1))
durations.append(5000)
destination = Path("docs/assets/demo.gif")
destination.parent.mkdir(parents=True, exist_ok=True)
frames[0].save(destination, save_all=True, append_images=frames[1:], duration=durations, loop=0, optimize=False)
print(f"Created {destination}: {sum(durations)/1000:.0f} seconds, {len(frames)} frames")
