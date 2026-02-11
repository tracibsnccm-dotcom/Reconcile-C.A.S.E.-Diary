import React, { useState, useEffect } from "react";
import {
  TIMELINE_TEMPLATES,
  TimelineTemplate,
} from "../../constants/timelineTemplates";

const STORAGE_KEY = "rcms_timeline_entries";

interface TimelineEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM or ""
  category: string;
  title: string;
  details: string;
  highlight: boolean;
  templateId?: string; // optional – for template-based entries
}

function loadTimelineEntries(): TimelineEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TimelineEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    console.error("Failed to load timeline entries", e);
    return [];
  }
}

function saveTimelineEntries(entries: TimelineEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error("Failed to save timeline entries", e);
  }
}

// Parse details back into bullets + RN Note for editing
function parseDetailsForTemplate(
  details: string,
  template: TimelineTemplate
): { bulletValues: string[]; rnNote: string } {
  const lines = details
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const bulletMap: Record<string, string> = {};
  let rnNote = "";

  lines.forEach((line) => {
    if (/^rn note:/i.test(line)) {
      rnNote = line.replace(/^rn note:\s*/i, "");
      return;
    }

    let processed = line;
    if (processed.startsWith("•")) {
      processed = processed.replace(/^•\s*/, "");
    }

    const idx = processed.indexOf(":");
    if (idx === -1) return;

    const label = processed.slice(0, idx).trim();
    const value = processed.slice(idx + 1).trim();

    bulletMap[label] = value;
  });

  const bulletValues = template.bulletFields.map((label) => {
    return bulletMap[label] ?? "";
  });

  return { bulletValues, rnNote };
}

