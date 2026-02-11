// src/components/attorney/AttorneyCaseReports.tsx
// Case-scoped Reports for attorney. Reuses AttorneyCaseDocuments with report filter. Read-only.

import { AttorneyCaseDocuments } from "./AttorneyCaseDocuments";

type Props = { caseId: string };

export function AttorneyCaseReports({ caseId }: Props) {
  return <AttorneyCaseDocuments caseId={caseId} variant="reports" />;
}
