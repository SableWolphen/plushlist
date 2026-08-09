#!/usr/bin/env python3
from pathlib import Path
import base64

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
SW = ROOT / "service-worker.js"
VALIDATOR = ROOT / "scripts" / "validate-static-deployment.js"
ASSETS = ROOT / "assets"
PARTS = sorted(ASSETS.glob("thunderstorm-upload-part-*.b64"))

if len(PARTS) != 7:
    raise SystemExit(f"Expected 7 thunderstorm upload parts, found {len(PARTS)}")

payload = "".join(part.read_text().strip() for part in PARTS)
audio = base64.b64decode(payload, validate=True)
if len(audio) < 50000:
    raise SystemExit("Decoded thunderstorm audio is unexpectedly small")
(ASSETS / "thunderstorm.mp3").write_bytes(audio)

text = INDEX.read_text()

old = '''const SOUNDSCAPES = [
  { id: "rain", icon: "🌧️", label: "Rain" },
  { id: "ocean", icon: "🌊", label: "Ocean" },
  { id: "white_noise", icon: "📻", label: "White Noise" },
  { id: "calm_tone", icon: "🎵", label: "Calm Tone" },
];'''
new = '''const SOUNDSCAPES = [
  { id: "rain", icon: "🌧️", label: "Rain" },
  { id: "thunderstorm", icon: "⛈️", label: "Thunderstorm" },
  { id: "ocean", icon: "🌊", label: "Ocean" },
  { id: "white_noise", icon: "📻", label: "White Noise" },
  { id: "calm_tone", icon: "🎵", label: "Calm Tone" },
];'''
if old not in text:
    raise SystemExit("Could not locate SOUNDSCAPES list")
text = text.replace(old, new, 1)

old = '''// Ambient sound is generated on the fly with the Web Audio API rather than
// shipping recorded audio files — no licensing to track, nothing to
// download, and it still works offline once the page has loaded.
let soundscapeAudioCtx = null;
let soundscapeNodes = null;'''
new = '''// Most ambient sounds are generated on the fly with Web Audio. Thunderstorm
// uses the user-supplied recording in assets/thunderstorm.mp3 and is cached
// with the rest of the app shell so it can keep working offline.
let soundscapeAudioCtx = null;
let soundscapeNodes = null;
let soundscapeFileAudio = null;'''
if old not in text:
    raise SystemExit("Could not locate soundscape audio state")
text = text.replace(old, new, 1)

old = '''function stopSoundscape() {
  if (!soundscapeNodes) return;
  const { source, filter, gain, extraOscillators } = soundscapeNodes;'''
new = '''function stopSoundscape() {
  if (soundscapeFileAudio) {
    try { soundscapeFileAudio.pause(); } catch (_error) {}
    try { soundscapeFileAudio.currentTime = 0; } catch (_error) {}
    soundscapeFileAudio = null;
  }
  if (!soundscapeNodes) return;
  const { source, filter, gain, extraOscillators } = soundscapeNodes;'''
if old not in text:
    raise SystemExit("Could not locate stopSoundscape")
text = text.replace(old, new, 1)

old = '''function startSoundscape(id, volume) {
  stopSoundscape();
  const ctx = ensureSoundscapeAudioContext();'''
new = '''function startSoundscape(id, volume) {
  stopSoundscape();
  if (id === "thunderstorm") {
    const audio = new Audio("./assets/thunderstorm.mp3");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = Math.max(0, Math.min(1, Number(volume) || 0));
    soundscapeFileAudio = audio;
    audio.play().catch(() => {
      if (soundscapeFileAudio === audio) soundscapeFileAudio = null;
    });
    return;
  }
  const ctx = ensureSoundscapeAudioContext();'''
if old not in text:
    raise SystemExit("Could not locate startSoundscape")
text = text.replace(old, new, 1)

old = '''function setSoundscapeVolume(volume) {
  if (soundscapeNodes) soundscapeNodes.gain.gain.value = volume;
}'''
new = '''function setSoundscapeVolume(volume) {
  const safeVolume = Math.max(0, Math.min(1, Number(volume) || 0));
  if (soundscapeFileAudio) soundscapeFileAudio.volume = safeVolume;
  if (soundscapeNodes) soundscapeNodes.gain.gain.value = safeVolume;
}'''
if old not in text:
    raise SystemExit("Could not locate setSoundscapeVolume")
text = text.replace(old, new, 1)
INDEX.write_text(text)

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

print(f"Installed Thunderstorm sound ({len(audio)} bytes) and wired it into PlushLife.")
