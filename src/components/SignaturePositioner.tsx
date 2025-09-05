import React from 'react';
import { MapPin, Trash2, Target } from 'lucide-react';

interface SignaturePositionerProps {
  position: { x: number, y: number, page: number } | null;
  onClearPosition: () => void;
  totalPages?: number;
}

const SignaturePositioner: React.FC<SignaturePositionerProps> = ({ 
  position, 
  onClearPosition,
  totalPages = 1
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center text-sm sm:text-lg">
          <Target className="h-5 w-5 mr-2 text-blue-600" />
          Posición de la Firma
        </h3>
        {position && (
          <button
            onClick={onClearPosition}
            className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
        )}
      </div>

      {position ? (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm font-medium text-green-800">✓ Posición seleccionada</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-green-700">
            <div className="bg-white bg-opacity-50 rounded px-2 py-1">
              <span className="font-medium">Página:</span> {position.page}/{totalPages}
            </div>
            <div className="bg-white bg-opacity-50 rounded px-2 py-1">
              <span className="font-medium">X:</span> {Math.round(position.x)}%
            </div>
            <div className="bg-white bg-opacity-50 rounded px-2 py-1">
              <span className="font-medium">Y:</span> {Math.round(position.y)}%
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600 mb-2">Selecciona dónde colocar la firma</p>
          <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
            Haz clic en el documento para seleccionar dónde colocar la firma
          </p>
        </div>
      )}
    </div>
  );
};

export default SignaturePositioner;