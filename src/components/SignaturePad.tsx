import React, { useRef, useEffect, useState } from 'react';
import { Trash2, Download, Palette } from 'lucide-react';

interface SignaturePadProps {
  onSignatureChange: (signature: string | null) => void;
  signature: string | null;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSignatureChange, signature }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [isEmpty, setIsEmpty] = useState(true);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar el canvas
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      
      // Cargar firma existente si la hay
      if (signature) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
          setIsEmpty(false);
        };
        img.src = signature;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [signature, strokeColor, strokeWidth]);

  const getEventPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const pos = getEventPos(e);
    setLastPos(pos);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const pos = getEventPos(e);

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    setIsEmpty(false);
    setLastPos(pos);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        const dataURL = canvas.toDataURL('image/png');
        onSignatureChange(dataURL);
      }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onSignatureChange(null);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'firma.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const colors = [
    { name: 'Negro', value: '#000000' },
    { name: 'Azul', value: '#1e40af' },
    { name: 'Azul Marino', value: '#1e3a8a' },
    { name: 'Verde', value: '#059669' },
    { name: 'Rojo', value: '#dc2626' }
  ];
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm sm:text-lg font-medium text-gray-900 flex items-center">
          ✍️ <span className="ml-2">Crear Firma</span>
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={clearSignature}
            disabled={isEmpty}
            className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
          <button
            onClick={saveSignature}
            disabled={isEmpty}
            className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Guardar</span>
          </button>
        </div>
      </div>
      
      {/* Controles de color y grosor */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Selector de color */}
          <div className="flex items-center space-x-2">
            <Palette className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Color:</span>
            <div className="flex space-x-1">
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setStrokeColor(color.value)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    strokeColor === color.value 
                      ? 'border-gray-400 scale-110' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          
          {/* Selector de grosor */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Grosor:</span>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="1"
                max="8"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                className="w-16 sm:w-20"
              />
              <span className="text-xs text-gray-600 min-w-[2rem]">{strokeWidth}px</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden hover:border-blue-400 transition-colors">
        <canvas
          ref={canvasRef}
          className="w-full h-32 sm:h-40 cursor-crosshair bg-white touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ touchAction: 'none' }}
        />
      </div>
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        {isEmpty ? 
          "✨ Dibuja tu firma usando el ratón o el dedo" : 
          "✓ Firma creada - Puedes editarla o crear una nueva"
        }
      </p>
    </div>
  );
};

export default SignaturePad;