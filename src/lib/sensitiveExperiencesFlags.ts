import { SensitiveExperiencesData } from "@/components/IntakeSensitiveExperiences";

export type FlagLevel = 'critical' | 'high' | 'moderate' | 'none';
export type FlagColor = '🟥' | '🟧' | '🟨';

export interface SensitiveFlag {
  level: FlagLevel;
  color: FlagColor | null;
  alertType: string;
  message: string;
  severity: 'critical' | 'high' | 'medium';
  sdohCategory?: 'safety' | 'economic' | 'behavioral_health' | 'social_support';
  sdohFlag?: string;
  disclosureScope: 'internal' | 'minimal' | 'full';
  notificationPriority: 'immediate' | 'within_2h' | 'within_24h';
}

// Critical red flag triggers
const criticalTriggers = [
  // Note: Suicidal ideation/self-harm would come from behavioral health section
  // This is handled separately and does NOT create SDOH flags
];

// High orange flag triggers
const highTriggers = [
  "History of domestic violence or intimate-partner violence",
  "Current safety concerns at home or in a relationship",
  "Stalking or harassment experience",
  "History of sexual abuse or assault",
  "Experience of trafficking or exploitation",
  "Current use of non-prescribed or illicit substances", // Active substance misuse
  "Current alcohol use that concerns you", // Withdrawal risk
  "Current prescription medication misuse or dependency", // Withdrawal risk
];

// Moderate yellow flag triggers
const moderateTriggers = [
  "History of physical abuse (childhood or adulthood)",
  "History of emotional or psychological abuse",
  "History of bullying or workplace harassment",
  "Witnessed violence (home, community, or workplace)",
  "Past use of non-prescribed or illicit substances",
  "Past alcohol use that required treatment or caused problems",
  "Past prescription medication misuse or dependency",
];

// SDOH category mappings
const sdohMappings: Record<string, { category: 'safety' | 'economic' | 'behavioral_health' | 'social_support', flag: string }> = {
  "History of domestic violence or intimate-partner violence": { category: 'safety', flag: 'Safety Concern - Domestic Violence' },
  "Current safety concerns at home or in a relationship": { category: 'safety', flag: 'Safety Concern - Current Unsafe Environment' },
  "Stalking or harassment experience": { category: 'safety', flag: 'Safety Concern - Stalking/Harassment' },
  "History of sexual abuse or assault": { category: 'safety', flag: 'Safety Concern - Sexual Trauma' },
  "Experience of trafficking or exploitation": { category: 'safety', flag: 'Safety Concern - Trafficking/Exploitation' },
  "Housing instability or homelessness risk": { category: 'economic', flag: 'Economic Insecurity - Housing' },
  "Food insecurity": { category: 'economic', flag: 'Economic Insecurity - Food' },
  "Financial hardship or loss of income": { category: 'economic', flag: 'Economic Insecurity - Financial' },
  "Current use of non-prescribed or illicit substances": { category: 'behavioral_health', flag: 'Behavioral Health Risk - Active Substance Use' },
  "Current alcohol use that concerns you": { category: 'behavioral_health', flag: 'Behavioral Health Risk - Alcohol Use' },
  "Current prescription medication misuse or dependency": { category: 'behavioral_health', flag: 'Behavioral Health Risk - Medication Misuse' },
  "Past use of non-prescribed or illicit substances": { category: 'behavioral_health', flag: 'Behavioral Health Risk - Past Substance Use' },
  "Past alcohol use that required treatment or caused problems": { category: 'behavioral_health', flag: 'Behavioral Health Risk - Past Alcohol Use' },
  "Past prescription medication misuse or dependency": { category: 'behavioral_health', flag: 'Behavioral Health Risk - Past Medication Misuse' },
  "Limited family or social support": { category: 'social_support', flag: 'Social Support Need - Limited Network' },
};

