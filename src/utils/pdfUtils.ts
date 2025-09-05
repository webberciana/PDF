import { PDFDocument, rgb } from 'pdf-lib';

export const addSignatureToPDF = async (
  pdfFile: File,
  signatureDataUrl: string,
  position: { x: number, y: number, page: number }
): Promise<Uint8Array> => {
  try {
    // Leer el PDF original
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Procesar la imagen de la firma
    const signatureImageBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer());
    const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

    // Obtener la página especificada
    const pages = pdfDoc.getPages();
    if (position.page > pages.length || position.page < 1) {
      throw new Error('Número de página inválido');
    }

    const page = pages[position.page - 1];
    const { width, height } = page.getSize();

    // Calcular las dimensiones y posición de la firma
    const signatureWidth = 100;
    const signatureHeight = 50;
    
    // Convertir porcentajes a coordenadas reales con mayor precisión
    // En PDF, el origen (0,0) está en la esquina inferior izquierda
    const x = Math.max(0, Math.min(width - signatureWidth, (position.x / 100) * width - (signatureWidth / 2)));
    const y = Math.max(0, Math.min(height - signatureHeight, height - ((position.y / 100) * height) - (signatureHeight / 2)));

    // Añadir la firma al PDF
    page.drawImage(signatureImage, {
      x: x,
      y: y,
      width: signatureWidth,
      height: signatureHeight,
    });

    // Devolver el PDF modificado
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error al procesar el PDF:', error);
    throw new Error('Error al aplicar la firma al PDF');
  }
};

export const downloadFile = (fileBytes: Uint8Array, fileName: string) => {
  const blob = new Blob([fileBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};