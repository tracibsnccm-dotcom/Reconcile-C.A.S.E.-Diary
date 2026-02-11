// src/pages/PublicClientIntake.tsx
import React, { useEffect, useMemo, useState } from "react";
import { createCaseAndIntake } from "../lib/clientIntakeApi";
import { createAutoNote } from "@/lib/autoNotes";

type Step = 1 | 2 | 3;

const GOLD = "#b09837";
const BLUE = "#0f2a6a";

const injuryOptions = [
  "Motor Vehicle Accident",
  "Slip and Fall",
  "Medical Malpractice",
  "Dog Bite / Animal Attack",
  "Assault / Intentional Tort",
  "Product Liability",
  "Premises Liability (Other)",
  "Pedestrian / Bicycle Accident",
  "Nursing Home Abuse / Neglect",
  "Sports / Recreational Injury",
  "Work Comp / Workplace Injury",
];

const incomeOptions = [
  "Under $25,000",
  "$25,000–$49,999",
  "$50,000–$74,999",
  "$75,000–$99,999",
  "$100,000–$149,999",
  "$150,000+",
  "Prefer not to say",
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 900, color: "#0f172a", marginBottom: 6 }}>{children}</div>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "11px 12px",
        borderRadius: 12,
        border: "1px solid #cbd5e1",
        outline: "none",
        fontWeight: 700,
        ...props.style,
      }}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        width: "100%",
        padding: "11px 12px",
        borderRadius: 12,
        border: "1px solid #cbd5e1",
        outline: "none",
        fontWeight: 800,
        background: "#fff",
        ...props.style,
      }}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%",
        padding: "11px 12px",
        borderRadius: 12,
        border: "1px solid #cbd5e1",
        outline: "none",
        fontWeight: 700,
        minHeight: 110,
        ...props.style,
      }}
    />
  );
}

