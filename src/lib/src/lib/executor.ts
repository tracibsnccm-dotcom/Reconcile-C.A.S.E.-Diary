// src/lib/executor.ts

import { AppState, Effect, Flag, Task } from "./models";

let idCounter = 1;
const newId = (prefix: string) => `${prefix}_${idCounter++}`;

export function applyEffects(
  state: AppState,
  effects: Effect[]
): AppState {
  let { client, flags, tasks } = state;

  for (const effect of effects) {
    switch (effect.type) {
      case "updateClient": {
        client = {
          ...client,
          ...(effect.payload || {}),
        };
        break;
      }

      case "createFlag": {
        const now = new Date().toISOString();
        const payload = effect.payload || {};
        const flag: Flag = {
          id: newId("flag"),
          clientId: client.id,
          type: payload.type || "System",
          label: payload.label || "Untitled Flag",
          severity: payload.severity || "Low",
          status: "Open",
          createdAt: now,
        };
        flags = [...flags, flag];
        break;
      }

      case "createTask": {
        const payload = effect.payload || {};
        const task: Task = {
          task_id: newId("task"),
          client_id: client.id,
          type: payload.type || "General",
          title: payload.title || "Untitled Task",
          assigned_to: payload.assigned_to || "RN_CM",
          due_date: payload.due_date,
          status: "Open",
          created_at: new Date().toISOString(),
        };
        tasks = [...tasks, task];
        break;
      }

      case "validationError": {
        // In UI, you catch this and show message
        throw new Error(effect.payload?.message || "Validation error");
      }

      default:
        // ignore unknown effect
        break;
    }
  }

  return { client, flags, tasks };
}
