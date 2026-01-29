// Order History View Component
function OrderHistoryView({ orders = ORDERS_HISTORY }) {
    const { useState } = React;

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date-desc');

    // Get filtered and sorted orders
    const getFilteredOrders = () => {
        let filtered = [...orders];

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(order =>
                order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(order => order.status === statusFilter);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'date-asc':
                    return new Date(a.date) - new Date(b.date);
                case 'total-desc':
                    return b.total - a.total;
                case 'total-asc':
                    return a.total - b.total;
                default:
                    return 0;
            }
        });

        return filtered;
    };

    const filteredOrders = getFilteredOrders();

    // Get status counts
    const statusCounts = {
        all: orders.length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        processing: orders.filter(o => o.status === 'processing').length,
        timeout: orders.filter(o => o.status === 'timeout').length,
        error: orders.filter(o => o.status === 'error').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl card-shadow p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
                        </p>
                    </div>

                    {/* Sort Dropdown */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm"
                    >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="total-desc">Highest Total</option>
                        <option value="total-asc">Lowest Total</option>
                    </select>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by order ID or product name..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Status Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    <FilterTab
                        active={statusFilter === 'all'}
                        onClick={() => setStatusFilter('all')}
                        count={statusCounts.all}
                    >
                        All Orders
                    </FilterTab>
                    <FilterTab
                        active={statusFilter === 'delivered'}
                        onClick={() => setStatusFilter('delivered')}
                        count={statusCounts.delivered}
                        color="green"
                    >
                        Delivered
                    </FilterTab>
                    <FilterTab
                        active={statusFilter === 'shipped'}
                        onClick={() => setStatusFilter('shipped')}
                        count={statusCounts.shipped}
                        color="blue"
                    >
                        Shipped
                    </FilterTab>
                    <FilterTab
                        active={statusFilter === 'processing'}
                        onClick={() => setStatusFilter('processing')}
                        count={statusCounts.processing}
                        color="yellow"
                    >
                        Processing
                    </FilterTab>
                    <FilterTab
                        active={statusFilter === 'timeout'}
                        onClick={() => setStatusFilter('timeout')}
                        count={statusCounts.timeout}
                        color="orange"
                    >
                        Timeout
                    </FilterTab>
                    <FilterTab
                        active={statusFilter === 'error'}
                        onClick={() => setStatusFilter('error')}
                        count={statusCounts.error}
                        color="red"
                    >
                        Error
                    </FilterTab>
                </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length > 0 ? (
                <div className="space-y-4">
                    {filteredOrders.map(order => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl card-shadow p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 text-sm">No orders found</p>
                    <p className="text-gray-400 text-xs mt-1">Try adjusting your filters or search query</p>
                </div>
            )}
        </div>
    );
}

// Filter Tab Component
function FilterTab({ active, onClick, count, color = 'primary', children }) {
    const colorClasses = {
        primary: 'bg-primary-50 text-primary-700 border-primary-200',
        green: 'bg-green-50 text-green-700 border-green-200',
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        orange: 'bg-orange-50 text-orange-700 border-orange-200',
        red: 'bg-red-50 text-red-700 border-red-200',
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                active
                    ? colorClasses[color] + ' border'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
        >
            {children}
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                active
                    ? 'bg-white/50'
                    : 'bg-gray-100'
            }`}>
                {count}
            </span>
        </button>
    );
}
