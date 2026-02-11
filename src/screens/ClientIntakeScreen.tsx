// src/screens/ClientIntakeScreen.tsx
// UPDATED: Added demographic fields (DOB, Gender Identity, Sex at Birth, Dependents, Student Status)
// These fields transfer to Care Plan Overlays for auto-suggestions

import React, { useMemo, useState } from "react";
import ClientEndScreen from "./ClientEndScreen";

type DemoStep =
  | "About You"
  | "Injury Snapshot"
  | "Care Disruptions"
  | "Client Voice"
  | "Preview"
  | "Complete";

const STEPS: DemoStep[] = [
  "About You",
  "Injury Snapshot",
  "Care Disruptions",
  "Client Voice",
  "Preview",
  "Complete",
];

type IncomeRange =
  | ""
  | "Prefer not to say"
  | "Under $25,000"
  | "$25,000–$49,999"
  | "$50,000–$74,999"
  | "$75,000–$99,999"
  | "$100,000–$149,999"
  | "$150,000+";

type InjuryType =
  | ""
  | "Back/Neck Injury"
  | "Shoulder Injury"
  | "Knee/Leg Injury"
  | "Head Injury / Concussion"
  | "Fracture"
  | "Soft Tissue Injury"
  | "Other";

type ChronicCondition =
  | ""
  | "None"
  | "Diabetes"
  | "Hypertension"
  | "Asthma/COPD"
  | "Heart Disease"
  | "Depression/Anxiety"
  | "Chronic Pain"
  | "Other";

type GenderIdentity =
  | ""
  | "Female"
  | "Male"
  | "Transgender Female (MTF)"
  | "Transgender Male (FTM)"
  | "Non-binary"
  | "Other"
  | "Prefer not to say";

type SexAtBirth =
  | ""
  | "Female"
  | "Male"
  | "Prefer not to say";

type FormState = {
  // Basic identifiers
  firstName: string;
  lastName: string;

  // NEW: Demographics for overlay auto-suggestions
  dateOfBirth: string;
  genderIdentity: GenderIdentity;
  sexAtBirth: SexAtBirth;
  hasDependents: "Yes" | "No" | "";
  isStudent: "Yes" | "No" | "";

  // Injury + conditions
  injuryType: InjuryType;
  injuryOther: string;
  chronicCondition: ChronicCondition;
  chronicOther: string;

  // Snapshot / basic care needs
  painNow: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  missedWork: "Yes" | "No" | "";
  primaryConcern: string;

  // Care disruptions (SDOH-like signals)
  transportationIssue: "Yes" | "No" | "";
  housingConcern: "Yes" | "No" | "";
  foodConcern: "Yes" | "No" | "";
  childcareIssue: "Yes" | "No" | "";
  incomeRange: IncomeRange;

  // Client Voice
  clientVoiceWhatHappened: string;
  clientVoiceHardestPart: string;
  clientVoiceNeedMost: string;

  // Demo acknowledgements
  demoAcknowledged: boolean;
};

const DEFAULT_FORM: FormState = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  genderIdentity: "",
  sexAtBirth: "",
  hasDependents: "",
  isStudent: "",
  injuryType: "",
  injuryOther: "",
  chronicCondition: "",
  chronicOther: "",
  painNow: 6,
  missedWork: "",
  primaryConcern: "",
  transportationIssue: "",
  housingConcern: "",
  foodConcern: "",
  childcareIssue: "",
  incomeRange: "",
  clientVoiceWhatHappened: "",
  clientVoiceHardestPart: "",
  clientVoiceNeedMost: "",
  demoAcknowledged: false,
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  padding: "1rem",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.78rem",
  fontWeight: 600,
  marginBottom: "0.25rem",
};

const helpStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "#64748b",
  marginBottom: "0.6rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "0.6rem",
  fontSize: "0.85rem",
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  background: "#ffffff",
};

const pillBtn = (active: boolean): React.CSSProperties => ({
  padding: "0.35rem 0.75rem",
  borderRadius: "999px",
  border: active ? "1px solid #0f2a6a" : "1px solid #cbd5e1",
  background: active ? "#0f2a6a" : "#ffffff",
  color: active ? "#ffffff" : "#0f172a",
  fontSize: "0.78rem",
  cursor: "pointer",
});

