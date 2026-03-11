export default function BetaBanner({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-accent/10 border border-accent/20 text-accent-light px-3 py-1.5 rounded-full text-[10px] font-bold font-mono shadow-sm flex items-center gap-2 whitespace-nowrap ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
      </span>
      BETA VERSION
    </div>
  )
}
