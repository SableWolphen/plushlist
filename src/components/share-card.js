// Shareable image cards for PlushLife's growth loop.
//
// Renders 1080x1350 portrait cards onto a <canvas> (zero dependencies) and
// shares them through the Web Share API, with save-to-photos and copy-text
// fallbacks. Plain JS on purpose: no JSX, no React, so the pure parts can
// be unit-tested in Node (see scripts/test-share-win.js).
//
// Privacy: cards carry only what the user explicitly chose to share — the
// win text they typed, or aggregate weekly stats. No name, email, or
// journal contents ever touch a card.

export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1350;
export const PLUSH_APP_URL = "https://sablewolphen.github.io/plushlist/";

const FONT_STACK = `"Nunito","Arial Rounded MT Bold",system-ui,-apple-system,"Segoe UI",sans-serif`;

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function winCardFilename(date = new Date()) {
  return `plushlife-win-${localDateKey(date)}.png`;
}

export function weeklyCardFilename(date = new Date()) {
  return `plushlife-week-${localDateKey(date)}.png`;
}

export function buildWinShareText(winText) {
  const clean = String(winText || "").trim().slice(0, 280);
  return `🌟 My one good thing today: "${clean}"\nTiny counts. 💜\n${PLUSH_APP_URL}`;
}

export function buildWeeklyShareText({ pct, careDays }) {
  return `💜 My PlushLife week: ${pct}% · ${careDays} care days.\nNo streaks to repair, no backlog to clear. Tiny counts.\n${PLUSH_APP_URL}`;
}

