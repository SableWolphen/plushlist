"use strict";
// Aggregate-only, local reporting. No network requests, persistence or personal records.
const fs=require("node:fs");
const INPUT_KEYS=new Set(["period","source","paidAccounts","signups","firstTaskIn24h","d7Eligible","d7Retained","recognizedRevenueCents","refundsCents","storeFeesCents","variableCostsCents","fixedCostsCents","marketingCents"]);
const COUNTS=["paidAccounts","signups","firstTaskIn24h","d7Eligible","d7Retained"];
const MONEY=["recognizedRevenueCents","refundsCents","storeFeesCents","variableCostsCents","fixedCostsCents","marketingCents"];
function isCount(n){return Number.isSafeInteger(n)&&n>=0;}
function computeReport(data){
 if(!data||typeof data!=="object"||Array.isArray(data))throw new TypeError("Expected a single aggregate object");
 for(const key of Object.keys(data)){if(!INPUT_KEYS.has(key))throw new Error("Unsupported field: "+key+"; do not submit personal information");}
 if(typeof data.period!=="string"||!/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(data.period))throw new Error("period must be YYYY-MM");
 if(typeof data.source!=="string"||!/^[-a-zA-Z0-9_ .:/]{3,120}$/.test(data.source))throw new Error("source must identify an aggregate reporting source");
 for(const key of [...COUNTS,...MONEY])if(data[key]!==undefined&&data[key]!==null&&!isCount(data[key]))throw new Error(key+" must be a nonnegative integer");
 if(data.firstTaskIn24h!=null&&data.signups!=null&&data.firstTaskIn24h>data.signups)throw new Error("first task count exceeds signups");
 if(data.d7Retained!=null&&data.d7Eligible!=null&&data.d7Retained>data.d7Eligible)throw new Error("D7 retained exceeds eligible");
 const requiredMoney=MONEY.filter(k=>data[k]===undefined||data[k]===null);
 const profit=requiredMoney.length?null:data.recognizedRevenueCents-data.refundsCents-data.storeFeesCents-data.variableCostsCents-data.fixedCostsCents-data.marketingCents;
 const result={
  period:data.period,source:data.source,
  paidAccounts:data.paidAccounts??null,
  activationRate:(data.signups>0&&data.firstTaskIn24h!=null)?data.firstTaskIn24h/data.signups:null,
  d7RetentionRate:(data.d7Eligible>0&&data.d7Retained!=null)?data.d7Retained/data.d7Eligible:null,
  revenueCents:data.recognizedRevenueCents??null,
  operatingProfitCents:profit,
  targetProfitCents:1000000,
  targetReached:profit===null?null:profit>=1000000,
  incompleteCostFields:requiredMoney,
  note:"Verified aggregates only; missing values are not treated as zero. Annual prepaid cash is not automatically monthly recognized revenue. Owner pay and income taxes excluded unless included in submitted costs."
 };
 return result;
}
module.exports={computeReport};
if(require.main===module){
 if(process.argv.length!==3){console.error("Usage: node scripts/business-kpi-report.cjs path/to/approved-aggregate.json");process.exit(2);}
 try {
  const data=JSON.parse(fs.readFileSync(process.argv[2],"utf8"));
  process.stdout.write(JSON.stringify(computeReport(data),null,2)+"\n");
 }catch(e){console.error(e.message);process.exitCode=1;}
}
