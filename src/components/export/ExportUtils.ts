import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export class ExportUtils {
  static exportToCSV(filename: string, rows: Record<string, any>[], headers?: { key: string; label: string }[]) {
    if (!rows || !rows.length) return;

    const columnHeaders = headers || Object.keys(rows[0]).map(k => ({ key: k, label: k }));
    const headerLine = columnHeaders.map(h => `"${h.label.replace(/"/g, '""')}"`).join(',');

    const lines = rows.map(row => {
      return columnHeaders
        .map(h => {
          const val = row[h.key] !== undefined && row[h.key] !== null ? String(row[h.key]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headerLine, ...lines].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static exportToExcel(filename: string, rows: Record<string, any>[], headers?: { key: string; label: string }[]) {
    // Generates an Excel-compatible CSV file with BOM
    if (!rows || !rows.length) return;

    const columnHeaders = headers || Object.keys(rows[0]).map(k => ({ key: k, label: k }));
    const headerLine = columnHeaders.map(h => `"${h.label.replace(/"/g, '""')}"`).join('\t');

    const lines = rows.map(row => {
      return columnHeaders
        .map(h => {
          const val = row[h.key] !== undefined && row[h.key] !== null ? String(row[h.key]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join('\t');
    });

    const blob = new Blob(['\ufeff' + [headerLine, ...lines].join('\r\n')], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static exportToPDF(
    title: string,
    subtitle: string,
    headers: string[],
    dataRows: (string | number)[][],
    filename: string
  ) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    // Document Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text('LeaveEase – Employee Leave Management System', 40, 40);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105);
    doc.text(title, 40, 60);

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`${subtitle} • Generated on ${new Date().toLocaleString()}`, 40, 75);

    // Auto Table
    autoTable(doc, {
      head: [headers],
      body: dataRows,
      startY: 90,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235], // Blue-600
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [51, 65, 85],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 40, right: 40 },
    });

    doc.save(`${filename}.pdf`);
  }

  static triggerPrint() {
    window.print();
  }
}