// Word-wrap for canvas: returns lines that fit maxWidth.
export function wrapLines(ctx, text, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth || !line) {
      line = trial;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const radius = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function setLetterSpacing(ctx, value) {
  try {
    if ("letterSpacing" in ctx) ctx.letterSpacing = value;
  } catch (_error) {}
}

// Shared backdrop: soft brand gradient, dreamy blurred circles, thin frame.
function drawCardBase(ctx, w, h) {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#FFFDFE");
  bg.addColorStop(0.55, "#F9EFFB");
  bg.addColorStop(1, "#EAF6FF");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const blobs = [
    [w * 0.12, h * 0.16, 260, "rgba(214,148,231,.16)"],
    [w * 0.88, h * 0.30, 300, "rgba(148,196,235,.14)"],
    [w * 0.20, h * 0.82, 280, "rgba(219,120,191,.12)"],
    [w * 0.85, h * 0.88, 240, "rgba(166,93,193,.12)"],
  ];
  for (const [x, y, r, color] of blobs) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  ctx.strokeStyle = "rgba(166,93,193,.35)";
  ctx.lineWidth = 3;
  roundRectPath(ctx, 28, 28, w - 56, h - 56, 54);
  ctx.stroke();
}

function drawKicker(ctx, w, text, y) {
  ctx.fillStyle = "#A65DC1";
  ctx.font = `900 34px ${FONT_STACK}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  setLetterSpacing(ctx, "10px");
  ctx.fillText(text, w / 2, y);
  setLetterSpacing(ctx, "0px");
}

function drawFooter(ctx, w, h, dateLabel) {
  ctx.fillStyle = "#8C6B9E";
  ctx.font = `700 30px ${FONT_STACK}`;
  ctx.textAlign = "center";
  ctx.fillText("Tiny counts 💜", w / 2, h - 150);
  ctx.fillStyle = "#B79DC4";
  ctx.font = `700 26px ${FONT_STACK}`;
  ctx.fillText(dateLabel, w / 2, h - 105);
}

export function makeShareCanvas(doc) {
  const owner = doc || (typeof document !== "undefined" ? document : null);
  if (!owner) throw new Error("No document available for canvas creation.");
  const canvas = owner.createElement("canvas");
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  return canvas;
}

// The "one good thing" win card. Text auto-shrinks to fit.
export function drawWinCard(canvas, { winText, dateLabel } = {}) {
  const w = SHARE_CARD_WIDTH;
  const h = SHARE_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  const clean = String(winText || "").trim().slice(0, 280) || "Today counted.";

  drawCardBase(ctx, w, h);
  drawKicker(ctx, w, "PLUSHLIFE · ONE GOOD THING", 150);

  ctx.textAlign = "center";
  ctx.font = "120px serif";
  ctx.fillText("🌟", w / 2, 250);

  const maxWidth = w - 220;
  let fontSize = 72;
  let lines = [];
  while (fontSize >= 40) {
    ctx.font = `900 ${fontSize}px ${FONT_STACK}`;
    lines = wrapLines(ctx, clean, maxWidth);
    if (lines.length <= 7) break;
    fontSize -= 6;
  }
  const lineHeight = fontSize * 1.32;
  const blockHeight = lines.length * lineHeight;
  let y = 560 - blockHeight / 2 + lineHeight * 0.82;
  ctx.fillStyle = "#3E2458";
  for (const line of lines) {
    ctx.fillText(line, w / 2, y);
    y += lineHeight;
  }

  ctx.strokeStyle = "rgba(166,93,193,.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 90, 1010);
  ctx.lineTo(w / 2 + 90, 1010);
  ctx.stroke();

  ctx.fillStyle = "#6B5A7D";
  ctx.font = `italic 700 34px ${FONT_STACK}`;
  ctx.fillText("kept gently, shared gladly", w / 2, 1075);

  drawFooter(ctx, w, h, dateLabel || localDateKey());
  return canvas;
}

// The weekly progress card (mirrors the in-app share card).
export function drawWeeklyCard(canvas, { pct, careDays, badges, caringDays, rangeLabel } = {}) {
  const w = SHARE_CARD_WIDTH;
  const h = SHARE_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");

  drawCardBase(ctx, w, h);
  drawKicker(ctx, w, "PLUSHLIFE · MY WEEK", 150);

  ctx.fillStyle = "#75428C";
  ctx.font = `900 190px ${FONT_STACK}`;
  ctx.textAlign = "center";
  ctx.fillText(`${Number(pct) || 0}%`, w / 2, 400);

  ctx.fillStyle = "#8C6B9E";
  ctx.font = `700 36px ${FONT_STACK}`;
  ctx.fillText("whole-week progress", w / 2, 460);

  const stats = [
    { value: String(careDays ?? 0), label: "CARE DAYS", color: "#318C79" },
    { value: String(badges ?? 0), label: "BADGES EARNED", color: "#A65DC1" },
    { value: String(caringDays ?? 0), label: "CARING DAYS", color: "#4C8FE8" },
  ];
  const boxW = 280;
  const gap = 36;
  const totalW = boxW * 3 + gap * 2;
  const startX = (w - totalW) / 2;
  const boxY = 560;
  const boxH = 220;
  stats.forEach((stat, i) => {
    const x = startX + i * (boxW + gap);
    ctx.fillStyle = "rgba(255,255,255,.72)";
    roundRectPath(ctx, x, boxY, boxW, boxH, 28);
    ctx.fill();
    ctx.fillStyle = stat.color;
    ctx.font = `900 84px ${FONT_STACK}`;
    ctx.fillText(stat.value, x + boxW / 2, boxY + 108);
    ctx.fillStyle = "#8C6B9E";
    ctx.font = `800 25px ${FONT_STACK}`;
    setLetterSpacing(ctx, "3px");
    ctx.fillText(stat.label, x + boxW / 2, boxY + 168);
    setLetterSpacing(ctx, "0px");
  });

  ctx.fillStyle = "#6B5A7D";
  ctx.font = `italic 700 36px ${FONT_STACK}`;
  ctx.fillText("no streaks to repair, no backlog to clear", w / 2, 920);

  ctx.fillStyle = "#8C6B9E";
  ctx.font = `700 30px ${FONT_STACK}`;
  if (rangeLabel) ctx.fillText(String(rangeLabel), w / 2, 985);

  drawFooter(ctx, w, h, localDateKey());
  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob === "function") {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed."))), "image/png");
    } else if (typeof canvas.toDataURL === "function") {
      try {
        const [header, data] = canvas.toDataURL("image/png").split(",");
        const binary = atob(data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const mime = (header.match(/data:(.*?);/) || [])[1] || "image/png";
        resolve(new Blob([bytes], { type: mime }));
      } catch (error) {
        reject(error);
      }
    } else {
      reject(new Error("Canvas export not supported."));
    }
  });
}

export function canShareFiles() {
  try {
    return typeof navigator !== "undefined" && typeof navigator.share === "function" && typeof navigator.canShare === "function";
  } catch (_error) {
    return false;
  }
}

// Returns "shared" when the native sheet took it, "fallback" when the
// caller should offer save/copy instead. User-cancels resolve quietly.
export async function sharePngFile({ canvas, filename, title, text }) {
  const blob = await canvasToBlob(canvas);
  const file = new File([blob], filename || "plushlife-share.png", { type: "image/png" });
  if (canShareFiles()) {
    try {
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: title || "PlushLife", text: text || "" });
        return "shared";
      }
    } catch (error) {
      if (error && (error.name === "AbortError" || error.name === "NotAllowedError")) return "dismissed";
      // Any other failure: fall through to save/copy fallbacks.
    }
  }
  return "fallback";
}

export async function downloadPng(canvas, filename) {
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "plushlife-share.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
}

export async function copyText(text) {
  const value = String(text || "");
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch (_error) {}
  try {
    const area = document.createElement("textarea");
    area.value = value;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch (_error) {
    return false;
  }
}
