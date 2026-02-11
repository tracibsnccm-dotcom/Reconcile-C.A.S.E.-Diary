// src/pages/DevCaseDocumentsDemo.tsx
import React from "react";
import { CaseDocumentsPanel } from "../components/cases/CaseDocumentsPanel";

// Use your real Dev Case + Dev Attorney IDs
const TEST_CASE_ID = "c8718112-4809-4394-8e09-32ad6dde1ab3";   // Dev Case 001
const TEST_USER_ID = "0a9ca6d9-b39f-4f80-b08f-f49c149a541e";   // Dev Attorney

export default function DevCaseDocumentsDemo() {
  return (
    <div style={{ padding: "2rem" }}>
      <h2>Dev: Case Documents Demo</h2>
      <CaseDocumentsPanel
        caseId={TEST_CASE_ID}
        currentUserId={TEST_USER_ID}
      />
    </div>
  );
}
