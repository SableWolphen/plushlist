"use strict";
// Planning-only financial model. Never used to determine user entitlements or collect payments.
const DEFAULTS = Object.freeze({
  targetProfitCents: 1_000_000,
  plusAnnualCents: 4999,
  togetherAnnualCents: 8999,
  togetherShare: 0.30,
  storeFeeRate: 0.15,
  variableMonthlyCents: 35,
  fixedMonthlyCents: 400_000,
});
function finiteInRange(value, name, min, max = Infinity) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(name + " must be a finite number from " + min + " to " + max);
  }
  return value;
}
function calculateProfit({ subscribers = 3500, ...overrides } = {}) {
  const c = { ...DEFAULTS, ...overrides };
  for (const key of ["targetProfitCents","plusAnnualCents","togetherAnnualCents","variableMonthlyCents","fixedMonthlyCents"]) {
    finiteInRange(c[key],key,0);
  }
  finiteInRange(c.togetherShare,"togetherShare",0,1);
  finiteInRange(c.storeFeeRate,"storeFeeRate",0,1);
  finiteInRange(subscribers,"subscribers",0);
  if (!Number.isInteger(subscribers)) throw new RangeError("subscribers must be an integer");
  const annualARPUCents = c.plusAnnualCents * (1-c.togetherShare) + c.togetherAnnualCents*c.togetherShare;
  const monthlyGrossCents = subscribers*annualARPUCents/12;
  const storeFeesCents = monthlyGrossCents*c.storeFeeRate;
  const variableCostsCents = subscribers*c.variableMonthlyCents;
  const profitCents = monthlyGrossCents-storeFeesCents-variableCostsCents-c.fixedMonthlyCents;
  const contributionPerSubscriberCents = annualARPUCents/12*(1-c.storeFeeRate)-c.variableMonthlyCents;
  const targetSubscribers = contributionPerSubscriberCents>0
    ? Math.ceil((c.targetProfitCents+c.fixedMonthlyCents)/contributionPerSubscriberCents)
    : null;
  return { subscribers, annualARPUCents, monthlyGrossCents, storeFeesCents, variableCostsCents,
    fixedMonthlyCents:c.fixedMonthlyCents, profitCents, contributionPerSubscriberCents,
    targetSubscribers, monthlyNormalizedNetRevenueCents:monthlyGrossCents-storeFeesCents };
}
function scenarioMatrix() {
  const result = [];
  for (const storeFeeRate of [0.10,0.15,0.20])
    for (const fixedMonthlyCents of [200_000,400_000,700_000])
      result.push({storeFeeRate,fixedMonthlyCents,...calculateProfit({storeFeeRate,fixedMonthlyCents})});
  return result;
}
module.exports = { DEFAULTS, calculateProfit, scenarioMatrix };
if (require.main === module) {
  const input = process.argv[2] ? JSON.parse(process.argv[2]) : {};
  process.stdout.write(JSON.stringify({base:calculateProfit(input),sensitivity:scenarioMatrix()},null,2)+"\n");
}
