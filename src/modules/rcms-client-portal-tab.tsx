// src/modules/rcms-client-portal-tab.tsx
// ONE FILE to add a "Client Portal" tab + route without changing your design.
// - Exports <ClientPortalNavItem/> to place in your header nav
// - Exports <ClientPortalRoute/> to add to your React Router <Routes>
// - Lazily loads your existing ClientCheckins page if available
// Works with React Router v6 and Tailwind classes you already use.

import * as React from "react";
import { NavLink } from "react-router-dom";

// Try to lazy-load your existing ClientCheckins page.
// Adjust the import path if your project uses a different path or filename.
const ClientCheckins = React.lazy(async () => {
  try {
    // Common paths your app might use; tweak if needed:
    // return import("@/pages/ClientCheckins");
    // return import("../pages/ClientCheckins");
    return import("@/pages/ClientCheckins");
  } catch (e) {
    // Fallback if the path above doesn't exist.
    return { default: FallbackClientPortal };
  }
});

// ---- Public: place this in your header/site nav (next to Attorney Portal / Client Intake)
export function ClientPortalNavItem() {
  return (
    <NavLink
      to="/client-portal"
      className={({ isActive }) =>
        `px-3 py-1.5 rounded-md text-sm ${
          isActive ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
        }`
      }
    >
      Client Portal
    </NavLink>
  );
}

// ---- Public: add this inside your <Routes> (one line) ----
// <Route path="/client-portal" element={<ClientPortalRoute />} />
export function ClientPortalRoute() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-3xl p-4 text-sm text-gray-600">
          Loading Client Portal…
        </div>
      }
    >
      <ClientPortalShim />
    </React.Suspense>
  );
}

// ---- Internal: wraps ClientCheckins so it "just works" if the page exists
function ClientPortalShim() {
  // If your ClientCheckins page reads token from URL (e.g., ?t=...), do nothing.
  // If it expects props/context, it will still render its own UI.
  return <ClientCheckins />;
}

// ---- Fallback UI (only shows if the lazy import path is wrong or the page is missing)
function FallbackClientPortal() {
  return (
    <section className="mx-auto max-w-3xl p-4 space-y-3">
      <h2 className="text-xl font-semibold">Client Portal</h2>
      <div className="rounded-lg border p-4 bg-yellow-50 border-yellow-200">
        <p className="text-sm text-yellow-800">
          We couldn't load the existing Client Portal page. This usually means
          the import path needs to be adjusted in{" "}
          <code className="bg-yellow-100 px-1">rcms-client-portal-tab.tsx</code>.
        </p>
        <ul className="mt-2 text-sm text-gray-700 list-disc ml-5">
          <li>
            If your file is at <code>src/pages/ClientCheckins.tsx</code>, try:
            <br />
            <code className="bg-gray-100 px-1">
              return import("../pages/ClientCheckins");
            </code>
          </li>
          <li>
            If you use absolute aliases like <code>@/pages</code>, confirm your
            tsconfig/vite alias and keep:
            <br />
            <code className="bg-gray-100 px-1">return import("@/pages/ClientCheckins");</code>
          </li>
        </ul>
      </div>
    </section>
  );
}
