import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPDF = async (elementId: string, filename: string = 'quote.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    // Find all elements with the class 'pdf-page'
    const pages = element.querySelectorAll('.pdf-page');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as HTMLElement;
      
      // Capture each page as a canvas
      const canvas = await html2canvas(page, {
        scale: 1.5, // Reduced scale for smaller file size, still good for print
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Convert to JPEG with 0.75 quality for significant size reduction
      const imgData = canvas.toDataURL('image/jpeg', 0.75);
      
      if (i > 0) {
        pdf.addPage();
      }

      // Calculate dimensions to fit A4
      const imgProps = pdf.getImageProperties(imgData);
      const ratio = imgProps.width / imgProps.height;
      const displayHeight = pdfWidth / ratio;

      // If the content is taller than one page, we might need to handle it, 
      // but since we structured it into pages, it should mostly fit.
      // For now, we'll just add it. If it's too long, it will be clipped or we can scale it.
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(displayHeight, pdfHeight));
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
