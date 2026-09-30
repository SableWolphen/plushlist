// Outfit IDs remain stable so earned rewards and saved selections stay intact.
export const OUTFIT_KINDS = {
  "bow": "bow",
  "comet-bow": "bow",
  "glasses": "glasses",
  "crown": "crown",
  "gold-crown": "crown",
  "aurora-crown": "crown",
  "yearlight-crown": "crown",
  "cape": "cape",
  "habit-tree": "cape",
  "sunrise-cape": "cape",
  "party": "party",
  "scarf": "scarf",
  "backpack": "backpack",
  "cozy-cap": "cap",
  "moon-cap": "cap",
  "compass": "charm",
  "century-gem": "charm",
  "change-champion": "charm",
  "journal-charm": "charm",
  "keepsake-gem": "charm",
  "moon-halo": "halo",
  "rainbow-aura": "halo",
  "garden-glow": "halo",
  "evergreen-halo": "halo",
  "sprout": "sprout",
  "garden": "overalls",
  "sunflower": "flower",
  "shield": "shield",
  "diamond-shield": "shield",
  "boots": "boots",
  "wings": "wings",
  "founders-ribbon": "ribbon",
  "memory-ribbon": "ribbon",
  "knit-sweater": "sweater",
  "book-buddy": "book",
  "storybook-star": "book",
  "raincoat": "coat",
  "starlight-pins": "pins",
  "cozy-cardigan": "cardigan"
};
export const REAR_OUTFITS = new Set(["cape", "habit-tree", "sunrise-cape", "backpack", "wings"]);
export const FRONT_OUTFITS = new Set(["bow", "comet-bow", "glasses", "crown", "gold-crown", "aurora-crown", "yearlight-crown", "cape", "habit-tree", "sunrise-cape", "party", "scarf", "backpack", "cozy-cap", "moon-cap", "compass", "century-gem", "change-champion", "journal-charm", "keepsake-gem", "moon-halo", "rainbow-aura", "garden-glow", "evergreen-halo", "sprout", "garden", "sunflower", "shield", "diamond-shield", "boots", "founders-ribbon", "memory-ribbon", "knit-sweater", "book-buddy", "storybook-star", "raincoat", "starlight-pins", "cozy-cardigan"]);

// Match the bear coordinates in the original Figma assets, not the scene bounds.
export function wardrobeGeometry(world) {
  return world === "dino" || world.startsWith("baby")
    ? { width: 294, x: 107, y: 14, scale: .82 }
    : { width: 211, x: 57, y: 0, scale: 1 };
}
