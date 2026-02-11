// src/components/CarePlanPDFExport.tsx
// Component for generating and downloading care plan PDFs

import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CarePlanPDFExportProps {
  carePlanId: string;
  carePlanNumber?: number;
  clientName?: string;
  existingPdfUrl?: string | null;
  onPdfGenerated?: (pdfUrl: string) => void;
  variant?: 'button' | 'icon' | 'link';
  size?: 'sm' | 'md' | 'lg';
}

// PDF generation using client-side library (jspdf + jspdf-autotable)
// For production, you'd typically use a server-side solution
// This provides a fallback for immediate functionality

const SCORE_LABELS: Record<number, string> = {
  1: 'Crisis',
  2: 'At Risk',
  3: 'Struggling',
  4: 'Stable',
  5: 'Thriving',
};

const CARE_PLAN_TYPE_LABELS: Record<string, string> = {
  initial: 'Initial Care Plan',
  routine_60_day: '60-Day Routine Review',
  accelerated_30_day: '30-Day Accelerated Review',
  event_based: 'Event-Based Review',
  attorney_request: 'Attorney-Requested Review',
  discharge: 'Discharge Care Plan',
};

const V_NAMES: Record<number, string> = {
  1: 'Validate', 2: 'Vitals', 3: 'Verify', 4: 'Visualize', 5: 'Value',
  6: 'Voice', 7: 'Volunteer', 8: 'Vigilance', 9: 'Victory', 10: 'Verify Discharge',
};

