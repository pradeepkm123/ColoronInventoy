// contexts/InventoryContext.js
import React, { createContext, useContext } from 'react';

const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  const [products] = React.useState([
    { id: 1, name: 'Laptop', category: 'Electronics', price: 999, quantity: 10 },
    { id: 2, name: 'Smartphone', category: 'Electronics', price: 699, quantity: 30 },
    { id: 3, name: 'Desk Chair', category: 'Furniture', price: 199, quantity: 5 },
    { id: 4, name: 'Coffee Mug', category: 'Kitchen', price: 9.99, quantity: 50 },
  ]);

  const [transactions] = React.useState([
    { id: 1, productName: 'Laptop', barcode: '123456', type: 'inward', quantity: 5, date: '2023-10-01T10:00:00' },
    { id: 2, productName: 'Smartphone', barcode: '789012', type: 'outward', quantity: 3, date: '2023-10-02T11:00:00' },
    { id: 3, productName: 'Desk Chair', barcode: '345678', type: 'inward', quantity: 10, date: '2023-10-03T12:00:00' },
    { id: 4, productName: 'Coffee Mug', barcode: '901234', type: 'outward', quantity: 2, date: '2023-10-04T13:00:00' },
  ]);

  return (
    <InventoryContext.Provider value={{ products, transactions }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => useContext(InventoryContext);
