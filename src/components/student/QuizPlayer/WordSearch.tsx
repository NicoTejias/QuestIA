import { Clock } from 'lucide-react'

interface Props {
    currentQ: any
    wordGrid: string[][]
    foundWords: string[]
    wsFirstCell: { r: number; c: number } | null
    wsFoundCells: { r: number; c: number }[]
    gameTimeLeft: number
    gameScore: number
    onCellClick: (r: number, c: number) => void
    onWordSelect: (word: string) => void
    onSkip: () => void
}

export default function WordSearch({
    currentQ, wordGrid, foundWords, wsFirstCell, wsFoundCells,
    gameTimeLeft, gameScore, onCellClick, onWordSelect, onSkip,
}: Props) {
    const words = currentQ.words || []

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-center gap-3 mb-6 bg-accent/10 border border-accent/20 rounded-2xl max-w-sm mx-auto p-4 shadow-xl shadow-accent/5">
                <Clock className={`w-6 h-6 ${gameTimeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-accent-light'}`} />
                <div className="flex flex-col items-center">
                    <span className={`text-xl font-black ${gameTimeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
                        {foundWords.length * 10} / {(currentQ.words?.length || 5) * 10} PTS
                    </span>
                    <span className="text-[10px] font-bold text-accent-light/60 uppercase tracking-widest">
                        Bono Tiempo: {gameScore}
                    </span>
                </div>
                <div className="ml-2 pl-3 border-l border-white/10 text-center">
                    <span className={`text-sm font-mono font-black ${gameTimeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                        {gameTimeLeft}s
                    </span>
                </div>
            </div>

            <h3 className="text-lg md:text-xl font-bold text-white mb-2 text-center">
                Encuentra las {words.length} palabras ocultas
            </h3>
            <p className="text-slate-500 text-xs text-center mb-6">
                Toca la primera y última letra en la cuadrícula para marcar cada palabra
            </p>

            <div className="flex flex-wrap gap-2 justify-center mb-4">
                {words.map((word: string, i: number) => (
                    <button
                        key={i}
                        onClick={() => onWordSelect(word)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                            foundWords.includes(word)
                                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 line-through'
                                : 'bg-cyan-500/5 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10'
                        }`}
                    >
                        {word}
                    </button>
                ))}
            </div>

            <div className="overflow-x-auto mb-4 -mx-2 px-2">
                <div className="inline-flex justify-center w-full min-w-max">
                    <div className="inline-grid gap-[3px] bg-surface p-2 rounded-xl border border-white/5">
                        {wordGrid.map((row, r) => (
                            <div key={r} className="flex gap-[3px]">
                                {row.map((cell, c) => {
                                    const isFound = wsFoundCells.some((f) => f.r === r && f.c === c)
                                    const isSelecting = wsFirstCell && wsFirstCell.r === r && wsFirstCell.c === c
                                    return (
                                        <button
                                            key={c}
                                            onClick={() => onCellClick(r, c)}
                                            className={`w-7 h-7 md:w-8 md:h-8 border rounded flex items-center justify-center text-[11px] md:text-[13px] font-mono font-black transition-all ${
                                                isFound
                                                    ? 'bg-cyan-500 border-cyan-400 text-white'
                                                    : isSelecting
                                                    ? 'bg-accent/40 border-accent text-white animate-pulse'
                                                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                                            }`}
                                        >
                                            {cell}
                                        </button>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="text-center text-slate-500 text-xs mb-3">
                {foundWords.length} / {words.length} palabras encontradas
            </div>
            <button
                onClick={onSkip}
                className="w-full bg-white/5 border border-white/10 text-slate-400 hover:text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98]"
            >
                {foundWords.length < words.length ? "Pasar (dejar sin encontrar)" : "Terminar"}
            </button>
        </div>
    )
}
