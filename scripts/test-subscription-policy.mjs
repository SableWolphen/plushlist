import assert from "node:assert/strict";
import { publicPlans, resolveServerEntitlement, assertCheckoutReady } from "../src/subscription-policy.mjs";
const plans = publicPlans();
assert.equal(plans.length, 3);
assert.equal(plans.find(p=>p.id==="plushplus").monthlyUsdCents, 499);
assert.equal(plans.find(p=>p.id==="plushfamily").monthlyUsdCents, 899);
assert.ok(plans.every(p=>p.checkoutEnabled===false), "Payments must be disabled");
const verified={provider:"stripe",plan:"plushplus",status:"active",serverVerified:true,verifiedAt:"2026-10-20T00:00:00Z",expiresAt:"2026-11-20T00:00:00Z"};
const now=Date.parse("2026-10-25T00:00:00Z");
assert.equal(resolveServerEntitlement(verified,now),"plushplus");
for(const patch of [{serverVerified:false},{provider:"unknown"},{status:"revoked"},{status:"cancelled"},{plan:"invalid"},{verifiedAt:null},{expiresAt:"2026-10-21T00:00:00Z"}]){
  assert.equal(resolveServerEntitlement({...verified,...patch},now),"free");
}
assert.equal(resolveServerEntitlement({...verified,status:"in_grace_period",plan:"plushfamily"},now),"plushfamily");
assert.equal(resolveServerEntitlement(null,now),"free");
assert.throws(()=>assertCheckoutReady({}),/Checkout disabled/);
assert.equal(assertCheckoutReady({providerConfigured:true,webhookVerified:true,entitlementsPersisted:true,termsPublished:true,refundPolicyPublished:true,platformComplianceReviewed:true}),true);
console.log("Subscription policy tests passed");
