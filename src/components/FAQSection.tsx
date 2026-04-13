import { useState, useEffect } from 'react'
import { FaqAPI } from '../lib/api'
import { ChevronDown, HelpCircle, Loader2 } from 'lucide-react'

export default function FAQSection({ category }: { category?: string }) {
    const [faqs, setFaqs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openId, setOpenId] = useState<string | null>(null)

    useEffect(() => {
        FaqAPI.getFaqs()
            .then(setFaqs)
            .catch(console.error)
            .finally(() => setIsLoading(false))
    }, [])

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        )
    }

    const filteredFaqs = category 
        ? faqs.filter((f: any) => f.category === category || f.category === 'general')
        : faqs

    if (filteredFaqs.length === 0) {
        return null
    }

    return (
        <section className="py-12 px-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8 justify-center">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <HelpCircle className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-black text-white">Preguntas Frecuentes</h2>
            </div>

            <div className="space-y-4">
                {filteredFaqs.map((faq: any) => (
                    <div 
                        key={faq.id}
                        className={`group bg-surface-light border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 ${
                            openId === faq.id ? 'border-primary/30 ring-1 ring-primary/20' : 'hover:border-white/10'
                        }`}
                    >
                        <button
                            onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                            className="w-full px-6 py-5 text-left flex items-center justify-between gap-4"
                        >
                            <span className={`font-bold text-lg transition-colors ${
                                openId === faq.id ? 'text-primary-light' : 'text-slate-100 group-hover:text-white'
                            }`}>
                                {faq.question}
                            </span>
                            <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${
                                openId === faq.id ? 'rotate-180 text-primary-light' : ''
                            }`} />
                        </button>
                        
                        <div 
                            className={`px-6 transition-all duration-300 ease-in-out ${
                                openId === faq.id ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'
                            }`}
                        >
                            <p className="text-slate-400 leading-relaxed">
                                {faq.answer}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}