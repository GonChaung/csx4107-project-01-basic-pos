import { useState, useEffect } from 'react';
import { getTransactions, getProducts } from '../utils/storage';
import {
    calculateTotalSales,
    filterByPeriod,
    getSalesByProduct,
    getSalesByCategory,
    getTopSellingItems,
    prepareTrendData,
    formatCurrency,
} from '../utils/analytics';
import LineChart from './LineChart';
import PieChart from './PieChart';

const Dashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [period, setPeriod] = useState('Daily');
    const products = getProducts();

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = () => {
        const data = getTransactions();
        setTransactions(data);
    };

    const filteredTransactions = filterByPeriod(transactions, period);
    const totalSales = calculateTotalSales(transactions);
    const periodSales = calculateTotalSales(filteredTransactions);
    const salesByProduct = getSalesByProduct(filteredTransactions);
    const salesByCategory = getSalesByCategory(filteredTransactions, products);
    const topItems = getTopSellingItems(transactions, 5);
    const trendData = prepareTrendData(filteredTransactions, period);

    return (
        <div className="dashboard">
            <h1>Sales Dashboard</h1>

            {/* Total Sales - All Time */}
            <div className="stats-grid">
                <div className="stat-card highlight">
                    <h3>Total Sales (All Time)</h3>
                    <p className="stat-value">{formatCurrency(totalSales)}</p>
                </div>

                <div className="stat-card">
                    <h3>{period} Sales</h3>
                    <p className="stat-value">{formatCurrency(periodSales)}</p>
                </div>

                <div className="stat-card">
                    <h3>Transactions ({period})</h3>
                    <p className="stat-value">{filteredTransactions.length}</p>
                </div>
            </div>

            {/* Period Selector */}
            <div className="period-selector">
                <label>View Period: </label>
                <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                </select>
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Sales Trend</h3>
                    <div className="chart-container">
                        {Object.keys(trendData).length > 0 ? (
                            <LineChart data={trendData} title={`${period} Sales Trend`} />
                        ) : (
                            <p className="no-data">No data available for this period</p>
                        )}
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Sales by Category</h3>
                    <div className="chart-container">
                        {Object.keys(salesByCategory).length > 0 ? (
                            <PieChart data={salesByCategory} title="Category Distribution" />
                        ) : (
                            <p className="no-data">No data available for this period</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Top 5 Selling Items */}
            <div className="card">
                <h3>Top 5 Best-Selling Items</h3>
                {topItems.length > 0 ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Product</th>
                                <th>Quantity Sold</th>
                                <th>Total Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topItems.map((item, index) => (
                                <tr key={item.productName}>
                                    <td className="rank">#{index + 1}</td>
                                    <td>{item.productName}</td>
                                    <td>{item.quantity}</td>
                                    <td>{formatCurrency(item.totalRevenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="no-data">No sales data available yet</p>
                )}
            </div>

            {/* Sales by Product */}
            <div className="card">
                <h3>Sales by Product ({period})</h3>
                {salesByProduct.length > 0 ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Quantity Sold</th>
                                <th>Total Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesByProduct.map((item) => (
                                <tr key={item.productName}>
                                    <td>{item.productName}</td>
                                    <td>{item.quantity}</td>
                                    <td>{formatCurrency(item.totalRevenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="no-data">No sales data for this period</p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
