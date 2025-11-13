import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isTokenValid, handleAuthError } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isTokenValid()) {
      handleAuthError(navigate);
    }
  }, [navigate]);

  // If token is invalid, the useEffect will handle redirect
  // Return children only if token is valid
  return isTokenValid() ? children : null;
};

export default ProtectedRoute;
