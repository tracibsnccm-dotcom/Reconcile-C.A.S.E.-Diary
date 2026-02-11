/**
 * Resolves the latest released/closed case from a revision lineage.
 * 
 * Case lifecycle: working/draft → released → revised (draft copy) → released → closed
 * Attorneys must always see the latest released version, even if a draft revision exists.
 * 
 * @param allCases - Array of all cases to search through
 * @param startCaseId - The case ID to start from (may be a draft or any version in the lineage)
 * @returns The most recent case with status "released" or "closed", or null if none found
 */

export interface CaseWithRevision {
  id: string;
  revision_of_case_id: string | null;
  case_status: string | null;
  closed_at?: string | null;
  released_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

export function resolveLatestReleasedCase<T extends CaseWithRevision>(
  allCases: T[],
  startCaseId: string | null | undefined
): T | null {
  if (!startCaseId || !allCases || allCases.length === 0) {
    return null;
  }

  // Find the starting case
  const startCase = allCases.find((c) => c.id === startCaseId);
  if (!startCase) {
    return null;
  }

  // Step 1: Walk revision_of_case_id upward to find the root case
  let rootCase: T | null = startCase;
  const visited = new Set<string>([startCase.id]);
  
  while (rootCase.revision_of_case_id) {
    const parentId = rootCase.revision_of_case_id;
    if (visited.has(parentId)) {
      // Circular reference detected, break to avoid infinite loop
      break;
    }
    visited.add(parentId);
    
    const parent = allCases.find((c) => c.id === parentId);
    if (!parent) {
      // Parent not found in allCases, current case is effectively the root
      break;
    }
    rootCase = parent;
  }

  // Step 2: Gather all cases in the lineage (root + all descendants)
  const lineageCases: T[] = [rootCase];
  const rootId = rootCase.id;
  
  // Find all cases that have this root (or any case in the lineage) as their revision_of_case_id
  const toProcess = [rootId];
  const processed = new Set<string>([rootId]);
  
  while (toProcess.length > 0) {
    const currentId = toProcess.shift()!;
    
    // Find all cases that are revisions of the current case
    const revisions = allCases.filter(
      (c) => c.revision_of_case_id === currentId && !processed.has(c.id)
    );
    
    for (const revision of revisions) {
      lineageCases.push(revision);
      toProcess.push(revision.id);
      processed.add(revision.id);
    }
  }

  // Step 3: Filter to only released/closed cases (never drafts or working)
  const releasedOrClosed = lineageCases.filter((c) => {
    const status = (c.case_status || "").toLowerCase();
    return status === "released" || status === "closed";
  });

  if (releasedOrClosed.length === 0) {
    return null;
  }

  // Step 4: Choose the most recent using timestamp priority:
  // closed_at > released_at > updated_at > created_at (fallback to 0 if missing)
  const getTimestamp = (c: T): number => {
    if (c.closed_at) {
      const ts = new Date(c.closed_at).getTime();
      if (!isNaN(ts)) return ts;
    }
    if (c.released_at) {
      const ts = new Date(c.released_at).getTime();
      if (!isNaN(ts)) return ts;
    }
    if (c.updated_at) {
      const ts = new Date(c.updated_at).getTime();
      if (!isNaN(ts)) return ts;
    }
    if (c.created_at) {
      const ts = new Date(c.created_at).getTime();
      if (!isNaN(ts)) return ts;
    }
    return 0;
  };

  // Sort by timestamp descending and return the first (most recent)
  releasedOrClosed.sort((a, b) => getTimestamp(b) - getTimestamp(a));
  
  return releasedOrClosed[0];
}

/**
 * Returns all released/closed cases in the revision lineage for a given start case,
 * ordered by timestamp descending (newest first). Used for RN Release History.
 *
 * @param allCases - Array of all cases to search through
 * @param startCaseId - The case ID to start from (may be a draft or any revision in the chain)
 * @returns Array of released/closed cases in lineage, newest first
 */
export function getReleasedHistoryInLineage<T extends CaseWithRevision>(
  allCases: T[],
  startCaseId: string | null | undefined
): T[] {
  if (!startCaseId || !allCases || allCases.length === 0) {
    return [];
  }

  const startCase = allCases.find((c) => c.id === startCaseId);
  if (!startCase) {
    return [];
  }

  // Step 1: Walk revision_of_case_id upward to find the root case
  let rootCase: T = startCase;
  const visited = new Set<string>([startCase.id]);

  while (rootCase.revision_of_case_id) {
    const parentId = rootCase.revision_of_case_id;
    if (visited.has(parentId)) break;
    visited.add(parentId);
    const parent = allCases.find((c) => c.id === parentId);
    if (!parent) break;
    rootCase = parent;
  }

  // Step 2: Gather all cases in the lineage (root + all descendants)
  const lineageCases: T[] = [rootCase];
  const toProcess = [rootCase.id];
  const processed = new Set<string>([rootCase.id]);

  while (toProcess.length > 0) {
    const currentId = toProcess.shift()!;
    const revisions = allCases.filter(
      (c) => c.revision_of_case_id === currentId && !processed.has(c.id)
    );
    for (const revision of revisions) {
      lineageCases.push(revision);
      toProcess.push(revision.id);
      processed.add(revision.id);
    }
  }

  // Step 3: Filter to only released/closed
  const releasedOrClosed = lineageCases.filter((c) => {
    const status = (c.case_status || "").toLowerCase();
    return status === "released" || status === "closed";
  });

  // Step 4: Sort by timestamp descending (closed_at > released_at > updated_at > created_at)
  const getTimestamp = (c: T): number => {
    if (c.closed_at) {
      const ts = new Date(c.closed_at).getTime();
      if (!isNaN(ts)) return ts;
    }
    if (c.released_at) {
      const ts = new Date(c.released_at).getTime();
      if (!isNaN(ts)) return ts;
    }
    if (c.updated_at) {
      const ts = new Date(c.updated_at).getTime();
      if (!isNaN(ts)) return ts;
    }
    if (c.created_at) {
      const ts = new Date(c.created_at).getTime();
      if (!isNaN(ts)) return ts;
    }
    return 0;
  };
  releasedOrClosed.sort((a, b) => getTimestamp(b) - getTimestamp(a));
  return releasedOrClosed;
}

/**
 * Gets the root case ID in a revision chain by walking up revision_of_case_id.
 * 
 * @param allCases - Array of all cases to search through
 * @param startCaseId - The case ID to start from
 * @returns The root case ID (the case with no revision_of_case_id), or null if not found
 */
export function getRevisionChainRootId<T extends CaseWithRevision>(
  allCases: T[],
  startCaseId: string | null | undefined
): string | null {
  if (!startCaseId || !allCases || allCases.length === 0) {
    return null;
  }

  // Find the starting case
  const startCase = allCases.find((c) => c.id === startCaseId);
  if (!startCase) {
    return null;
  }

  // Walk revision_of_case_id upward to find the root case
  let rootCase: T = startCase;
  const visited = new Set<string>([startCase.id]);
  
  while (rootCase.revision_of_case_id) {
    const parentId = rootCase.revision_of_case_id;
    if (visited.has(parentId)) {
      // Circular reference detected, break to avoid infinite loop
      break;
    }
    visited.add(parentId);
    
    const parent = allCases.find((c) => c.id === parentId);
    if (!parent) {
      // Parent not found in allCases, current case is effectively the root
      break;
    }
    rootCase = parent;
  }

  return rootCase.id;
}