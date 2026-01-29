// Failure Statistics Component
function FailureStats({ stats }) {
    return (
        <div className="bg-white rounded-xl card-shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Statistics</h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Success Rate */}
                <div className="col-span-2">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Success Rate</span>
                        <span className="text-2xl font-bold text-green-600">{stats.successRate}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                            style={{ width: `${stats.successRate}%` }}
                        ></div>
                    </div>
                </div>

                {/* Total Requests */}
                <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {stats.totalRequests.toLocaleString()}
                    </p>
                </div>

                {/* Successful Requests */}
                <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-700 mb-1">Successful</p>
                    <p className="text-2xl font-bold text-green-600">
                        {stats.successfulRequests.toLocaleString()}
                    </p>
                </div>

                {/* Failed Requests */}
                <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-xs text-red-700 mb-1">Failed</p>
                    <p className="text-2xl font-bold text-red-600">
                        {stats.failedRequests.toLocaleString()}
                    </p>
                </div>

                {/* Timeout Requests */}
                <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-xs text-orange-700 mb-1">Timeouts</p>
                    <p className="text-2xl font-bold text-orange-600">
                        {stats.timeoutRequests.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Breakdown */}
            <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-3">Request Breakdown</p>
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-gray-700">Success</span>
                        </div>
                        <span className="text-gray-900 font-medium">
                            {((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)}%
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <span className="text-gray-700">Timeout</span>
                        </div>
                        <span className="text-gray-900 font-medium">
                            {((stats.timeoutRequests / stats.totalRequests) * 100).toFixed(1)}%
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-gray-700">Error</span>
                        </div>
                        <span className="text-gray-900 font-medium">
                            {((stats.errorRequests / stats.totalRequests) * 100).toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