export function analyzeSensitiveExperiences(data: SensitiveExperiencesData): SensitiveFlag[] {
  const flags: SensitiveFlag[] = [];
  
  // Skip if section was skipped
  if (data.sectionSkipped) {
    return flags;
  }

  // Collect all selected options
  const allSelections = [
    ...(data.substanceUse || []),
    ...(data.safetyTrauma || []),
    ...(data.stressors || [])
  ];

  // Filter out "None" and "N/A" responses
  const significantSelections = allSelections.filter(
    item => item !== "None of the above / prefer not to answer" && item !== "Not Applicable / N/A"
  );

  if (significantSelections.length === 0) {
    return flags;
  }

  // Track highest priority flag for grouping
  let hasCritical = false;
  let hasHigh = false;

  // Check for critical flags (would come from behavioral health section)
  // This is a placeholder for integration with behavioral health data
  
  // Check for high priority flags
  const highPriorityItems = significantSelections.filter(item => highTriggers.includes(item));
  if (highPriorityItems.length > 0) {
    hasHigh = true;
    highPriorityItems.forEach(item => {
      const sdohMapping = sdohMappings[item];
      flags.push({
        level: 'high',
        color: '🟧',
        alertType: 'safety_concern',
        message: `High priority safety concern: ${item}`,
        severity: 'high',
        sdohCategory: sdohMapping?.category,
        sdohFlag: sdohMapping?.flag,
        disclosureScope: 'internal',
        notificationPriority: 'within_2h'
      });
    });
  }

  // Check for moderate priority flags
  const moderatePriorityItems = significantSelections.filter(item => moderateTriggers.includes(item));
  if (moderatePriorityItems.length > 0 && !hasHigh && !hasCritical) {
    moderatePriorityItems.forEach(item => {
      const sdohMapping = sdohMappings[item];
      flags.push({
        level: 'moderate',
        color: '🟨',
        alertType: 'safety_review',
        message: `Moderate priority for review: ${item}`,
        severity: 'medium',
        sdohCategory: sdohMapping?.category,
        sdohFlag: sdohMapping?.flag,
        disclosureScope: 'internal',
        notificationPriority: 'within_24h'
      });
    });
  }

  // Check for other SDOH-relevant items not already flagged
  const otherSdohItems = significantSelections.filter(
    item => sdohMappings[item] && !highTriggers.includes(item) && !moderateTriggers.includes(item)
  );
  otherSdohItems.forEach(item => {
    const sdohMapping = sdohMappings[item];
    if (sdohMapping) {
      flags.push({
        level: 'moderate',
        color: '🟨',
        alertType: 'sdoh_concern',
        message: `SDOH concern identified: ${item}`,
        severity: 'medium',
        sdohCategory: sdohMapping.category,
        sdohFlag: sdohMapping.flag,
        disclosureScope: 'internal',
        notificationPriority: 'within_24h'
      });
    }
  });

  return flags;
}

export function getClientFacingMessage(flags: SensitiveFlag[]): string {
  if (flags.length === 0) return '';
  
  return "Thank you for sharing this information. Your care plan will incorporate this to ensure you have the right support.";
}

export function getAttorneyVisibleNote(flags: SensitiveFlag[]): string {
  const hasHighOrCritical = flags.some(f => f.level === 'critical' || f.level === 'high');
  
  if (hasHighOrCritical) {
    return "Safety Review Initiated";
  }
  
  return "";
}

export function buildSdohUpdates(flags: SensitiveFlag[]): Record<string, any> {
  const sdohUpdates: Record<string, any> = {};
  
  flags.forEach(flag => {
    if (flag.sdohCategory && flag.sdohFlag) {
      if (!sdohUpdates[flag.sdohCategory]) {
        sdohUpdates[flag.sdohCategory] = [];
      }
      sdohUpdates[flag.sdohCategory].push({
        flag: flag.sdohFlag,
        level: flag.level,
        detectedAt: new Date().toISOString()
      });
    }
  });
  
  return sdohUpdates;
}
