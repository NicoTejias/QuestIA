import { Clock, CheckCircle2 } from 'lucide-react'

interface MemoryCard {
    idx: number
    label: string
    type: 'term' | 'definition'
    pairIndex: number
}

interface Props {
    currentQ: any
    shuffledCards: MemoryCard[]
    flippedCards: number[]
    memoryMatched: number[]
    gameTimeLeft: number
    gameScore: number
    onFlip: (cardIdx: number) => void
}

export default function Memory({
    currentQ, shuffledCards, flippedCards, memoryMatched, gameTimeLeft, gameScore, onFlip,
}: Props) {
    const pairs = currentQ.pairs || []
    const cardsToRender = shuffledCards.length > 0
        ? shuffledCards
        : pairs.flatMap((p: any, i: number) => [
            { idx: i * 2, label: p.term, type: 'term' as const, pairIndex: i },
            { idx: i * 2 + 1, label: p.definition, type: 'definition' as const, pairIndex: i },
        ])

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-center gap-3 mb-6 bg-pink-500/10 border border-pink-500/20 rounded-2xl max-w-sm mx-auto p-4 shadow-xl shadow-pink-500/5">
                <Clock className={`w-6 h-6 ${gameTimeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-pink-400'}`} />
                <div className="flex flex-col items-center">
                    <span className={`text-xl font-black ${gameTimeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
                        {(memoryMatched.length / 2) * 10} / {(currentQ.pairs?.length || 5) * 10} PTS
                    </span>
                    <span className="text-[10px] font-bold text-pink-400/60 uppercase tracking-widest">
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
                Encuentra las {pairs.length} parejas
            </h3>
            <p className="text-slate-500 text-xs text-center mb-4">
                Toca dos cartas para buscar una pareja (término ↔ definición)
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                {cardsToRender.map((card: MemoryCard) => {
                    const isFlipped = flippedCards.includes(card.idx) || memoryMatched.includes(card.idx)
                    const isMatched = memoryMatched.includes(card.idx)
                    return (
                        <button
                            key={card.idx}
                            onClick={() => onFlip(card.idx)}
                            disabled={isMatched}
                            className={`p-1.5 md:p-3 rounded-xl border text-left transition-all min-h-[100px] md:min-h-[140px] flex items-center justify-center overflow-hidden hover:scale-[1.02] active:scale-[0.98] ${
                                isMatched
                                    ? 'bg-pink-500/20 border-pink-500/40 cursor-default opacity-80'
                                    : isFlipped
                                    ? 'bg-pink-500/10 border-pink-500/30 ring-2 ring-pink-500/20'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                        >
                            {isMatched ? (
                                <div className="flex flex-col items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-pink-400" />
                                    <span className={`text-xs md:text-sm font-bold text-center leading-tight break-words px-1 drop-shadow-[0_0_8px_rgba(236,72,153,0.9)] ${card.type === 'term' ? 'text-pink-300' : 'text-slate-200'}`}>
                                        {card.label}
                                    </span>
                                </div>
                            ) : isFlipped ? (
                                <span className={`text-xs md:text-sm font-bold text-center leading-tight break-words px-2 max-h-full ${card.type === 'term' ? 'text-pink-300' : 'text-slate-200'}`}>
                                    {card.label}
                                </span>
                            ) : (
                                <div className="relative">
                                    <span className="text-slate-600 text-xl md:text-3xl font-black">?</span>
                                    <div className="absolute -inset-4 bg-pink-500/5 rounded-full blur-xl"></div>
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
            <div className="text-center text-slate-500 text-xs mt-3">
                {memoryMatched.length / 2} / {pairs.length} parejas
            </div>
        </div>
    )
}
