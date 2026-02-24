// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SignUp } from './pages/SignUp';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoutes';

const Dashboard: React.FC = () => {
    return (
        <div style={{ padding: 24 }}>
            <h2>Dashboard</h2>
            <p>Protected content — you are logged in.</p>
            <Link to="/profile">Profile</Link>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    {/* add other routes here */}
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;