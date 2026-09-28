import assert from "node:assert/strict";
import {
  SHARE_CARD_WIDTH,
  SHARE_CARD_HEIGHT,
  PLUSH_APP_URL,
  wrapLines,
  buildWinShareText,
  buildWeeklyShareText,
  winCardFilename,
  weeklyCardFilename,
  drawWinCard,
  drawWeeklyCard,
  canShareFiles,
  sharePngFile,
  copyText,
} from "../src/components/share-card.js";

// --- Canvas stub -----------------------------------------------------------
function makeStubCtx() {
  const calls = { fillText: [], measureCalls: 0 };
  const gradient = { addColorStop() {} };
  return {
    calls,
    canvas: null,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textAlign: "",
    textBaseline: "",
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    fillRect() {},
    fill() {},
    stroke() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    arcTo() {},
    closePath() {},
    measureText: (text) => {
      calls.measureCalls += 1;
      return { width: String(text).length * 10 };
    },
    fillText: (text, x, y) => {
      calls.fillText.push(String(text));
    },
  };
}

function makeStubCanvas() {
  const ctx = makeStubCtx();
  const canvas = {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    getContext: () => ctx,
    toBlob: (cb) => cb(new Blob(["fake-png"], { type: "image/png" })),
    _ctx: ctx,
  };
  ctx.canvas = canvas;
  return canvas;
}

// --- Dimensions & share text -----------------------------------------------
assert.equal(SHARE_CARD_WIDTH, 1080);
assert.equal(SHARE_CARD_HEIGHT, 1350);
assert.ok(PLUSH_APP_URL.includes("sablewolphen.github.io/plushlist"));

const winText = buildWinShareText("I drank water before coffee");
assert.ok(winText.includes("I drank water before coffee"));
assert.ok(winText.includes(PLUSH_APP_URL));

const longWin = buildWinShareText("x".repeat(500));
assert.ok(longWin.indexOf("x".repeat(281)) === -1, "win text truncates at 280 chars");

const weeklyText = buildWeeklyShareText({ pct: 72, careDays: 5 });
assert.ok(weeklyText.includes("72%"));
assert.ok(weeklyText.includes("5 care days"));
assert.ok(weeklyText.includes(PLUSH_APP_URL));

assert.match(winCardFilename(new Date("2026-09-28T12:00:00")), /^plushlife-win-2026-09-28\.png$/);
assert.match(weeklyCardFilename(new Date("2026-09-28T12:00:00")), /^plushlife-week-2026-09-28\.png$/);

// --- Word wrap ---------------------------------------------------------------
{
  const ctx = makeStubCtx();
  const lines = wrapLines(ctx, "one two three four five", 65); // 6 chars fit per line at 10px/char
  assert.deepEqual(lines, ["one", "two", "three", "four", "five"]);
  assert.deepEqual(wrapLines(ctx, "", 100), [""]);
}

// --- Win card render ---------------------------------------------------------
{
  const canvas = makeStubCanvas();
  drawWinCard(canvas, { winText: "I drank water before coffee", dateLabel: "2026-09-28" });
  const drawn = canvas._ctx.calls.fillText.join("\n");
  assert.ok(drawn.includes("PLUSHLIFE · ONE GOOD THING"), "kicker drawn");
  assert.ok(drawn.includes("I drank water before coffee"), "win text drawn");
  assert.ok(drawn.includes("Tiny counts 💜"), "footer drawn");
  assert.ok(drawn.includes("2026-09-28"), "date drawn");
}

// Long wins shrink instead of overflowing.
{
  const canvas = makeStubCanvas();
  drawWinCard(canvas, { winText: "word ".repeat(60).trim() });
  assert.ok(canvas._ctx.calls.measureCalls > 0, "text measured for fit");
  assert.ok(canvas._ctx.calls.fillText.length > 0, "long text still rendered");
}

// --- Weekly card render --------------------------------------------------------
{
  const canvas = makeStubCanvas();
  drawWeeklyCard(canvas, { pct: 72, careDays: 5, badges: 3, caringDays: 4, rangeLabel: "Sep 21 – Sep 27" });
  const drawn = canvas._ctx.calls.fillText.join("\n");
  assert.ok(drawn.includes("72%"), "pct drawn");
  assert.ok(drawn.includes("CARE DAYS"), "stat labels drawn");
  assert.ok(drawn.includes("Sep 21 – Sep 27"), "range drawn");
}

// --- Sharing behavior in a non-browser env --------------------------------------
assert.equal(canShareFiles(), false, "no Web Share API in Node");

{
  const canvas = makeStubCanvas();
  const result = await sharePngFile({ canvas, filename: "x.png", title: "t", text: "hi" });
  assert.equal(result, "fallback", "falls back gracefully without navigator.share");
}

{
  const ok = await copyText("hello");
  assert.equal(ok, false, "copy reports false without a clipboard, never throws");
}

console.log("Share-a-win card tests passed.");