export default function PublicClientIntake() {
  const [routeDebug, setRouteDebug] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setRouteDebug(`${window.location.pathname}${window.location.search || ""}`);
    }
  }, []);

  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [successCaseId, setSuccessCaseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [injuryCategory, setInjuryCategory] = useState("");
  const [injurySummary, setInjurySummary] = useState("");

  // Step 2 demographics + conditions
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [raceEthnicity, setRaceEthnicity] = useState("");
  const [language, setLanguage] = useState("");
  const [livingSituation, setLivingSituation] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [occupation, setOccupation] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  const [chronicConditions, setChronicConditions] = useState("");

  // Step 3 meds + mood + sdoh + work/income
  const [medsList, setMedsList] = useState("");
  const [allergies, setAllergies] = useState("");
  const [depression, setDepression] = useState(false);
  const [anxiety, setAnxiety] = useState(false);
  const [stress, setStress] = useState(false);

  const [foodInsecurity, setFoodInsecurity] = useState<"yes" | "no" | "unsure">("no");
  const [incomeRange, setIncomeRange] = useState("");
  const [workImpact, setWorkImpact] = useState("");

  const canNext1 = useMemo(
    () => fullName.trim() && email.trim() && injuryCategory.trim(),
    [fullName, email, injuryCategory]
  );
  const canNext2 = useMemo(() => age.trim() && gender.trim() && language.trim(), [age, gender, language]);
  const canSubmit = useMemo(() => medsList.trim().length > 0, [medsList]);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        fullName,
        email,
        phone,
        demographics: {
          age,
          gender,
          raceEthnicity,
          preferredLanguage: language,
          livingSituation,
          maritalStatus,
          occupation,
          emergencyContact,
        },
        injury: {
          category: injuryCategory,
          summary: injurySummary,
        },
        conditions: {
          chronicConditionsText: chronicConditions,
        },
        medications: {
          medicationsOTCAndVitaminsText: medsList,
          allergiesText: allergies,
          note: "Medication reconciliation occurs each client contact; intake captures baseline list.",
        },
        mood: {
          depression,
          anxiety,
          stress,
          note: "Mood assessed each contact; intake captures baseline self-report.",
        },
        sdoh: {
          foodInsecurity,
        },
        workImpact: {
          incomeRange,
          workImpactText: workImpact,
        },
      };

      const { caseId } = await createCaseAndIntake(payload);
      setSuccessCaseId(caseId);
      
      // Create auto-note for intake completion
      if (caseId) {
        try {
          await createAutoNote({
            caseId: caseId,
            noteType: 'intake',
            title: 'Intake Completed',
            content: 'Client completed intake assessment',
            triggerEvent: 'intake_completed',
            visibleToClient: true,
            visibleToRN: true,
            visibleToAttorney: true
          });
        } catch (err) {
          console.error("Failed to create auto-note for intake completion:", err);
        }
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (successCaseId) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 18 }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 18,
              padding: 18,
              boxShadow: "0 12px 32px rgba(15,23,42,0.06)",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 950, color: "#0f172a" }}>Intake received</div>
            <div style={{ marginTop: 8, color: "#475569", lineHeight: 1.55 }}>
              Thank you. Your information has been captured for care coordination review.
            </div>

            <div style={{ marginTop: 14, padding: 12, borderRadius: 14, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#0f172a" }}>Internal reference (case id)</div>
              <div style={{ fontFamily: "ui-monospace, Menlo, Monaco, Consolas, monospace", fontWeight: 900 }}>
                {successCaseId}
              </div>
            </div>

            <div style={{ marginTop: 14, color: "#475569", lineHeight: 1.55 }}>
              If you were instructed to provide additional records, please follow the instructions from your care team.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 18 }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 18,
            padding: 18,
            boxShadow: "0 12px 32px rgba(15,23,42,0.06)",
          }}
        >
          {/* DEBUG BANNER (makes it impossible to confuse screens) */}
          <div
            style={{
              marginBottom: 14,
              padding: "10px 12px",
              borderRadius: 14,
              border: `1px solid ${BLUE}`,
              background: "rgba(15,42,106,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontWeight: 950, color: "#0f172a" }}>
              PUBLIC CLIENT INTAKE (this is NOT RN)
            </div>
            <div
              style={{
                fontFamily: "ui-monospace, Menlo, Monaco, Consolas, monospace",
                fontSize: 12,
                fontWeight: 900,
                color: "#0f172a",
                opacity: 0.9,
              }}
            >
              Route: {routeDebug || "(loading…)"}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 950, color: "#0f172a" }}>Client Intake</div>
              <div style={{ marginTop: 6, color: "#475569", lineHeight: 1.55 }}>
                Please complete all sections. You were advised to set aside 60–90 minutes and gather medications/supplements before starting.
              </div>
            </div>

            <div
              style={{
                alignSelf: "center",
                padding: "8px 12px",
                borderRadius: 999,
                border: `1px solid ${GOLD}`,
                background: "rgba(176,152,55,0.10)",
                color: "#0f172a",
                fontWeight: 950,
                fontSize: 12,
              }}
            >
              Step {step} of 3
            </div>
          </div>

          {error && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 14,
                border: "1px solid #fecaca",
                background: "#fff1f2",
                color: "#991b1b",
                fontWeight: 900,
              }}
            >
              {error}
            </div>
          )}

          {/* Step content */}
          <div style={{ marginTop: 16 }}>
            {step === 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <FieldLabel>Full name *</FieldLabel>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
                </div>

                <div>
                  <FieldLabel>Email *</FieldLabel>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                </div>

                <div>
                  <FieldLabel>Phone</FieldLabel>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <FieldLabel>Injury category *</FieldLabel>
                  <Select value={injuryCategory} onChange={(e) => setInjuryCategory(e.target.value)}>
                    <option value="">Select…</option>
                    {injuryOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <FieldLabel>Brief description (optional)</FieldLabel>
                  <TextArea
                    value={injurySummary}
                    onChange={(e) => setInjurySummary(e.target.value)}
                    placeholder="What happened? What hurts? What treatment has been attempted?"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <FieldLabel>Age *</FieldLabel>
                  <Input value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" />
                </div>

                <div>
                  <FieldLabel>Gender *</FieldLabel>
                  <Input value={gender} onChange={(e) => setGender(e.target.value)} placeholder="Gender" />
                </div>

                <div>
                  <FieldLabel>Race / ethnicity</FieldLabel>
                  <Input value={raceEthnicity} onChange={(e) => setRaceEthnicity(e.target.value)} placeholder="Race / ethnicity" />
                </div>

                <div>
                  <FieldLabel>Preferred language *</FieldLabel>
                  <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="Preferred language" />
                </div>

                <div>
                  <FieldLabel>Living situation</FieldLabel>
                  <Input value={livingSituation} onChange={(e) => setLivingSituation(e.target.value)} placeholder="Living situation" />
                </div>

                <div>
                  <FieldLabel>Marital status</FieldLabel>
                  <Input value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} placeholder="Marital status" />
                </div>

                <div>
                  <FieldLabel>Occupation</FieldLabel>
                  <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Occupation" />
                </div>

                <div>
                  <FieldLabel>Emergency contact (name + phone)</FieldLabel>
                  <Input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="Emergency contact" />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <FieldLabel>Other conditions (HTN, asthma, diabetes, etc.)</FieldLabel>
                  <TextArea
                    value={chronicConditions}
                    onChange={(e) => setChronicConditions(e.target.value)}
                    placeholder="List chronic conditions you have (even if unrelated)."
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <FieldLabel>Medications, OTCs, vitamins/supplements (required) *</FieldLabel>
                  <TextArea
                    value={medsList}
                    onChange={(e) => setMedsList(e.target.value)}
                    placeholder="List all medications (prescribed), OTCs, vitamins/supplements. Include dose if known."
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <FieldLabel>Allergies (include reactions if known)</FieldLabel>
                  <TextArea
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="Allergies (meds/food/latex/etc.) + reactions if known."
                  />
                </div>

                <div style={{ gridColumn: "1 / -1", padding: 12, borderRadius: 14, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                  <div style={{ fontSize: 12, fontWeight: 950, color: "#0f172a" }}>Mood (select any that apply)</div>
                  <div style={{ marginTop: 10, display: "flex", gap: 14, flexWrap: "wrap" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, color: "#0f172a" }}>
                      <input type="checkbox" checked={depression} onChange={(e) => setDepression(e.target.checked)} />
                      Depression
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, color: "#0f172a" }}>
                      <input type="checkbox" checked={anxiety} onChange={(e) => setAnxiety(e.target.checked)} />
                      Anxiety
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, color: "#0f172a" }}>
                      <input type="checkbox" checked={stress} onChange={(e) => setStress(e.target.checked)} />
                      High stress
                    </label>
                  </div>
                </div>

                <div>
                  <FieldLabel>Food insecurity</FieldLabel>
                  <Select value={foodInsecurity} onChange={(e) => setFoodInsecurity(e.target.value as any)}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                    <option value="unsure">Unsure</option>
                  </Select>
                </div>

                <div>
                  <FieldLabel>Income range</FieldLabel>
                  <Select value={incomeRange} onChange={(e) => setIncomeRange(e.target.value)}>
                    <option value="">Select…</option>
                    {incomeOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <FieldLabel>Work impact / income loss details</FieldLabel>
                  <TextArea
                    value={workImpact}
                    onChange={(e) => setWorkImpact(e.target.value)}
                    placeholder="Describe work status, missed time, restrictions, income loss, burnout/work barriers if relevant."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer controls */}
          <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setStep((s) => (s === 1 ? 1 : ((s - 1) as Step)))}
              disabled={step === 1 || submitting}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontWeight: 950,
                cursor: step === 1 || submitting ? "not-allowed" : "pointer",
                opacity: step === 1 || submitting ? 0.6 : 1,
              }}
            >
              Back
            </button>

            {step !== 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s === 3 ? 3 : ((s + 1) as Step)))}
                disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2) || submitting}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${BLUE}`,
                  background: BLUE,
                  color: "#ffffff",
                  fontWeight: 950,
                  cursor:
                    (step === 1 && !canNext1) || (step === 2 && !canNext2) || submitting ? "not-allowed" : "pointer",
                  opacity:
                    (step === 1 && !canNext1) || (step === 2 && !canNext2) || submitting ? 0.6 : 1,
                }}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit || submitting}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${GOLD}`,
                  background: GOLD,
                  color: "#0b1220",
                  fontWeight: 950,
                  cursor: !canSubmit || submitting ? "not-allowed" : "pointer",
                  opacity: !canSubmit || submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "Submitting..." : "Submit intake"}
              </button>
            )}
          </div>

          <div style={{ marginTop: 14, color: "#64748b", fontSize: 12, lineHeight: 1.5 }}>
            This intake is assessment-based (not diagnostic). Medication reconciliation and mood are reviewed at each client contact.
          </div>
        </div>
      </div>
    </div>
  );
}
