import { useState, useEffect, Component, type ReactNode } from 'react';
import { AppConfigAPI } from "../lib/api";
import { NATIVE_VERSION } from "../version";
import { Download, AlertCircle, Loader2 } from "lucide-react";
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { toast } from 'sonner';

class UpdateErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        console.warn("⚠️ UpdateNotification error (non-critical):", error.message);
    }

    render() {
        if (this.state.hasError) {
            return null;
        }
        return this.props.children;
    }
}

function UpdateNotificationInner() {
    const [config, setConfig] = useState<any>(null)
    const [showModal, setShowModal] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        AppConfigAPI.getLatestConfig()
            .then(setConfig)
            .catch(console.error)
    }, [])

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        if (config) {
            if (config.latestVersion !== NATIVE_VERSION) {
                setShowModal(true);
            } else {
                setShowModal(false);
            }
        }
    }, [config]);

    const handleUpdate = async () => {
        if (!config?.downloadUrl) return;

        if (Capacitor.getPlatform() !== 'android') {
            window.open(config.downloadUrl, '_blank');
            return;
        }

        try {
            setDownloading(true);
            setError(null);
            setProgress(5);

            const fileName = `QuestIA_v${config.latestVersion}.apk`;

            const downloadResult = await Filesystem.downloadFile({
                url: config.downloadUrl,
                path: fileName,
                directory: Directory.External,
            });

            if (!downloadResult.path) throw new Error("No se pudo obtener la ruta del archivo");

            setProgress(100);
            toast.success("Descarga completada. Iniciando instalación...");

            await FileOpener.open({
                filePath: downloadResult.path,
                contentType: 'application/vnd.android.package-archive'
            });

        } catch (err: any) {
            console.error("Error actualizando:", err);
            setError(err.message || "Error al descargar la actualización");
            toast.error("Error al actualizar la aplicación");
        } finally {
            setDownloading(false);
        }
    };

    if (!showModal || !config) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <div className="bg-surface-light border border-primary/30 rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all duration-700" />
                
                <div className="relative z-10 text-center">
                    <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
                        {downloading ? (
                            <Loader2 className="w-10 h-10 text-primary-light animate-spin" />
                        ) : (
                            <Download className="w-10 h-10 text-primary-light animate-bounce" />
                        )}
                    </div>

                    <h2 className="text-2xl font-black text-white mb-3 tracking-tight">
                        {downloading ? 'Descargando...' : '¡Nueva Actualización! 🚀'}
                    </h2>
                    
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-4 mb-6 text-left">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tu Versión</span>
                            <span className="text-xs font-mono text-slate-400">{NATIVE_VERSION}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-primary-light font-bold uppercase tracking-widest">Nueva Versión</span>
                            <span className="text-xs font-mono text-primary-light font-bold">{config?.latestVersion}</span>
                        </div>
                    </div>

                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        {downloading 
                            ? `Estamos preparando la versión v${config.latestVersion} para ti. No cierres la aplicación.` 
                            : config.message}
                    </p>

                    {downloading && (
                        <div className="mb-8 space-y-2">
                            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                                <div 
                                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out" 
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                {progress < 100 ? 'Sincronizando paquetes...' : 'Listo para instalar'}
                            </p>
                        </div>
                    )}

                    {!downloading && (
                        <div className="space-y-3">
                            <button 
                                onClick={handleUpdate}
                                className="flex items-center justify-center gap-3 w-full bg-primary hover:bg-primary-light text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-primary/25 active:scale-[0.98]"
                            >
                                <Download className="w-5 h-5" />
                                Actualizar Ahora (v{config.latestVersion})
                            </button>
                            
                            {!config.isMandatory && (
                                <button 
                                    onClick={() => setShowModal(false)}
                                    className="w-full text-slate-500 hover:text-white text-sm font-medium py-2 transition-colors"
                                >
                                    Quizás más tarde
                                </button>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}
                    
                    <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-600 font-mono uppercase tracking-widest">
                        <AlertCircle className="w-3 h-3" />
                        Versión Actual: {NATIVE_VERSION}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function UpdateNotification() {
    return (
        <UpdateErrorBoundary>
            <UpdateNotificationInner />
        </UpdateErrorBoundary>
    );
}