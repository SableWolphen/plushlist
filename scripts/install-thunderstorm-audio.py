#!/usr/bin/env python3
from pathlib import Path
import base64
import re

ROOT = Path(__file__).resolve().parents[1]
GENTLE = ROOT / "assets" / "gentle-discovery-ui.js"
SW = ROOT / "service-worker.js"
VALIDATOR = ROOT / "scripts" / "validate-static-deployment.js"
ASSETS = ROOT / "assets"
PARTS = sorted(ASSETS.glob("thunderstorm-upload-part-*.b64"))

if len(PARTS) != 10:
    raise SystemExit(f"Expected 10 thunderstorm upload parts, found {len(PARTS)}")

payload = "".join(part.read_text().strip() for part in PARTS)
audio = base64.b64decode(payload, validate=True)
if len(audio) < 150000:
    raise SystemExit("Decoded thunderstorm audio is unexpectedly small")
(ASSETS / "thunderstorm.mp3").write_bytes(audio)

text = GENTLE.read_text()
pattern = re.compile(
    r"  let thunder = null;\n  function stopThunderstorm\(\) \{.*?\n  \}\n\n  document\.addEventListener\(\"click\"",
    re.S,
)
replacement = '''  let thunder = null;
  function stopThunderstorm() {
    if (!thunder) return;
    const { audio, button } = thunder;
    try { audio.pause(); } catch (_) {}
    try { audio.currentTime = 0; } catch (_) {}
    thunder = null;
    if (button) delete button.dataset.plushlifeThunderstormActive;
    document.querySelectorAll('[data-plushlife-thunderstorm-active="true"]').forEach((node) => delete node.dataset.plushlifeThunderstormActive);
  }

  function startThunderstorm(button) {
    stopThunderstorm();
    const audio = new Audio("./assets/thunderstorm.mp3");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.48;
    thunder = { audio, button };
    button.dataset.plushlifeThunderstormActive = "true";
    audio.play().catch(() => {
      if (thunder && thunder.audio === audio) stopThunderstorm();
    });
  }

  document.addEventListener("click"'''
text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit("Could not locate the existing procedural Thunderstorm player")
GENTLE.write_text(text)

sw = SW.read_text()
if '"./assets/thunderstorm.mp3"' not in sw:
    sw = sw.replace('  "./assets/plush-guide.js",\n', '  "./assets/plush-guide.js",\n  "./assets/thunderstorm.mp3",\n', 1)
sw = sw.replace('const CACHE_NAME = "plushlife-v60";', 'const CACHE_NAME = "plushlife-v61";', 1)
SW.write_text(sw)

validator = VALIDATOR.read_text()
validator = validator.replace('"assets/plush-guide.js",\n  "capacitor.config.json",', '"assets/plush-guide.js",\n  "assets/thunderstorm.mp3",\n  "capacitor.config.json",', 1)
validator = validator.replace('const CACHE_NAME = "plushlife-v60"', 'const CACHE_NAME = "plushlife-v61"')
validator = validator.replace('Service worker cache is not set to plushlife-v60.', 'Service worker cache is not set to plushlife-v61.')
validator = validator.replace('["login.html", "oauth.html", "support.html", "account-deletion.html", "assets/cloudflare-primary.js", "assets/plush-guide.js"]', '["login.html", "oauth.html", "support.html", "account-deletion.html", "assets/cloudflare-primary.js", "assets/plush-guide.js", "assets/thunderstorm.mp3"]')
VALIDATOR.write_text(validator)

for part in PARTS:
    part.unlink()

print(f"Installed the uploaded Thunderstorm recording ({len(audio)} bytes).")
