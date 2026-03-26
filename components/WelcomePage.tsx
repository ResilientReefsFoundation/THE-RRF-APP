import * as React from 'react';
import { UserGroupIcon, CubeIcon, GlobeAltIcon, SparklesIcon, CheckCircleIcon, CloseIcon, EyeIcon, ChevronRightIcon, MicrophoneIcon, PlusCircleIcon, ArrowPathIcon } from './Icons';
import type { UserRole, Staff, Volunteer } from '../types';

interface WelcomePageProps {
    staffMembers: Staff[];
    volunteers: Volunteer[];
    onAddStaff: (s: Staff) => void;
    onLogin: (role: UserRole, username: string, id: string) => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ staffMembers, volunteers, onAddStaff, onLogin }) => {
    const [selectedPortal, setSelectedPortal] = React.useState<UserRole | null>(null);
    const [isRegistering, setIsRegistering] = React.useState(false);
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [fullName, setFullName] = React.useState('');
    const [isAuthenticating, setIsAuthenticating] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!username || !password) return;
        
        // IMMEDIATE BYPASS for specific admin credentials
        if (username.toLowerCase() === 'admin' && password === '3474') {
            onLogin('Staff', 'Administrator', 'admin-id');
            return;
        }

        setIsAuthenticating(true);
        setTimeout(() => {
            if (selectedPortal === 'Staff') {
                const found = staffMembers.find(s => s.username?.toLowerCase() === username.toLowerCase() && s.password === password);
                if (found) {
                    onLogin('Staff', found.name, found.id);
                } else {
                    setError("Invalid username or password.");
                    setIsAuthenticating(false);
                }
            } else if (selectedPortal === 'Volunteer') {
                const found = volunteers.find(v => v.username?.toLowerCase() === username.toLowerCase() && v.password === password);
                if (found) {
                    onLogin('Volunteer', found.name, found.id);
                } else {
                    setError("Invalid username or password.");
                    setIsAuthenticating(false);
                }
            } else {
                setIsAuthenticating(false);
            }
        }, 800);
    };

    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const pin = prompt("Enter Admin Passkey (3474) to authorize registration:");
        if (pin !== "3474") return alert("Unauthorized.");

        if (staffMembers.some(s => s.username?.toLowerCase() === username.toLowerCase())) {
            return alert("Username already exists.");
        }

        const newStaff: Staff = {
            id: Math.random().toString(36).substring(2, 9),
            name: fullName,
            username: username.toLowerCase(),
            password,
            role: 'Scientist'
        };
        onAddStaff(newStaff);
        alert("Registration complete! You can now log in.");
        setIsRegistering(false);
        setPassword('');
    };

    const handleBiometricLogin = async () => {
        if (!window.PublicKeyCredential) {
            return alert("Your browser or device does not support biometric authentication.");
        }

        setIsAuthenticating(true);
        try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const options: any = {
                publicKey: {
                    challenge,
                    timeout: 60000,
                    userVerification: 'required',
                    allowCredentials: staffMembers
                        .filter(s => s.webAuthnCredentialId)
                        .map(s => ({
                            type: 'public-key',
                            id: new TextEncoder().encode(s.id)
                        }))
                }
            };

            const assertion: any = await navigator.credentials.get(options);
            const rawId = btoa(String.fromCharCode(...new Uint8Array(assertion.rawId)));
            const staff = staffMembers.find(s => s.webAuthnCredentialId === rawId);
            
            if (staff) {
                onLogin('Staff', staff.name, staff.id);
            } else {
                throw new Error("Device not linked to an account.");
            }
        } catch (err: any) {
            console.error(err);
            setError("Biometric verification failed or canceled.");
            setIsAuthenticating(false);
        }
    };

    if (selectedPortal) {
        return (
            <div className="fixed inset-0 z-[200] bg-coral-sand flex items-center justify-center p-4 overflow-hidden">
                <div className="w-full max-w-md animate-fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl border-2 border-coral-blue p-6 sm:p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            {selectedPortal === 'Staff' ? <CubeIcon className="w-32 h-32" /> : <UserGroupIcon className="w-32 h-32" />}
                        </div>

                        <button onClick={() => { setSelectedPortal(null); setIsRegistering(false); setError(null); }} className="absolute top-4 left-4 p-2 text-gray-400 hover:text-coral-dark">
                            <CloseIcon className="w-5 h-5" />
                        </button>

                        <div className="text-center mb-6 mt-4">
                            <h2 className="text-xl font-black text-coral-dark uppercase tracking-tighter italic">
                                {isRegistering ? 'Staff Registry' : `${selectedPortal} Login`}
                            </h2>
                            <p className="text-[9px] font-black text-coral-blue uppercase tracking-widest mt-1">
                                {isRegistering ? 'Register Internal Credentials' : 'Password Required'}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-2 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-bold text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={isRegistering ? handleRegisterSubmit : handleLoginSubmit} className="space-y-3">
                            {isRegistering && (
                                <div className="space-y-0.5">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={fullName} 
                                        onChange={e => setFullName(e.target.value)} 
                                        className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold focus:border-coral-blue outline-none transition-all shadow-inner text-sm" 
                                        required 
                                    />
                                </div>
                            )}
                            <div className="space-y-0.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Username</label>
                                <input 
                                    type="text" 
                                    value={username} 
                                    onChange={e => setUsername(e.target.value)} 
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck="false"
                                    className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold focus:border-coral-blue outline-none transition-all shadow-inner text-sm" 
                                    required 
                                />
                            </div>
                            <div className="space-y-0.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                                <input 
                                    type="password" 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold focus:border-coral-blue outline-none transition-all shadow-inner text-sm" 
                                    required 
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isAuthenticating}
                                className="w-full bg-coral-blue text-white font-black py-4 rounded-[1.5rem] shadow-xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 mt-4"
                            >
                                {isAuthenticating ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /><span>Verifying...</span></> : <>{isRegistering ? <PlusCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}<span>{isRegistering ? 'Register' : 'Enter Portal'}</span></>}
                            </button>

                            {!isRegistering && selectedPortal === 'Staff' && (
                                <>
                                    <div className="flex items-center gap-4 py-1">
                                        <div className="h-px bg-gray-100 flex-grow"></div>
                                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">or</span>
                                        <div className="h-px bg-gray-100 flex-grow"></div>
                                    </div>

                                    <button 
                                        type="button"
                                        onClick={handleBiometricLogin}
                                        className="w-full border-2 border-gray-100 text-coral-dark font-black py-3 rounded-[1.5rem] hover:bg-gray-50 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                        <MicrophoneIcon className="w-4 h-4" />
                                        Use Biometrics
                                    </button>

                                    <p className="text-center mt-4">
                                        <button type="button" onClick={() => { setIsRegistering(true); setError(null); }} className="text-[9px] font-black text-gray-400 hover:text-coral-blue uppercase tracking-widest transition-colors">
                                            Create Staff Account
                                        </button>
                                    </p>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] bg-coral-sand flex flex-col items-center justify-center p-4 sm:p-8 text-center overflow-hidden">
            <div className="absolute top-0 -left-20 w-72 h-72 bg-coral-blue/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 -right-20 w-72 h-72 bg-coral-green/10 rounded-full blur-3xl animate-pulse delay-700"></div>

            <div className="relative z-10 space-y-8 sm:space-y-12 max-w-4xl w-full">
                <div className="space-y-1 sm:space-y-4">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="p-2 sm:p-4 bg-white rounded-2xl sm:rounded-3xl shadow-xl border-2 border-coral-blue">
                            <SparklesIcon className="w-6 h-6 sm:w-10 sm:h-10 text-coral-blue" />
                        </div>
                    </div>
                    <h1 className="text-4xl sm:text-7xl font-black text-coral-dark uppercase tracking-tighter italic leading-none">
                        Resilient Reefs
                    </h1>
                    <p className="text-xs sm:text-xl font-bold text-coral-blue uppercase tracking-[0.4em] italic">
                        Foundation Registry
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
                    <button 
                        onClick={() => setSelectedPortal('Staff')}
                        className="group bg-white p-5 sm:p-8 rounded-[2rem] border-4 border-coral-blue shadow-xl hover:scale-[1.01] active:scale-95 transition-all text-left relative overflow-hidden"
                    >
                        <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <CubeIcon className="w-32 h-32" />
                        </div>
                        <div className="p-2.5 sm:p-3 bg-blue-50 text-coral-blue rounded-xl w-fit mb-4 shadow-sm">
                            <GlobeAltIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <h3 className="text-xl sm:text-3xl font-black text-coral-dark uppercase italic tracking-tighter">Staff Suite</h3>
                        <p className="text-[9px] sm:text-xs font-bold text-gray-400 mt-1 uppercase leading-relaxed max-w-[220px]">
                            Internal registry and nursery logic.
                        </p>
                        <div className="mt-6 sm:mt-8 flex items-center gap-2 text-coral-blue font-black uppercase text-[10px] tracking-widest group-hover:gap-3 transition-all">
                            Enter Full Hub <ChevronRightIcon className="w-3.5 h-3.5" />
                        </div>
                    </button>

                    <button 
                        onClick={() => setSelectedPortal('Volunteer')}
                        className="group bg-white p-5 sm:p-8 rounded-[2rem] border-4 border-coral-green shadow-xl hover:scale-[1.01] active:scale-95 transition-all text-left relative overflow-hidden"
                    >
                        <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <UserGroupIcon className="w-32 h-32" />
                        </div>
                        <div className="p-2.5 sm:p-3 bg-green-50 text-coral-green rounded-xl w-fit mb-4 shadow-sm">
                            <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <h3 className="text-xl sm:text-3xl font-black text-coral-dark uppercase italic tracking-tighter">My Nursery</h3>
                        <p className="text-[9px] sm:text-xs font-bold text-gray-400 mt-1 uppercase leading-relaxed max-w-[220px]">
                            Profile, shifts, and equipment.
                        </p>
                        <div className="mt-6 sm:mt-8 flex items-center gap-2 text-coral-green font-black uppercase text-[10px] tracking-widest group-hover:gap-3 transition-all">
                            Enter Member Portal <ChevronRightIcon className="w-3.5 h-3.5" />
                        </div>
                    </button>
                </div>
            </div>
            <p className="fixed bottom-8 text-[10px] font-black text-gray-300 uppercase tracking-[1em] opacity-40">Resilient Reefs Foundation Field Registry</p>
        </div>
    );
};

export default WelcomePage;