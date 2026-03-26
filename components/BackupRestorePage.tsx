import * as React from 'react';
import type { ChangeEvent } from 'react';
import type { BackupData, Site, CoralBranch, R2Settings, Species, RubbleAnchor } from '../types';
import { 
    UploadIcon, CloudIcon, BookOpenIcon, CloseIcon, SparklesIcon, 
    ArrowPathIcon, ArchiveBoxIcon, CheckCircleIcon, DatabaseIcon,
    ClipboardListIcon, GlobeAltIcon
} from './Icons';
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

interface BackupRestorePageProps {
  onNavigateBack: () => void;
  backupData: BackupData;
  onWipeAllData: () => boolean;
  onRestoreData: (data: BackupData) => void;
  onImportData: (dataType: 'sites' | 'branches' | 'rubbleAnchors', data: any[]) => void;
  onImportSpecies: (species: Species[]) => void;
  r2Settings: R2Settings | null;
  legacyPhotoCount: number;
  isMigratingPhotos: boolean;
  onMigratePhotosToCloud: () => void;
}

const BackupRestorePage: React.FC<BackupRestorePageProps> = ({ 
    onNavigateBack, 
    backupData, 
    onWipeAllData, 
    onRestoreData,
    onImportData,
    onImportSpecies,
    r2Settings,
    legacyPhotoCount,
    isMigratingPhotos,
    onMigratePhotosToCloud
}) => {
  const [isCloudLoading, setIsCloudLoading] = React.useState(false);
  const restoreFileInputRef = React.useRef<HTMLInputElement>(null);
  const importSpeciesInputRef = React.useRef<HTMLInputElement>(null);

  const downloadCSV = (data: any[], filename: string) => {
      if (!data || data.length === 0) {
          alert("No data to export.");
          return;
      }
      const headers = Object.keys(data[0]);
      const csvContent = [
          headers.join(','),
          ...data.map(row => headers.map(fieldName => {
              const val = row[fieldName];
              const strVal = val === undefined || val === null ? '' : String(val);
              if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
                  return `"${strVal.replace(/"/g, '""')}"`;
              }
              return strVal;
          }).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const getS3Client = () => {
        if (!r2Settings) return null;
        const { accountId, accessKeyId, secretAccessKey } = r2Settings;
        
        if (!accountId || !accessKeyId || !secretAccessKey) return null;

        return new S3Client({
            region: "auto",
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: { 
                accessKeyId: accessKeyId, 
                secretAccessKey: secretAccessKey 
            },
            forcePathStyle: true,
        });
  };

  const handleBackupToCloud = async () => {
        if (!r2Settings) return alert("Please configure R2 settings in the Settings menu first.");
        setIsCloudLoading(true);
        try {
            const client = getS3Client();
            if (!client) throw new Error("Could not initialize S3 client. Check your R2 settings.");
            
            if (!backupData || typeof backupData !== 'object') {
                throw new Error("Local database is corrupted or empty.");
            }

            const json = JSON.stringify(backupData, null, 2);
            await client.send(new PutObjectCommand({
                Bucket: r2Settings.bucketName,
                Key: 'coral_backup_latest.json',
                Body: json,
                ContentType: 'application/json'
            }));
            alert("Cloud backup updated successfully!");
        } catch (e: any) {
            console.error("Cloud Sync Error:", e);
            alert("Sync failed: " + (e.message || "Network Error. Please check your credentials and bucket CORS policy."));
        } finally {
            setIsCloudLoading(false);
        }
  };

  const handleRestoreFromCloud = async () => {
         if (!r2Settings) return alert("Please configure R2 settings in the Settings menu first.");
         if (!confirm("This will overwrite ALL current local data with the latest cloud backup. Proceed?")) return;
         
         setIsCloudLoading(true);
         try {
            const client = getS3Client();
            if (!client) throw new Error("Could not initialize S3 client.");
            
            const response = await client.send(new GetObjectCommand({
                Bucket: r2Settings.bucketName,
                Key: 'coral_backup_latest.json'
            }));
            
            const str = await response.Body?.transformToString();
            if (str) {
                const data = JSON.parse(str);
                onRestoreData(data);
                alert("Database restored from cloud successfully.");
            } else {
                throw new Error("Remote backup file is empty.");
            }
         } catch (e: any) {
             console.error("Cloud Restore Error:", e);
             alert("Restore failed: " + (e.message || "Could not find backup file in bucket."));
         } finally {
             setIsCloudLoading(false);
         }
  };

  const handleDownloadBackup = () => {
    const backupJson = JSON.stringify(backupData, null, 2);
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
    link.download = `rrf-full-site-backup-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestoreFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && window.confirm('Restore from JSON? Current unsynced data will be lost.')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                onRestoreData(data);
                alert("Database restored from file.");
            } catch (error) { 
                alert('Invalid backup file. Please ensure it is a valid JSON exported from this app.'); 
            }
        };
        reader.readAsText(file);
    }
    if (restoreFileInputRef.current) restoreFileInputRef.current.value = '';
  };

  return (
    <div className="bg-coral-sand min-h-screen p-4 sm:p-8 animate-fade-in pb-24">
      <div className="max-w-6xl mx-auto space-y-12">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-4xl font-black text-coral-dark uppercase tracking-tighter italic leading-none">Backup & Retrieval</h2>
            <p className="text-[10px] font-black text-coral-blue uppercase tracking-[0.4em] mt-2">Nursery System Persistence Manager</p>
          </div>
          <button onClick={onNavigateBack} className="bg-white border-2 border-gray-100 text-coral-dark font-black py-3 px-8 rounded-2xl hover:bg-gray-50 shadow-sm transition-all active:scale-95 text-xs uppercase tracking-widest">
            &larr; Dashboard
          </button>
        </div>

        {/* 1. MASTER SITE ARCHIVE - NEW SECTION */}
        <div className="bg-white border-4 border-coral-dark rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-12 -top-12 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                <ArchiveBoxIcon className="w-64 h-64" />
            </div>
            
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
                <div className="space-y-6 max-w-2xl text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-5">
                        <div className="p-5 bg-coral-dark text-coral-blue rounded-3xl shadow-xl">
                            <ArchiveBoxIcon className="w-10 h-10" />
                        </div>
                        <h3 className="text-4xl font-black text-coral-dark uppercase tracking-tighter italic">Master Site Archive</h3>
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-tight leading-relaxed">
                        Generate a complete <span className="text-coral-blue">Universal Recovery Package</span>. This backup includes every logical node, inventory record, scientist profile, and system configuration currently residing in the registry. 
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start">
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                            <span className="text-coral-blue font-black shrink-0">»</span> Full Registry Database (JSON)
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                            <span className="text-coral-blue font-black shrink-0">»</span> Cryptographic State Consistency
                        </div>
                    </div>
                </div>

                <div className="shrink-0 w-full lg:w-auto">
                    <button 
                        onClick={handleDownloadBackup}
                        className="w-full bg-coral-blue text-white font-black px-16 py-8 rounded-[2.5rem] shadow-2xl hover:brightness-110 active:scale-95 transition-all text-sm uppercase tracking-[0.2em] border-b-[10px] border-blue-800 flex items-center justify-center gap-6"
                    >
                        <UploadIcon className="w-8 h-8 transform rotate-180" />
                        Download Full Site Backup
                    </button>
                    <p className="text-center mt-6 text-[9px] font-black text-gray-300 uppercase tracking-[0.4em] italic animate-pulse">
                        Immutable Snapshot Protocol Active
                    </p>
                </div>
            </div>
        </div>

        {legacyPhotoCount > 0 && (
            <div className="p-8 bg-orange-50 border-4 border-orange-200 rounded-[3rem] flex flex-col lg:flex-row items-center gap-8 shadow-xl animate-fade-in">
                <div className="w-20 h-20 bg-orange-100 rounded-[1.5rem] flex items-center justify-center text-orange-600 shrink-0 shadow-inner">
                    <SparklesIcon className="w-10 h-10" />
                </div>
                <div className="flex-grow text-center lg:text-left">
                    <h3 className="text-2xl font-black text-orange-900 uppercase tracking-tighter italic">Legacy Data Detected</h3>
                    <p className="text-sm text-orange-700 font-bold uppercase tracking-tight mt-1">
                        There are <strong>{legacyPhotoCount} high-res images</strong> embedded in local storage.
                    </p>
                    <p className="text-xs text-orange-600/70 font-medium uppercase mt-2 tracking-widest italic">Transition to Cloud R2 recommended for optimal system velocity.</p>
                </div>
                <button 
                    onClick={onMigratePhotosToCloud}
                    disabled={isMigratingPhotos || !r2Settings}
                    className="w-full lg:w-auto px-12 py-5 bg-orange-600 text-white font-black rounded-2xl shadow-xl hover:bg-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-4 border-b-4 border-orange-800"
                >
                    {isMigratingPhotos ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <DatabaseIcon className="w-6 h-6" />}
                    <span>{isMigratingPhotos ? "MIGRATING..." : "MOVE MEDIA TO R2"}</span>
                </button>
            </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* CLOUD SYNC CARD */}
            <div className="bg-white p-10 border-2 border-gray-100 rounded-[3rem] shadow-lg flex flex-col h-full group hover:border-coral-blue transition-all">
                <div className="flex items-center gap-5 mb-8 border-b border-gray-50 pb-6">
                    <div className="p-4 bg-blue-50 text-coral-blue rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                        <CloudIcon className="w-6 h-6" />
                    </div>
                    <h3 className="font-black text-xl text-coral-dark uppercase tracking-tight italic leading-none">Cloud Persistence</h3>
                </div>
                
                <p className="text-xs font-bold text-gray-500 uppercase tracking-tight mb-10 leading-relaxed flex-grow">
                    Primary atomic synchronization with Cloudflare R2. Overwrites remote database with local state. Use as the definitive team-sync method.
                </p>

                <div className="space-y-4">
                    <button 
                        onClick={handleBackupToCloud} 
                        disabled={isCloudLoading} 
                        className="w-full bg-coral-blue hover:brightness-110 text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 border-b-4 border-blue-700 uppercase tracking-widest text-[11px]"
                    >
                        {isCloudLoading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <CloudIcon className="w-5 h-5" />}
                        <span>{isCloudLoading ? 'COMMIT IN PROGRESS' : 'FORCE CLOUD SYNC'}</span>
                    </button>
                    <button 
                        onClick={handleRestoreFromCloud} 
                        disabled={isCloudLoading} 
                        className="w-full bg-white border-2 border-coral-blue text-coral-blue hover:bg-blue-50 font-black py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-30 uppercase tracking-widest text-[10px]"
                    >
                        RELOAD FROM CLOUD BUCKET
                    </button>
                </div>
            </div>

            {/* RESTORE PACKAGE CARD */}
            <div className="bg-white p-10 border-2 border-gray-100 rounded-[3rem] shadow-lg flex flex-col h-full group hover:border-coral-dark transition-all">
                <div className="flex items-center gap-5 mb-8 border-b border-gray-50 pb-6">
                    <div className="p-4 bg-gray-50 text-gray-400 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                        <ClipboardListIcon className="w-6 h-6" />
                    </div>
                    <h3 className="font-black text-xl text-coral-dark uppercase tracking-tight italic leading-none">Import Recovery Package</h3>
                </div>
                
                <p className="text-xs font-bold text-gray-500 uppercase tracking-tight mb-10 leading-relaxed flex-grow">
                    Manually restore from a previously exported <span className="text-coral-dark underline">.json</span> archive. This action will purge all current unsynced data.
                </p>

                <div className="space-y-4">
                    <button 
                        onClick={handleDownloadBackup}
                        className="w-full bg-coral-blue text-white font-black py-5 rounded-2xl shadow-md hover:brightness-110 transition-all active:scale-95 uppercase tracking-widest text-[11px] border-b-4 border-blue-700 flex items-center justify-center gap-2"
                    >
                        <UploadIcon className="w-4 h-4 transform rotate-180" />
                        Download Latest JSON
                    </button>
                    <button 
                        onClick={() => restoreFileInputRef.current?.click()}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-coral-dark font-black py-5 rounded-2xl shadow-md transition-all active:scale-95 uppercase tracking-widest text-[11px] border-b-4 border-gray-300"
                    >
                        Select JSON Package
                    </button>
                    <input type="file" ref={restoreFileInputRef} onChange={handleRestoreFileChange} className="hidden" accept=".json" />
                    <p className="text-center text-[9px] font-black text-gray-300 uppercase tracking-widest mt-2 italic">Requires unencrypted site manifest</p>
                </div>
            </div>
        </div>

        {/* SPECIES LIBRARY CARD */}
        <div className="p-10 border-2 border-purple-100 rounded-[3.5rem] bg-purple-50/20 shadow-xl space-y-10 group hover:border-purple-300 transition-all">
            <div className="flex items-center gap-6 border-b border-purple-100 pb-6">
                <div className="p-5 bg-purple-600 text-white rounded-[1.5rem] shadow-xl group-hover:rotate-6 transition-transform">
                    <BookOpenIcon className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="font-black text-2xl text-purple-900 uppercase tracking-tighter italic leading-none">Scientific Library Assets</h3>
                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mt-2">Taxonomy & Genetic Records</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => downloadCSV(backupData.speciesList || [], 'species-library.csv')} className="bg-purple-600 hover:bg-purple-700 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest border-b-4 border-purple-800 flex items-center justify-center gap-3">
                    <UploadIcon className="w-5 h-5 transform rotate-180" /> EXPORT SPECIES CSV
                </button>
                <button onClick={() => importSpeciesInputRef.current?.click()} className="bg-white border-2 border-purple-600 text-purple-700 font-black py-5 rounded-2xl hover:bg-purple-50 transition-all active:scale-95 shadow-lg text-xs uppercase tracking-widest">
                    IMPORT SPECIES JSON
                </button>
                <input type="file" ref={importSpeciesInputRef} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            try {
                                onImportSpecies(JSON.parse(ev.target?.result as string));
                            } catch (err) {
                                alert("Invalid JSON format for species import.");
                            }
                        }
                        reader.readAsText(file);
                    }
                }} className="hidden" accept=".json" />
            </div>
        </div>

        {/* CSV EXPORT HUB */}
        <div className="p-10 bg-gray-50 border-2 border-gray-100 rounded-[3rem] shadow-inner space-y-8">
            <div className="flex items-center gap-4">
                <DatabaseIcon className="w-5 h-5 text-gray-400" />
                <h3 className="font-black text-gray-700 uppercase tracking-widest text-xs italic">CSV Analytic Exports</h3>
            </div>
            <div className="flex flex-wrap gap-4">
                <button onClick={() => downloadCSV(backupData.sites, 'sites.csv')} className="px-10 py-4 bg-white border-2 border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-coral-blue hover:text-coral-blue transition-all shadow-sm active:scale-95">SITES</button>
                <button onClick={() => downloadCSV(backupData.coralBranches, 'coral-inventory.csv')} className="px-10 py-4 bg-white border-2 border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-coral-blue hover:text-coral-blue transition-all shadow-sm active:scale-95">INVENTORY</button>
                <button onClick={() => downloadCSV(backupData.rubbleAnchors, 'rubble-anchors.csv')} className="px-10 py-4 bg-white border-2 border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-coral-blue hover:text-coral-blue transition-all shadow-sm active:scale-95">RUBBLE ANCHORS</button>
            </div>
        </div>

        <div className="pt-20 border-t border-gray-100 flex flex-col items-center gap-6">
            <button onClick={onWipeAllData} className="text-[10px] font-black text-red-300 hover:text-red-500 uppercase tracking-[0.5em] transition-colors italic">
                WIPE REGISTRY SYSTEM (DESTRUCTIVE)
            </button>
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Resilient Reefs Foundation v15.0 Operational Integrity</p>
        </div>
      </div>
    </div>
  );
};

export default BackupRestorePage;