import React, { useState } from 'react';
import { FileSignature, Download, AlertCircle } from 'lucide-react';
import FileUploader from './components/FileUploader';
import SignaturePad from './components/SignaturePad';
import PDFViewer from './components/PDFViewer';
import { addSignatureToPDF, downloadFile } from './utils/pdfUtils';

interface SignaturePosition {
  x: number;
  y: number;
  page: number;
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [signaturePosition, setSignaturePosition] = useState<SignaturePosition | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setSignaturePosition(null);
    setError(null);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setSignaturePosition(null);
    setError(null);
  };

  const handleSignatureChange = (newSignature: string | null) => {
    setSignature(newSignature);
  };

  const handlePageClick = (x: number, y: number, page: number) => {
    setSignaturePosition({ x, y, page });
  };

  const canApplySignature = selectedFile && signature && signaturePosition;

  const handleApplySignature = async () => {
    if (!canApplySignature) {
      setError('Por favor, selecciona un archivo, crea una firma y elige una posición.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      if (selectedFile.type === 'application/pdf') {
        const signedPdfBytes = await addSignatureToPDF(selectedFile, signature, signaturePosition);
        const fileName = selectedFile.name.replace('.pdf', '_firmado.pdf');
        downloadFile(signedPdfBytes, fileName);
      } else {
        setError('Los archivos Word necesitan ser convertidos a PDF primero. Esta funcionalidad estará disponible pronto.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Contenido principal */}
      <div className="flex-grow container mx-auto px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center items-center mb-4">
            <FileSignature className="h-8 sm:h-12 w-8 sm:w-12 text-blue-600 mr-2 sm:mr-3" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Firma Digital
            </h1>
          </div>
          <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Sube tu documento PDF o Word, crea tu firma y selecciona dónde aplicarla
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 sm:mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="w-full">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Column - Upload & Signature */}
            <div className="space-y-4 sm:space-y-6 order-2 xl:order-1">
              {/* File Upload */}
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">1</span>
                  1. Seleccionar Documento
                </h2>
                <FileUploader
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  onRemoveFile={handleRemoveFile}
                />
              </div>

              {/* Signature Pad */}
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">2</span>
                  2. Crear Firma
                </h2>
                <SignaturePad
                  onSignatureChange={handleSignatureChange}
                  signature={signature}
                />
              </div>

              {/* Signature Position */}
              {signaturePosition && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      <span className="text-sm font-medium text-green-800">✓ Posición seleccionada</span>
                    </div>
                    <button
                      onClick={() => setSignaturePosition(null)}
                      className="text-xs text-green-700 hover:text-green-900 underline"
                    >
                      Cambiar posición
                    </button>
                  </div>
                  <div className="text-xs text-green-700">
                    Página {signaturePosition.page} - X: {Math.round(signaturePosition.x)}%, Y: {Math.round(signaturePosition.y)}%
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Preview */}
            <div className="space-y-4 sm:space-y-6 order-1 xl:order-2">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <span className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">👁</span>
                  Vista Previa del Documento
                </h2>
                {selectedFile ? (
                  <PDFViewer
                    file={selectedFile}
                    onPageClick={handlePageClick}
                    signaturePosition={signaturePosition}
                  />
                ) : (
                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 sm:p-12 text-center min-h-[300px] sm:min-h-[400px] flex items-center justify-center">
                    <div>
                      <FileSignature className="h-12 sm:h-16 w-12 sm:w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-sm sm:text-base">
                        Selecciona un documento para ver la vista previa
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6 sm:mt-8 text-center">
            <button
              onClick={handleApplySignature}
              disabled={!canApplySignature || isProcessing}
              className={`
                inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium rounded-lg transition-all duration-200 w-full sm:w-auto
                ${canApplySignature && !isProcessing
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 sm:h-5 w-4 sm:w-5 border-b-2 border-white mr-2 sm:mr-3"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <Download className="h-4 sm:h-5 w-4 sm:w-5 mr-2 sm:mr-3" />
                  Aplicar Firma y Descargar
                </>
              )}
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 sm:mt-12 bg-white rounded-lg p-4 sm:p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Instrucciones de Uso
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 text-sm text-gray-600">
              <div>
                <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center text-blue-600 font-bold mb-3">
                  1
                </div>
                <p><strong>Sube tu documento:</strong> Selecciona un archivo PDF o Word desde tu dispositivo.</p>
              </div>
              <div>
                <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center text-blue-600 font-bold mb-3">
                  2
                </div>
                <p><strong>Crea tu firma:</strong> Dibuja tu firma, elige color y grosor. Usa el ratón o el dedo en dispositivos táctiles.</p>
              </div>
              <div>
                <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center text-blue-600 font-bold mb-3">
                  3
                </div>
                <p><strong>Posiciona y descarga:</strong> Haz clic en el documento donde quieras la firma y descarga el archivo firmado.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 sm:mt-12 bg-white rounded-lg p-4 sm:p-6 shadow-sm">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Hecho con ❤️ por{' '}
            <a 
              href="https://artxeweb.pages.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
            >
              Artxeweb
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