const smallBtn: React.CSSProperties = {
  padding: "0.35rem 0.9rem",
  borderRadius: "999px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: "0.78rem",
  cursor: "pointer",
};

const primaryBtn: React.CSSProperties = {
  padding: "0.5rem 1.25rem",
  borderRadius: "999px",
  border: "none",
  background: "#0f2a6a",
  color: "#ffffff",
  fontSize: "0.85rem",
  cursor: "pointer",
};

const ClientIntakeScreen: React.FC = () => {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [stepIndex, setStepIndex] = useState(0);

  const step = STEPS[stepIndex];
  const isPreview = step === "Preview";
  const isComplete = step === "Complete";

  const update = (partial: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const goTo = (idx: number) => {
    if (idx >= 0 && idx < STEPS.length) setStepIndex(idx);
  };

  const stepLabel = (s: DemoStep) => {
    if (s === "About You") return "1 · About You";
    if (s === "Injury Snapshot") return "2 · Snapshot";
    if (s === "Care Disruptions") return "3 · Disruptions";
    if (s === "Client Voice") return "4 · Voice";
    return s;
  };

  // Calculate age from date of birth
  const calculateAge = (dob: string): number | null => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = useMemo(() => calculateAge(form.dateOfBirth), [form.dateOfBirth]);

  // Check if transgender identity
  const isTransgender = form.genderIdentity === "Transgender Female (MTF)" || 
                        form.genderIdentity === "Transgender Male (FTM)" ||
                        form.genderIdentity === "Non-binary";

  if (isComplete) {
    return (
      <div style={{ padding: "1.5rem", maxWidth: 980, margin: "0 auto" }}>
        <ClientEndScreen
          form={{
            firstName: form.firstName,
            lastName: form.lastName,
            dateOfBirth: form.dateOfBirth,
            genderIdentity: form.genderIdentity,
            sexAtBirth: form.sexAtBirth,
            hasDependents: form.hasDependents,
            isStudent: form.isStudent,
            injuryType: form.injuryType,
            injuryOther: form.injuryOther,
            chronicCondition: form.chronicCondition,
            chronicOther: form.chronicOther,
            painNow: form.painNow,
            missedWork: form.missedWork,
            primaryConcern: form.primaryConcern,
            transportationIssue: form.transportationIssue,
            housingConcern: form.housingConcern,
            foodConcern: form.foodConcern,
            childcareIssue: form.childcareIssue,
            incomeRange: form.incomeRange,
            clientVoiceWhatHappened: form.clientVoiceWhatHappened,
            clientVoiceHardestPart: form.clientVoiceHardestPart,
            clientVoiceNeedMost: form.clientVoiceNeedMost,
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: 980, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "0.9rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.2rem" }}>
          Client Intake
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.35 }}>
          Please complete this intake form. Your responses help your RN Care Manager develop 
          a personalized care plan tailored to your needs and circumstances.
        </p>
        <div style={{ marginTop: "0.45rem", fontSize: "0.78rem", color: "#64748b" }}>
          <strong>Estimated time:</strong> 15–20 minutes
        </div>
      </div>

      {/* Progress / Steps */}
      <div
        style={{
          ...cardStyle,
          padding: "0.75rem",
          marginBottom: "0.9rem",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {STEPS.slice(0, 5).map((s, idx) => {
            const active = idx === stepIndex;
            const done = idx < stepIndex;
            return (
              <button
                key={s}
                type="button"
                onClick={() => goTo(idx)}
                style={{
                  ...pillBtn(active),
                  opacity: active ? 1 : done ? 0.95 : 0.65,
                }}
                aria-current={active ? "step" : undefined}
              >
                {stepLabel(s)}
              </button>
            );
          })}
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>→</span>
          <button
            type="button"
            style={{ ...pillBtn(false), opacity: 0.6, cursor: "not-allowed" }}
            disabled
            title="Complete becomes available after preview"
          >
            Complete
          </button>
        </div>
      </div>

      {/* Main step content */}
      <div style={cardStyle}>
        
        {/* ========== STEP 1: ABOUT YOU (NEW) ========== */}
        {step === "About You" && (
          <div style={{ display: "grid", gap: "0.85rem" }}>
            <div style={{ 
              padding: "0.75rem", 
              background: "#f0f9ff", 
              borderRadius: "8px",
              border: "1px solid #bae6fd",
              marginBottom: "0.5rem"
            }}>
              <div style={{ fontSize: "0.8rem", color: "#0369a1" }}>
                <strong>Why we ask:</strong> This information helps your RN Care Manager understand 
                your unique needs and circumstances. It ensures your care plan considers all relevant 
                factors for your recovery.
              </div>
            </div>

            <div>
              <div style={labelStyle}>Your Name</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                <input
                  style={inputStyle}
                  value={form.firstName}
                  onChange={(e) => update({ firstName: e.target.value })}
                  placeholder="First name"
                />
                <input
                  style={inputStyle}
                  value={form.lastName}
                  onChange={(e) => update({ lastName: e.target.value })}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <div style={labelStyle}>Date of Birth</div>
              <div style={helpStyle}>
                Your age helps us identify relevant health screenings and care considerations.
              </div>
              <input
                type="date"
                style={{ ...inputStyle, maxWidth: "200px" }}
                value={form.dateOfBirth}
                onChange={(e) => update({ dateOfBirth: e.target.value })}
              />
              {age !== null && (
                <div style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "#16a34a" }}>
                  Age: {age} years old
                </div>
              )}
            </div>

            <div>
              <div style={labelStyle}>Gender Identity</div>
              <div style={helpStyle}>
                How you identify helps us provide inclusive, personalized care.
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {[
                  "Female",
                  "Male",
                  "Transgender Female (MTF)",
                  "Transgender Male (FTM)",
                  "Non-binary",
                  "Other",
                  "Prefer not to say",
                ].map((v) => (
                  <button
                    key={v}
                    type="button"
                    style={pillBtn(form.genderIdentity === v)}
                    onClick={() => update({ genderIdentity: v as GenderIdentity })}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Sex Assigned at Birth</div>
              <div style={helpStyle}>
                This helps identify relevant health screenings (e.g., cervical, prostate).
                Your answer is kept confidential.
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {["Female", "Male", "Prefer not to say"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    style={pillBtn(form.sexAtBirth === v)}
                    onClick={() => update({ sexAtBirth: v as SexAtBirth })}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Do you have dependents?</div>
              <div style={helpStyle}>
                Dependents include children, elderly parents, or anyone who relies on you for care.
                This helps us understand your caregiving responsibilities.
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {["Yes", "No"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    style={pillBtn(form.hasDependents === v)}
                    onClick={() => update({ hasDependents: v as "Yes" | "No" })}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Are you currently a student?</div>
              <div style={helpStyle}>
                This includes college, trade school, or other educational programs.
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {["Yes", "No"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    style={pillBtn(form.isStudent === v)}
                    onClick={() => update({ isStudent: v as "Yes" | "No" })}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Show what overlays would apply based on their answers */}
            {(age !== null || form.genderIdentity || form.hasDependents === "Yes" || form.isStudent === "Yes") && (
              <div style={{ 
                marginTop: "0.5rem",
                padding: "0.75rem", 
                background: "#f0fdf4", 
                borderRadius: "8px",
                border: "1px solid #86efac",
              }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#166534", marginBottom: "0.4rem" }}>
                  Based on your answers, your care plan may include considerations for:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {age !== null && age >= 60 && (
                    <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", background: "#dcfce7", borderRadius: "4px", color: "#166534" }}>
                      60+ Geriatric Care
                    </span>
                  )}
                  {age !== null && age >= 18 && age <= 24 && form.isStudent === "Yes" && (
                    <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", background: "#dcfce7", borderRadius: "4px", color: "#166534" }}>
                      Student Support
                    </span>
                  )}
                  {age !== null && age >= 13 && age <= 17 && (
                    <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", background: "#dcfce7", borderRadius: "4px", color: "#166534" }}>
                      Adolescent Care
                    </span>
                  )}
                  {age !== null && age >= 3 && age <= 12 && (
                    <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", background: "#dcfce7", borderRadius: "4px", color: "#166534" }}>
                      Pediatric Care
                    </span>
                  )}
                  {age !== null && age < 3 && (
                    <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", background: "#dcfce7", borderRadius: "4px", color: "#166534" }}>
                      Infant/Toddler Care
                    </span>
                  )}
                  {isTransgender && (
                    <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", background: "#dcfce7", borderRadius: "4px", color: "#166534" }}>
                      Gender-Affirming Care
                    </span>
                  )}
                  {(form.genderIdentity === "Female" || form.genderIdentity === "Transgender Female (MTF)") && (
                    <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", background: "#dcfce7", borderRadius: "4px", color: "#166534" }}>
                      Female Health Considerations
                    </span>
                  )}
                  {(form.genderIdentity === "Male" || form.genderIdentity === "Transgender Male (FTM)") && (
                    <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", background: "#dcfce7", borderRadius: "4px", color: "#166534" }}>
                      Male Health Considerations
                    </span>
                  )}
                  {form.hasDependents === "Yes" && (
                    <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", background: "#dcfce7", borderRadius: "4px", color: "#166534" }}>
                      Caregiver Support
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== STEP 2: INJURY SNAPSHOT ========== */}
        {step === "Injury Snapshot" && (
          <div style={{ display: "grid", gap: "0.85rem" }}>
            <div>
              <div style={labelStyle}>Most common injury type</div>
              <div style={helpStyle}>
                Choose the closest match. (This maps into structured RN review and care planning.)
              </div>
              <select
                style={selectStyle}
                value={form.injuryType}
                onChange={(e) => update({ injuryType: e.target.value as InjuryType })}
              >
                <option value="">Select…</option>
                <option value="Back/Neck Injury">Back/Neck Injury</option>
                <option value="Shoulder Injury">Shoulder Injury</option>
                <option value="Knee/Leg Injury">Knee/Leg Injury</option>
                <option value="Head Injury / Concussion">Head Injury / Concussion</option>
                <option value="Fracture">Fracture</option>
                <option value="Soft Tissue Injury">Soft Tissue Injury</option>
                <option value="Other">Other</option>
              </select>
              {form.injuryType === "Other" && (
                <input
                  style={{ ...inputStyle, marginTop: "0.5rem" }}
                  value={form.injuryOther}
                  onChange={(e) => update({ injuryOther: e.target.value })}
                  placeholder="Briefly describe injury type"
                />
              )}
            </div>

            <div>
              <div style={labelStyle}>Common chronic conditions (optional)</div>
              <div style={helpStyle}>
                This helps identify care needs and barriers; it does not replace provider diagnosis.
              </div>
              <select
                style={selectStyle}
                value={form.chronicCondition}
                onChange={(e) => update({ chronicCondition: e.target.value as ChronicCondition })}
              >
                <option value="">Select…</option>
                <option value="None">None</option>
                <option value="Diabetes">Diabetes</option>
                <option value="Hypertension">Hypertension</option>
                <option value="Asthma/COPD">Asthma/COPD</option>
                <option value="Heart Disease">Heart Disease</option>
                <option value="Depression/Anxiety">Depression/Anxiety</option>
                <option value="Chronic Pain">Chronic Pain</option>
                <option value="Other">Other</option>
              </select>
              {form.chronicCondition === "Other" && (
                <input
                  style={{ ...inputStyle, marginTop: "0.5rem" }}
                  value={form.chronicOther}
                  onChange={(e) => update({ chronicOther: e.target.value })}
                  placeholder="Briefly describe condition"
                />
              )}
            </div>

            <div>
              <div style={labelStyle}>Current pain level (0–10)</div>
              <div style={helpStyle}>
                0 = no pain, 10 = worst possible pain.
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={form.painNow}
                onChange={(e) => update({ painNow: Number(e.target.value) as FormState["painNow"] })}
                style={{ width: "100%", maxWidth: "300px" }}
              />
              <div style={{ fontSize: "0.85rem", fontWeight: 600, marginTop: "0.25rem" }}>
                {form.painNow}/10
              </div>
            </div>

            <div>
              <div style={labelStyle}>Have you missed work due to your injury?</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {["Yes", "No"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    style={pillBtn(form.missedWork === v)}
                    onClick={() => update({ missedWork: v as "Yes" | "No" })}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={labelStyle}>What is your primary concern right now?</div>
              <div style={helpStyle}>
                This helps tailor education and self-management supports.
              </div>
              <textarea
                style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                value={form.primaryConcern}
                onChange={(e) => update({ primaryConcern: e.target.value })}
                placeholder="Example: Pain management, returning to work, medical bills..."
              />
            </div>
          </div>
        )}

        {/* ========== STEP 3: CARE DISRUPTIONS ========== */}
        {step === "Care Disruptions" && (
          <div style={{ display: "grid", gap: "0.85rem" }}>
            <div style={{ 
              padding: "0.75rem", 
              background: "#fffbeb", 
              borderRadius: "8px",
              border: "1px solid #fcd34d",
              marginBottom: "0.5rem"
            }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#92400e", marginBottom: "0.25rem" }}>
                Social Drivers of Health (SDOH) — External Disruptions of Care
              </div>
              <div style={{ fontSize: "0.75rem", color: "#78350f" }}>
                Why it matters: documenting SDOH defends the integrity of the client by distinguishing real
                barriers from assumptions. This informs your care plan and protects your case.
              </div>
            </div>

            <div>
              <div style={labelStyle}>Transportation disruption since injury/accident?</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {["Yes", "No"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    style={pillBtn(form.transportationIssue === v)}
                    onClick={() => update({ transportationIssue: v as "Yes" | "No" })}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Housing instability concerns?</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {["Yes", "No"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    style={pillBtn(form.housingConcern === v)}
                    onClick={() => update({ housingConcern: v as "Yes" | "No" })}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Food insecurity concerns?</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {["Yes", "No"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    style={pillBtn(form.foodConcern === v)}
                    onClick={() => update({ foodConcern: v as "Yes" | "No" })}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Childcare issues affecting appointments?</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {["Yes", "No"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    style={pillBtn(form.childcareIssue === v)}
                    onClick={() => update({ childcareIssue: v as "Yes" | "No" })}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Household income range (optional)</div>
              <div style={helpStyle}>
                This helps identify potential financial barriers to care.
              </div>
              <select
                style={selectStyle}
                value={form.incomeRange}
                onChange={(e) => update({ incomeRange: e.target.value as IncomeRange })}
              >
                <option value="">Select…</option>
                <option value="Prefer not to say">Prefer not to say</option>
                <option value="Under $25,000">Under $25,000</option>
                <option value="$25,000–$49,999">$25,000–$49,999</option>
                <option value="$50,000–$74,999">$50,000–$74,999</option>
                <option value="$75,000–$99,999">$75,000–$99,999</option>
                <option value="$100,000–$149,999">$100,000–$149,999</option>
                <option value="$150,000+">$150,000+</option>
              </select>
            </div>
          </div>
        )}

        {/* ========== STEP 4: CLIENT VOICE ========== */}
        {step === "Client Voice" && (
          <div style={{ display: "grid", gap: "0.85rem" }}>
            <div style={{ 
              padding: "0.75rem", 
              background: "#f0f9ff", 
              borderRadius: "8px",
              border: "1px solid #bae6fd",
              marginBottom: "0.5rem"
            }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#0369a1", marginBottom: "0.25rem" }}>
                Your Voice Matters
              </div>
              <div style={{ fontSize: "0.75rem", color: "#0c4a6e" }}>
                These questions help your RN understand your experience in your own words.
                There are no right or wrong answers.
              </div>
            </div>

            <div>
              <div style={labelStyle}>In your own words, what happened?</div>
              <textarea
                style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
                value={form.clientVoiceWhatHappened}
                onChange={(e) => update({ clientVoiceWhatHappened: e.target.value })}
                placeholder="Describe the incident or how your injury occurred..."
              />
            </div>

            <div>
              <div style={labelStyle}>What has been the hardest part?</div>
              <textarea
                style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
                value={form.clientVoiceHardestPart}
                onChange={(e) => update({ clientVoiceHardestPart: e.target.value })}
                placeholder="What challenges have you faced since the injury?"
              />
            </div>

            <div>
              <div style={labelStyle}>What do you need most right now?</div>
              <textarea
                style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
                value={form.clientVoiceNeedMost}
                onChange={(e) => update({ clientVoiceNeedMost: e.target.value })}
                placeholder="Example: Guidance, appointments scheduled, pain plan, transportation help..."
              />
            </div>
          </div>
        )}

        {/* ========== PREVIEW ========== */}
        {isPreview && (
          <div style={{ display: "grid", gap: "1rem" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.25rem" }}>
              Review Your Information
            </div>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "-0.5rem" }}>
              Please review your responses below. You can go back to any section to make changes.
            </p>

            {/* About You Summary */}
            <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", marginBottom: "0.4rem" }}>
                ABOUT YOU
              </div>
              <div style={{ fontSize: "0.85rem" }}>
                <strong>{form.firstName} {form.lastName}</strong>
                {form.dateOfBirth && <span> • Born: {form.dateOfBirth} (Age: {age})</span>}
              </div>
              <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                Gender: <strong>{form.genderIdentity || "—"}</strong> • 
                Sex at Birth: <strong>{form.sexAtBirth || "—"}</strong>
              </div>
              <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                Has Dependents: <strong>{form.hasDependents || "—"}</strong> • 
                Student: <strong>{form.isStudent || "—"}</strong>
              </div>
            </div>

            {/* Injury Snapshot Summary */}
            <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", marginBottom: "0.4rem" }}>
                INJURY SNAPSHOT
              </div>
              <div style={{ fontSize: "0.8rem" }}>
                Injury: <strong>{form.injuryType || "—"}</strong>
                {form.injuryOther && ` (${form.injuryOther})`}
              </div>
              <div style={{ fontSize: "0.8rem" }}>
                Chronic Condition: <strong>{form.chronicCondition || "—"}</strong>
                {form.chronicOther && ` (${form.chronicOther})`}
              </div>
              <div style={{ fontSize: "0.8rem" }}>
                Pain Level: <strong>{form.painNow}/10</strong> • 
                Missed Work: <strong>{form.missedWork || "—"}</strong>
              </div>
              {form.primaryConcern && (
                <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                  Primary Concern: <em>{form.primaryConcern}</em>
                </div>
              )}
            </div>

            {/* SDOH Summary */}
            <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", marginBottom: "0.4rem" }}>
                SDOH — External Disruptions of Care
              </div>
              <div style={{ fontSize: "0.8rem" }}>
                Transportation: <strong>{form.transportationIssue || "—"}</strong> • 
                Housing: <strong>{form.housingConcern || "—"}</strong> • 
                Food: <strong>{form.foodConcern || "—"}</strong>
              </div>
              <div style={{ fontSize: "0.8rem" }}>
                Childcare Issues: <strong>{form.childcareIssue || "—"}</strong> • 
                Income: <strong>{form.incomeRange || "—"}</strong>
              </div>
            </div>

            {/* Client Voice Summary */}
            <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", marginBottom: "0.4rem" }}>
                CLIENT VOICE
              </div>
              {form.clientVoiceWhatHappened && (
                <div style={{ fontSize: "0.8rem", marginBottom: "0.4rem" }}>
                  <strong>What happened:</strong> <em>{form.clientVoiceWhatHappened}</em>
                </div>
              )}
              {form.clientVoiceHardestPart && (
                <div style={{ fontSize: "0.8rem", marginBottom: "0.4rem" }}>
                  <strong>Hardest part:</strong> <em>{form.clientVoiceHardestPart}</em>
                </div>
              )}
              {form.clientVoiceNeedMost && (
                <div style={{ fontSize: "0.8rem" }}>
                  <strong>Need most:</strong> <em>{form.clientVoiceNeedMost}</em>
                </div>
              )}
            </div>

            {/* Submit */}
            <div style={{ 
              marginTop: "0.5rem",
              padding: "0.75rem", 
              background: "#f0fdf4", 
              borderRadius: "8px",
              border: "1px solid #86efac",
            }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.demoAcknowledged}
                  onChange={(e) => update({ demoAcknowledged: e.target.checked })}
                  style={{ marginTop: "0.2rem" }}
                />
                <span style={{ fontSize: "0.8rem", color: "#166534" }}>
                  I confirm that the information I have provided is accurate to the best of my knowledge.
                  I understand this information will be reviewed by an RN Care Manager as part of my care plan.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "1.25rem",
            paddingTop: "1rem",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <button
            type="button"
            style={{ ...smallBtn, opacity: stepIndex === 0 ? 0.5 : 1 }}
            disabled={stepIndex === 0}
            onClick={() => goTo(stepIndex - 1)}
          >
            ← Back
          </button>

          {isPreview ? (
            <button
              type="button"
              style={{ ...primaryBtn, opacity: form.demoAcknowledged ? 1 : 0.6 }}
              disabled={!form.demoAcknowledged}
              onClick={() => goTo(5)}
            >
              Submit Intake →
            </button>
          ) : (
            <button
              type="button"
              style={primaryBtn}
              onClick={() => goTo(stepIndex + 1)}
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientIntakeScreen;
