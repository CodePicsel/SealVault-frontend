// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SignUp } from './pages/SignUp';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoutes';
import {Dashboard} from "./pages/Dashboard.tsx";

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