const CarePlanPDFExport: React.FC<CarePlanPDFExportProps> = ({
  carePlanId,
  carePlanNumber = 1,
  clientName = 'Client',
  existingPdfUrl,
  onPdfGenerated,
  variant = 'button',
  size = 'md',
}) => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string): string => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const generatePDF = async () => {
    setGenerating(true);
    setError(null);

    try {
      // Dynamically import jsPDF
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      // Load care plan data
      const { data: carePlan, error: planError } = await supabase
        .from('rc_care_plans')
        .select('*')
        .eq('id', carePlanId)
        .single();

      if (planError || !carePlan) {
        throw new Error('Care plan not found');
      }
      const plan = carePlan;

      // Load case info
      const { data: caseResult, error: caseError } = await supabase
        .from('rc_cases')
        .select('*,rc_clients(*)')
        .eq('id', plan.case_id)
        .eq('is_superseded', false)
        .single();

      const caseInfo = caseResult || {};
      const client = (caseInfo as any).rc_clients || {};

      // Load 4Ps
      const { data: fourPsResult } = await supabase
        .from('rc_fourps_assessments')
        .select('*')
        .eq('care_plan_id', carePlanId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const fourPs = fourPsResult || null;

      // Load SDOH
      const { data: sdohResult } = await supabase
        .from('rc_sdoh_assessments')
        .select('*')
        .eq('care_plan_id', carePlanId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const sdoh = sdohResult || null;

      // Load overlays
      const { data: overlaysData } = await supabase
        .from('rc_overlay_selections')
        .select('*')
        .eq('care_plan_id', carePlanId);

      const overlays = overlaysData || [];

      // Load guidelines
      const { data: guidelinesData } = await supabase
        .from('rc_guideline_references')
        .select('*')
        .eq('care_plan_id', carePlanId);

      const guidelines = guidelinesData || [];

      // Load 10-Vs
      const { data: careVsData } = await supabase
        .from('rc_care_plan_vs')
        .select('*')
        .eq('care_plan_id', carePlanId)
        .order('v_number', { ascending: true });

      const careVs = careVsData || [];

      // Load attestation
      const { data: attestationResult } = await supabase
        .from('rc_care_plan_attestations')
        .select('*')
        .eq('care_plan_id', carePlanId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const attestation = attestationResult || null;

      // Load medications
      const { data: medRecResult } = await supabase
        .from('rc_medication_reconciliations')
        .select('*')
        .eq('care_plan_id', carePlanId)
        .eq('status', 'submitted')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let medications: any[] = [];
      if (medRecResult) {
        const { data: medsResult } = await supabase
          .from('rc_medication_items')
          .select('*')
          .eq('med_rec_id', medRecResult.id)
          .eq('still_taking', true);

        medications = medsResult || [];
      }

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Helper functions
      const addHeader = (text: string) => {
        doc.setFontSize(14);
        doc.setTextColor(15, 42, 106); // PRIMARY_BLUE
        doc.setFont('helvetica', 'bold');
        doc.text(text, 14, yPos);
        yPos += 4;
        doc.setDrawColor(226, 232, 240); // GRAY_200
        doc.line(14, yPos, pageWidth - 14, yPos);
        yPos += 8;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81); // GRAY_700
      };

      const checkPageBreak = (neededSpace: number = 30) => {
        if (yPos > doc.internal.pageSize.getHeight() - neededSpace) {
          doc.addPage();
          yPos = 20;
        }
      };

      // Title
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('Reconcile C.A.R.E.', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;

      doc.setFontSize(20);
      doc.setTextColor(15, 42, 106);
      doc.setFont('helvetica', 'bold');
      doc.text(`Care Plan #${plan.plan_number || 1}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;

      const planTypeLabel = CARE_PLAN_TYPE_LABELS[plan.care_plan_type as string] || plan.care_plan_type || 'Care Plan';
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(planTypeLabel, pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Client info box
      const clientFullName = `${(client as any).first_name || ''} ${(client as any).last_name || ''}`.trim() || 'Unknown';
      doc.setFillColor(248, 250, 252);
      doc.rect(14, yPos - 2, pageWidth - 28, 28, 'F');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Client Name:', 18, yPos + 5);
      doc.text('Case Number:', 18, yPos + 12);
      doc.text('Care Plan Date:', 18, yPos + 19);
      doc.text('Date of Injury:', pageWidth / 2 + 10, yPos + 5);
      doc.text('Injury Type:', pageWidth / 2 + 10, yPos + 12);

      doc.setTextColor(55, 65, 81);
      doc.setFont('helvetica', 'bold');
      doc.text(clientFullName, 50, yPos + 5);
      doc.text((caseInfo as any).case_number || 'N/A', 50, yPos + 12);
      doc.text(formatDate(plan.created_at || ''), 55, yPos + 19);
      doc.text(formatDate((caseInfo as any).date_of_injury || ''), pageWidth / 2 + 45, yPos + 5);
      doc.text((caseInfo as any).injury_type || 'N/A', pageWidth / 2 + 40, yPos + 12);
      doc.setFont('helvetica', 'normal');
      yPos += 35;

      // 4Ps Section
      addHeader('4Ps Wellness Assessment');
      if (fourPs) {
        const fourPsData = [
          ['Domain', 'Score', 'Status'],
          ['P1 - Physical', String((fourPs as any).p1_physical || '-'), SCORE_LABELS[(fourPs as any).p1_physical] || '-'],
          ['P2 - Psychological', String((fourPs as any).p2_psychological || '-'), SCORE_LABELS[(fourPs as any).p2_psychological] || '-'],
          ['P3 - Psychosocial', String((fourPs as any).p3_psychosocial || '-'), SCORE_LABELS[(fourPs as any).p3_psychosocial] || '-'],
          ['P4 - Professional', String((fourPs as any).p4_professional || '-'), SCORE_LABELS[(fourPs as any).p4_professional] || '-'],
        ];

        (doc as any).autoTable({
          startY: yPos,
          head: [fourPsData[0]],
          body: fourPsData.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [15, 42, 106], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 30, halign: 'center' }, 2: { cellWidth: 40 } },
          margin: { left: 14, right: 14 },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;

        // 4Ps Notes
        const notes = [
          { label: 'Physical', value: (fourPs as any).p1_notes },
          { label: 'Psychological', value: (fourPs as any).p2_notes },
          { label: 'Psychosocial', value: (fourPs as any).p3_notes },
          { label: 'Professional', value: (fourPs as any).p4_notes },
        ].filter(n => n.value);

        if (notes.length > 0) {
          doc.setFontSize(9);
          for (const note of notes) {
            checkPageBreak(20);
            doc.setFont('helvetica', 'bold');
            doc.text(`${note.label} Notes:`, 14, yPos);
            doc.setFont('helvetica', 'normal');
            const splitNotes = doc.splitTextToSize(note.value, pageWidth - 32);
            doc.text(splitNotes, 14, yPos + 5);
            yPos += 5 + (splitNotes.length * 4);
          }
        }
      } else {
        doc.setFontSize(9);
        doc.text('No 4Ps assessment data available.', 14, yPos);
        yPos += 10;
      }

      // SDOH Section
      checkPageBreak(50);
      yPos += 5;
      addHeader('Social Determinants of Health (SDOH)');
      if (sdoh) {
        const sdohData = [
          ['Domain', 'Score', 'Status'],
          ['Economic Stability', String((sdoh as any).economic_score || '-'), SCORE_LABELS[(sdoh as any).economic_score] || '-'],
          ['Education Access', String((sdoh as any).education_score || '-'), SCORE_LABELS[(sdoh as any).education_score] || '-'],
          ['Healthcare Access', String((sdoh as any).healthcare_score || '-'), SCORE_LABELS[(sdoh as any).healthcare_score] || '-'],
          ['Neighborhood & Environment', String((sdoh as any).neighborhood_score || '-'), SCORE_LABELS[(sdoh as any).neighborhood_score] || '-'],
          ['Social & Community', String((sdoh as any).social_score || '-'), SCORE_LABELS[(sdoh as any).social_score] || '-'],
        ];

        (doc as any).autoTable({
          startY: yPos,
          head: [sdohData[0]],
          body: sdohData.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [15, 42, 106], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
        });
        yPos = (doc as any).lastAutoTable.finalY + 8;

        // SDOH Flags
        const flags = [];
        if ((sdoh as any).housing_insecurity) flags.push('Housing Insecurity');
        if ((sdoh as any).food_insecurity) flags.push('Food Insecurity');
        if ((sdoh as any).transportation_barrier) flags.push('Transportation Barrier');
        if ((sdoh as any).financial_hardship) flags.push('Financial Hardship');
        if ((sdoh as any).social_isolation) flags.push('Social Isolation');

        if (flags.length > 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Identified Barriers:', 14, yPos);
          yPos += 5;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          for (const flag of flags) {
            doc.text(`⚠ ${flag}`, 18, yPos);
            yPos += 5;
          }
        }
      } else {
        doc.setFontSize(9);
        doc.text('No SDOH assessment data available.', 14, yPos);
        yPos += 10;
      }

      // Overlays Section
      doc.addPage();
      yPos = 20;
      addHeader('Applied Condition Overlays');
      if (overlays.length > 0) {
        doc.setFontSize(9);
        for (const overlay of overlays) {
          const title = ((overlay as any).overlay_type || '').replace(/_/g, ' ');
          const subtype = (overlay as any).overlay_subtype ? ` (${(overlay as any).overlay_subtype})` : '';
          doc.setFont('helvetica', 'bold');
          doc.text(`• ${title}${subtype}`, 14, yPos);
          yPos += 5;
          if ((overlay as any).application_notes) {
            doc.setFont('helvetica', 'normal');
            const splitNotes = doc.splitTextToSize((overlay as any).application_notes, pageWidth - 36);
            doc.text(splitNotes, 20, yPos);
            yPos += splitNotes.length * 4 + 3;
          }
        }
      } else {
        doc.setFontSize(9);
        doc.text('No condition overlays applied.', 14, yPos);
        yPos += 10;
      }

      // Guidelines Section
      checkPageBreak(40);
      yPos += 5;
      addHeader('Clinical Guidelines Reference');
      if (guidelines.length > 0) {
        doc.setFontSize(9);
        for (const g of guidelines) {
          checkPageBreak(25);
          doc.setFont('helvetica', 'bold');
          doc.text(`[${((g as any).guideline_type || '').toUpperCase()}] ${(g as any).guideline_name || ''}`, 14, yPos);
          yPos += 5;
          doc.setFont('helvetica', 'normal');
          if ((g as any).recommendation) {
            const splitRec = doc.splitTextToSize((g as any).recommendation, pageWidth - 32);
            doc.text(splitRec, 14, yPos);
            yPos += splitRec.length * 4;
          }
          if ((g as any).deviation_reason) {
            doc.setTextColor(220, 38, 38);
            doc.text(`⚠ Deviation: ${(g as any).deviation_reason}`, 14, yPos);
            yPos += 4;
            if ((g as any).deviation_justification) {
              doc.text(`Justification: ${(g as any).deviation_justification}`, 18, yPos);
              yPos += 4;
            }
            doc.setTextColor(55, 65, 81);
          }
          yPos += 5;
        }
      } else {
        doc.setFontSize(9);
        doc.text('No clinical guidelines referenced.', 14, yPos);
        yPos += 10;
      }

      // 10-Vs Section
      checkPageBreak(40);
      yPos += 5;
      addHeader('10-Vs of Care Management');
      if (careVs.length > 0) {
        doc.setFontSize(9);
        for (const v of careVs) {
          checkPageBreak(20);
          const vName = V_NAMES[(v as any).v_number] || `V${(v as any).v_number}`;
          const statusIcon = (v as any).status === 'completed' ? '✓' : '○';
          doc.setFont('helvetica', 'bold');
          doc.text(`${statusIcon} V${(v as any).v_number} – ${vName} (${(v as any).status || 'pending'})`, 14, yPos);
          yPos += 5;
          doc.setFont('helvetica', 'normal');
          if ((v as any).findings) {
            doc.text(`Findings: ${(v as any).findings}`, 18, yPos);
            yPos += 4;
          }
          if ((v as any).recommendations) {
            doc.text(`Recommendations: ${(v as any).recommendations}`, 18, yPos);
            yPos += 4;
          }
          yPos += 3;
        }
      } else {
        doc.setFontSize(9);
        doc.text('No 10-Vs data available.', 14, yPos);
        yPos += 10;
      }

      // Medications Section
      doc.addPage();
      yPos = 20;
      addHeader('Current Medications');
      if (medications.length > 0) {
        const medData = medications.map(m => [
          (m as any).medication_name || '',
          (m as any).dosage || '-',
          (m as any).frequency || '-',
          (m as any).prescriber || '-',
        ]);

        (doc as any).autoTable({
          startY: yPos,
          head: [['Medication', 'Dosage', 'Frequency', 'Prescriber']],
          body: medData,
          theme: 'grid',
          headStyles: { fillColor: [15, 42, 106], textColor: 255, fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          margin: { left: 14, right: 14 },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(9);
        doc.text('No medications on file.', 14, yPos);
        yPos += 10;
      }

      // Attestation Section
      checkPageBreak(50);
      yPos += 5;
      addHeader('Care Plan Attestation');
      if (attestation) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 101, 52); // Green
        doc.text('✓ Care Plan Finalized', 14, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        doc.setFontSize(9);
        doc.text(`Attested on ${formatDateTime((attestation as any).attested_at || '')}`, 14, yPos);
        yPos += 10;

        const skipped = (attestation as any).skipped_sections || [];
        if (skipped.length > 0) {
          doc.text(`Sections marked N/A: ${skipped.join(', ')}`, 14, yPos);
          yPos += 5;
          if ((attestation as any).skipped_justification) {
            doc.text(`Justification: ${(attestation as any).skipped_justification}`, 14, yPos);
            yPos += 5;
          }
        }

        yPos += 5;
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        const disclaimer = 'By finalizing this care plan, the RN attested that all information has been reviewed for accuracy, clinical guidelines have been appropriately referenced, client-specific overlays have been considered, and this care plan reflects appropriate clinical judgment.';
        const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - 28);
        doc.text(splitDisclaimer, 14, yPos);
      } else {
        doc.setFontSize(9);
        doc.text('This care plan has not been finalized.', 14, yPos);
      }

      // Add page numbers to all pages
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(
          'Reconcile C.A.R.E. – Confidential Health Information',
          14,
          doc.internal.pageSize.getHeight() - 10
        );
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth - 14,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'right' }
        );
        doc.text(
          `Generated: ${new Date().toLocaleString()}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 6,
          { align: 'center' }
        );
      }

      // Save the PDF
      const fileName = `CarePlan_${plan.plan_number || 1}_${clientFullName.replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);

      // Optionally upload to storage and update care plan record
      // This would require server-side implementation for production

      if (onPdfGenerated) {
        onPdfGenerated(fileName);
      }

    } catch (err: any) {
      console.error('PDF generation error:', err);
      setError(err.message || 'Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  const handleClick = () => {
    if (existingPdfUrl) {
      window.open(existingPdfUrl, '_blank');
    } else {
      generatePDF();
    }
  };

  const sizeStyles = {
    sm: { padding: '0.25rem 0.5rem', fontSize: '0.75rem' },
    md: { padding: '0.4rem 0.75rem', fontSize: '0.85rem' },
    lg: { padding: '0.5rem 1rem', fontSize: '0.9rem' },
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={generating}
        title={existingPdfUrl ? 'Download PDF' : 'Generate PDF'}
        style={{
          padding: '0.4rem',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          background: generating ? '#f1f5f9' : '#ffffff',
          cursor: generating ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {generating ? '⏳' : '📥'}
      </button>
    );
  }

  if (variant === 'link') {
    return (
      <button
        onClick={handleClick}
        disabled={generating}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#0ea5e9',
          textDecoration: 'underline',
          cursor: generating ? 'not-allowed' : 'pointer',
          ...sizeStyles[size],
        }}
      >
        {generating ? 'Generating...' : existingPdfUrl ? 'Download PDF' : 'Generate PDF'}
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={generating}
        style={{
          ...sizeStyles[size],
          borderRadius: '8px',
          border: 'none',
          background: generating ? '#94a3b8' : '#0f2a6a',
          color: '#ffffff',
          cursor: generating ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}
      >
        {generating ? (
          <>
            <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
            Generating...
          </>
        ) : (
          <>
            📥 {existingPdfUrl ? 'Download PDF' : 'Generate PDF'}
          </>
        )}
      </button>
      {error && (
        <div style={{
          marginTop: '0.5rem',
          padding: '0.5rem',
          borderRadius: '6px',
          background: '#fef2f2',
          color: '#dc2626',
          fontSize: '0.8rem',
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default CarePlanPDFExport;
