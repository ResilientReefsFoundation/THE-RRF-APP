
import * as React from 'react';
import QRCode from 'qrcode';
import { CloseIcon, QrCodeIcon } from './Icons';

interface QRCodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
  itemType: string;
  detail?: string;
}

const QRCodeLabelModal: React.FC<QRCodeLabelModalProps> = ({
  isOpen,
  onClose,
  itemId,
  itemName,
  itemType,
  detail
}) => {
  const [qrDataUrl, setQrDataUrl] = React.useState('');

  React.useEffect(() => {
    if (isOpen && itemId) {
      QRCode.toDataURL(itemId, {
        width: 300,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error(err));
    }
  }, [isOpen, itemId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex justify-center items-center p-4 print:p-0 print:bg-white print:static modal-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative printable-label-modal print:shadow-none print:w-auto">
        <header className="p-4 border-b flex justify-between items-center print:hidden">
          <h2 className="text-xl font-bold text-coral-dark">Item Created!</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <CloseIcon className="w-6 h-6"/>
          </button>
        </header>
        
        <div className="p-6 flex flex-col items-center printable-label-content">
            <div className="text-center mb-2">
                <p className="text-xs uppercase font-bold text-gray-500">{itemType}</p>
                <h3 className="text-2xl font-bold text-black">{itemName}</h3>
                {detail && <p className="text-sm text-gray-700">{detail}</p>}
            </div>
            
            {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 border-2 border-white" />
            ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-100 text-gray-400">Loading QR...</div>
            )}
            
            <p className="text-xs font-mono text-gray-500 mt-1">{itemId}</p>
        </div>

        <footer className="p-4 bg-gray-50 rounded-b-2xl flex flex-col gap-3 print:hidden">
            <button 
                onClick={() => window.print()} 
                className="w-full bg-coral-blue hover:bg-opacity-90 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
            >
                <QrCodeIcon className="w-5 h-5" />
                Print Label
            </button>
            <button onClick={onClose} className="text-sm text-gray-500 hover:underline">
                Close
            </button>
        </footer>
      </div>
    </div>
  );
};

export default QRCodeLabelModal;
