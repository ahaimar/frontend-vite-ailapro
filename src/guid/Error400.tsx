export const Error400 = () => {
    return (
        <div className="min-h-screen bg-bg flex items-center justify-center text-center">
            <div>
                <div className="font-syne font-extrabold text-8xl text-white/10 mb-4">404</div>
                <div className="font-syne font-bold text-2xl mb-2">Page not found</div>
                <div className="text-white/40 text-sm mb-6">The page you're looking for doesn't exist.</div>
                <a href="/dashboard" className="px-5 py-2.5 bg-gold text-bg font-syne font-bold text-sm rounded-xl hover:opacity-90 transition-all">Go to Dashboard</a>
            </div>
        </div>
    )
};