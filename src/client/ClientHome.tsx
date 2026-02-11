// src/client/ClientHome.tsx

import * as React from "react";
import { ClientFourPsForm } from "./ClientFourPsForm";

const ClientHome: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-white px-4 py-3">
        <h2 className="text-sm font-semibold">
          Reconcile C.A.R.E. — Client Portal (Mock)
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          This is a mock of what your client will see. Their check-ins feed the
          RN case engine, update the 10-Vs snapshot, and shape the story that
          attorneys and payers eventually see. No live data or PHI is stored
          here yet.
        </p>
      </div>

      <ClientFourPsForm />
    </div>
  );
};

export default ClientHome;

