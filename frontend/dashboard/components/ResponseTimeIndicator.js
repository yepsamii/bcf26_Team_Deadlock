// Response Time Indicator Component
function ResponseTimeIndicator({ averageTime, serviceName, threshold = 1000 }) {
    const isAlert = averageTime > threshold;

    return (
        <div className={`rounded-xl p-6 transition-all duration-500 ${
            isAlert
                ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/50'
                : 'bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/50'
        }`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {isAlert ? (
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                    ) : (
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                    <div>
                        <p className="text-white/90 text-sm font-medium">{serviceName}</p>
                        <p className="text-white/70 text-xs">30-Second Rolling Average</p>
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isAlert ? 'bg-red-900/50 text-white' : 'bg-green-900/50 text-white'
                }`}>
                    {isAlert ? 'ALERT' : 'HEALTHY'}
                </div>
            </div>

            <div className="mb-3">
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">{averageTime}</span>
                    <span className="text-xl text-white/80">ms</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${
                                isAlert ? 'bg-white' : 'bg-white/60'
                            }`}
                            style={{ width: `${Math.min((averageTime / (threshold * 2)) * 100, 100)}%` }}
                        ></div>
                    </div>
                    <span className="text-white/80 text-xs font-medium">{threshold}ms threshold</span>
                </div>
            </div>

            {isAlert && (
                <div className="flex items-start gap-2 p-3 bg-red-900/30 rounded-lg border border-white/20">
                    <svg className="w-4 h-4 text-white mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <p className="text-white text-xs font-medium">Performance Degradation Detected</p>
                        <p className="text-white/80 text-xs mt-1">
                            Response time exceeds {threshold}ms threshold. Investigate for potential issues.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
