import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToExcel = (data: any[], fileName: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const exportToPDF = (columns: string[], data: any[][], fileName: string) => {
  const doc = new jsPDF();
  (doc as any).autoTable({
    head: [columns],
    body: data,
  });
  doc.save(`${fileName}.pdf`);
};
