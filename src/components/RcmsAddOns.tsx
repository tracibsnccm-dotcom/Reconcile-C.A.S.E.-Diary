/** ================== RCMS C.A.R.E. — Lovable-Ready Add-Ons ==================
 * This file adds the missing placeholders:
 * 1) INTAKE: Insurance (private vs personal injury + claim #), Emergency Contacts,
 *    Coverage Type, HIPAA/Text Consent, Behavioral Emergency notice.
 * 2) CLIENT PORTAL: Progress bar, Appointment Tracker placeholder, Resource Library placeholder,
 *    Feedback Survey placeholder.
 *
 * HOW TO USE
 * - Render <IntakeAdditions /> inside your IntakeWizard page (below your existing form).
 * - Render <ClientPortalAdditions /> inside your Client Portal page.
 * =============================================================================================== */

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

/* ----------------------------- INTAKE ADDITIONS -------------------------------- */

interface IntakeAdditionsForm {
  privateInsuranceName: string;
  coverageType: string;
  piInsurerName: string;
  piClaimNumber: string;
  emergencyPrimaryName: string;
  emergencyPrimaryPhone: string;
  emergencyPrimaryRelation: string;
  emergencySecondaryName: string;
  emergencySecondaryPhone: string;
  emergencySecondaryRelation: string;
  hipaaTextConsent: boolean;
  crisisFlag: boolean;
}

