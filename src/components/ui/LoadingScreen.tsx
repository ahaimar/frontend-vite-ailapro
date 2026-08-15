export default function LoadingScreen() {
    return (
        <div className="min-h-screen bg-bg flex items-center justify-center">
            <div className="text-center">
                {/*<div className="w-12 h-12 rounded-2xl bg-linear-to-br from-gold to-gold2 flex items-center justify-center font-syne font-bold text-xl text-bg mx-auto mb-4 animate-pulse">
                    <span className="loading loading-ball loading-xl"></span>
                </div>*/}
                <div className="text-white/30 text-sm font-mono tracking-wider">Loadin<span className="loading loading-dots loading-xs"></span></div>
            </div>
        </div>
    )
}