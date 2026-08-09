#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
GENTLE = ROOT / "assets" / "gentle-discovery-ui.js"
AUDIO = ROOT / "assets" / "thunderstorm.mp3"
SW = ROOT / "service-worker.js"
VALIDATOR = ROOT / "scripts" / "validate-static-deployment.js"

if not AUDIO.exists() or AUDIO.stat().st_size < 100000:
    raise SystemExit("Thunderstorm recording was not downloaded correctly")

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

print(f"Installed the Thunderstorm recording ({AUDIO.stat().st_size} bytes).")
