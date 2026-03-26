import * as React from 'react';
import type { Page, R2Settings, Staff } from '../types';
import { CogIcon, CloudIcon, QrCodeIcon, CloseIcon, DatabaseIcon, GlobeAltIcon, BriefcaseIcon, BookOpenIcon, EyeIcon, CheckCircleIcon, WrenchIcon, SparklesIcon } from './Icons';
import QRCode from 'qrcode';

interface SettingsPageProps {
  r2Settings: R2Settings | null;
  adminOverride: boolean;
  globalReadOnly: boolean;
  currentStaff?: Staff;
  onUpdateStaff: (updated: Staff) => void;
  onToggleGlobalReadOnly: (val: boolean) => void;
  onToggleAdminOverride: (val: boolean) => void;
  onApplySettings: (settings: R2Settings) => void;
  onNavigateBack: () => void;
  onNavigateToPage: (page: Page) => void;
  databaseSizeKb?: number;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ 
    r2Settings, 
    adminOverride, 
    globalReadOnly,
    currentStaff,
    onUpdateStaff,
    onToggleGlobalReadOnly,
    onToggleAdminOverride, 
    onApplySettings,
    onNavigateBack, 
    onNavigateToPage, 
    databaseSizeKb = 0 
}) => {
  const [accountId, setAccountId] = React.useState(r2Settings?.accountId || '');
  const [accessKeyId, setAccessKeyId] = React.useState(r2Settings?.accessKeyId || '');
  const [secretAccessKey, setSecretAccessKey] = React.useState(r2Settings?.secretAccessKey || '');
  const [bucketName, setBucketName] = React.useState(r2Settings?.bucketName || '');
  const [publicUrl, setPublicUrl] = React.useState(r2Settings?.publicUrl || '');
  const [userName, setUserName] = React.useState(r2Settings?.userName || '');
  const [showQR, setShowQR] = React.useState(false);
  const [qrUrl, setQrUrl] = React.useState('');
  const [qrFullLink, setQrFullLink] = React.useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onApplySettings({ accountId, accessKeyId, secretAccessKey, bucketName, publicUrl, userName });
    alert('Cloud configuration saved!');
  };

  const handleChangePassword = () => {
      if (!currentStaff) return;
      const newPass = prompt("Enter new password:");
      if (!newPass || newPass.length < 4) return alert("Password must be at least 4 characters.");
      onUpdateStaff({ ...currentStaff, password: newPass });
      alert("Password updated!");
  };

  const handleEnrollBiometrics = async () => {
    if (!currentStaff) return;
    if (!window.PublicKeyCredential) return alert("Biometrics not supported on this browser.");

    try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const options: any = {
            publicKey: {
                challenge,
                rp: { name: "Resilient Reefs" },
                user: {
                    id: new TextEncoder().encode(currentStaff.id),
                    name: currentStaff.username || 'user',
                    displayName: currentStaff.name
                },
                pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                timeout: 60000,
                attestation: "direct"
            }
        };

        const credential: any = await navigator.credentials.create(options);
        const rawId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        
        onUpdateStaff({ ...currentStaff, webAuthnCredentialId: rawId });
        alert("FaceID / Fingerprint linked successfully!");
    } catch (err) {
        console.error(err);
        alert("Failed to link biometrics.");
    }
  };

  const handleShowQRCode = async () => {
    if (!accountId || !accessKeyId) return alert("Fill credentials first.");
    const payload = btoa(JSON.stringify({ accountId, accessKeyId, secretAccessKey, bucketName, publicUrl, userName: '' }));
    const setupUrl = `${window.location.origin}${window.location.pathname}#setup=${encodeURIComponent(payload)}`;
    setQrFullLink(setupUrl);
    const url = await QRCode.toDataURL(setupUrl, { width: 512, margin: 2, color: { dark: '#4A90E2', light: '#FFFFFF' } });
    setQrUrl(url); setShowQR(true);
  };

  const checkPasskey = () => {
    const pass = prompt("Enter Admin Passkey (3474):");
    return pass === "3474";
  };

  return (
    <div className="bg-coral-sand min-h-screen p-4 sm:p-8 space-y-12 animate-fade-in pb-20">
      <div className="flex justify-between items-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-black text-coral-dark uppercase tracking-tighter italic">Settings & Identity</h2>
        <button onClick={onNavigateBack} className="bg-white border-2 border-gray-100 text-coral-dark font-black py-2 px-6 rounded-2xl hover:bg-gray-50 shadow-sm transition-all active:scale-95 text-xs uppercase tracking-widest">Done</button>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
          
          {currentStaff && (
              <div className="p-8 border-2 border-coral-green rounded-[2.5rem] bg-white shadow-xl space-y-8">
                  <div className="flex items-center gap-4 border-b border-gray-50 pb-4">
                      <div className="p-3 bg-green-50 rounded-2xl">
                          <CheckCircleIcon className="w-6 h-6 text-coral-green" />
                      </div>
                      <h3 className="font-black text-xl text-coral-dark uppercase tracking-tight italic">Security & Biometrics</h3>
                  </div>
                  
                  <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                          <button onClick={handleChangePassword} className="flex-1 p-5 bg-gray-50 rounded-3xl border-2 border-gray-100 hover:border-coral-blue transition-all text-left group">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Passcode</p>
                              <p className="text-sm font-black text-coral-dark group-hover:text-coral-blue">Change Password</p>
                          </button>
                          <button onClick={handleEnrollBiometrics} className="flex-1 p-5 bg-gray-50 rounded-3xl border-2 border-gray-100 hover:border-coral-green transition-all text-left group">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">WebAuthn</p>
                              <p className="text-sm font-black text-coral-dark group-hover:text-coral-green flex items-center gap-2">
                                  Link FaceID / Fingerprint 
                                  {currentStaff.webAuthnCredentialId && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                              </p>
                          </button>
                      </div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase ml-2">Linking biometrics allows instant access from this device's secure enclave.</p>
                  </div>
              </div>
          )}

          <div className="p-8 border-2 border-purple-600 rounded-[2.5rem] bg-white shadow-xl space-y-8">
              <div className="flex items-center gap-4 border-b border-gray-50 pb-4">
                  <div className="p-3 bg-purple-50 rounded-2xl">
                      <GlobeAltIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-black text-xl text-purple-900 uppercase tracking-tight italic">Global Permissions</h3>
              </div>
              
              <div className="space-y-6">
                  <div 
                    className="p-5 bg-white rounded-3xl border-2 border-purple-100/50 flex items-center justify-between gap-4 cursor-pointer hover:bg-purple-50/20 transition-all shadow-sm"
                    onClick={() => checkPasskey() && onToggleGlobalReadOnly(!globalReadOnly)}
                  >
                      <div className="flex-grow pr-4">
                          <p className="text-xs font-black text-purple-900 uppercase tracking-widest mb-1.5">Public Gallery Mode</p>
                          <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-tight">
                              Enable to make the app read-only for <span className="text-purple-600">everyone</span>.
                          </p>
                      </div>
                      <div className={`relative inline-flex h-8 w-14 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${globalReadOnly ? 'bg-purple-600 shadow-inner' : 'bg-gray-200'}`}>
                          <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${globalReadOnly ? 'translate-x-6' : 'translate-x-0'}`}></span>
                      </div>
                  </div>

                  <div 
                    className={`p-5 bg-white rounded-3xl border-2 flex items-center justify-between gap-4 transition-all cursor-pointer shadow-sm ${adminOverride ? 'border-coral-blue/40 bg-blue-50/10' : 'border-coral-blue/10'}`}
                    onClick={() => checkPasskey() && onToggleAdminOverride(!adminOverride)}
                  >
                      <div className="flex-grow pr-4">
                          <div className="flex items-center gap-2 mb-1.5">
                              <EyeIcon className="w-4 h-4 text-coral-blue" />
                              <p className="text-xs font-black text-coral-dark uppercase tracking-widest">Admin Override</p>
                          </div>
                          <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-tight">
                              Enable <span className="text-coral-blue">on this device only</span> to bypass Gallery Mode.
                          </p>
                      </div>
                      <div className={`relative inline-flex h-8 w-14 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${adminOverride ? 'bg-coral-blue shadow-inner' : 'bg-gray-200'}`}>
                          <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${adminOverride ? 'translate-x-6' : 'translate-x-0'}`}></span>
                      </div>
                  </div>
              </div>
          </div>

          <div className="p-8 border-2 border-coral-blue rounded-[2.5rem] bg-white shadow-xl space-y-6">
              <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-50 rounded-2xl">
                      <CloudIcon className="w-6 h-6 text-coral-blue" />
                  </div>
                  <h3 className="font-black text-xl text-gray-800 uppercase tracking-tight italic">Cloud Storage Config</h3>
              </div>
              
              <form onSubmit={handleSave} className="space-y-5">
                  <div className="p-5 bg-coral-green/5 rounded-3xl border-2 border-coral-green/20">
                      <label className="block text-[10px] font-black text-coral-green uppercase mb-2 ml-1 tracking-[0.2em]">Display Name</label>
                      <input 
                        type="text" 
                        value={userName} 
                        onChange={e => setUserName(e.target.value)} 
                        autoCapitalize="none"
                        autoCorrect="off"
                        placeholder="e.g. Field Scientist" 
                        className="w-full p-4 border-2 border-white rounded-2xl bg-white font-black text-coral-dark outline-none focus:border-coral-green shadow-sm text-lg" 
                        required 
                      />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-5">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Cloudflare R2 Account ID</label>
                        <input type="text" value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-2xl font-mono text-sm shadow-inner" required />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Access Key</label><input type="text" value={accessKeyId} onChange={e => setAccessKeyId(e.target.value)} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-2xl font-mono text-xs shadow-inner" required /></div>
                          <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Secret Key</label><input type="password" value={secretAccessKey} onChange={e => setSecretAccessKey(e.target.value)} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-2xl font-mono text-xs shadow-inner" required /></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Bucket Name</label>
                            <input type="text" value={bucketName} onChange={e => setBucketName(e.target.value)} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-2xl font-mono text-sm shadow-inner" required />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Public R2 URL</label>
                            <input type="text" value={publicUrl} onChange={e => setPublicUrl(e.target.value)} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-2xl font-mono text-sm shadow-inner" placeholder="e.g. pub-uuid.r2.dev" required />
                          </div>
                      </div>
                  </div>
                  
                  <button type="submit" className="w-full bg-coral-blue text-white font-black py-5 rounded-[2rem] shadow-2xl hover:brightness-105 active:scale-95 transition-all uppercase tracking-[0.2em] text-sm mt-6 border-b-[8px] border-blue-700">
                      Save & Re-Connect
                  </button>
              </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
              <div className="p-6 border-2 border-coral-green/30 rounded-[2rem] bg-white flex flex-col justify-between shadow-lg">
                    <div className="flex items-center gap-4 mb-6">
                         <div className="p-3 bg-green-50 rounded-2xl"><QrCodeIcon className="w-8 h-8 text-coral-green" /></div>
                         <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest italic">Sync Other Devices</h4>
                    </div>
                    <div className="space-y-4">
                        <button onClick={handleShowQRCode} className="w-full bg-coral-green/10 border-2 border-coral-green text-coral-dark font-black py-3 rounded-2xl hover:bg-coral-green hover:text-white transition-all text-[10px] uppercase tracking-widest active:scale-95">Generate Setup Link</button>
                    </div>
              </div>

              <div className="p-6 border-2 border-coral-blue/30 rounded-[2rem] bg-white flex flex-col justify-between shadow-lg">
                  <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-blue-50 rounded-2xl"><BookOpenIcon className="w-8 h-8 text-coral-blue" /></div>
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest italic">System Blueprint</h4>
                  </div>
                  <button onClick={() => onNavigateToPage('systemMap')} className="w-full bg-coral-blue text-white font-black py-3 rounded-2xl hover:bg-blue-700 transition-all text-[10px] uppercase tracking-widest shadow-lg">Open Blueprint</button>
              </div>
          </div>
      </div>

      {showQR && (
          <div className="fixed inset-0 bg-black/90 z-[150] flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
              <div className="bg-white rounded-[3rem] w-full max-w-lg p-8 shadow-2xl flex flex-col items-center gap-6 animate-fade-in relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowQR(false)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><CloseIcon className="w-6 h-6 text-gray-600"/></button>
                  <img src={qrUrl} alt="Setup QR" className="w-64 h-64 mx-auto" />
                  <button onClick={() => { navigator.clipboard.writeText(qrFullLink); alert("Setup link copied!"); }} className="w-full py-4 bg-coral-dark text-white font-black rounded-2xl shadow-lg hover:brightness-110 active:scale-95 transition-all text-xs uppercase tracking-widest">Copy Setup Link</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default SettingsPage;