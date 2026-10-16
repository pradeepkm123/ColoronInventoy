import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './Pages/UserContext';
import Dashboard from './Components/Dashboard';
import Login from './Pages/Login';
import InvoiceDetails from './Pages/InvoiceDetails'; // ✅ Correct
import './index.css'; // or './App.css'

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route path="/invoicedetails/:id" element={<InvoiceDetails />} />
            <Route path="/invoice" element={<Navigate to="/" replace />} />
            <Route path="/invoices" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes >
        </div >
      </Router >
    </UserProvider >
  );
}

function RequireAuth({ children }) {
  const { user } = useUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default App;