const TimelineScreen: React.FC = () => {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>(""); // empty = free-form
  const [category, setCategory] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [bulletValues, setBulletValues] = useState<string[]>([]);
  const [rnNote, setRnNote] = useState<string>("");
  const [freeDetails, setFreeDetails] = useState<string>("");
  const [highlight, setHighlight] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadTimelineEntries();
    setEntries(loaded);
  }, []);

  const selectedTemplate: TimelineTemplate | undefined = TIMELINE_TEMPLATES.find(
    (t) => t.id === templateId
  );

  // When template changes, reset bullets and RN note, and default category/title
  const handleTemplateChange = (newId: string) => {
    setTemplateId(newId);
    setRnNote("");
    setFreeDetails("");

    if (!newId) {
      // Free-form entry
      setBulletValues([]);
      setCategory("");
      if (!title) setTitle("Timeline Event");
      return;
    }

    const tmpl = TIMELINE_TEMPLATES.find((t) => t.id === newId);
    if (!tmpl) {
      setBulletValues([]);
      return;
    }

    setBulletValues(new Array(tmpl.bulletFields.length).fill(""));
    setCategory(tmpl.category || "");
    setTitle(tmpl.label);
  };

  const handleBulletChange = (index: number, value: string) => {
    setBulletValues((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const resetForm = () => {
    setDate("");
    setTime("");
    setTemplateId("");
    setCategory("");
    setTitle("");
    setBulletValues([]);
    setRnNote("");
    setFreeDetails("");
    setHighlight(false);
    setEditingId(null);
  };

  const handleAddOrUpdateEntry = () => {
    if (!date) {
      alert("Date is required for a timeline entry.");
      return;
    }

    // Build final details string
    let detailsText = "";

    if (selectedTemplate) {
      const lines: string[] = [];

      selectedTemplate.bulletFields.forEach((label, idx) => {
        const value = bulletValues[idx]?.trim();
        if (value) {
          lines.push(`• ${label}: ${value}`);
        }
      });

      if (selectedTemplate.includeRnNote && rnNote.trim()) {
        lines.push(`RN Note: ${rnNote.trim()}`);
      }

      if (lines.length === 0 && !freeDetails.trim()) {
        alert("Please fill at least one bullet or RN Note for this template.");
        return;
      }

      detailsText = lines.join("\n");
    } else {
      // Free-form mode
      if (!freeDetails.trim()) {
        alert("Please enter details for this timeline entry.");
        return;
      }
      detailsText = freeDetails.trim();
    }

    if (editingId) {
      // Update existing entry
      const updated = entries
        .map((e) => {
          if (e.id !== editingId) return e;
          return {
            ...e,
            date,
            time,
            category: category || (selectedTemplate?.category ?? "Other"),
            title: title.trim() || (selectedTemplate?.label ?? "Timeline Event"),
            details: detailsText,
            highlight,
            templateId: selectedTemplate ? selectedTemplate.id : undefined,
          };
        })
        .sort((a, b) => {
          const dateCompare = b.date.localeCompare(a.date);
          if (dateCompare !== 0) return dateCompare;
          return (b.time || "").localeCompare(a.time || "");
        });

      setEntries(updated);
      saveTimelineEntries(updated);
      resetForm();
      return;
    }

    // New entry
    const newEntry: TimelineEntry = {
      id: `${Date.now()}`,
      date,
      time,
      category: category || (selectedTemplate?.category ?? "Other"),
      title: title.trim() || (selectedTemplate?.label ?? "Timeline Event"),
      details: detailsText,
      highlight,
      templateId: selectedTemplate ? selectedTemplate.id : undefined,
    };

    const updated = [...entries, newEntry].sort((a, b) => {
      // Sort by date desc, then time desc
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return (b.time || "").localeCompare(a.time || "");
    });

    setEntries(updated);
    saveTimelineEntries(updated);

    // Reset form (keep date could be handy, but we’ll clear it for safety)
    resetForm();
  };

  const handleDeleteEntry = (id: string) => {
    if (!window.confirm("Delete this timeline entry? This cannot be undone.")) {
      return;
    }
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    saveTimelineEntries(updated);

    if (editingId === id) {
      resetForm();
    }
  };

  const handleEditEntry = (entry: TimelineEntry) => {
    setEditingId(entry.id);
    setDate(entry.date);
    setTime(entry.time || "");
    setCategory(entry.category || "");
    setTitle(entry.title || "");
    setHighlight(entry.highlight || false);

    if (entry.templateId) {
      const tmpl = TIMELINE_TEMPLATES.find((t) => t.id === entry.templateId);
      if (tmpl) {
        setTemplateId(tmpl.id);
        const { bulletValues, rnNote } = parseDetailsForTemplate(
          entry.details || "",
          tmpl
        );
        setBulletValues(bulletValues);
        setRnNote(rnNote);
        setFreeDetails("");
        return;
      }
    }

    // If no template or unknown template – treat as free-form
    setTemplateId("");
    setBulletValues([]);
    setRnNote("");
    setFreeDetails(entry.details || "");
  };

  const groupedByDate = entries.reduce<Record<string, TimelineEntry[]>>(
    (acc, entry) => {
      if (!acc[entry.date]) acc[entry.date] = [];
      acc[entry.date].push(entry);
      return acc;
    },
    {}
  );

  const sortedDates = Object.keys(groupedByDate).sort((a, b) =>
    b.localeCompare(a)
  );

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1
        style={{
          fontSize: "1.2rem",
          fontWeight: 600,
          marginBottom: "0.75rem",
        }}
      >
        Timeline & Clinical Notes (RN)
      </h1>

      {/* Entry form */}
      <div
        style={{
          marginBottom: "1rem",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          background: "#ffffff",
          padding: "0.85rem",
        }}
      >
        <div
          style={{
            fontSize: "0.82rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
          }}
        >
          {editingId ? "Edit Timeline Entry" : "Add Timeline Entry"}
        </div>

        {/* Row 1: Date, Time, Highlight */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginBottom: "0.6rem",
          }}
        >
          <div style={{ minWidth: "160px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                marginBottom: "0.15rem",
              }}
            >
              Date<span style={{ color: "#dc2626" }}> *</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: "100%",
                padding: "0.35rem 0.45rem",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.8rem",
              }}
            />
          </div>

          <div style={{ minWidth: "120px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                marginBottom: "0.15rem",
              }}
            >
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              style={{
                width: "100%",
                padding: "0.35rem 0.45rem",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.8rem",
              }}
            />
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.78rem",
              marginTop: "1.25rem",
            }}
          >
            <input
              type="checkbox"
              checked={highlight}
              onChange={(e) => setHighlight(e.target.checked)}
            />
            Mark as <strong>Attorney Highlight</strong>
          </label>
        </div>

        {/* Row 2: Template selector */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginBottom: "0.6rem",
          }}
        >
          <div style={{ minWidth: "220px", flex: "1 1 220px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                marginBottom: "0.15rem",
              }}
            >
              Template
            </label>
            <select
              value={templateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              style={{
                width: "100%",
                padding: "0.35rem 0.45rem",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.8rem",
              }}
            >
              <option value="">Free-form entry</option>
              <optgroup label="Clinical Events">
                {TIMELINE_TEMPLATES.filter(
                  (t) => t.category === "Clinical Events"
                ).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Function & Work">
                {TIMELINE_TEMPLATES.filter(
                  (t) => t.category === "Function & Work"
                ).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="SDOH & Adherence">
                {TIMELINE_TEMPLATES.filter(
                  (t) => t.category === "SDOH & Adherence"
                ).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Case & Legal">
                {TIMELINE_TEMPLATES.filter(
                  (t) => t.category === "Case & Legal"
                ).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other">
                {TIMELINE_TEMPLATES.filter(
                  (t) => t.category === "Other"
                ).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div style={{ minWidth: "180px", flex: "1 1 180px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                marginBottom: "0.15rem",
              }}
            >
              Category (editable)
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={selectedTemplate?.category || "e.g., Visit, Crisis"}
              style={{
                width: "100%",
                padding: "0.35rem 0.45rem",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.8rem",
              }}
            />
          </div>
        </div>

        {/* Title (RN editable) */}
        <div style={{ marginBottom: "0.6rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.75rem",
              marginBottom: "0.15rem",
            }}
          >
            Title (attorney-facing)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              selectedTemplate?.label || "Short event title (e.g., ED visit)"
            }
            style={{
              width: "100%",
              padding: "0.35rem 0.45rem",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "0.8rem",
            }}
          />
        </div>

        {/* Template-driven bullets OR free-form details */}
        {selectedTemplate ? (
          <div style={{ marginBottom: "0.6rem" }}>
            <div
              style={{
                fontSize: "0.76rem",
                color: "#64748b",
                marginBottom: "0.35rem",
              }}
            >
              {selectedTemplate.description}
            </div>
            {selectedTemplate.bulletFields.map((label, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: "0.45rem",
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    marginBottom: "0.15rem",
                  }}
                >
                  {label}
                </label>
                <textarea
                  value={bulletValues[idx] || ""}
                  onChange={(e) => handleBulletChange(idx, e.target.value)}
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "0.35rem 0.45rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.8rem",
                    resize: "vertical",
                  }}
                />
              </div>
            ))}

            {selectedTemplate.includeRnNote && (
              <div style={{ marginBottom: "0.45rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    marginBottom: "0.15rem",
                  }}
                >
                  RN Note (free text – optional)
                </label>
                <textarea
                  value={rnNote}
                  onChange={(e) => setRnNote(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "0.35rem 0.45rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.8rem",
                    resize: "vertical",
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: "0.6rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                marginBottom: "0.15rem",
              }}
            >
              Details
            </label>
            <textarea
              value={freeDetails}
              onChange={(e) => setFreeDetails(e.target.value)}
              rows={4}
              placeholder="Enter clinical facts, functional impact, and plan."
              style={{
                width: "100%",
                padding: "0.35rem 0.45rem",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.8rem",
                resize: "vertical",
              }}
            />
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={handleAddOrUpdateEntry}
            style={{
              padding: "0.4rem 0.9rem",
              borderRadius: "999px",
              border: "none",
              background: "#0f2a6a",
              color: "#ffffff",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            {editingId ? "Update Timeline Entry" : "Add Timeline Entry"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={{
                padding: "0.35rem 0.8rem",
                borderRadius: "999px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* Existing entries list */}
      <div
        style={{
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          background: "#ffffff",
          padding: "0.85rem",
        }}
      >
        <div
          style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            marginBottom: "0.35rem",
          }}
        >
          RN Timeline (saved entries)
        </div>
        {entries.length === 0 ? (
          <p
            style={{
              fontSize: "0.78rem",
              color: "#64748b",
            }}
          >
            No entries have been saved yet. Use the form above to add the first
            timeline entry.
          </p>
        ) : (
          sortedDates.map((d) => (
            <div
              key={d}
              style={{
                marginBottom: "0.6rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  marginBottom: "0.25rem",
                  color: "#0f172a",
                }}
              >
                {new Date(d).toLocaleDateString()}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {groupedByDate[d].map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      borderRadius: 6,
                      border: entry.highlight
                        ? "1px solid #fed7aa"
                        : "1px solid #e2e8f0",
                      padding: "0.45rem 0.55rem",
                      background: entry.highlight ? "#fffbeb" : "#f9fafb",
                      fontSize: "0.78rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                        marginBottom: "0.15rem",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontWeight: 600,
                            marginRight: "0.35rem",
                          }}
                        >
                          {entry.title}
                        </span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "0.05rem 0.4rem",
                            borderRadius: 999,
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            marginRight: "0.35rem",
                          }}
                        >
                          {entry.category}
                        </span>
                        {entry.time && (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "#64748b",
                            }}
                          >
                            {entry.time}
                          </span>
                        )}
                        {entry.highlight && (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              marginLeft: "0.35rem",
                              color: "#b45309",
                              fontWeight: 600,
                            }}
                          >
                            ★ Attorney Highlight
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.15rem",
                          alignItems: "flex-end",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleEditEntry(entry)}
                          style={{
                            fontSize: "0.7rem",
                            border: "none",
                            background: "transparent",
                            color: "#0f172a",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(entry.id)}
                          style={{
                            fontSize: "0.7rem",
                            border: "none",
                            background: "transparent",
                            color: "#dc2626",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {entry.details && (
                      <pre
                        style={{
                          fontSize: "0.75rem",
                          color: "#0f172a",
                          whiteSpace: "pre-wrap",
                          margin: 0,
                        }}
                      >
                        {entry.details}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TimelineScreen;
