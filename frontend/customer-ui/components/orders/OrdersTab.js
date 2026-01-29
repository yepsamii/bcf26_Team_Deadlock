// Orders Tab Component
function OrdersTab({ user, products = PRODUCTS_INVENTORY, orders = ORDERS_HISTORY }) {
    const { useState } = React;

    const [activeSubTab, setActiveSubTab] = useState('create');
    const [cart, setCart] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Get unique categories
    const categories = ['all', ...new Set(products.map(p => p.category))];

    // Filter products
    const filteredProducts = products.filter(product => {
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Add to cart
    const addToCart = (product) => {
        const existingItem = cart.find(item => item.product.id === product.id);
        if (existingItem) {
            setCart(cart.map(item =>
                item.product.id === product.id
                    ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
                    : item
            ));
        } else {
            setCart([...cart, { product, quantity: 1 }]);
        }
    };

    // Remove from cart
    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product.id !== productId));
    };

    // Update quantity
    const updateQuantity = (productId, newQuantity) => {
        const product = products.find(p => p.id === productId);
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else if (newQuantity <= product.stock) {
            setCart(cart.map(item =>
                item.product.id === productId
                    ? { ...item, quantity: newQuantity }
                    : item
            ));
        }
    };

    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    // Place order
    const placeOrder = () => {
        if (cart.length === 0) return;
        alert(`Order placed successfully!\nTotal: $${total.toFixed(2)}\nItems: ${cart.length}`);
        setCart([]);
    };

    return (
        <div className="space-y-6">
            {/* Sub-navigation */}
            <div className="bg-white rounded-xl card-shadow">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveSubTab('create')}
                        className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                            activeSubTab === 'create'
                                ? 'text-primary-600 border-b-2 border-primary-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Create Order
                    </button>
                    <button
                        onClick={() => setActiveSubTab('history')}
                        className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                            activeSubTab === 'history'
                                ? 'text-primary-600 border-b-2 border-primary-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Order History
                    </button>
                </div>
            </div>

            {activeSubTab === 'create' ? (
                <CreateOrderView
                    products={filteredProducts}
                    cart={cart}
                    categories={categories}
                    selectedCategory={selectedCategory}
                    searchQuery={searchQuery}
                    total={total}
                    setSelectedCategory={setSelectedCategory}
                    setSearchQuery={setSearchQuery}
                    addToCart={addToCart}
                    removeFromCart={removeFromCart}
                    updateQuantity={updateQuantity}
                    placeOrder={placeOrder}
                />
            ) : (
                <OrderHistoryView orders={orders} />
            )}
        </div>
    );
}
