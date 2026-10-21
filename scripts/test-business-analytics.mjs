import assert from "node:assert/strict";import {normalizeEvent,tallyEvents,COLLECTION_ENABLED} from "../src/business-analytics.mjs";
assert.equal(COLLECTION_ENABLED,false);assert.equal(normalizeEvent("journal_text"),null);
assert.deepEqual(tallyEvents(["landing_view","landing_view",{name:"premium_interest"},"private_reflection"]),{landing_view:2,pricing_view:0,signup_started:0,onboarding_completed:0,premium_interest:1});
console.log("Privacy-safe analytics unit tests passed");