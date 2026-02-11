import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { getSensitiveDataSummaryForPDF } from "./sensitiveDataExport";

interface CaseSummaryData {
  caseId: string;
  clientLabel: string;
  status: string;
  attyRef: string;
  timeline: Array<{ date: string; event: string }>;
  reports: Array<{ title: string; date: string; status: string }>;
  followUps: Array<{ title: string; dueDate: string; status: string }>;
  messagesSummary: { total: number; lastMessageDate: string };
  viewerRole?: string; // Role of person generating the PDF
}

export async function generateCaseSummaryPDF(data: CaseSummaryData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = 20;

  // Header - Branded
  doc.setFillColor(15, 42, 106); // Navy
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Reconcile C.A.R.E.", 20, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Case Management System - Secure Record", 20, 22);

  // Watermark
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(40);
  doc.setFont("helvetica", "bold");
  const watermarkText = "Reconcile C.A.R.E. Secure Record";
  const textWidth = doc.getTextWidth(watermarkText);
  doc.saveGraphicsState();
  doc.setGState({ opacity: 0.1 } as any);
  doc.text(watermarkText, (pageWidth - textWidth) / 2, pageHeight / 2, {
    angle: 45,
  });
  doc.restoreGraphicsState();

  yPosition = 40;

  // Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Case Summary Report", 20, yPosition);
  yPosition += 10;

  // Generated timestamp
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Generated: ${format(new Date(), "MMM dd, yyyy 'at' h:mm a")}`,
    20,
    yPosition
  );
  yPosition += 15;

  // Case Metadata
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(176, 152, 55); // Gold
  doc.text("Case Information", 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  autoTable(doc, {
    startY: yPosition,
    head: [["Field", "Value"]],
    body: [
      ["Case ID", data.caseId.slice(0, 8)],
      ["Client", data.clientLabel],
      ["Status", data.status],
      ["Attorney Reference", data.attyRef || "N/A"],
    ],
    theme: "grid",
    headStyles: { fillColor: [15, 42, 106], textColor: 255 },
    margin: { left: 20 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Timeline Milestones
  if (data.timeline.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(176, 152, 55);
    doc.text("Timeline Milestones", 20, yPosition);
    yPosition += 8;

    autoTable(doc, {
      startY: yPosition,
      head: [["Date", "Event"]],
      body: data.timeline.map((t) => [t.date, t.event]),
      theme: "grid",
      headStyles: { fillColor: [18, 143, 139], textColor: 255 },
      margin: { left: 20 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Check if we need a new page
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  // Reviewed Reports
  if (data.reports.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(176, 152, 55);
    doc.text("Reviewed Reports", 20, yPosition);
    yPosition += 8;

    autoTable(doc, {
      startY: yPosition,
      head: [["Report Title", "Date", "Status"]],
      body: data.reports.map((r) => [r.title, r.date, r.status]),
      theme: "grid",
      headStyles: { fillColor: [18, 143, 139], textColor: 255 },
      margin: { left: 20 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Check if we need a new page
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  // Open Follow-Ups
  if (data.followUps.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(176, 152, 55);
    doc.text("Open Follow-Ups", 20, yPosition);
    yPosition += 8;

    autoTable(doc, {
      startY: yPosition,
      head: [["Task", "Due Date", "Status"]],
      body: data.followUps.map((f) => [f.title, f.dueDate, f.status]),
      theme: "grid",
      headStyles: { fillColor: [18, 143, 139], textColor: 255 },
      margin: { left: 20 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Communication Summary
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(176, 152, 55);
  doc.text("Communication Summary", 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(`Total Messages: ${data.messagesSummary.total}`, 25, yPosition);
  yPosition += 6;
  doc.text(
    `Last Message: ${data.messagesSummary.lastMessageDate}`,
    25,
    yPosition
  );
  yPosition += 15;

  // Check if we need a new page
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = 20;
  }

  // Sensitive Information Summary (filtered by disclosure scope)
  if (data.viewerRole) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(176, 152, 55);
    doc.text("Sensitive Information Summary", 20, yPosition);
    yPosition += 8;

    try {
      const sensitiveSummary = await getSensitiveDataSummaryForPDF(
        data.caseId,
        data.viewerRole
      );
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      
      const lines = doc.splitTextToSize(sensitiveSummary, pageWidth - 50);
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 25, yPosition);
        yPosition += 5;
      });
    } catch (error) {
      console.error('Error adding sensitive data summary:', error);
      doc.text('Sensitive information summary unavailable', 25, yPosition);
    }
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Reconcile C.A.R.E. Secure Record - Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    doc.text(
      "CONFIDENTIAL - Attorney Work Product",
      pageWidth / 2,
      pageHeight - 6,
      { align: "center" }
    );
  }

  // Save
  doc.save(`Case_Summary_${data.caseId.slice(0, 8)}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}