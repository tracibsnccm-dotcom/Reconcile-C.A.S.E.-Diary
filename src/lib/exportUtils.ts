import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const exportToPDF = (title: string, data: any[], columns: string[]) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 30);
  
  const tableData = data.map(item => 
    columns.map(col => String(item[col] || ''))
  );
  
  autoTable(doc, {
    head: [columns],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [79, 70, 229] },
  });
  
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportToCSV = (title: string, data: any[], columns: string[]) => {
  const headers = columns.join(',');
  const rows = data.map(item => 
    columns.map(col => {
      const value = item[col];
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  ).join('\n');
  
  const csv = `${headers}\n${rows}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportWellnessReport = async (caseId: string, checkins: any[]) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Wellness Progress Report', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Case ID: ${caseId}`, 14, 32);
  doc.text(`Report Date: ${format(new Date(), 'PPP')}`, 14, 38);
  doc.text(`Total Check-ins: ${checkins.length}`, 14, 44);
  
  // Summary statistics
  const avgWellness = Math.round(
    checkins.reduce((sum, c) => 
      sum + (c.p_physical + c.p_psychological + c.p_psychosocial + c.p_purpose) / 4, 0
    ) / checkins.length
  );
  
  const avgPain = (checkins.reduce((sum, c) => sum + c.pain_scale, 0) / checkins.length).toFixed(1);
  
  doc.setFontSize(12);
  doc.text('Summary', 14, 55);
  doc.setFontSize(10);
  doc.text(`Average Wellness Score: ${avgWellness}/100`, 20, 62);
  doc.text(`Average Pain Level: ${avgPain}/10`, 20, 68);
  
  // Table of check-ins
  const tableData = checkins.map(c => [
    format(new Date(c.created_at), 'MM/dd/yyyy'),
    Math.round((c.p_physical + c.p_psychological + c.p_psychosocial + c.p_purpose) / 4),
    c.pain_scale,
    c.depression_scale,
    c.anxiety_scale,
  ]);
  
  autoTable(doc, {
    head: [['Date', 'Wellness', 'Pain', 'Depression', 'Anxiety']],
    body: tableData,
    startY: 75,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [79, 70, 229] },
  });
  
  doc.save(`wellness-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
