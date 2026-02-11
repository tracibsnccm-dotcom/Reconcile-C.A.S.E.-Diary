// src/lib/caseEventsContext.tsx

import * as React from "react";
import type { CaseTimelineEvent } from "../domain/caseTimeline";
import { mockTimelineEvents } from "../mock/mockTimeline";

interface CaseEventsContextValue {
  events: CaseTimelineEvent[];
  addEvent: (event: CaseTimelineEvent) => void;
}

const CaseEventsContext = React.createContext<
  CaseEventsContextValue | undefined
>(undefined);

export const CaseEventsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [events, setEvents] = React.useState<CaseTimelineEvent[]>(
    () => mockTimelineEvents
  );

  const addEvent = React.useCallback((event: CaseTimelineEvent) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  return (
    <CaseEventsContext.Provider value={{ events, addEvent }}>
      {children}
    </CaseEventsContext.Provider>
  );
};

export const useCaseEvents = (): CaseEventsContextValue => {
  const ctx = React.useContext(CaseEventsContext);
  if (!ctx) {
    throw new Error("useCaseEvents must be used within a CaseEventsProvider");
  }
  return ctx;
};
