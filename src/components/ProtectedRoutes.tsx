// src/components/ProtectedRoute.tsx
import React, {type JSX} from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props { children: JSX.Element; }
export const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
};