export function IntakeAdditions() {
  const [form, setForm] = useState<IntakeAdditionsForm>({
    privateInsuranceName: "",
    coverageType: "",
    piInsurerName: "",
    piClaimNumber: "",
    emergencyPrimaryName: "",
    emergencyPrimaryPhone: "",
    emergencyPrimaryRelation: "",
    emergencySecondaryName: "",
    emergencySecondaryPhone: "",
    emergencySecondaryRelation: "",
    hipaaTextConsent: false,
    crisisFlag: false,
  });

  const [showSecondary, setShowSecondary] = useState(false);

  const setField = (k: keyof IntakeAdditionsForm, v: any) => 
    setForm(prev => ({ ...prev, [k]: v }));

  const intakeReady = useMemo(() => {
    return !!form.piInsurerName && !!form.piClaimNumber && 
           !!form.emergencyPrimaryName && !!form.emergencyPrimaryPhone;
  }, [form]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: merge these fields into your main Intake payload and POST to Apps Script.
    console.log("IntakeAdditions submit ->", form);
    toast.success("Saved Intake Additions (placeholder)");
  };

  return (
    <section className="mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Additional Intake Details</CardTitle>
          <CardDescription>
            Insurance details for coordination, emergency contacts, and communication consents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Insurance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Private Insurance (Statistical)</CardTitle>
                <CardDescription className="text-xs">
                  This is collected for statistical purposes only and not used for claims.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Label htmlFor="privateInsurance">Private Insurance Name</Label>
                <Input
                  id="privateInsurance"
                  placeholder="e.g., Blue Cross, Aetna, Kaiser"
                  value={form.privateInsuranceName}
                  onChange={e => setField("privateInsuranceName", e.target.value)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Injury Coverage (For Claim)</CardTitle>
                <CardDescription className="text-xs">
                  The insurance responsible for the personal injury or workers' compensation claim.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="coverageType">Coverage Type</Label>
                  <Select value={form.coverageType} onValueChange={v => setField("coverageType", v)}>
                    <SelectTrigger id="coverageType">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Personal Injury">Personal Injury</SelectItem>
                      <SelectItem value="Workers' Compensation">Workers' Compensation</SelectItem>
                      <SelectItem value="Other/Unknown">Other/Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="piInsurer">Responsible Insurer Name</Label>
                  <Input
                    id="piInsurer"
                    placeholder="e.g., State Farm, Liberty Mutual"
                    value={form.piInsurerName}
                    onChange={e => setField("piInsurerName", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="claimNumber">Claim Number</Label>
                  <Input
                    id="claimNumber"
                    placeholder="e.g., PI-123456"
                    value={form.piClaimNumber}
                    onChange={e => setField("piClaimNumber", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Emergency Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Emergency Contacts</CardTitle>
              <CardDescription className="text-xs">
                Provide at least one primary contact in case urgent updates are needed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primaryName">Primary Contact Name</Label>
                  <Input
                    id="primaryName"
                    value={form.emergencyPrimaryName}
                    onChange={e => setField("emergencyPrimaryName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="primaryPhone">Primary Contact Phone</Label>
                  <Input
                    id="primaryPhone"
                    value={form.emergencyPrimaryPhone}
                    onChange={e => setField("emergencyPrimaryPhone", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="primaryRelation">Relationship</Label>
                  <Input
                    id="primaryRelation"
                    placeholder="e.g., spouse, parent, friend"
                    value={form.emergencyPrimaryRelation}
                    onChange={e => setField("emergencyPrimaryRelation", e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSecondary(!showSecondary)}
              >
                {showSecondary ? "- Hide" : "+ Add"} Secondary Contact (optional)
              </Button>

              {showSecondary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t">
                  <div>
                    <Label htmlFor="secondaryName">Secondary Contact Name</Label>
                    <Input
                      id="secondaryName"
                      value={form.emergencySecondaryName}
                      onChange={e => setField("emergencySecondaryName", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="secondaryPhone">Secondary Contact Phone</Label>
                    <Input
                      id="secondaryPhone"
                      value={form.emergencySecondaryPhone}
                      onChange={e => setField("emergencySecondaryPhone", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="secondaryRelation">Relationship</Label>
                    <Input
                      id="secondaryRelation"
                      placeholder="e.g., sibling, adult child"
                      value={form.emergencySecondaryRelation}
                      onChange={e => setField("emergencySecondaryRelation", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Consents & Crisis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">HIPAA/Text Consent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="hipaaConsent"
                    checked={form.hipaaTextConsent}
                    onCheckedChange={(checked) => setField("hipaaTextConsent", !!checked)}
                  />
                  <Label htmlFor="hipaaConsent" className="text-sm font-normal cursor-pointer">
                    I consent to receive care coordination updates by text or email.
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  You can change your communication preferences at any time.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Behavioral Emergency (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="crisis"
                    checked={form.crisisFlag}
                    onCheckedChange={(checked) => setField("crisisFlag", !!checked)}
                  />
                  <Label htmlFor="crisis" className="text-sm font-normal cursor-pointer">
                    I need help urgently or I feel in crisis.
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  If selected, an RCMS supervisor will be alerted to contact you. If you are in immediate danger, call 911.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className={`text-sm font-semibold ${intakeReady ? "text-green-600" : "text-muted-foreground"}`}>
              {intakeReady ? "✓ Ready to proceed" : "Fill in claim insurer, claim #, and primary contact to continue"}
            </div>
            <Button onClick={handleSubmit} type="button">
              Save Intake Additions
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

/* --------------------------- CLIENT PORTAL ADDITIONS ---------------------------- */

interface Appointment {
  when: string;
  with: string;
  status: string;
}

export function ClientPortalAdditions() {
  const [progress] = useState(72);
  const [appointments] = useState<Appointment[]>([
    { when: "Tue, Nov 4 — 10:30 AM", with: "Physical Therapy", status: "upcoming" },
    { when: "Fri, Nov 7 — 2:00 PM", with: "Chiropractor", status: "upcoming" },
  ]);
  
  const [satisfaction, setSatisfaction] = useState("");
  const [feedbackText, setFeedbackText] = useState("");

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: POST feedback to Apps Script or local storage
    toast.success("Thanks for your feedback!");
  };

  return (
    <section className="mt-10 space-y-6">
      {/* Progress Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
          <CardDescription>Keep going — you're almost done.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
            <div 
              className="h-3 bg-primary transition-all duration-500" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <div className="mt-2 text-sm text-muted-foreground">{progress}% complete</div>
        </CardContent>
      </Card>

      {/* Appointment Tracker */}
      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
          <CardDescription>Upcoming visits and follow-ups.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {appointments.map((a, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="font-semibold">{a.when}</div>
                <div className="text-sm text-muted-foreground">{a.with}</div>
              </div>
              <Badge variant="secondary">{a.status}</Badge>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-2">
            * Calendar sync and reminders will be added later.
          </p>
        </CardContent>
      </Card>

      {/* Resource Library */}
      <Card>
        <CardHeader>
          <CardTitle>Resources & Handouts</CardTitle>
          <CardDescription>Education to support your recovery.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: "Pain & Mobility Tips (PDF)", desc: "Stretching, pacing, and comfort strategies." },
              { title: "Anxiety / Depression Self-Care (PDF)", desc: "Breathing, journaling, when to seek help." },
              { title: "4Ps of Wellness Guide", desc: "Physical, Psychological, Psychosocial, Professional." },
              { title: "Injury-Specific Recovery Tips", desc: "Neck/back strain, concussion, soft tissue." },
            ].map((resource, i) => (
              <div key={i} className="rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors">
                <div className="font-semibold">{resource.title}</div>
                <div className="text-xs text-muted-foreground">{resource.desc}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            * Upload files later; link or download will appear here.
          </p>
        </CardContent>
      </Card>

      {/* Feedback Survey */}
      <Card>
        <CardHeader>
          <CardTitle>Share Your Feedback</CardTitle>
          <CardDescription>
            Your feedback helps us improve care coordination and your experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <div>
              <Label htmlFor="satisfaction">How satisfied are you with your care coordination so far?</Label>
              <Select value={satisfaction} onValueChange={setSatisfaction}>
                <SelectTrigger id="satisfaction">
                  <SelectValue placeholder="Select rating..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 – Very satisfied</SelectItem>
                  <SelectItem value="4">4 – Satisfied</SelectItem>
                  <SelectItem value="3">3 – Neutral</SelectItem>
                  <SelectItem value="2">2 – Dissatisfied</SelectItem>
                  <SelectItem value="1">1 – Very dissatisfied</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="feedback">Anything we could do better?</Label>
              <Textarea
                id="feedback"
                rows={3}
                placeholder="Your suggestions..."
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
              />
            </div>
            <Button type="submit">Submit Feedback</Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
