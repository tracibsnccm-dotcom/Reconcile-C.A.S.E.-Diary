// src/domain/crisisState.ts
// Reconcile C.A.R.E. — Simple crisis state module
//
// This is a minimal, non-reactive store that provides the fields and
// functions used by RNCrisisScreen and App.tsx.
// Later we can upgrade this to a proper shared store if needed.

export type CrisisCategoryCode =
  | "behavioral_suicide"
  | "medical"
  | "violence_assault"
  | "other"
  | null;

type CrisisStateInternal = {
  crisisCategory: CrisisCategoryCode;
  crisisDescription: string;
  isInCrisis: boolean;
};

const crisisState: CrisisStateInternal = {
  crisisCategory: null,
  crisisDescription: "",
  isInCrisis: false,
};

type CrisisStateAPI = {
  crisisCategory: CrisisCategoryCode;
  crisisDescription: string;
  isInCrisis: boolean;
  setCrisisCategory: (cat: CrisisCategoryCode) => void;
  setCrisisDescription: (desc: string) => void;
  enterCrisisMode: () => void;
  exitCrisisMode: () => void;
};

// Simple function-based API. This is NOT a React hook with reactivity;
// it just gives callers access to the current values and mutators.
// For now this keeps the build green and the API surface consistent.
export function useCrisisState(): CrisisStateAPI {
  return {
    crisisCategory: crisisState.crisisCategory,
    crisisDescription: crisisState.crisisDescription,
    isInCrisis: crisisState.isInCrisis,
    setCrisisCategory: (cat: CrisisCategoryCode) => {
      crisisState.crisisCategory = cat;
    },
    setCrisisDescription: (desc: string) => {
      crisisState.crisisDescription = desc;
    },
    enterCrisisMode: () => {
      crisisState.isInCrisis = true;
    },
    exitCrisisMode: () => {
      crisisState.isInCrisis = false;
      // Optional: keep description/category, or clear them—your choice.
      // For now we leave them as-is so the last crisis context is still visible.
    },
  };
}
