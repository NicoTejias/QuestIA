import React, { useState } from "react";
import { FolderOpen, FileText, RefreshCw, Sparkles, CheckCircle, BookOpen, Trash2, Cloud } from "lucide-react";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import { useGooglePicker } from "../../hooks/useGooglePicker";
import { DriveSyncAPI } from "../../lib/api";

interface CourseNotebookPanelProps {
  courseId: string;
}

export const CourseNotebookPanel: React.FC<CourseNotebookPanelProps> = ({ courseId }) => {
  const { data: course, refetch: refetchCourse } = useSupabaseQuery(
    () => DriveSyncAPI.getCourseNotebook(courseId),
    [courseId]
  );
  const { openPicker, authenticate, accessToken, isLoaded } = useGooglePicker();

  const [folderInput, setFolderInput] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [planningResult, setPlanningResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);

  const manifest: any[] = (course as any)?.drive_files_manifest || [];
  const notebookText: string | null = (course as any)?.drive_notebook_text || (typeof localStorage !== 'undefined' ? localStorage.getItem(`questia_notebook_text_${courseId}`) : null);

  const handleSync = async (customToken?: string) => {
    const targetFolder = folderInput.trim() || (course as any)?.drive_folder_id;
    if (!targetFolder) {
      setErrorMessage("Por favor ingresa la URL o el ID de tu carpeta de Google Drive.");
      return;
    }

    setErrorMessage(null);
    setIsSyncing(true);

    try {
      let folderId = targetFolder;
      if (targetFolder.includes("folders/")) {
        folderId = targetFolder.split("folders/")[1].split("?")[0];
      }

      let token = customToken || accessToken;
      if (!token) {
        try {
          token = await authenticate();
        } catch {
          throw new Error("Se requiere autorización con tu cuenta de Google para acceder a los archivos de Google Drive.");
        }
      }

      const items = await DriveSyncAPI.syncCourseDriveFolder(courseId, folderId, token);
      if (items.length === 0) {
        setErrorMessage("No se encontraron archivos dentro de la carpeta especificada. Asegúrate de que la carpeta contenga archivos (PDFs, PPTs, Docs, XLSX).");
      }
      await refetchCourse();
    } catch (err: any) {
      console.error("Error sincronizando cuaderno de Drive:", err);
      setErrorMessage(err.message || "Error al conectar con Google Drive. Por favor concede permisos a tu cuenta de Google.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePickFolder = () => {
    setErrorMessage(null);
    if (!isLoaded) {
      setErrorMessage("Cargando API de Google Drive... Intenta de nuevo en unos segundos.");
      return;
    }
    openPicker(async (docs, token) => {
      if (docs && docs.length > 0) {
        const selected = docs[0];
        const folderId = selected.mimeType === "application/vnd.google-apps.folder" ? selected.id : (selected.parentId || selected.id);
        setFolderInput(folderId);
        setIsSyncing(true);
        try {
          const items = await DriveSyncAPI.syncCourseDriveFolder(courseId, folderId, token);
          if (items.length === 0) {
            setErrorMessage("No se encontraron archivos dentro de la carpeta seleccionada.");
          }
          await refetchCourse();
        } catch (err: any) {
          setErrorMessage(err.message || "Error al sincronizar carpeta de Google Drive.");
        } finally {
          setIsSyncing(false);
        }
      }
    });
  };

  const handleUnlink = async () => {
    if (!window.confirm("¿Estás seguro de que deseas desvincular la carpeta de Google Drive de este ramo?")) {
      return;
    }

    setErrorMessage(null);
    setIsSyncing(true);

    try {
      await DriveSyncAPI.unlinkCourseDriveFolder(courseId);
      setFolderInput("");
      setPlanningResult(null);
      await refetchCourse();
    } catch (err: any) {
      console.error("Error desvinculando carpeta de Drive:", err);
      setErrorMessage("No se pudo desvincular la carpeta. Intenta de nuevo.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePlanCourse = async () => {
    setErrorMessage(null);
    setIsPlanning(true);
    try {
      const res = await DriveSyncAPI.planCourseFromDriveNotebook(courseId);
      setPlanningResult(res);
    } catch (err: any) {
      console.error("Error al planificar curso con IA:", err);
      setErrorMessage(err.message || "No se pudo generar la planificación con Gemini. Reintenta en unos instantes.");
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl text-white my-6">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-950/80 border border-emerald-800/60 rounded-lg text-emerald-400">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Cuaderno del Curso en Google Drive
            </h3>
            <p className="text-xs text-slate-400">
              Archivos, syllabus y presentaciones leídos recursivamente desde las subcarpetas de tu Google Drive.
            </p>
          </div>
        </div>
        {(course as any)?.last_drive_sync && (
          <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Última sync: {new Date((course as any).last_drive_sync).toLocaleString("es-CL")}
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-950/80 border border-red-800 rounded-lg text-xs text-red-300">
          {errorMessage}
        </div>
      )}

      {/* Selector/Ingreso de Carpeta */}
      {(!(course as any)?.drive_folder_id || manifest.length === 0) && (
        <div className="mb-5 space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <label className="block text-sm font-medium text-slate-300">
            Vincular Carpeta de Google Drive del Ramo:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              placeholder="Pega la URL o el ID de tu carpeta de Google Drive..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
            />
            <button
              onClick={() => handleSync()}
              disabled={isSyncing}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/50"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Escaneando...</span>
                </>
              ) : (
                <>
                  <FolderOpen className="w-4 h-4" />
                  <span>Escanear y Vincular</span>
                </>
              )}
            </button>
            <button
              onClick={handlePickFolder}
              disabled={isSyncing || !isLoaded}
              className="bg-[#4285F4]/20 hover:bg-[#4285F4]/30 text-[#4285F4] border border-[#4285F4]/40 font-semibold px-4 py-2.5 rounded-lg text-sm transition-all flex items-center justify-center space-x-2"
              title="Abrir selector nativo de Google Drive para elegir tu carpeta"
            >
              <Cloud className="w-4 h-4" />
              <span>Elegir con Google</span>
            </button>
          </div>
        </div>
      )}

      {/* Árbol y Manifiesto de Archivos */}
      {manifest.length > 0 && (
        <div className="space-y-4">
          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Materiales e Insumos Detectados ({manifest.length})
              </span>
              {(course as any)?.drive_folder_id && (
                <span className="text-xs text-slate-500 font-mono">ID: {(course as any).drive_folder_id}</span>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {manifest.map((file: any) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between py-2 px-3 bg-slate-900/80 hover:bg-slate-800/80 rounded-lg border border-slate-800/60 transition-colors"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-200 truncate">{file.path}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-400 border border-emerald-800/60 uppercase tracking-wider">
                    {file.category || "General"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {notebookText && (
            <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  <strong>Cuaderno Consolidado en Markdown (.md) activo</strong> ({notebookText.length.toLocaleString()} caracteres extraídos para la IA)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowMarkdownPreview(!showMarkdownPreview)}
                className="px-3 py-1 bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 font-semibold rounded-lg border border-emerald-700 transition-colors whitespace-nowrap"
              >
                {showMarkdownPreview ? "Ocultar Texto .md" : "Ver Texto .md"}
              </button>
            </div>
          )}

          {showMarkdownPreview && notebookText && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-xs font-bold text-slate-300">
                <span>Vista Previa del Cuaderno Consolidado (.md)</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(notebookText);
                    alert("Texto Markdown copiado al portapapeles");
                  }}
                  className="text-emerald-400 hover:text-emerald-300 text-[11px] underline"
                >
                  Copiar Markdown
                </button>
              </div>
              <pre className="max-h-80 overflow-y-auto text-[11px] font-mono text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800/80 custom-scrollbar whitespace-pre-wrap leading-relaxed">
                {notebookText}
              </pre>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={() => handleSync()}
              disabled={isSyncing}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 border border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              <span>Re-sincronizar Subcarpetas</span>
            </button>

            <button
              onClick={handlePlanCourse}
              disabled={isPlanning}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-emerald-950/50 transition-all flex items-center space-x-2"
            >
              <Sparkles className={`w-4 h-4 ${isPlanning ? "animate-spin" : ""}`} />
              <span>{isPlanning ? "Analizando Cuaderno con Gemini..." : "Generar Planificación con IA"}</span>
            </button>

            <button
              onClick={handleUnlink}
              disabled={isSyncing || isPlanning}
              className="bg-red-950/60 hover:bg-red-900/80 text-red-300 hover:text-red-200 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 border border-red-800/60 ml-auto"
              title="Quitar vinculación de Google Drive en este ramo"
            >
              <Trash2 className="w-4 h-4" />
              <span>Desvincular Cuaderno</span>
            </button>
          </div>
        </div>
      )}

      {/* Resultados de Planificación con IA */}
      {planningResult && (
        <div className="mt-6 border-t border-slate-800 pt-5 space-y-4">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-base">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>Planificación Académica Generada por Gemini</span>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <p className="text-sm text-slate-300 leading-relaxed">{planningResult.resumen_ejecutivo}</p>

            {planningResult.semanas && planningResult.semanas.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Cronograma Semanal Generado ({planningResult.semanas.length} Semanas)
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {planningResult.semanas.slice(0, 6).map((sem: any) => (
                    <div key={sem.semana} className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between items-center text-slate-200 font-semibold">
                        <span>Semana {sem.semana}: {sem.unidad}</span>
                      </div>
                      <p className="text-slate-400">{sem.tema}</p>
                      {sem.mision_gamificada && (
                        <div className="mt-1 text-[11px] text-amber-400 font-medium">
                          🎮 Misión: {sem.mision_gamificada.titulo} (+{sem.mision_gamificada.puntos_exp} EXP)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
