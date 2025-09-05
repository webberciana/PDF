import React, { useState, useEffect, useRef } from 'react';
import { FileText, AlertCircle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface PDFViewerProps {
  file: File;
  onPageClick?: (x: number, y: number, page: number) => void;
  signaturePosition?: { x: number, y: number, page: number } | null;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file, onPageClick, signaturePosition }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPDF = async () => {
      if (!file) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (file.type === 'application/pdf') {
          // Importar PDF.js dinámicamente
          const pdfjsLib = await import('pdfjs-dist');
          
          // Configurar worker
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
          
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          
          setTotalPages(pdf.numPages);
          
          // Renderizar la primera página
          await renderPage(pdf, 1);
          
          // Crear URL para fallback
          const url = URL.createObjectURL(file);
          setPdfUrl(url);
        } else {
          setError('Tipo de archivo no soportado para vista previa');
        }
      } catch (err) {
        console.error('Error loading PDF:', err);
        // Fallback a iframe si PDF.js falla
        if (file.type === 'application/pdf') {
          const url = URL.createObjectURL(file);
          setPdfUrl(url);
          setTotalPages(1);
        } else {
          setError('Error al cargar el documento');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [file]);

  const renderPage = async (pdf: any, pageNum: number) => {
    try {
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const viewport = page.getViewport({ scale: zoom });
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.style.width = '100%';
      canvas.style.height = 'auto';

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Error rendering page:', err);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onPageClick || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calcular la posición relativa dentro del canvas
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    
    // Convertir a porcentajes basados en las dimensiones reales del canvas
    const x = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
    const y = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));
    
    onPageClick(x, y, currentPage);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  // Efecto para re-renderizar cuando cambia el zoom
  useEffect(() => {
    const reRenderPage = async () => {
      if (file && file.type === 'application/pdf') {
        try {
          const pdfjsLib = await import('pdfjs-dist');
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          await renderPage(pdf, currentPage);
        } catch (err) {
          console.error('Error re-rendering page:', err);
        }
      }
    };

    reRenderPage();
  }, [zoom, currentPage, file]);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center min-h-[400px] flex items-center justify-center">
        <div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando documento...</p>
        </div>
      </div>
    );
  }

  if (error || file.type !== 'application/pdf') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center min-h-[400px] flex items-center justify-center">
        <div>
          {file.type !== 'application/pdf' ? (
            <>
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4 text-lg font-medium">
                Archivo Word seleccionado
              </p>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                La vista previa no está disponible para archivos Word. El archivo será procesado al aplicar la firma.
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 mb-4 text-lg font-medium">
                Error al cargar el documento
              </p>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                {error || 'No se pudo cargar la vista previa del PDF'}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Controles */}
      <div className="bg-gray-50 p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700 truncate">
              {file.name}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </div>
        </div>
        
        {/* Controles de zoom */}
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs text-gray-600 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded ml-2"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Visor PDF */}
      <div 
        ref={containerRef}
        className="relative bg-gray-100 overflow-auto"
        style={{ height: '70vh', minHeight: '400px' }}
      >
        <div className="relative inline-block min-w-full">
          {/* Canvas para renderizar el PDF */}
          <canvas
            ref={canvasRef}
            className="block mx-auto shadow-lg"
            style={{ maxWidth: '100%', height: 'auto' }}
          />

          {/* Overlay transparente para capturar clics */}
          {onPageClick && canvasRef.current && (
            <div
              ref={overlayRef}
              className="absolute inset-0 cursor-crosshair"
              style={{ 
                width: canvasRef.current.style.width || '100%',
                height: canvasRef.current.style.height || 'auto',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)'
              }}
              onClick={handleOverlayClick}
            >
              {/* Indicador de posición de firma con líneas cortadas */}
              {signaturePosition && signaturePosition.page === currentPage && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${signaturePosition.x}%`,
                    top: `${signaturePosition.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {/* Rectángulo con líneas cortadas */}
                  <div 
                    className="border-2 border-red-500 bg-red-100 bg-opacity-30"
                    style={{
                      width: '100px',
                      height: '50px',
                      borderStyle: 'dashed',
                      borderRadius: '4px',
                      position: 'relative'
                    }}
                  >
                    {/* Etiqueta */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                      📝 Firma aquí
                    </div>
                    
                    {/* Punto central */}
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                    
                    {/* Esquinas para mejor visibilidad */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-red-600"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-red-600"></div>
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-red-600"></div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-red-600"></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fallback iframe si el canvas no funciona */}
          {!canvasRef.current && pdfUrl && (
            <iframe
              src={pdfUrl}
              className="w-full border-0 block mx-auto shadow-lg"
              style={{ height: '600px', minHeight: '400px' }}
              title="Vista previa del PDF"
            />
          )}
        </div>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 p-3 border-t">
        <p className="text-xs text-blue-700 text-center">
          {onPageClick ? (
            <>
              <span className="font-medium">💡 Consejo:</span> Haz clic en el documento para seleccionar dónde colocar tu firma. Usa los controles de zoom para mayor precisión.
            </>
          ) : (
            'Vista previa del documento'
          )}
        </p>
      </div>
    </div>
  );
};

export default PDFViewer;