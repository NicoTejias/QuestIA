import { useState, useEffect, useCallback, useRef } from 'react';
import { Joyride, STATUS } from 'react-joyride';

const TOUR_KEY_PREFIX = 'questia_tour_seen_';

function makeStep(content: React.ReactNode) {
    return {
        target: 'body',
        placement: 'center' as const,
        disableBeacon: true,
        content,
    };
}

const SECTION_TOURS: Record<string, React.ReactNode[]> = {
    inicio: [
        <div className="text-center space-y-2">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-base font-bold text-white">Panel de Inicio</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
                Aquí verás el resumen general de todos tus ramos: retención de alumnos, actividad reciente y métricas clave.
            </p>
        </div>,
        <div className="text-center space-y-2">
            <div className="text-4xl mb-3">📈</div>
            <h3 className="text-base font-bold text-white">Indicadores de Retención</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
                El indicador de retención muestra qué tan enganchados están tus alumnos. Mientras más alto, mejor están participando en los desafíos.
            </p>
        </div>,
    ],
    ramos: [
        <div className="text-center space-y-2">
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-base font-bold text-white">Mis Ramos</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
                Aquí administras todos tus cursos. Cada ramo tiene sus propios alumnos, desafíos, ranking y recompensas independientes.
            </p>
        </div>,
        <div className="text-center space-y-2">
            <div className="text-4xl mb-3">➕</div>
            <h3 className="text-base font-bold text-white">Crear un Ramo</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
                Usa el botón <strong className="text-accent-light">+ Nuevo Ramo</strong> para crear un curso. Asígnale un nombre y código, y luego agrega a tus alumnos por lista o invitación.
            </p>
        </div>,
        <div className="text-center space-y-2">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="text-base font-bold text-white">Gestión de Alumnos</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
                Al entrar a un ramo podrás ver la lista de alumnos, su puntaje, historial de quizzes y darles puntos de participación en clases.
            </p>
        </div>,
    ],
    material: [
        <div className="text-center space-y-2">
            <div className="text-4xl mb-3">📄</div>
            <h3 className="text-base font-bold text-white">Material de Clases</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
                Sube tus documentos de clases: PDFs, Word, PowerPoint o Excel. La IA los leerá para generar desafíos automáticamente con el contenido.
            </p>
        </div>,
        <div className="text-center space-y-2">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="text-base font-bold text-white">Generación con IA</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
                Una vez subido el material, ve a <strong className="text-accent-light">Desafíos</strong> y selecciona el documento para que la IA cree preguntas basadas en tu propio contenido del ramo.
            </p>
        </div>,
    ],
    desafios: [
        <div className="text-center space-y-2">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-base font-bold text-white">Desafíos y Quizzes</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
                Crea actividades gamificadas para tus alumnos. Tienen 5 tipos de juego: trivia, verdadero/falso, sopa de letras, memoria y emparejamiento.
            </p>
        </div>,
        <div className="text-center space-y-2">
            <div className="text-4xl mb-3">✨</div>
            <h3 className="text-base font-bold text-white">Generación con IA</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
                Elige <strong className="text-accent-light">Generar con IA</strong> para crear el quiz automáticamente desde tu material de clases. Solo selecciona el ramo, el documento y el tipo de juego.
            </p>
        </div>,
        <div className="text-center space-y-2">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-base font-bold text-white">Puntos y Rachas</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
                Los alumnos ganan puntos al completar desafíos y acumulan rachas si juegan día a día. Tú defines cuántos puntos vale cada desafío.
            </p>
        </div>,
    ],
    ranking: [
        <div className="text-center space-y-2">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="text-base font-bold text-white">Ranking en Tiempo Real</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
                Ve el tablero de líderes de cada ramo. Los puntajes se actualizan al instante cuando los alumnos completan desafíos.
            </p>
        </div>,
        <div className="text-center space-y-2">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-base font-bold text-white">Puntos de Participación</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
                Desde la vista de tu ramo puedes darle puntos extra a cualquier alumno manualmente, por ejemplo para premiar participación en clases.
            </p>
        </div>,
    ],
    recompensas: [
        <div className="text-center space-y-2">
            <div className="text-4xl mb-3">🎁</div>
            <h3 className="text-base font-bold text-white">Tienda de Recompensas</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
                Crea recompensas que los alumnos pueden canjear con sus puntos: puntos extra en una evaluación, extensión de un plazo, etc.
            </p>
        </div>,
        <div className="text-center space-y-2">
            <div className="text-4xl mb-3">📬</div>
            <h3 className="text-base font-bold text-white">Canjes Pendientes</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
                Cuando un alumno canjea una recompensa, te llega una notificación. Aquí verás los canjes pendientes de entrega para gestionarlos uno a uno.
            </p>
        </div>,
    ],
};

interface TeacherTourProps {
    activeTab: string;
    isDemo: boolean;
}

export default function TeacherTour({ activeTab, isDemo }: TeacherTourProps) {
    const [run, setRun] = useState(false);
    const [steps, setSteps] = useState<any[]>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const activeTabRef = useRef(activeTab);

    useEffect(() => {
        activeTabRef.current = activeTab;
    }, [activeTab]);

    useEffect(() => {
        if (!isDemo) return;

        // Limpiar timer anterior
        if (timerRef.current) clearTimeout(timerRef.current);
        setRun(false);

        const key = TOUR_KEY_PREFIX + activeTab;
        if (localStorage.getItem(key)) return;

        const contents = SECTION_TOURS[activeTab];
        if (!contents || contents.length === 0) return;

        // Guardar clave ANTES de mostrar — garantiza que no se repita
        // aunque el callback de Joyride no dispare correctamente
        localStorage.setItem(key, 'true');

        const sectionSteps = contents.map(makeStep);
        setSteps(sectionSteps);

        timerRef.current = setTimeout(() => setRun(true), 800);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [activeTab, isDemo]);

    const handleCallback = useCallback((data: any) => {
        const { status } = data;
        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            setRun(false);
            localStorage.setItem(TOUR_KEY_PREFIX + activeTabRef.current, 'true');
        }
    }, []);

    if (!run || steps.length === 0) return null;

    const JoyrideAny = Joyride as any;

    return (
        <JoyrideAny
            steps={steps}
            run={run}
            continuous={true}
            showSkipButton={true}
            showProgress={true}
            disableScrolling={true}
            callback={handleCallback}
            locale={{
                back: 'Atrás',
                close: 'Cerrar',
                last: '¡Entendido!',
                next: 'Siguiente →',
                skip: 'Omitir',
            }}
            styles={{
                options: {
                    zIndex: 9999,
                    primaryColor: '#8b5cf6',
                    backgroundColor: '#1e293b',
                    textColor: '#f8fafc',
                    arrowColor: '#1e293b',
                    overlayColor: 'rgba(0,0,0,0.6)',
                },
                tooltip: {
                    borderRadius: '16px',
                    padding: '24px',
                    maxWidth: '320px',
                    border: '1px solid rgba(139,92,246,0.2)',
                },
                buttonNext: {
                    backgroundColor: '#8b5cf6',
                    borderRadius: '10px',
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                },
                buttonBack: {
                    color: '#94a3b8',
                    marginRight: '8px',
                },
                buttonSkip: {
                    color: '#64748b',
                    fontSize: '12px',
                },
            }}
        />
    );
}
