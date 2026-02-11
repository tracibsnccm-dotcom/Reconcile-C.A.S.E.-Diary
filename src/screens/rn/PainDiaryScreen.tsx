import React, { useState, ChangeEvent } from "react";

interface PainEntry {
  id: string;
  date: string;
  time: string;
  intensity: number;
  location: string;
  trigger: string;
  relief: string;
  meds: string;
  notes: string;
}

const emptyEntry: PainEntry = {
  id: "",
  date: "",
  time: "",
  intensity: 0,
  location: "",
  trigger: "",
  relief: "",
  meds: "",
  notes: "",
};

const PainDiaryScreen: React.FC = () => {
  const [current, setCurrent] = useState<PainEntry>({ ...emptyEntry });
  const [entries, setEntries] = useState<PainEntry[]>([]);

  const handleChange =
    (field: keyof PainEntry) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        field === "intensity" ? Number(e.target.value || 0) : e.target.value;
      setCurrent((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleSaveEntry = () => {
    if (!current.date || !current.time) {
      alert("Please enter date and time for this pain entry.");
      return;
    }

    const newEntry: PainEntry = {
      ...current,
      id: `${current.date}-${current.time}-${Date.now()}`,
    };

    const updated = [newEntry, ...entries].sort((a, b) => {
      const aKey = `${a.date}T${a.time}`;
      const bKey = `${b.date}T${b.time}`;
      return bKey.localeCompare(aKey);
    });

    setEntries(updated);
    setCurrent({ ...emptyEntry });
  };

  const computeAverageIntensity = () => {
    if (!entries.length) return 0;
    const sum = entries.reduce((acc, e) => acc + e.intensity, 0);
    return Math.round((sum / entries.length) * 10) / 10;
  };

  const averageIntensity = computeAverageIntensity();

  const highestEntry = entries.reduce<PainEntry | null>((max, e) => {
    if (!max || e.intensity > max.intensity) return e;
    return max;
  }, null);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          marginBottom: "0.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "1.05rem",
              fontWeight: 600,
              marginBottom: "0.15rem",
            }}
          >
            Pain Diary
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
            Quick RN capture of pain episodes to support trends, medication
            review, and functional impact.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <div
            style={{
              textAlign: "right",
              padding: "0.45rem 0.7rem",
              borderRadius: "999px",
              border: "1px solid #cbd5e1",
              background: "#f8fafc",
              minWidth: "120px",
            }}
          >
            <div
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                color: "#64748b",
              }}
            >
              Avg Intensity
            </div>
            <div
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              {entries.length ? `${averageIntensity}/10` : "—"}
            </div>
          </div>

          <div
            style={{
              textAlign: "right",
              padding: "0.45rem 0.7rem",
              borderRadius: "999px",
              border: "1px solid #cbd5e1",
              background: "#f8fafc",
              minWidth: "160px",
            }}
          >
            <div
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                color: "#64748b",
              }}
            >
              Highest Episode
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 500,
              }}
            >
              {highestEntry
                ? `${highestEntry.intensity}/10 – ${highestEntry.date} ${highestEntry.time}`
                : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Layout: left form, right list */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.8fr) minmax(0, 2.2fr)",
          gap: "1rem",
        }}
      >
        {/* Form */}
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
              marginBottom: "0.5rem",
            }}
          >
            New Pain Episode
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  marginBottom: "0.2rem",
                }}
              >
                Date
              </label>
              <input
                type="date"
                value={current.date}
                onChange={handleChange("date")}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  padding: "0.3rem 0.5rem",
                  fontSize: "0.8rem",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  marginBottom: "0.2rem",
                }}
              >
                Time
              </label>
              <input
                type="time"
                value={current.time}
                onChange={handleChange("time")}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  padding: "0.3rem 0.5rem",
                  fontSize: "0.8rem",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  marginBottom: "0.2rem",
                }}
              >
                Intensity (0–10)
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={current.intensity}
                onChange={handleChange("intensity")}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  padding: "0.3rem 0.5rem",
                  fontSize: "0.8rem",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  marginBottom: "0.2rem",
                }}
              >
                Pain Location
              </label>
              <input
                type="text"
                value={current.location}
                onChange={handleChange("location")}
                placeholder="e.g., low back, right knee, neck"
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  padding: "0.3rem 0.5rem",
                  fontSize: "0.8rem",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  marginBottom: "0.2rem",
                }}
              >
                Likely Trigger
              </label>
              <input
                type="text"
                value={current.trigger}
                onChange={handleChange("trigger")}
                placeholder="Activity, positioning, stress, missed meds, etc."
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  padding: "0.3rem 0.5rem",
                  fontSize: "0.8rem",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  marginBottom: "0.2rem",
                }}
              >
                What Helped / Relief
              </label>
              <input
                type="text"
                value={current.relief}
                onChange={handleChange("relief")}
                placeholder="Rest, ice/heat, stretching, meds, repositioning, etc."
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  padding: "0.3rem 0.5rem",
                  fontSize: "0.8rem",
                }}
              />
            </div>
          </div>

          <div
            style={{
              marginBottom: "0.5rem",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                marginBottom: "0.2rem",
              }}
            >
              Medications Taken
            </label>
            <input
              type="text"
              value={current.meds}
              onChange={handleChange("meds")}
              placeholder="Name, dose, timing (RN may later reconcile with MAR)."
              style={{
                width: "100%",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                padding: "0.3rem 0.5rem",
                fontSize: "0.8rem",
              }}
            />
          </div>

          <div
            style={{
              marginBottom: "0.6rem",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                marginBottom: "0.2rem",
              }}
            >
              RN Notes (function, red flags, patterns)
            </label>
            <textarea
              value={current.notes}
              onChange={handleChange("notes")}
              rows={3}
              placeholder="Brief clinical notes on function, activity tolerance, or RN concerns."
              style={{
                width: "100%",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                padding: "0.4rem",
                fontSize: "0.8rem",
                resize: "vertical",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={handleSaveEntry}
              style={{
                padding: "0.4rem 0.9rem",
                borderRadius: "999px",
                border: "none",
                background: "#0f2a6a",
                color: "#ffffff",
                fontSize: "0.8rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Add Pain Entry
            </button>
          </div>
        </div>

        {/* Entries list */}
        <div
          style={{
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            padding: "0.85rem",
            minHeight: "260px",
          }}
        >
          <div
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              marginBottom: "0.4rem",
            }}
          >
            Recent Pain Episodes
          </div>

          {entries.length === 0 ? (
            <p
              style={{
                fontSize: "0.8rem",
                color: "#64748b",
              }}
            >
              No entries recorded yet. Add at least one episode to see trends.
            </p>
          ) : (
            <div
              style={{
                maxHeight: "360px",
                overflowY: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.75rem",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "0.35rem",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      When
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "0.35rem",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      Intensity
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "0.35rem",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      Location
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "0.35rem",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      Trigger / Relief
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td
                        style={{
                          padding: "0.35rem",
                          borderBottom: "1px solid #f1f5f9",
                          verticalAlign: "top",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {e.date} {e.time}
                      </td>
                      <td
                        style={{
                          padding: "0.35rem",
                          borderBottom: "1px solid #f1f5f9",
                          verticalAlign: "top",
                        }}
                      >
                        {e.intensity}/10
                      </td>
                      <td
                        style={{
                          padding: "0.35rem",
                          borderBottom: "1px solid #f1f5f9",
                          verticalAlign: "top",
                        }}
                      >
                        {e.location || "—"}
                      </td>
                      <td
                        style={{
                          padding: "0.35rem",
                          borderBottom: "1px solid #f1f5f9",
                          verticalAlign: "top",
                        }}
                      >
                        <div>
                          <strong>Trigger:</strong> {e.trigger || "—"}
                        </div>
                        <div>
                          <strong>Relief:</strong> {e.relief || "—"}
                        </div>
                        {e.meds && (
                          <div>
                            <strong>Meds:</strong> {e.meds}
                          </div>
                        )}
                        {e.notes && (
                          <div>
                            <strong>RN:</strong> {e.notes}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {entries.length > 0 && (
            <p
              style={{
                marginTop: "0.5rem",
                fontSize: "0.75rem",
                color: "#64748b",
              }}
            >
              Use this diary to support trend review with providers and to align
              the clinical story with reported activity limits.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PainDiaryScreen;
