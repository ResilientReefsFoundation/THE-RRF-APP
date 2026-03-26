
import * as React from 'react';
import type { FormEvent } from 'react';
import type { ToDoItem, VoiceNote } from '../types';
import { MicrophoneIcon, PauseIcon, PlayIcon, StopIcon, TrashIcon, CameraIcon, CloseIcon, ArrowPathIcon } from './Icons';

interface NotesToDoPageProps {
  toDoItems: ToDoItem[];
  voiceNotes: VoiceNote[];
  onAddToDo: (text: string, mediaUrl?: string, mediaType?: 'image' | 'video') => void;
  onDeleteToDo: (id: string) => void;
  onAddVoiceNote: (audioUrl: string, duration: number) => void;
  onDeleteVoiceNote: (id: string) => void;
  onNavigateBack: () => void;
  uploadMedia?: (file: File | Blob, prefix: string) => Promise<string>;
}

const formatDuration = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

const SwipeToDeleteItem: React.FC<{
  children: React.ReactNode;
  onDelete: () => void;
  label: string;
}> = ({ children, onDelete, label }) => {
  const itemRef = React.useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = React.useState(0);
  const isDragging = React.useRef(false);
  const startXRef = React.useRef(0);
  const revealWidth = 96;

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, [data-interactive="true"]')) return;
    isDragging.current = true;
    startXRef.current = e.touches[0].clientX - dragX;
    if (itemRef.current) itemRef.current.style.transition = 'none';
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const currentX = e.touches[0].clientX;
    const newDragX = currentX - startXRef.current;
    setDragX(Math.max(-revealWidth, Math.min(0, newDragX)));
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (itemRef.current) itemRef.current.style.transition = 'transform 0.3s ease';
    if (dragX < -revealWidth / 2) {
        if (confirm(`Delete ${label}?`)) {
            onDelete();
        } else {
            setDragX(0);
        }
    }
    else setDragX(0);
  };

  const handleClickDelete = () => {
      if (confirm(`Delete ${label}?`)) {
          onDelete();
      }
  };

  return (
    <li className="relative bg-red-500 overflow-hidden rounded-lg mb-3 shadow-sm border border-gray-200">
      <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center">
        <button onClick={handleClickDelete} className="w-full h-full flex items-center justify-center text-white font-semibold">
          <TrashIcon className="w-6 h-6" />
        </button>
      </div>
      <div
        ref={itemRef}
        className="relative bg-white touch-none rounded-lg h-full"
        style={{ transform: `translateX(${dragX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {children}
      </div>
    </li>
  );
};

const VoiceNoteItem: React.FC<{ note: VoiceNote; onDelete: (id: string) => void; }> = ({ note, onDelete }) => {
    const audioRef = React.useRef<HTMLAudioElement>(null);
    const progressRef = React.useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [currentTime, setCurrentTime] = React.useState(0);
    const [duration, setDuration] = React.useState(note.duration);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if(audioRef.current) { if(isPlaying) audioRef.current.pause(); else audioRef.current.play().catch(console.error); }
    };
    
    React.useEffect(() => {
        const audioEl = audioRef.current; if (!audioEl) return;
        const handlePlay = () => setIsPlaying(true); const handlePause = () => setIsPlaying(false);
        const handleTimeUpdate = () => setCurrentTime(audioEl.currentTime);
        const handleMetadata = () => { if (audioEl.duration && isFinite(audioEl.duration)) setDuration(audioEl.duration); }
        audioEl.addEventListener('play', handlePlay); audioEl.addEventListener('pause', handlePause);
        audioEl.addEventListener('ended', handlePause); audioEl.addEventListener('timeupdate', handleTimeUpdate);
        audioEl.addEventListener('loadedmetadata', handleMetadata);
        return () => {
            audioEl.removeEventListener('play', handlePlay); audioEl.removeEventListener('pause', handlePause);
            audioEl.removeEventListener('ended', handlePause); audioEl.removeEventListener('timeupdate', handleTimeUpdate);
            audioEl.removeEventListener('loadedmetadata', handleMetadata);
        };
    }, []);

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressRef.current || !audioRef.current || !isFinite(duration) || duration === 0) return;
        const clickPosition = e.clientX - progressRef.current.getBoundingClientRect().left;
        const newTime = duration * (clickPosition / progressRef.current.offsetWidth);
        audioRef.current.currentTime = newTime; setCurrentTime(newTime);
    };

    const progressPercentage = duration > 0 && isFinite(duration) ? (currentTime / duration) * 100 : 0;

    return (
        <SwipeToDeleteItem label="Voice Note" onDelete={() => onDelete(note.id)}>
             <div className="p-3 flex items-center gap-3">
                <audio ref={audioRef} src={note.audioUrl} preload="metadata"></audio>
                <button onClick={togglePlay} className="p-2 rounded-full bg-coral-blue text-white flex-shrink-0" data-interactive="true">
                    {isPlaying ? <PauseIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>}
                </button>
                <div className="flex-grow flex items-center gap-2">
                    <div ref={progressRef} onClick={handleProgressClick} className="w-full h-2 bg-gray-200 rounded-full cursor-pointer" data-interactive="true">
                        <div className="h-full bg-coral-green rounded-full" style={{ width: `${progressPercentage}%`}}></div>
                    </div>
                    <span className="text-xs text-gray-500 font-mono w-12 text-center">{formatDuration(currentTime)} / {formatDuration(duration)}</span>
                </div>
            </div>
        </SwipeToDeleteItem>
    );
};

const NotesToDoPage: React.FC<NotesToDoPageProps> = ({
  toDoItems, voiceNotes, onAddToDo, onDeleteToDo, onAddVoiceNote, onDeleteVoiceNote, onNavigateBack, uploadMedia
}) => {
  const [newToDoText, setNewToDoText] = React.useState('');
  const [isRecording, setIsRecording] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const recordingStartTimeRef = React.useRef<number>(0);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const timerIntervalRef = React.useRef<number | null>(null);
  const [micError, setMicError] = React.useState<string | null>(null);
  const [isCheckingMic, setIsCheckingMic] = React.useState(true);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const checkMic = async () => {
        setIsCheckingMic(true); setMicError(null);
        if (!navigator.mediaDevices?.getUserMedia) { setMicError("Browser does not support mic."); setIsCheckingMic(false); return; }
        try { const devices = await navigator.mediaDevices.enumerateDevices(); if (!devices.some(d => d.kind === 'audioinput')) setMicError("No mic found."); }
        catch (err) { setMicError("Mic check failed."); }
        finally { setIsCheckingMic(false); }
    };
    checkMic();
  }, []);

  const handleToDoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!uploadMedia) return alert("Storage not configured.");
    if (newToDoText.trim() || selectedFile) {
        if (selectedFile) {
            setIsUploading(true);
            try {
                const mediaUrl = await uploadMedia(selectedFile, 'todo_media');
                const mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'image';
                onAddToDo(newToDoText.trim(), mediaUrl, mediaType);
                setNewToDoText(''); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '';
            } catch (err) { alert("Failed to upload media."); }
            finally { setIsUploading(false); }
        } else {
            onAddToDo(newToDoText.trim());
            setNewToDoText('');
        }
    }
  };
  
  const startRecording = async () => {
    setMicError(null);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const type = ['audio/webm', 'audio/mp4'].find(t => MediaRecorder.isTypeSupported(t));
        const mediaRecorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        mediaRecorder.onstop = async () => {
            const blob = new Blob(audioChunksRef.current, { type: type || 'audio/webm' });
            if (uploadMedia) {
                setIsUploading(true);
                try {
                    const url = await uploadMedia(blob, 'voice_notes');
                    onAddVoiceNote(url, (Date.now() - recordingStartTimeRef.current) / 1000);
                } catch (e) { alert("Failed to sync voice note."); }
                finally { setIsUploading(false); }
            }
            audioChunksRef.current = []; stream.getTracks().forEach(t => t.stop());
        };
        audioChunksRef.current = []; mediaRecorder.start(); setIsRecording(true);
        recordingStartTimeRef.current = Date.now();
        timerIntervalRef.current = window.setInterval(() => setRecordingTime(Date.now() - recordingStartTimeRef.current), 100);
    } catch (err) { setMicError("Mic access denied."); setIsRecording(false); }
  };
  
  const stopRecording = () => { if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); if(timerIntervalRef.current) clearInterval(timerIntervalRef.current); setRecordingTime(0); } };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4"><h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">Notes / ToDo</h2><button onClick={onNavigateBack} className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg self-start sm:self-center">&larr; Back</button></div>
      <div className="flex flex-col gap-8">
        <div className="p-4 border-2 border-coral-blue rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-semibold text-gray-700 text-lg">ToDo List</h3>
          <form onSubmit={handleToDoSubmit} className="flex flex-col gap-2">
            {selectedFile && (<div className="flex items-center gap-2 bg-blue-50 p-2 rounded-md border border-blue-200 self-start"><span className="text-xs text-blue-800 font-medium truncate max-w-[200px]">{selectedFile.name}</span><button type="button" onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="text-blue-500 hover:text-blue-700"><CloseIcon className="w-4 h-4"/></button></div>)}
            <div className="flex gap-2">
                <input type="text" value={newToDoText} onChange={(e) => setNewToDoText(e.target.value)} placeholder="Add a new task..." className="flex-grow rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900" disabled={isUploading}/>
                <input type="file" accept="image/*,video/*" ref={fileInputRef} className="hidden" onChange={e => e.target.files?.[0] && setSelectedFile(e.target.files[0])}/>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 py-2 px-3 rounded-lg" title="Add Photo/Video"><CameraIcon className="w-5 h-5"/></button>
                <button type="submit" disabled={isUploading} className="bg-coral-blue text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">{isUploading ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : 'Add'}</button>
            </div>
          </form>
          <div className="max-h-96 overflow-y-auto">{toDoItems.length > 0 ? (<ul className="space-y-1">{toDoItems.map(item => (<SwipeToDeleteItem key={item.id} label="Task" onDelete={() => onDeleteToDo(item.id)}><div className="p-3">{item.text && <p className="text-sm text-gray-800 mb-2">{item.text}</p>}{item.mediaUrl && (<div className="mt-1">{item.mediaType === 'video' ? (<video src={item.mediaUrl} controls className="w-full max-h-48 rounded-lg object-contain bg-black"/>) : (<img src={item.mediaUrl} alt="attachment" className="w-full max-h-48 rounded-lg object-contain bg-gray-100"/>)}</div>)}</div></SwipeToDeleteItem>))}</ul>) : (<p className="text-center text-gray-500 p-8 border-2 border-dashed border-gray-300 rounded-lg">No tasks yet.</p>)}</div>
        </div>
        <div className="p-4 border-2 border-coral-blue rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-semibold text-gray-700 text-lg">Voice Notes</h3>
          <div className="flex justify-center flex-col items-center border-2 border-coral-blue rounded-lg p-4 bg-white">
            {isRecording ? (<button onClick={stopRecording} className="flex flex-col items-center gap-2 p-4 text-red-500"><StopIcon className="w-16 h-16"/><div className="flex items-center gap-2 mt-2"><div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div><span className="font-semibold font-mono text-lg text-gray-800">{formatDuration(recordingTime / 1000)}</span></div></button>) : (<button onClick={startRecording} disabled={!!micError || isCheckingMic || isUploading} className="flex flex-col items-center gap-2 p-4 text-coral-blue disabled:text-gray-400"><MicrophoneIcon className="w-16 h-16"/><span className="font-semibold">{isUploading ? 'Syncing...' : 'Start Recording'}</span></button>)}
            {micError && <p className="text-sm text-red-500 text-center p-2 bg-red-50 rounded-md">{micError}</p>}
          </div>
          <div className="max-h-96 overflow-y-auto">{voiceNotes.length > 0 ? (<ul className="space-y-1">{voiceNotes.map(n => <VoiceNoteItem key={n.id} note={n} onDelete={onDeleteVoiceNote} />)}</ul>) : (<p className="text-center text-gray-500 p-8 border-2 border-dashed border-gray-300 rounded-lg">No notes recorded.</p>)}</div>
        </div>
      </div>
    </div>
  );
};
export default NotesToDoPage;
