export default function OfflinePage() {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-6 text-center">
            <div className="w-20 h-20 bg-surface-accent/20 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl">wifi_off</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">You are offline</h1>
            <p className="text-gray-400">Please check your internet connection and try again.</p>
            <button onClick={() => window.location.reload()} className="mt-8 px-6 py-3 bg-primary rounded-full font-bold">
                Try Again
            </button>
        </div>
    );
}
