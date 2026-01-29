// Activity Log Component
function ActivityLog({ activities, maxItems = 8 }) {
    const typeConfig = {
        success: {
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            ),
            bgClass: 'bg-green-100',
            textClass: 'text-green-700',
            dotClass: 'bg-green-500'
        },
        info: {
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
            ),
            bgClass: 'bg-blue-100',
            textClass: 'text-blue-700',
            dotClass: 'bg-blue-500'
        },
        warning: {
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            ),
            bgClass: 'bg-yellow-100',
            textClass: 'text-yellow-700',
            dotClass: 'bg-yellow-500'
        },
        error: {
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            ),
            bgClass: 'bg-red-100',
            textClass: 'text-red-700',
            dotClass: 'bg-red-500'
        }
    };

    const displayActivities = activities.slice(0, maxItems);

    return (
        <div className="bg-white rounded-xl card-shadow">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                    <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        View All
                    </button>
                </div>
            </div>

            <div className="divide-y divide-gray-100">
                {displayActivities.map((activity) => {
                    const config = typeConfig[activity.type] || typeConfig.info;

                    return (
                        <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className={`w-8 h-8 rounded-lg ${config.bgClass} ${config.textClass} flex items-center justify-center flex-shrink-0`}>
                                    {config.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                                        <span className="text-xs text-gray-500 whitespace-nowrap">
                                            {formatTimeAgo(activity.timestamp)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`}></span>
                                        <p className="text-xs text-gray-600">{activity.service}</p>
                                    </div>
                                    {activity.details && (
                                        <p className="text-xs text-gray-500 mt-1">{activity.details}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {activities.length === 0 && (
                <div className="p-12 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-sm text-gray-500">No recent activity</p>
                </div>
            )}
        </div>
    );
}
