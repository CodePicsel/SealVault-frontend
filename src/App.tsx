// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from './contexts/AuthContext';
import { SignUp } from './pages/SignUp';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoutes';
import { Dashboard } from './pages/Dashboard';
import SignPage from './pages/SignPage';
import SignedResult from "./pages/SignedResult.tsx";
import { LandingPage } from './pages/LandingPage';

const App: React.FC = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/login" element={<Login />} />

                    <Route path="/" element={<LandingPage />} />

                    {/* Protected routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/sign/:id"
                        element={
                            <ProtectedRoute>
                                <SignPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/signed/:id"
                        element={
                            <ProtectedRoute>
                                <SignedResult />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;