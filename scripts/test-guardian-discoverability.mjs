import assert from "node:assert/strict";
import fs from "node:fs";
import { buildSync } from "esbuild";

const app = fs.readFileSync("src/app-source.jsx", "utf8");
const guardian = fs.readFileSync("src/components/guardian-panel.jsx", "utf8");
const progress = fs.readFileSync("src/components/progress-panel-core.jsx", "utf8");
const docs = fs.readFileSync("docs/plushlife-ui-source-of-truth.md", "utf8");
const nav = app.split('<nav className="pl-app-bottom-nav" aria-label="Main navigation">')[1]?.split("</nav>")[0];
assert(nav, "Guardian and other destinations must use the actual mobile bottom navigation");

const tabs = [...nav.matchAll(/<span>(Home|Tasks|Care|Progress|Plush|Guardian)<\/span>/g)].map(m=>m[1]);
assert.deepEqual(tabs, ["Home","Tasks","Care","Progress","Guardian"], "Five clear, phone-friendly tabs with Guardian easy to find");
assert(nav.includes('aria-current={dashboard === "guardian" && !collectionOpen ? "page" : undefined}'), "Guardian must have a selected state");
assert(nav.includes('goToDashboard("guardian")'), "Bottom Guardian opens the actual Guardian page");
assert(nav.includes('setCollectionOpen(false); goToDashboard("guardian")'), "Switching from a Plush collection must close the overlay");
assert(fs.existsSync("assets/figma/icon-guardian.svg"), "Real Guardian tab icon must be included in the build");
assert(fs.readFileSync("assets/figma/icon-guardian.svg", "utf8").includes("<svg"), "Guardian icon must have valid SVG content");

assert(guardian.includes('aria-label="Guardian support"'), "Guardian needs a clear, unified support card");
assert(guardian.includes("useGuardianState(user?.id)"), "Bot entry must reflect the chosen, account-scoped bot style");
assert(guardian.includes('openPlushGuardian("rewards")'), "Automatic Guardian rewards remain reachable");
assert(guardian.indexOf('aria-label="Guardian support"') < guardian.indexOf('aria-label="Guardian sections"'), "Guardian selection remains prominent above advanced sections");
assert(guardian.includes('mode === "person"') && guardian.includes('mode === "automatic"'), "Guardian distinguishes connected person from automatic mode");
assert(guardian.includes('guardianMode(ownedSupportLinks'), "Automatic mode must defer to an accepted human Guardian");
assert(guardian.includes("<CozySharing links={ownedSupportLinks} />") && guardian.includes('guardianArea === "together"'), "Human Guardian and Together features stay intact");
assert(guardian.includes('guardianArea === "support"'), "Existing sharing and invitations remain accessible");

assert(progress.includes("My Plush & Rewards"), "Plush cannot vanish when its tab becomes Guardian");
assert(progress.includes('onClick={() => onOpenPlush?.()}'), "Plush rewards need a working direct button");
assert(app.includes('onOpenPlush={() => setCollectionOpen(true)}'), "The Plush button must open the original collection");
assert(app.includes("<RewardsPanel inline={collectionOpen}"), "Original earned plush rewards and outfits must stay intact");
assert(docs.includes("Home · Tasks · Care · Progress · Guardian"), "UI source of truth must match shipped navigation");

buildSync({
  entryPoints: ["src/components/guardian-panel.jsx","src/components/progress-panel-core.jsx"],
  bundle: true, format: "esm", platform: "browser", target: "es2022",
  loader: {".jsx":"jsx"}, write: false, outdir: "out",
});
console.log("Guardian findability passed: unified Guardian navigation, exclusive person/automatic type and visible rewards.");
