#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const listingPath = path.join(root, "docs/play-store-listing.md");
const completionPath = path.join(root, "src/components/completed-task-flow.jsx");
const ratingMomentPath = path.join(root, "src/components/rating-moment.jsx");
const failures = [];

if (!fs.existsSync(listingPath)) failures.push("Missing docs/play-store-listing.md");
if (!fs.existsSync(completionPath)) failures.push("Missing completed-task-flow.jsx");

const listing = fs.existsSync(listingPath) ? fs.readFileSync(listingPath, "utf8") : "";
const completion = [completionPath, ratingMomentPath]
  .filter((file) => fs.existsSync(file))
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");

function section(markdown, heading, nextHeading) {
  const start = markdown.indexOf(`## ${heading}`);
  if (start < 0) return "";
  const bodyStart = markdown.indexOf("\n", start) + 1;
  const end = nextHeading ? markdown.indexOf(`## ${nextHeading}`, bodyStart) : markdown.length;
  return markdown.slice(bodyStart, end < 0 ? markdown.length : end).trim();
}

const title = section(listing, "App title", "Short description").replace(/^\*\*|\*\*$/g, "").trim();
const shortDescription = section(listing, "Short description", "Full description").replace(/^\*\*|\*\*$/g, "").trim();
const fullDescription = section(listing, "Full description", "Screenshot sequence");

if (!title) failures.push("Store title is missing");
if (title.length > 30) failures.push(`Store title is ${title.length} characters; Play allows 30`);
if (!/habit tracker/i.test(title)) failures.push("Store title must contain the primary keyword 'habit tracker'");
if (!shortDescription) failures.push("Short description is missing");
if (shortDescription.length > 80) failures.push(`Short description is ${shortDescription.length} characters; Play allows 80`);
if (!/habit tracker/i.test(shortDescription)) failures.push("Short description must contain 'habit tracker'");
if (fullDescription.length < 3000) failures.push(`Full description is only ${fullDescription.length} characters; target at least 3000`);
if (!/habit tracker/i.test(fullDescription)) failures.push("Full description must contain 'habit tracker'");
if (!/\n• /.test(fullDescription)) failures.push("Full description should remain scannable with bullet lists");
if (!listing.includes("## Screenshot sequence")) failures.push("Screenshot conversion plan is missing");
if (!completion.includes("Rate PlushLife") || !completion.includes("play.google.com/store/apps/details?id=com.PlushLife")) failures.push("Positive-moment Play Store rating entry is missing");
if (!completion.includes("completedCount >= 3")) failures.push("Rating prompt should only appear after a positive completion moment");
if (!completion.includes("30 * 24 * 60 * 60 * 1000")) failures.push("Rating prompt should back off for 30 days after Maybe later");

if (failures.length) {
  console.error("Store readiness checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Store readiness checks passed. Title ${title.length}/30, short description ${shortDescription.length}/80, full description ${fullDescription.length} chars.`);
