// src/App.tsx

import * as React from "react";
import { ClientFourPsForm } from "./components/diary/ClientFourPsForm";
import { AttorneyDiaryDashboard } from "./components/attorney/AttorneyDiaryDashboard";

const App: React.FC = () => {
  // For now, we'll show both client and attorney views for demo purposes.
  // In production, you would have authentication and routing.
  const [userType, setUserType] = React.useState<"client" | "attorney">("client");

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reconcile C.A.S.E. Diary</h1>
        <p className="text-gray-600">Client's Advocacy & Settlement Evidence Diary</p>
        
        {/* Demo Only: User Type Switcher */}
        <div className="mt-4">
          <label className="mr-4">
            <input
              type="radio"
              name="userType"
              checked={userType === "client"}
              onChange={() => setUserType("client")}
              className="mr-1"
            />
            Client View
          </label>
          <label>
            <input
              type="radio"
              name="userType"
              checked={userType === "attorney"}
              onChange={() => setUserType("attorney")}
              className="mr-1"
            />
            Attorney View
          </label>
        </div>
      </header>

      <main>
        {userType === "client" ? <ClientFourPsForm /> : <AttorneyDiaryDashboard />}
      </main>

      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Reconcile Care Management Services. All rights reserved.</p>
        <p className="mt-1">This tool is for legal evidence documentation. Use responsibly.</p>
      </footer>
    </div>
  );
};

export default App;
