
import * as React from 'react';
import QRCode from 'qrcode';
import { UploadIcon } from './Icons';

interface QRCodeGeneratorPageProps {
  onNavigateBack: () => void;
}

const QRCodeGeneratorPage: React.FC<QRCodeGeneratorPageProps> = ({ onNavigateBack }) => {
  const [inputText, setInputText] = React.useState('');
  const [qrDataUrl, setQrDataUrl] = React.useState('');
  const [error, setError] = React.useState('');

  const generateQRCode = async (text: string) => {
    try {
      setError('');
      if (!text.trim()) {
        setQrDataUrl('');
        return;
      }
      const url = await QRCode.toDataURL(text, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error(err);
      setError('Failed to generate QR code.');
    }
  };

  React.useEffect(() => {
    const timeout = setTimeout(() => {
        generateQRCode(inputText);
    }, 500); // Debounce generation
    return () => clearTimeout(timeout);
  }, [inputText]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `qrcode-${inputText.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">QR Code Generator</h2>
        <button
          onClick={onNavigateBack}
          className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 self-start sm:self-center"
        >
          &larr; Back
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 text-lg">Generate Label</h3>
            <p className="text-sm text-gray-600">
                Enter the unique ID or text for the item (e.g., Branch ID, Tree Number) to generate a QR code for printing.
            </p>
            <div>
                <label htmlFor="qrInput" className="block text-sm font-medium text-gray-700">Item ID / Text</label>
                <input
                    type="text"
                    id="qrInput"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="e.g. M1-A-PALMATA"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-3 bg-gray-50 text-gray-900 focus:ring-coral-blue focus:border-coral-blue"
                />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Preview Section */}
        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 border rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-4">Preview</h3>
            {qrDataUrl ? (
                <div className="text-center space-y-4">
                    <div className="bg-white p-2 rounded shadow-sm inline-block">
                        <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 sm:w-64 sm:h-64" />
                    </div>
                    <p className="text-sm font-mono text-gray-600 break-all max-w-xs mx-auto">{inputText}</p>
                    <button
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-2 bg-coral-blue hover:bg-opacity-90 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md mx-auto"
                    >
                        <UploadIcon className="w-5 h-5 transform rotate-180" /> {/* Re-using UploadIcon as Download by rotating or just generic icon */}
                        Download Image
                    </button>
                </div>
            ) : (
                <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-sm">
                    Enter text to generate
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeGeneratorPage;
