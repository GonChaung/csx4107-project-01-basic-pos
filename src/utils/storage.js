import posItems from '../assets/pos_item.json';

const STORAGE_KEY = 'pos_transactions';
const INVENTORY_KEY = 'pos_inventory';

/**
 * Initialize inventory from pos_item.json if not already set
 */
export const initializeInventory = () => {
  const existing = localStorage.getItem(INVENTORY_KEY);
  if (!existing) {
    const inventory = {};
    posItems.forEach(item => {
      inventory[item.itemName] = item.inventory;
    });
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  }
};

/**
 * Get current inventory levels
 */
export const getInventory = () => {
  try {
    initializeInventory();
    const data = localStorage.getItem(INVENTORY_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error reading inventory:', error);
    return {};
  }
};

/**
 * Update inventory after a sale
 */
export const updateInventory = (productName, quantitySold) => {
  try {
    const inventory = getInventory();
    if (inventory[productName] !== undefined) {
      inventory[productName] -= quantitySold;
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    }
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw error;
  }
};

/**
 * Check if sufficient inventory is available
 */
export const checkInventory = (productName, quantity) => {
  const inventory = getInventory();
  return inventory[productName] !== undefined && inventory[productName] >= quantity;
};

/**
 * Get all transactions from localStorage
 */
export const getTransactions = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading transactions:', error);
    return [];
  }
};

/**
 * Save a new transaction to localStorage and update inventory
 */
export const saveTransaction = (transaction) => {
  try {
    const transactions = getTransactions();
    const newTransaction = {
      ...transaction,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    transactions.push(newTransaction);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));

    // Update inventory
    updateInventory(transaction.productName, transaction.quantity);

    return newTransaction;
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
};

/**
 * Save multiple transactions (for cart checkout) and update inventory
 */
export const saveCartTransactions = (cartItems, transactionDate) => {
  try {
    const transactions = getTransactions();
    const newTransactions = [];

    cartItems.forEach(item => {
      // Check inventory first
      if (!checkInventory(item.productName, item.quantity)) {
        throw new Error(`Insufficient inventory for ${item.productName}`);
      }

      const newTransaction = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        productName: item.productName,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        date: transactionDate,
      };
      newTransactions.push(newTransaction);
      transactions.push(newTransaction);

      // Update inventory
      updateInventory(item.productName, item.quantity);
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    return newTransactions;
  } catch (error) {
    console.error('Error saving cart transactions:', error);
    throw error;
  }
};

/**
 * Get all products from the imported JSON file with current inventory
 */
export const getProducts = () => {
  const inventory = getInventory();
  return posItems.map(item => ({
    ...item,
    currentInventory: inventory[item.itemName] !== undefined ? inventory[item.itemName] : item.inventory,
  }));
};

/**
 * Find a product by name with current inventory
 */
export const getProductByName = (name) => {
  const inventory = getInventory();
  const item = posItems.find(item => item.itemName === name);
  if (item) {
    return {
      ...item,
      currentInventory: inventory[item.itemName] !== undefined ? inventory[item.itemName] : item.inventory,
    };
  }
  return null;
};
