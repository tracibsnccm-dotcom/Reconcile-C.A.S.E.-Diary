import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, FileText, CheckCircle2 } from 'lucide-react';
import { supabaseGet } from '@/lib/supabaseRest';
import { format } from 'date-fns';

interface ConsentData {
  id: string;
  session_id: string;
  service_agreement_signed_at: string | null;
  service_agreement_signature: string | null;
  legal_disclosure_signed_at: string | null;
  legal_disclosure_signature: string | null;
  legal_disclosure_attorney_name: string | null;
  obtain_records_signed_at: string | null;
  obtain_records_signature: string | null;
  obtain_records_injury_date: string | null;
  healthcare_coord_signed_at: string | null;
  healthcare_coord_signature: string | null;
  healthcare_coord_pcp: string | null;
  healthcare_coord_specialist: string | null;
  healthcare_coord_therapy: string | null;
  hipaa_acknowledged_at: string | null;
  hipaa_signature: string | null;
}

interface ConsentDocumentViewerProps {
  intakeId?: string;
  sessionId?: string;
  caseId?: string;
  showPrintButton?: boolean;
}

export function ConsentDocumentViewer({ 
  intakeId, 
  sessionId,
  caseId,
  showPrintButton = true 
}: ConsentDocumentViewerProps) {
  const [consent, setConsent] = useState<ConsentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadConsent() {
      setLoading(true);
      setError(null);
      
      try {
        let query = 'select=*';
        
        if (intakeId) {
          query += `&client_intake_id=eq.${intakeId}`;
        } else if (sessionId) {
          query += `&session_id=eq.${sessionId}`;
        } else if (caseId) {
          // Query directly by case_id
          query += `&case_id=eq.${caseId}`;
        } else {
          setError('No intake, session, or case ID provided');
          setLoading(false);
          return;
        }
        
        query += '&limit=1';
        
        const { data, error: fetchError } = await supabaseGet('rc_client_consents', query);
        
        if (fetchError) throw new Error(fetchError.message);
        
        const consentData = Array.isArray(data) ? data[0] : data;
        if (consentData) {
          setConsent(consentData);
        } else {
          setError('No consent records found');
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load consents');
      } finally {
        setLoading(false);
      }
    }
    
    loadConsent();
  }, [intakeId, sessionId, caseId]);

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Signed Consent Documents</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                .consent-section { margin-bottom: 40px; padding: 20px; border: 1px solid #ccc; page-break-inside: avoid; }
                .consent-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; }
                .consent-content { margin-top: 15px; }
                .consent-content h3, .consent-content h4 { font-weight: bold; margin-top: 15px; margin-bottom: 10px; }
                .consent-content p { margin-bottom: 10px; }
                .consent-content ul { margin-left: 20px; margin-bottom: 10px; }
                .consent-content li { margin-bottom: 5px; }
                .signature-line { margin-top: 30px; padding-top: 15px; border-top: 2px solid #000; }
                .signature { font-family: 'Brush Script MT', cursive; font-size: 24px; }
                .timestamp { font-size: 12px; color: #666; }
                .badge { display: inline-block; padding: 2px 8px; background: #22c55e; color: white; border-radius: 4px; font-size: 12px; }
                @media print { 
                  body { padding: 0; }
                  .consent-section { page-break-inside: avoid; }
                }
              </style>
            </head>
            <body>
              <h1>Signed Consent Documents</h1>
              <p><strong>Reconcile C.A.R.E. - Client Authorization Records</strong></p>
              <hr />
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not signed';
    return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
  };

  const ConsentSection = ({ 
    title, 
    signedAt, 
    signature, 
    children 
  }: { 
    title: string; 
    signedAt: string | null; 
    signature: string | null;
    children?: React.ReactNode;
  }) => (
    <div className="consent-section border rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="consent-title text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {title}
        </h3>
        {signedAt && <Badge className="badge bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Signed</Badge>}
      </div>
      
      <div className="consent-content prose prose-sm max-w-none text-foreground">
        {children}
      </div>
      
      {signature && (
        <div className="signature-line mt-6 pt-4 border-t-2">
          <p className="text-sm text-muted-foreground mb-1">Electronic Signature:</p>
          <p className="signature text-2xl font-serif italic">{signature}</p>
          <p className="timestamp text-xs text-muted-foreground mt-1">
            Signed: {formatDate(signedAt)}
          </p>
        </div>
      )}
      
      {!signature && (
        <p className="text-amber-600 text-sm mt-4">Not yet signed</p>
      )}
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading consent documents...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!consent) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No consent documents found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Signed Consent Documents
        </CardTitle>
        {showPrintButton && (
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print All
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div ref={printRef} className="space-y-6">
          {/* 1. Service Agreement */}
          <ConsentSection
            title="1. Service Agreement & Informed Consent"
            signedAt={consent.service_agreement_signed_at}
            signature={consent.service_agreement_signature}
          >
            <h3 className="text-base font-bold mb-3">RECONCILE CARE MANAGEMENT SERVICES (RCMS)</h3>
            <h4 className="text-sm font-semibold mb-4">SERVICE AGREEMENT & INFORMED CONSENT FOR CARE MANAGEMENT SERVICES</h4>
            
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-2">1. Voluntary Agreement for Services:</p>
                <p>
                  I voluntarily request and agree to receive care management services from Reconcile Care Management Services (RCMS). I understand that these services are designed to provide support and navigation for my clinically complex situation. I am not obligated to accept these services and may decline to participate at any time.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">2. Nature of Services – The RCMS C.A.R.E. Model:</p>
                <p className="mb-2">RCMS provides clinical advocacy, resource coordination, and evidence-based support. Services may include:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Comprehensive clinical assessment and review of medical records.</li>
                  <li>Care coordination and communication with my treating healthcare providers.</li>
                  <li>Identification of barriers to recovery and connection to community resources.</li>
                  <li>Clinical consultation and analysis for my legal team to support my case.</li>
                </ul>
                <p className="mt-2">
                  I understand that RCMS and its staff are Registered Nurses and Care Managers. <strong>THEY DO NOT PROVIDE LEGAL ADVICE.</strong> All legal decisions remain the responsibility of my attorney.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">3. My Responsibilities as a Client:</p>
                <p className="mb-2">I agree to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Provide accurate and complete information about my health and circumstances.</li>
                  <li>Participate actively in the care management process.</li>
                  <li>Inform my RCMS Care Manager of significant changes in my health or treatment.</li>
                  <li>Notify RCMS if I wish to discontinue services.</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-2">4. Financial Agreement:</p>
                <p>
                  I understand that RCMS services are engaged and compensated by my legal representative/law firm under a separate business agreement. I will not receive a bill or be directly charged by RCMS for these services. This financial arrangement does not influence the clinical judgment or advocacy provided by my RCMS Care Manager.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">5. Confidentiality:</p>
                <p>
                  I understand that my privacy is protected by law and by RCMS policies. I will receive a separate Notice of Privacy Practices that details these protections. I authorize the necessary use and disclosure of my health information through accompanying consent forms.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">6. Right to Discontinue:</p>
                <p>
                  I may discontinue RCMS services at any time by providing verbal or written notice to my Care Manager and my attorney.
                </p>
              </div>
            </div>
          </ConsentSection>

          {/* 2. Authorization for Legal Disclosure */}
          <ConsentSection
            title="2. Authorization for Legal Disclosure"
            signedAt={consent.legal_disclosure_signed_at}
            signature={consent.legal_disclosure_signature}
          >
            <h3 className="text-base font-bold mb-3">AUTHORIZATION FOR CLINICAL CONSULTATION & DISCLOSURE OF PROTECTED HEALTH INFORMATION TO LEGAL COUNSEL/REPRESENTATIVE</h3>
            
            {consent.legal_disclosure_attorney_name && (
              <p className="mb-4">
                <strong>Attorney/Firm Name:</strong> {consent.legal_disclosure_attorney_name}
              </p>
            )}
            
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-2">Coordination of Authorizations:</p>
                <p>
                  This is one of three distinct authorizations for Reconcile Care Management Services (RCMS). Each form serves a separate purpose: collaboration with your legal team, obtaining your records, and coordinating with your healthcare providers. These authorizations are designed to work together. Signing one does not invalidate the others. You may revoke any one authorization without affecting the others.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">RCMS's Role as a Clinical Business Associate:</p>
                <p>
                  Reconcile Care Management Services (RCMS) operates as a Business Associate under HIPAA to your legal team. This means we are engaged by your attorneys to provide specialized, clinical support for your case. We do not provide legal advice. Our role is to organize, interpret, and translate complex medical information into clear, actionable insights for your legal team.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">Specific Authorization for Legal Collaboration:</p>
                <p className="mb-2">
                  I specifically authorize and direct my Reconcile Care Management Services (RCMS) Care Manager to discuss, consult on, and disclose my Protected Health Information (PHI) and all pertinent clinical information with my designated legal representative for the purpose of legal case coordination and strategy.
                </p>
                <p className="mb-2">This includes, but is not limited to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Verbal consultations, strategy discussions, and updates.</li>
                  <li>Written summaries, assessments, and reports.</li>
                  <li>Reviews and interpretations of medical records.</li>
                  <li>Analysis of treatment plans and future care needs.</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-2">Nurse's Fiduciary Duty & Your Rights:</p>
                <p className="mb-2">
                  As Registered Nurses and Care Managers, we have a professional and ethical fiduciary duty to you, our client. This means our primary obligation is to act in your best interest, with loyalty, and to protect your confidential information.
                </p>
                <p>
                  You have the absolute right to revoke this authorization, in whole or in part, at any time, for any reason.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">Expiration:</p>
                <p>
                  This authorization will expire upon the formal closure of my case with RCMS, or one (1) year from the date signed, whichever occurs first.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">Re-Disclosure Notice:</p>
                <p>
                  I understand that information disclosed to my legal representative may be re-disclosed by them in the course of my legal proceedings and may no longer be protected by federal HIPAA regulations.
                </p>
              </div>
            </div>
          </ConsentSection>

          {/* 3. Authorization to Obtain Records */}
          <ConsentSection
            title="3. Authorization to Obtain Records"
            signedAt={consent.obtain_records_signed_at}
            signature={consent.obtain_records_signature}
          >
            <h3 className="text-base font-bold mb-3">AUTHORIZATION TO OBTAIN PROTECTED HEALTH INFORMATION</h3>
            
            {consent.obtain_records_injury_date && (
              <p className="mb-4">
                <strong>Date of Injury/Incident:</strong> {consent.obtain_records_injury_date}
              </p>
            )}
            
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-2">Coordination of Authorizations:</p>
                <p>
                  This is one of three distinct authorizations for Reconcile Care Management Services (RCMS). Each form serves a separate purpose. You may revoke any one authorization without affecting the others.
                </p>
              </div>

              <div>
                <p className="mb-2">
                  I hereby authorize any and all physicians, healthcare providers, hospitals, clinics, rehabilitation facilities, insurance companies, employers, and other entities to release and disclose my complete records and Protected Health Information (PHI) to Reconcile Care Management Services (RCMS) and its assigned Care Managers.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">Information to Be Disclosed:</p>
                <p className="mb-2">
                  This authorization covers all records pertaining to my condition, treatment, and related claims, including but not limited to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>All medical records, office notes, charts, and diagnoses.</li>
                  <li>Diagnostic reports (e.g., MRI, X-Ray, CT Scan, EMG).</li>
                  <li>Billing statements, itemized charges, and payment records.</li>
                  <li>Therapy records (physical, occupational, speech, cognitive).</li>
                  <li>Employment records related to job duties, wages, and injury.</li>
                  <li>Pharmacy records.</li>
                  <li>Any other documents relevant to the injury/incident.</li>
                </ul>
                <p className="mt-2">
                  This authorization specifically excludes 'psychotherapy notes' as defined by HIPAA. A separate authorization is required for those notes.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">Purpose:</p>
                <p>
                  The information is necessary for Reconcile Care Management Services to provide comprehensive care management, assessment, and coordination of services related to my case.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">Important Distinction:</p>
                <p>
                  You may have already signed a general release with your attorney. This RCMS-specific authorization is required under HIPAA to permit healthcare entities to release your PHI directly to RCMS.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">Expiration:</p>
                <p>
                  This authorization will expire one (1) year from the date signed, or upon the formal closure of my case with RCMS, whichever occurs first.
                </p>
              </div>
            </div>
          </ConsentSection>

          {/* 4. Authorization for Healthcare Coordination */}
          <ConsentSection
            title="4. Authorization for Healthcare Coordination"
            signedAt={consent.healthcare_coord_signed_at}
            signature={consent.healthcare_coord_signature}
          >
            <h3 className="text-base font-bold mb-3">AUTHORIZATION TO DISCLOSE INFORMATION FOR HEALTHCARE COORDINATION</h3>
            
            {(consent.healthcare_coord_pcp || consent.healthcare_coord_specialist || consent.healthcare_coord_therapy) && (
              <div className="mb-4 space-y-1">
                {consent.healthcare_coord_pcp && <p><strong>Primary Care Physician:</strong> {consent.healthcare_coord_pcp}</p>}
                {consent.healthcare_coord_specialist && <p><strong>Specialist(s):</strong> {consent.healthcare_coord_specialist}</p>}
                {consent.healthcare_coord_therapy && <p><strong>Therapy Provider(s):</strong> {consent.healthcare_coord_therapy}</p>}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-2">Coordination of Authorizations:</p>
                <p>
                  This is one of three distinct authorizations for Reconcile Care Management Services (RCMS). You may revoke any one authorization without affecting the others.
                </p>
              </div>

              <div>
                <p className="mb-2">
                  I hereby authorize Reconcile Care Management Services (RCMS) and its assigned Care Managers to disclose, release, and discuss the Protected Health Information (PHI) and professional Care Management work product they create, compile, or review in the course of managing my case.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">Information to Be Disclosed:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Care Management Assessments, Initial Evaluations, and Clinical Reviews.</li>
                  <li>Progress Reports, Summaries, and Correspondence.</li>
                  <li>Reviews and summaries of medical records and other PHI.</li>
                  <li>Treatment plan and resource recommendations.</li>
                  <li>Functional capacity evaluations or work status opinions (if performed).</li>
                  <li>Identification of barriers to recovery and care plan coordination.</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-2">Specific Authorized Recipients:</p>
                <p>
                  This information may be disclosed ONLY to my treating healthcare providers for the purpose of coordinating my care. This includes my current and future treating physicians, therapists, and other healthcare providers.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">Purpose:</p>
                <p>
                  This authorization allows RCMS to coordinate my healthcare by sharing relevant assessments and recommendations with my treating medical team to support a unified approach to my treatment and recovery.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">Expiration:</p>
                <p>
                  This authorization will expire upon the formal closure of my case with RCMS, or one (1) year from the date signed, whichever occurs first.
                </p>
              </div>
            </div>
          </ConsentSection>

          {/* 5. HIPAA Privacy Notice */}
          <ConsentSection
            title="5. HIPAA Privacy Notice"
            signedAt={consent.hipaa_acknowledged_at}
            signature={consent.hipaa_signature}
          >
            <h3 className="text-base font-bold mb-2">NOTICE OF PRIVACY PRACTICES</h3>
            <p className="text-sm mb-1">Reconcile Care Management Services (RCMS)</p>
            <p className="text-sm mb-4">Effective Date: 01/01/2026</p>
            
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-2">
                  THIS NOTICE DESCRIBES HOW PROTECTED HEALTH INFORMATION (PHI) ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW THE FOLLOWING CAREFULLY.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">Our Commitment to Your Privacy:</p>
                <p>
                  This Notice describes the privacy practices of Reconcile Care Management Services (RCMS). Our primary goal is to provide you with exceptional care management and advocacy. A critical part of that service is protecting the confidentiality and security of your health information.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">OUR PLEDGE REGARDING YOUR PROTECTED HEALTH INFORMATION (PHI):</p>
                <p className="mb-2">
                  At RCMS, we are committed to protecting the privacy of your health information. We are required by law to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Maintain the privacy of your Protected Health Information (PHI);</li>
                  <li>Provide you with this Notice of our legal duties and privacy practices;</li>
                  <li>Abide by the terms of this Notice currently in effect;</li>
                  <li>Notify you following a breach of your unsecured PHI.</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-2">HOW WE MAY USE AND DISCLOSE YOUR PHI:</p>
                
                <div className="ml-4 space-y-3">
                  <div>
                    <p className="font-semibold mb-1">1. For Treatment, Payment, or Healthcare Operations</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Treatment:</strong> We may use and disclose your PHI to provide, coordinate, or manage your healthcare.</li>
                      <li><strong>Payment:</strong> We may use and disclose your PHI to obtain payment for services.</li>
                      <li><strong>Healthcare Operations:</strong> We may use your PHI for quality assessment and business planning.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold mb-1">2. With Your Written Authorization</p>
                    <p>
                      We will not use or disclose your PHI for purposes not described in this Notice without your written authorization. You may revoke an authorization at any time in writing.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold mb-1">3. Without Your Authorization – As Permitted by Law</p>
                    <p>
                      We may use or disclose your PHI when required by law, for public health activities, health oversight, judicial proceedings, law enforcement, to avert serious threats to health or safety, and other purposes permitted by law.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-semibold mb-2">YOUR RIGHTS REGARDING YOUR PHI:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Right to Inspect and Copy your PHI</li>
                  <li>Right to Amend your PHI if incorrect</li>
                  <li>Right to an Accounting of Disclosures</li>
                  <li>Right to Request Restrictions on uses</li>
                  <li>Right to Request Confidential Communications</li>
                  <li>Right to a Paper Copy of This Notice</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-2">COMPLAINTS:</p>
                <p>
                  If you believe your privacy rights have been violated, you may file a complaint with us or with the Secretary of the U.S. Department of Health and Human Services. You will not be penalized for filing a complaint.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">Questions or Concerns:</p>
                <p className="mb-1">Contact our Privacy Officer:</p>
                <p className="mb-1">Traci Johnson, BSN RN CCM</p>
                <p className="mb-1">251 Clearlake Dr., Grand Prairie, TX 75054</p>
                <p className="mb-1">Phone: 682-556-8472</p>
                <p>Email: traci.johnson@rcmspllc.com</p>
              </div>
            </div>
          </ConsentSection>
        </div>
      </CardContent>
    </Card>
  );
}
