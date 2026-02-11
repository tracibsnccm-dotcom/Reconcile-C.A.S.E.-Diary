// src/client/ClientIntakePage.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";

type SDOHValue = "ok" | "issue" | "prefer-not-say";
type SensitiveComfort = "yes" | "not-today" | "prefer-not-say";
type TimeframePreference = "30" | "60" | "90" | "flexible";

export default function ClientIntakePage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [consentPhone, setConsentPhone] = useState(true);
  const [consentText, setConsentText] = useState(true);
  const [consentEmail, setConsentEmail] = useState(true);
  const [consentAttorney, setConsentAttorney] = useState(true);
  const [consentProviders, setConsentProviders] = useState(true);

  const [voice, setVoice] = useState("");
  const [view, setView] = useState("");

  const [physicalStage, setPhysicalStage] = useState(3);
  const [psychStage, setPsychStage] = useState(3);
  const [psychosocialStage, setPsychosocialStage] = useState(3);
  const [professionalStage, setProfessionalStage] = useState(3);

  const [sdohHousing, setSdohHousing] = useState<SDOHValue>("ok");
  const [sdohFood, setSdohFood] = useState<SDOHValue>("ok");
  const [sdohTransport, setSdohTransport] = useState<SDOHValue>("ok");
  const [sdohFinances, setSdohFinances] = useState<SDOHValue>("ok");
  const [sdohSafety, setSdohSafety] = useState<SDOHValue>("ok");

  const [shortTermGoal, setShortTermGoal] = useState("");
  const [mediumTermGoal, setMediumTermGoal] = useState("");
  const [longTermGoal, setLongTermGoal] = useState("");
  const [timeframePreference, setTimeframePreference] =
    useState<TimeframePreference>("90");

  const [sensitiveComfort, setSensitiveComfort] =
    useState<SensitiveComfort>("yes");
  const [concernHomeSafety, setConcernHomeSafety] = useState(false);
  const [concernPartnerViolence, setConcernPartnerViolence] = useState(false);
  const [concernPastAbuse, setConcernPastAbuse] = useState(false);
  const [concernSelfHarm, setConcernSelfHarm] = useState(false);
  const [concernSubstanceUse, setConcernSubstanceUse] = useState(false);
  const [sensitiveNotes, setSensitiveNotes] = useState("");

  const [snapshotId, setSnapshotId] = useState<string | null>(null);

  useEffect(() => {
    async function loadSnapshot() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("client_intake_snapshots")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error loading intake snapshot:", error);
        setError("We had trouble loading your intake. You can still fill it out.");
        setLoading(false);
        return;
      }

      if (data) {
        setSnapshotId(data.id as string);

        setConsentPhone(data.consent_phone ?? true);
        setConsentText(data.consent_text ?? true);
        setConsentEmail(data.consent_email ?? true);
        setConsentAttorney(data.consent_attorney ?? true);
        setConsentProviders(data.consent_providers ?? true);

        setVoice(data.voice ?? "");
        setView(data.view ?? "");

        setPhysicalStage(data.physical_stage ?? 3);
        setPsychStage(data.psych_stage ?? 3);
        setPsychosocialStage(data.psychosocial_stage ?? 3);
        setProfessionalStage(data.professional_stage ?? 3);

        setSdohHousing(
          (data.sdoh_housing as SDOHValue) || "ok"
        );
        setSdohFood(
          (data.sdoh_food as SDOHValue) || "ok"
        );
        setSdohTransport(
          (data.sdoh_transport as SDOHValue) || "ok"
        );
        setSdohFinances(
          (data.sdoh_finances as SDOHValue) || "ok"
        );
        setSdohSafety(
          (data.sdoh_safety as SDOHValue) || "ok"
        );

        setShortTermGoal(data.short_term_goal ?? "");
        setMediumTermGoal(data.medium_term_goal ?? "");
        setLongTermGoal(data.long_term_goal ?? "");
        setTimeframePreference(
          (data.timeframe_preference as TimeframePreference) || "90"
        );

        setSensitiveComfort(
          (data.sensitive_comfort as SensitiveComfort) || "yes"
        );
        setConcernHomeSafety(!!data.concern_home_safety);
        setConcernPartnerViolence(!!data.concern_partner_violence);
        setConcernPastAbuse(!!data.concern_past_abuse);
        setConcernSelfHarm(!!data.concern_self_harm);
        setConcernSubstanceUse(!!data.concern_substance_use);
        setSensitiveNotes(data.sensitive_notes ?? "");
      }

      setLoading(false);
    }

    loadSnapshot();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);
    setHasSubmitted(false);

    const payload = {
      user_id: user.id,
      consent_phone: consentPhone,
      consent_text: consentText,
      consent_email: consentEmail,
      consent_attorney: consentAttorney,
      consent_providers: consentProviders,
      voice,
      view,
      physical_stage: physicalStage,
      psych_stage: psychStage,
      psychosocial_stage: psychosocialStage,
      professional_stage: professionalStage,
      sdoh_housing: sdohHousing,
      sdoh_food: sdohFood,
      sdoh_transport: sdohTransport,
      sdoh_finances: sdohFinances,
      sdoh_safety: sdohSafety,
      short_term_goal: shortTermGoal,
      medium_term_goal: mediumTermGoal,
      long_term_goal: longTermGoal,
      timeframe_preference: timeframePreference,
      sensitive_comfort: sensitiveComfort,
      concern_home_safety: concernHomeSafety,
      concern_partner_violence: concernPartnerViolence,
      concern_past_abuse: concernPastAbuse,
      concern_self_harm: concernSelfHarm,
      concern_substance_use: concernSubstanceUse,
      sensitive_notes: sensitiveNotes,
      updated_at: new Date().toISOString(),
    };

    try {
      let result;
      if (snapshotId) {
        result = await supabase
          .from("client_intake_snapshots")
          .update(payload)
          .eq("id", snapshotId)
          .select()
          .maybeSingle();
      } else {
        result = await supabase
          .from("client_intake_snapshots")
          .insert(payload)
          .select()
          .maybeSingle();
      }

      const { data, error } = result;
      if (error) {
        console.error("Error saving intake snapshot:", error);
        setError("We could not save your intake yet. Please try again.");
      } else if (data) {
        setSnapshotId(data.id as string);
        setHasSubmitted(true);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-xl border bg-white p-4 shadow-sm text-sm text-gray-700">
        You need to be signed in to complete your intake.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-1">
          Client Intake: Story, Wellness, and Social Needs
        </h2>
        <p className="text-xs text-gray-600">
          This intake helps your RN Care Manager understand your situation, your
          wellness, and anything that may affect your recovery. You can skip any
          question you are not comfortable answering, and you can update this
          information later.
        </p>
        {loading && (
          <p className="mt-2 text-[11px] text-gray-500">
            Loading your intake information…
          </p>
        )}
        {error && (
          <p className="mt-2 text-[11px] text-red-600">
            {error}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* A. Consent & Communication */}
        <section className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
          <h3 className="font-semibold text-sm">A. Consent & Communication</h3>
          <p className="text-xs text-gray-600 mb-1">
            Tell us how we can contact you and who we are allowed to talk to
            about your care. You can change these choices later.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={consentPhone}
                onChange={(e) => setConsentPhone(e.target.checked)}
              />
              I consent to receive phone calls related to my care.
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={consentText}
                onChange={(e) => setConsentText(e.target.checked)}
              />
              I consent to receive text messages related to my care.
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={consentEmail}
                onChange={(e) => setConsentEmail(e.target.checked)}
              />
              I consent to receive email updates related to my care.
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={consentAttorney}
                onChange={(e) => setConsentAttorney(e.target.checked)}
              />
              <span>
                I authorize my RN Care Manager to communicate with my{" "}
                <span className="font-semibold">attorney</span> about my care
                and recovery, when needed.
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={consentProviders}
                onChange={(e) => setConsentProviders(e.target.checked)}
              />
              <span>
                I authorize my RN Care Manager to communicate with my{" "}
                <span className="font-semibold">
                  doctors, therapists, and other providers
                </span>{" "}
                about my care.
              </span>
            </label>
          </div>

          <p className="text-[11px] text-gray-500">
            Your choices help us protect your privacy and follow HIPAA and legal
            requirements.
          </p>
        </section>

        {/* B. Voice & View */}
        <section className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
          <h3 className="font-semibold text-sm">B. Voice &amp; View</h3>
          <p className="text-xs text-gray-600">
            Voice is your story in your own words. View is how you see yourself
            and what “better” looks like to you. This helps your RN and
            attorney understand your perspective, not just your diagnoses.
          </p>

          <div className="space-y-2 text-sm">
            <label className="block font-medium">
              Your Voice (what happened, in your own words)
            </label>
            <textarea
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
              rows={4}
              placeholder="Tell us what brought you here, what changed, and how this is affecting your daily life."
            />
          </div>

          <div className="space-y-2 text-sm">
            <label className="block font-medium">
              Your View (how you see yourself and your recovery)
            </label>
            <textarea
              value={view}
              onChange={(e) => setView(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
              rows={3}
              placeholder="How do you see yourself right now, and what would you like your health, function, or life to look like 3–6 months from now?"
            />
          </div>
        </section>

        {/* C. 4Ps of Wellness Snapshot */}
        <section className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
          <h3 className="font-semibold text-sm">C. 4Ps of Wellness Snapshot</h3>
          <p className="text-xs text-gray-600">
            This is a quick snapshot of how you are doing in each area. Your RN
            Care Manager uses your 4Ps to understand where support is needed
            most. (This is a summary view, not the full clinical tool.)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <label className="block font-medium mb-1">
                Physical Wellness (1–5)
              </label>
              <select
                value={physicalStage}
                onChange={(e) => setPhysicalStage(Number(e.target.value))}
                className="w-full border rounded-lg p-2"
              >
                <option value={1}>1 - Most limited / struggling</option>
                <option value={2}>2 - Significant difficulties</option>
                <option value={3}>3 - Mixed / some good days</option>
                <option value={4}>4 - Mostly stable</option>
                <option value={5}>5 - Doing well / stable</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">
                Psychological Wellness (1–5)
              </label>
              <select
                value={psychStage}
                onChange={(e) => setPsychStage(Number(e.target.value))}
                className="w-full border rounded-lg p-2"
              >
                <option value={1}>1 - Most limited / struggling</option>
                <option value={2}>2 - Significant difficulties</option>
                <option value={3}>3 - Mixed / some good days</option>
                <option value={4}>4 - Mostly stable</option>
                <option value={5}>5 - Doing well / stable</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">
                Psychosocial Wellness (1–5)
              </label>
              <select
                value={psychosocialStage}
                onChange={(e) => setPsychosocialStage(Number(e.target.value))}
                className="w-full border rounded-lg p-2"
              >
                <option value={1}>1 - Most limited / struggling</option>
                <option value={2}>2 - Significant difficulties</option>
                <option value={3}>3 - Mixed / some good days</option>
                <option value={4}>4 - Mostly stable</option>
                <option value={5}>5 - Doing well / stable</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">
                Professional Wellness (1–5)
              </label>
              <select
                value={professionalStage}
                onChange={(e) => setProfessionalStage(Number(e.target.value))}
                className="w-full border rounded-lg p-2"
              >
                <option value={1}>1 - Most limited / struggling</option>
                <option value={2}>2 - Significant difficulties</option>
                <option value={3}>3 - Mixed / some good days</option>
                <option value={4}>4 - Mostly stable</option>
                <option value={5}>5 - Doing well / stable</option>
              </select>
            </div>
          </div>

          <p className="text-[11px] text-gray-500">
            Your RN uses a more detailed 4Ps tool behind the scenes. This page
            gives a quick client-facing summary so your plan matches how you
            feel day-to-day.
          </p>
        </section>

        {/* D. Social Needs (SDOH Snapshot) */}
        <section className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
          <h3 className="font-semibold text-sm">D. Social Needs Snapshot</h3>
          <p className="text-xs text-gray-600">
            These questions help us see whether anything outside of your
            medical care (housing, food, transportation, safety, money) is
            affecting your recovery. You can choose “Prefer not to say” at any
            time.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <label className="block font-medium mb-1">Housing</label>
              <select
                value={sdohHousing}
                onChange={(e) =>
                  setSdohHousing(e.target.value as SDOHValue)
                }
                className="w-full border rounded-lg p-2"
              >
                <option value="ok">Stable housing</option>
                <option value="issue">Housing is unstable or unsafe</option>
                <option value="prefer-not-say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">Food</label>
              <select
                value={sdohFood}
                onChange={(e) =>
                  setSdohFood(e.target.value as SDOHValue)
                }
                className="w-full border rounded-lg p-2"
              >
                <option value="ok">Enough food most of the time</option>
                <option value="issue">Sometimes not enough food</option>
                <option value="prefer-not-say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">Transportation</label>
              <select
                value={sdohTransport}
                onChange={(e) =>
                  setSdohTransport(e.target.value as SDOHValue)
                }
                className="w-full border rounded-lg p-2"
              >
                <option value="ok">I can usually get to my appointments</option>
                <option value="issue">Transportation is a barrier</option>
                <option value="prefer-not-say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">Finances</label>
              <select
                value={sdohFinances}
                onChange={(e) =>
                  setSdohFinances(e.target.value as SDOHValue)
                }
                className="w-full border rounded-lg p-2"
              >
                <option value="ok">I can usually cover my basic needs</option>
                <option value="issue">Money is a major barrier</option>
                <option value="prefer-not-say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">Safety</label>
              <select
                value={sdohSafety}
                onChange={(e) =>
                  setSdohSafety(e.target.value as SDOHValue)
                }
                className="w-full border rounded-lg p-2"
              >
                <option value="ok">I feel physically safe where I live</option>
                <option value="issue">
                  I do not always feel physically safe
                </option>
                <option value="prefer-not-say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <p className="text-[11px] text-gray-500">
            Social needs do not change your worth or deserve-ness of care. They
            simply help us understand what support may be needed for your plan
            to work in real life.
          </p>
        </section>

        {/* E. Vision & Goals */}
        <section className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
          <h3 className="font-semibold text-sm">E. Vision &amp; Goals</h3>
          <p className="text-xs text-gray-600">
            Vision is where you and your RN are trying to go together. These
            goals help your care plan match what matters most to you, not just
            what&apos;s in the chart.
          </p>

          <div className="space-y-2 text-sm">
            <label className="block font-medium">
              Short-Term Goal (next 30 days)
            </label>
            <textarea
              value={shortTermGoal}
              onChange={(e) => setShortTermGoal(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
              rows={2}
              placeholder="Example: Sleep at least 5–6 hours most nights, make it to all my therapy appointments this month."
            />
          </div>

          <div className="space-y-2 text-sm">
            <label className="block font-medium">
              Medium-Term Goal (next 60–90 days)
            </label>
            <textarea
              value={mediumTermGoal}
              onChange={(e) => setMediumTermGoal(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
              rows={2}
              placeholder="Example: Walk for 15–20 minutes without stopping, reduce pain flares so I can do light housework."
            />
          </div>

          <div className="space-y-2 text-sm">
            <label className="block font-medium">
              Longer-Term Goal (beyond 90 days)
            </label>
            <textarea
              value={longTermGoal}
              onChange={(e) => setLongTermGoal(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
              rows={2}
              placeholder="Example: Return to work (full or part time), resume caring for family, or resume activities I enjoy."
            />
          </div>

          <div className="space-y-2 text-sm">
            <label className="block font-medium">
              How far ahead do you want to plan right now?
            </label>
            <select
              value={timeframePreference}
              onChange={(e) =>
                setTimeframePreference(
                  e.target.value as TimeframePreference
                )
              }
              className="w-full border rounded-lg p-2"
            >
              <option value="30">Let&apos;s focus on the next 30 days</option>
              <option value="60">Let&apos;s focus on the next 60 days</option>
              <option value="90">Let&apos;s focus on the next 90 days</option>
              <option value="flexible">
                I&apos;m not sure yet / I need help deciding
              </option>
            </select>
          </div>

          <p className="text-[11px] text-gray-500">
            Your RN Care Manager will use these goals to build and update your
            care plan. You do not have to know all the answers now; we can shape
            these over time.
          </p>
        </section>

        {/* F. Safety & Sensitive Experiences */}
        <section className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-sm">🔒</span>
            <div>
              <h3 className="font-semibold text-sm">
                F. Safety &amp; Sensitive Experiences
              </h3>
              <p className="text-xs text-gray-600">
                Some experiences are very private. You are in control of what
                you share and when. Your answers here are kept confidential and
                are only used to help keep you safe and support your recovery.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <label className="block font-medium">
              Are you comfortable answering sensitive questions today?
            </label>
            <select
              value={sensitiveComfort}
              onChange={(e) =>
                setSensitiveComfort(e.target.value as SensitiveComfort)
              }
              className="w-full border rounded-lg p-2"
            >
              <option value="yes">Yes, I&apos;m okay answering today</option>
              <option value="not-today">
                Not today, but I&apos;m open to talking about this later
              </option>
              <option value="prefer-not-say">I prefer not to answer</option>
            </select>
            <p className="text-[11px] text-gray-500">
              You can still receive care even if you choose not to answer these
              questions today.
            </p>
          </div>

          {sensitiveComfort === "yes" && (
            <div className="space-y-2 text-sm">
              <p className="text-xs text-gray-600">
                If any of the situations below apply to you now or in the past,
                you may check them. You can leave items blank if you are unsure
                or do not want to share details.
              </p>

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={concernHomeSafety}
                  onChange={(e) => setConcernHomeSafety(e.target.checked)}
                />
                <span>I have concerns about feeling physically safe at home.</span>
              </label>

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={concernPartnerViolence}
                  onChange={(e) => setConcernPartnerViolence(e.target.checked)}
                />
                <span>
                  I have current or past concerns about a partner or family
                  member hurting, threatening, or controlling me.
                </span>
              </label>

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={concernPastAbuse}
                  onChange={(e) => setConcernPastAbuse(e.target.checked)}
                />
                <span>
                  I have experienced physical, emotional, sexual, or other abuse
                  that affects me now.
                </span>
              </label>

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={concernSelfHarm}
                  onChange={(e) => setConcernSelfHarm(e.target.checked)}
                />
                <span>
                  I have had thoughts of self-harm, feeling like I don&apos;t
                  want to be here, or other safety concerns about myself.
                </span>
              </label>

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={concernSubstanceUse}
                  onChange={(e) => setConcernSubstanceUse(e.target.checked)}
                />
                <span>
                  I am worried that alcohol, medications, or other substances
                  might be affecting my safety, health, or recovery.
                </span>
              </label>

              <div className="space-y-1">
                <label className="block font-medium">
                  Is there anything else about safety or past experiences you
                  want your RN to know?
                </label>
                <textarea
                  value={sensitiveNotes}
                  onChange={(e) => setSensitiveNotes(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm"
                  rows={3}
                  placeholder="Only share what you feel comfortable sharing. You can also ask to speak with your RN by phone instead of writing details here."
                />
              </div>

              <p className="text-[11px] text-gray-500">
                If we see something that suggests you may be in immediate
                danger, your RN Care Manager may reach out or work with your
                attorney or providers to help keep you safe.
              </p>
            </div>
          )}

          {sensitiveComfort !== "yes" && (
            <p className="text-[11px] text-gray-500">
              We will check in about these topics again in the future. You can
              also bring them up with your RN at any time if you change your
              mind.
            </p>
          )}
        </section>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Intake Snapshot"}
          </button>

          {hasSubmitted && !saving && (
            <span className="text-xs text-emerald-700 font-medium">
              Your intake snapshot has been saved. Your RN Care Manager will
              review it and may ask follow-up questions.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
