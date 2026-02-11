/* -------------------------------
   FILE: src/lib/triggers.ts
   (Client check-in triggers; RN prompts)
   ------------------------------- */
import { CaseLite } from "./readiness";

export function getRNCallTriggers(k: CaseLite) {
  const triggers: string[] = [];
  const diaryDays = (k.lastPainDiaryAt ? Math.floor((Date.now()-new Date(k.lastPainDiaryAt).getTime())/86400000) : 999);

  if (diaryDays>=3) triggers.push("Client missed diary for 3+ days — RN call required.");
  // Example: if you store last 2 pain values:
  // if (k.lastTwoPain && k.lastTwoPain[0]>=8 && k.lastTwoPain[1]>=8) triggers.push("Pain ≥8 two days — RN call & Pain Mgmt referral check.");
  if (k.sdoh && (k.sdoh.housing || k.sdoh.food || k.sdoh.transport || k.sdoh.insuranceGap)) {
    const ok = k.sdohResolved || {};
    if ((k.sdoh.housing&&!ok.housing) || (k.sdoh.food&&!ok.food) || (k.sdoh.transport&&!ok.transport) || (k.sdoh.insuranceGap&&!ok.insuranceGap)) {
      triggers.push("SDOH risk unresolved — RN outreach & resource protocol.");
    }
  }
  return triggers;
}
