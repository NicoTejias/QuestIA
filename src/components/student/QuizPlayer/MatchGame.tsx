import { useMemo } from 'react'

interface Props {
    questions: any[]
    selectedA: number | null
    matchedPairs: number[]
    onSelect: (idx: number, isRightSide: boolean) => void
}

function deterministcShuffle<T>(array: T[], seed: number): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const randomIndex = Math.floor((seed * 9301 + 49297) % (i + 1))
        const nextSeed = (seed * 9301 + 49297) % 233280
        ;[shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]]
        seed = nextSeed
    }
    return shuffled
}

export default function MatchGame({ questions, selectedA, matchedPairs, onSelect }: Props) {
    const shuffledDefinitions = useMemo(() => {
        const items = [...questions].map((q, originalIndex) => ({ ...q, originalIndex }))
        return deterministcShuffle(items, questions.length + 12345)
    }, [questions]);

    return (
        <div className="animate-in fade-in duration-300">
            <h3 className="text-center text-lg md:text-xl font-bold text-slate-300 mb-6 md:mb-8">Empareja los conceptos</h3>
            <div className="grid grid-cols-2 gap-3 md:gap-8">
                <div className="space-y-2 md:space-y-4">
                    {questions.map((q: any, i: number) => (
                        <button
                            key={`left-${i}`}
                            disabled={matchedPairs.includes(i)}
                            onClick={() => onSelect(i, false)}
                            className={`w-full p-3 md:p-4 rounded-xl border text-left text-sm md:text-base font-bold transition-all ${
                                matchedPairs.includes(i)
                                    ? 'bg-green-500/10 border-green-500/20 text-green-500/50 cursor-default'
                                    : selectedA === i
                                    ? 'bg-accent/20 border-accent text-white'
                                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                            }`}
                        >
                            {q.front || q.term || `Concepto ${i + 1}`}
                        </button>
                    ))}
                </div>
                <div className="space-y-2 md:space-y-4">
                    {shuffledDefinitions.map((q: any, i: number) => {
                        const realIdx = q.originalIndex
                        return (
                            <button
                                key={`right-${i}`}
                                disabled={matchedPairs.includes(realIdx)}
                                onClick={() => onSelect(realIdx, true)}
                                className={`w-full p-3 md:p-4 rounded-xl border text-left text-sm md:text-base font-bold transition-all ${
                                    matchedPairs.includes(realIdx)
                                        ? 'bg-green-500/10 border-green-500/20 text-green-500/50 cursor-default'
                                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                }`}
                            >
                                {q.back || q.definition || `Definición ${realIdx + 1}`}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
