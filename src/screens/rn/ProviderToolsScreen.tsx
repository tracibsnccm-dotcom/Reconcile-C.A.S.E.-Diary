import React, { useState, ChangeEvent } from "react";

type ProviderType = "PCP" | "Specialist" | "Therapy" | "Diagnostics" | "Surgery" | "Other";

interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  specialty: string;
  roleInCase: string;
  phone: string;
  location: string;
  status: "Active" | "Pending" | "Completed" | "On Hold";
  rnNotes: string;
  priority: "Routine" | "Important" | "Urgent";
}

const providerTypes: ProviderType[] = [
  "PCP",
  "Specialist",
  "Therapy",
  "Diagnostics",
  "Surgery",
  "Other",
];

const statusOptions: Provider["status"][] = [
  "Active",
  "Pending",
  "Completed",
  "On Hold",
];

const priorities: Provider["priority"][] = [
  "Routine",
  "Important",
  "Urgent",
];

const emptyProvider: Provider = {
  id: "",
  name: "",
  type: "PCP",
  specialty: "",
  roleInCase: "",
  phone: "",
  location: "",
  status: "Active",
  rnNotes: "",
  priority: "Routine",
};

const ProviderToolsScreen: React.FC = () => {
  const [current, setCurrent] = useState<Provider>({ ...emptyProvider });
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filterStatus, setFilterStatus] = useState<Provider["status"] | "All">(
    "All"
  );
  const [filterPriority, setFilterPriority] = useState<
    Provider["priority"] | "All"
  >("All");

  const handleChange =
    (field: keyof Provider) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setCurrent((prev) => ({
        ...prev,
        [field]: value as any,
      }));
    };

  const handleSaveProvider = () => {
    if (!current.name.trim()) {
      alert("Provider name is required.");
      return;
    }

    const newProvider: Provider = {
      ...current,
      id: current.id || `${current.name}-${Date.now()}`,
    };

    const existingIndex = providers.findIndex((p) => p.id === newProvider.id);

    let updated: Provider[];
    if (existingIndex >= 0) {
      updated = [...providers];
      updated[existingIndex] = newProvider;
    } else {
      updated = [...providers, newProvider];
    }

    updated.sort((a, b) => {
      const priorityOrder: Record<Provider["priority"], number> = {
        Urgent: 0,
        Important: 1,
        Routine: 2,
      };
      const pa = priorityOrder[a.priority];
      const pb = priorityOrder[b.priority];
      if (pa !== pb) return pa - pb;
      return a.name.localeCompare(b.name);
    });

    setProviders(updated);
    setCurrent({ ...emptyProvider });
  };

  const handleEdit = (provider: Provider) => {
    setCurrent(provider);
  };

  const filteredProviders = providers.filter((p) => {
    const statusMatch =
      filterStatus === "All" ? true : p.status === filterStatus;
    const priorityMatch =
      filterPriority === "All" ? true : p.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

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
            Provider Tools
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
            Keep track of key providers, their role in the case, and subsequent care plan
            priorities.
          </p>
        </div>

        <div
          style={{
            fontSize: "0.75rem",
            color: "#64748b",
            textAlign: "right",
          }}
        >
          Use this as a working RN view. Later we can sync to scheduling, alerts,
          and attorney dashboards.
        </div>
      </div>

      {/* Layout: left form, right list */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.7fr) minmax(0, 2.3fr)",
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
            Add / Edit Provider
          </div>

          {/* Name / type */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
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
                Provider Name
              </label>
              <input
                type="text"
                value={current.name}
                onChange={handleChange("name")}
                placeholder="Dr. Smith, ABC PT Clinic, etc."
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
                Type
              </label>
              <select
                value={current.type}
                onChange={handleChange("type")}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  padding: "0.3rem 0.5rem",
                  fontSize: "0.8rem",
                  background: "#ffffff",
                }}
              >
                {providerTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Specialty / role */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.3fr)",
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
                Specialty
              </label>
              <input
                type="text"
                value={current.specialty}
                onChange={handleChange("specialty")}
                placeholder="Pain, ortho, neuro, psych, PT/OT, etc."
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
                Role in Case
              </label>
              <input
                type="text"
                value={current.roleInCase}
                onChange={handleChange("roleInCase")}
                placeholder="Primary pain MD, IME, surgeon opinion, therapist, etc."
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

          {/* Phone / location */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr)",
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
                Phone
              </label>
              <input
                type="text"
                value={current.phone}
                onChange={handleChange("phone")}
                placeholder="Contact for scheduling / records"
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
                Location
              </label>
              <input
                type="text"
                value={current.location}
                onChange={handleChange("location")}
                placeholder="Clinic / hospital name, city/state"
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

          {/* Status / priority */}
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
                Status
              </label>
              <select
                value={current.status}
                onChange={handleChange("status")}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  padding: "0.3rem 0.5rem",
                  fontSize: "0.8rem",
                  background: "#ffffff",
                }}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  marginBottom: "0.2rem",
                }}
              >
                RN Priority
              </label>
              <select
                value={current.priority}
                onChange={handleChange("priority")}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  padding: "0.3rem 0.5rem",
                  fontSize: "0.8rem",
                  background: "#ffffff",
                }}
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* RN notes */}
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
              RN Notes / Next Step
            </label>
            <textarea
              value={current.rnNotes}
              onChange={handleChange("rnNotes")}
              rows={3}
              placeholder="e.g., needs updated records, overdue subsequent care plan, consider provider change, etc."
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

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
            }}
          >
            <button
              type="button"
              onClick={() => setCurrent({ ...emptyProvider })}
              style={{
                padding: "0.35rem 0.8rem",
                borderRadius: "999px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSaveProvider}
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
              Save Provider
            </button>
          </div>
        </div>

        {/* Provider list */}
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
              marginBottom: "0.4rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              Providers for This Case
            </div>

            {/* Filters */}
            <div
              style={{
                display: "flex",
                gap: "0.4rem",
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as Provider["status"] | "All")
                }
                style={{
                  borderRadius: "999px",
                  border: "1px solid #cbd5e1",
                  padding: "0.2rem 0.5rem",
                  fontSize: "0.75rem",
                  background: "#ffffff",
                }}
              >
                <option value="All">All Status</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                value={filterPriority}
                onChange={(e) =>
                  setFilterPriority(
                    e.target.value as Provider["priority"] | "All"
                  )
                }
                style={{
                  borderRadius: "999px",
                  border: "1px solid #cbd5e1",
                  padding: "0.2rem 0.5rem",
                  fontSize: "0.75rem",
                  background: "#ffffff",
                }}
              >
                <option value="All">All Priority</option>
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredProviders.length === 0 ? (
            <p
              style={{
                fontSize: "0.8rem",
                color: "#64748b",
              }}
            >
              No providers listed yet. Add at least one provider to start
              tracking subsequent care plan and roles.
            </p>
          ) : (
            <div
              style={{
                maxHeight: "380px",
                overflowY: "auto",
              }}
            >
              {filteredProviders.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: "0.55rem 0",
                    borderBottom: "1px solid #f1f5f9",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                  onClick={() => handleEdit(p)}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                      marginBottom: "0.1rem",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: "0.05rem",
                        }}
                      >
                        {p.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "#64748b",
                        }}
                      >
                        {p.type}
                        {p.specialty ? ` • ${p.specialty}` : ""}
                        {p.location ? ` • ${p.location}` : ""}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "0.35rem",
                        alignItems: "center",
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                      }}
                    >
                      <span
                        style={{
                          padding: "0.1rem 0.4rem",
                          borderRadius: "999px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.68rem",
                          background: "#f8fafc",
                        }}
                      >
                        {p.status}
                      </span>
                      <span
                        style={{
                          padding: "0.1rem 0.4rem",
                          borderRadius: "999px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.68rem",
                          background:
                            p.priority === "Urgent"
                              ? "#fee2e2"
                              : p.priority === "Important"
                              ? "#fef3c7"
                              : "#ecfeff",
                        }}
                      >
                        {p.priority}
                      </span>
                    </div>
                  </div>

                  {p.roleInCase && (
                    <div
                      style={{
                        marginBottom: "0.15rem",
                      }}
                    >
                      <strong>Role:</strong> {p.roleInCase}
                    </div>
                  )}

                  {p.rnNotes && (
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "#64748b",
                      }}
                    >
                      <strong>RN:</strong> {p.rnNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {providers.length > 0 && (
            <p
              style={{
                marginTop: "0.5rem",
                fontSize: "0.75rem",
                color: "#64748b",
              }}
            >
              Click a provider row to load it into the form for quick edits or to
              update status/priority.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderToolsScreen;
