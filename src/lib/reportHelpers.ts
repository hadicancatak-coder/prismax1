import type { ReportDocument, ReportElement, TableElementData, TextElementData, ChartElementData, ImageElementData } from "@/types/report";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function generateElementId(type: string): string {
  return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createTableElement(position: number): ReportElement {
  return {
    id: generateElementId('table'),
    type: 'table',
    position,
    config: {
      width: 'full',
    },
    data: {
      rows: 5,
      cols: 5,
      cells: {},
      title: 'New Table',
    } as TableElementData,
  };
}

export function createTextElement(position: number): ReportElement {
  return {
    id: generateElementId('text'),
    type: 'text',
    position,
    config: {
      width: 'full',
    },
    data: {
      content: '<p>Start typing...</p>',
    } as TextElementData,
  };
}

export function createChartElement(position: number): ReportElement {
  return {
    id: generateElementId('chart'),
    type: 'chart',
    position,
    config: {
      width: 'full',
      height: 400,
    },
    data: {
      chartType: 'bar',
      xAxis: '',
      yAxis: [],
      title: 'New Chart',
    } as ChartElementData,
  };
}

export function createImageElement(position: number): ReportElement {
  return {
    id: generateElementId('image'),
    type: 'image',
    position,
    config: {
      width: 'full',
    },
    data: {
      url: '',
      alt: '',
      caption: '',
    } as ImageElementData,
  };
}

export function exportReportToJSON(report: ReportDocument): string {
  return JSON.stringify(report, null, 2);
}

export function importReportFromJSON(json: string): ReportDocument | null {
  try {
    return JSON.parse(json) as ReportDocument;
  } catch (error) {
    console.error('Failed to parse report JSON:', error);
    return null;
  }
}

export async function exportReportToPDF(reportName: string, canvasElementId: string = 'report-canvas'): Promise<void> {
  const canvas = document.getElementById(canvasElementId);
  if (!canvas) {
    throw new Error('Report canvas element not found');
  }

  // Capture the canvas as an image
  const canvasImage = await html2canvas(canvas, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvasImage.toDataURL('image/png');
  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvasImage.height * imgWidth) / canvasImage.width;
  let heightLeft = imgHeight;

  const pdf = new jsPDF('p', 'mm', 'a4');
  let position = 0;

  // Add first page
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Add additional pages if content is longer than one page
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${reportName.replace(/\s+/g, '_')}.pdf`);
}
