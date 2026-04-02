import { useState, useEffect, useCallback } from 'react';
import { Joyride, STATUS, EVENTS } from 'react-joyride';

const TOUR_KEY = 'questia_demo_tour_seen';

const steps = [
    {
        target: 'body',
        placement: 'center' as const,
        disableBeacon: true,
        content: (
            <div className="text-center space-y-2">
                <div className="text-4xl mb-3">👋</div>
                <h2 className="text-lg font-bold text-white">¡Bienvenido a QuestIA!</h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                    Te mostraremos las funciones principales para que puedas sacarle el máximo provecho como docente.
                </p>
            </div>
        ),
    },
    {
        target: '.tour-step-ramos',
        placement: 'right' as const,
        disableBeacon: true,
        content: (
            <div className="space-y-1">
                <h3 className="font-bold text-white">📚 Mis Ramos</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                    Crea y gestiona tus cursos. Cada ramo tiene sus propios alumnos, desafíos y ranking.
                </p>
            </div>
        ),
    },
    {
        target: '.tour-step-material',
        placement: 'right' as const,
        disableBeacon: true,
        content: (
            <div className="space-y-1">
                <h3 className="font-bold text-white">📄 Material</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                    Sube tus PDFs, Word o PowerPoints. La IA los leerá para generar desafíos automáticamente basados en tu contenido.
                </p>
            </div>
        ),
    },
    {
        target: '.tour-step-desafios',
        placement: 'right' as const,
        disableBeacon: true,
        content: (
            <div className="space-y-1">
                <h3 className="font-bold text-white">🎯 Desafíos</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                    Crea quizzes con IA: trivia, verdadero/falso, sopa de letras o memoria. Los alumnos ganan puntos al completarlos.
                </p>
            </div>
        ),
    },
    {
        target: '.tour-step-ranking',
        placement: 'right' as const,
        disableBeacon: true,
        content: (
            <div className="space-y-1">
                <h3 className="font-bold text-white">🏆 Ranking</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                    Ve el tablero de puntajes en tiempo real. Fomenta la competencia sana entre compañeros de curso.
                </p>
            </div>
        ),
    },
    {
        target: '.tour-step-recompensas',
        placement: 'right' as const,
        disableBeacon: true,
        content: (
            <div className="space-y-1">
                <h3 className="font-bold text-white">🎁 Recompensas</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                    Los alumnos canjean sus puntos por beneficios reales: puntos extra en evaluaciones, extensiones de plazo y más.
                </p>
            </div>
        ),
    },
    {
        target: '.tour-step-estadisticas',
        placement: 'right' as const,
        disableBeacon: true,
        content: (
            <div className="space-y-1">
                <h3 className="font-bold text-white">📊 Inicio & Estadísticas</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                    Aquí verás el resumen de retención y actividad de tus alumnos. ¡Ya estás listo para explorar!
                </p>
            </div>
        ),
    },
];

export default function TeacherTour() {
    const [run, setRun] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem(TOUR_KEY)) {
            setTimeout(() => setRun(true), 1200);
        }
    }, []);

    const handleCallback = useCallback((data: any) => {
        const { status, type } = data;
        if (type === EVENTS.TOUR_END || status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            setRun(false);
            localStorage.setItem(TOUR_KEY, 'true');
        }
    }, []);

    if (!run) return null;

    const JoyrideAny = Joyride as any;

    return (
        <JoyrideAny
            steps={steps}
            run={run}
            continuous={true}
            showSkipButton={true}
            showProgress={true}
            disableScrolling={false}
            scrollToFirstStep={false}
            spotlightClicks={false}
            callback={handleCallback}
            locale={{
                back: 'Atrás',
                close: 'Cerrar',
                last: '¡Listo!',
                next: 'Siguiente →',
                skip: 'Omitir tour',
            }}
            styles={{
                options: {
                    zIndex: 9999,
                    primaryColor: '#8b5cf6',
                    backgroundColor: '#1e293b',
                    textColor: '#f8fafc',
                    arrowColor: '#1e293b',
                    overlayColor: 'rgba(0,0,0,0.55)',
                    spotlightShadow: '0 0 0 3px #8b5cf6',
                },
                tooltip: {
                    borderRadius: '16px',
                    padding: '20px',
                    maxWidth: '300px',
                },
                tooltipTitle: {
                    fontSize: '16px',
                    fontWeight: 700,
                },
                buttonNext: {
                    backgroundColor: '#8b5cf6',
                    borderRadius: '10px',
                    padding: '8px 16px',
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
