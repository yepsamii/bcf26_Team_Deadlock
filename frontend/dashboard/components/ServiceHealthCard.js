// Service Health Card Component
function ServiceHealthCard({ data }) {
    const statusConfig = {
        healthy: {
            label: 'Healthy',
            color: 'green',
            bgClass: 'bg-green-50',
            textClass: 'text-green-700',
            borderClass: 'border-green-200',
            dotClass: 'bg-green-500',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            )
        },
        degraded: {
            label: 'Degraded',
            color: 'yellow',
            bgClass: 'bg-yellow-50',
            textClass: 'text-yellow-700',
            borderClass: 'border-yellow-200',
            dotClass: 'bg-yellow-500',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            )
        },
        down: {
            label: 'Down',
            color: 'red',
            bgClass: 'bg-red-50',
            textClass: 'text-red-700',
            borderClass: 'border-red-200',
            dotClass: 'bg-red-500',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            )
        }
    };

    const config = statusConfig[data.status] || statusConfig.healthy;
    const isSlowResponse = data.responseTime > 1000;

    return (
        <div className="bg-white rounded-xl card-shadow p-6 hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${config.bgClass} ${config.textClass} flex items-center justify-center`}>
                        {config.icon}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{data.name}</h3>
                        <p className="text-xs text-gray-500">{data.endpoint}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${config.dotClass} ${data.status === 'healthy' ? 'animate-pulse' : ''}`}></div>
                    <span className={`text-xs font-medium ${config.textClass}`}>{config.label}</span>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="text-xs text-gray-500 mb-1">Response Time</p>
                    <div className="flex items-baseline gap-1">
                        <p className={`text-2xl font-bold ${isSlowResponse ? 'text-red-600' : 'text-gray-900'}`}>
                            {data.responseTime}
                        </p>
                        <span className="text-sm text-gray-500">ms</span>
                        {isSlowResponse && (
                            <svg className="w-4 h-4 text-red-500 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                </div>
                <div>
                    <p className="text-xs text-gray-500 mb-1">Uptime</p>
                    <div className="flex items-baseline gap-1">
                        <p className="text-2xl font-bold text-gray-900">{data.uptime}</p>
                        <span className="text-sm text-gray-500">%</span>
                    </div>
                </div>
            </div>

            {/* Dependencies */}
            {data.dependencies && data.dependencies.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Dependencies</p>
                    <div className="flex flex-wrap gap-2">
                        {data.dependencies.map((dep, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded"
                            >
                                {dep}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Last Check */}
            <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                    Last checked: {formatTimeAgo(data.lastCheck)}
                </p>
            </div>
        </div>
    );
}
