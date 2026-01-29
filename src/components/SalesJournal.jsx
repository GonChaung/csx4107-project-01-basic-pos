import { useState, useEffect } from 'react';
import { getTransactions, saveCartTransactions, getProducts, initializeInventory, checkInventory } from '../utils/storage';
import { formatCurrency, formatDate } from '../utils/analytics';

// Helper function to get current date/time in Bangkok timezone for datetime-local input
const getBangkokDateTime = () => {
    const now = new Date();
    // Convert to Bangkok timezone (UTC+7)
    const bangkokTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    const year = bangkokTime.getFullYear();
    const month = String(bangkokTime.getMonth() + 1).padStart(2, '0');
    const day = String(bangkokTime.getDate()).padStart(2, '0');
    const hours = String(bangkokTime.getHours()).padStart(2, '0');
    const minutes = String(bangkokTime.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const SalesJournal = () => {
    const [transactions, setTransactions] = useState([]);
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        initializeInventory();
        loadTransactions();
        loadProducts();
    }, []);

    const loadTransactions = () => {
        const data = getTransactions();
        setTransactions(data);
    };

    const loadProducts = () => {
        const data = getProducts();
        setProducts(data);
    };

    const categories = ['all', ...new Set(products.map(p => p.category))];

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.productName === product.itemName);

        if (existingItem) {
            // Check if we can add one more
            if (!checkInventory(product.itemName, existingItem.quantity + 1)) {
                alert(`Insufficient inventory! Only ${product.currentInventory} available.`);
                return;
            }

            setCart(cart.map(item =>
                item.productName === product.itemName
                    ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
                    : item
            ));
        } else {
            if (!checkInventory(product.itemName, 1)) {
                alert('Out of stock!');
                return;
            }

            setCart([...cart, {
                productName: product.itemName,
                category: product.category,
                quantity: 1,
                unitPrice: product.unitPrice,
                totalPrice: product.unitPrice,
            }]);
        }
    };

    const removeFromCart = (productName) => {
        setCart(cart.filter(item => item.productName !== productName));
    };

    const updateCartQuantity = (productName, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productName);
            return;
        }

        // Check inventory
        if (!checkInventory(productName, newQuantity)) {
            const product = products.find(p => p.itemName === productName);
            alert(`Insufficient inventory! Only ${product?.currentInventory || 0} available.`);
            return;
        }

        setCart(cart.map(item =>
            item.productName === productName
                ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice }
                : item
        ));
    };

    const getTotalAmount = () => {
        return cart.reduce((sum, item) => sum + item.totalPrice, 0);
    };

    const handleCheckout = () => {
        if (cart.length === 0) {
            alert('Cart is empty!');
            return;
        }

        try {
            const transactionDate = new Date().toISOString();
            saveCartTransactions(cart, transactionDate);

            // Reload data
            loadTransactions();
            loadProducts();
            setCart([]);

            alert(`Checkout successful! Total: ${formatCurrency(getTotalAmount())}`);
        } catch (error) {
            alert(`Checkout failed: ${error.message}`);
        }
    };

    const clearCart = () => {
        setCart([]);
    };

    return (
        <div className="pos-container">
            <div className="pos-layout">
                {/* Left Panel - Products */}
                <div className="pos-products-panel">
                    <div className="pos-search-bar">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pos-search-input"
                        />
                    </div>

                    <div className="pos-category-filter">
                        {categories.map(category => (
                            <button
                                key={category}
                                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category.replace(/_/g, ' ')}
                            </button>
                        ))}
                    </div>

                    <div className="pos-product-grid">
                        {filteredProducts.map(product => (
                            <div
                                key={product.itemName}
                                className={`pos-product-card ${product.currentInventory <= 0 ? 'out-of-stock' : ''}`}
                                onClick={() => product.currentInventory > 0 && addToCart(product)}
                            >
                                <div className="product-card-header">
                                    <h4>{product.itemName}</h4>
                                    <span className="product-price">{formatCurrency(product.unitPrice)}</span>
                                </div>
                                <p className="product-description">{product.description}</p>
                                <div className="product-card-footer">
                                    <span className="product-category">{product.category.replace(/_/g, ' ')}</span>
                                    <span className={`product-stock ${product.currentInventory <= 10 ? 'low-stock' : ''}`}>
                                        Stock: {product.currentInventory}
                                    </span>
                                </div>
                                {product.currentInventory <= 0 && (
                                    <div className="out-of-stock-overlay">OUT OF STOCK</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel - Cart & Checkout */}
                <div className="pos-cart-panel">
                    <div className="cart-header">
                        <h3>Current Sale</h3>
                        {cart.length > 0 && (
                            <button className="clear-cart-btn" onClick={clearCart}>Clear</button>
                        )}
                    </div>

                    <div className="cart-items">
                        {cart.length === 0 ? (
                            <div className="empty-cart">
                                <p>No items in cart</p>
                                <p className="empty-cart-hint">Click on products to add</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.productName} className="cart-item">
                                    <div className="cart-item-info">
                                        <h4>{item.productName}</h4>
                                        <p className="cart-item-price">{formatCurrency(item.unitPrice)} each</p>
                                    </div>
                                    <div className="cart-item-controls">
                                        <button
                                            className="qty-btn"
                                            onClick={() => updateCartQuantity(item.productName, item.quantity - 1)}
                                        >
                                            −
                                        </button>
                                        <span className="qty-display">{item.quantity}</span>
                                        <button
                                            className="qty-btn"
                                            onClick={() => updateCartQuantity(item.productName, item.quantity + 1)}
                                        >
                                            +
                                        </button>
                                        <span className="cart-item-total">{formatCurrency(item.totalPrice)}</span>
                                        <button
                                            className="remove-btn"
                                            onClick={() => removeFromCart(item.productName)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="cart-summary">
                        <div className="cart-total">
                            <span>Total:</span>
                            <span className="total-amount">{formatCurrency(getTotalAmount())}</span>
                        </div>
                        <button
                            className="checkout-btn"
                            onClick={handleCheckout}
                            disabled={cart.length === 0}
                        >
                            Complete Sale
                        </button>
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <div className="card transaction-history-card">
                <h3>Recent Transactions</h3>
                {transactions.length > 0 ? (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date & Time</th>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Total Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.slice().reverse().slice(0, 10).map((transaction) => (
                                    <tr key={transaction.id}>
                                        <td>{formatDate(transaction.date)}</td>
                                        <td>{transaction.productName}</td>
                                        <td>
                                            <span className="category-badge">{transaction.category}</span>
                                        </td>
                                        <td>{transaction.quantity}</td>
                                        <td>{formatCurrency(transaction.unitPrice)}</td>
                                        <td className="price-cell">{formatCurrency(transaction.totalPrice)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="no-data">No transactions recorded yet.</p>
                )}
            </div>
        </div>
    );
};

export default SalesJournal;
