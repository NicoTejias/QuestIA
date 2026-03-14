import { useState, useEffect } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { NATIVE_VERSION } from "../version";
import { Download, AlertCircle } from "lucide-react";
import { Capacitor } from '@capacitor/core';

export default function UpdateNotification() {
    const config = useQuery(api.app_config.getLatestConfig);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        // Solo verificamos si estamos corriendo como App Nativa (Android/iOS)
        if (!Capacitor.isNativePlatform()) return;

        if (config && config.latestVersion !== NATIVE_VERSION) {
            setShowModal(true);
        }
    }, [config]);

    if (!showModal || !config) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <div className="bg-surface-light border border-primary/30 rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden relative group">
                {/* Decoración de fondo */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all duration-700" />
                
                <div className="relative z-10 text-center">
                    <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
                        <Download className="w-10 h-10 text-primary-light animate-bounce" />
                    </div>

                    <h2 className="text-2xl font-black text-white mb-3 tracking-tight">
                        ¡Nueva Actualización! 🚀
                    </h2>
                    
                    <p className="text-slate-400 text-sm leading-relaxed mb-8">
                        {config.message}
                    </p>

                    <div className="space-y-3">
                        <a 
                            href={config.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 w-full bg-primary hover:bg-primary-light text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-primary/25 active:scale-[0.98]"
                        >
                            <Download className="w-5 h-5" />
                            Descargar APK v{config.latestVersion}
                        </a>
                        
                        {!config.isMandatory && (
                            <button 
                                onClick={() => setShowModal(false)}
                                className="w-full text-slate-500 hover:text-white text-sm font-medium py-2 transition-colors"
                            >
                                Quizás más tarde
                            </button>
                        )}
                    </div>
                    
                    <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-600 font-mono uppercase tracking-widest">
                        <AlertCircle className="w-3 h-3" />
                        Versión Actual: {NATIVE_VERSION}
                    </div>
                </div>
            </div>
        </div>
    );
}
