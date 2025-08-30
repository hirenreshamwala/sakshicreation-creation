import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();

  useEffect(() => {
    const authToken = localStorage.getItem('auth_token') || Cookies.get('auth_token');
    console.log('ProtectedRoute - Checking auth token:', { localStorage: localStorage.getItem('auth_token'), cookies: Cookies.get('auth_token') });
    if (!authToken) {
      console.log('ProtectedRoute - No token, redirecting to /login');
      router.push(`/login`);
    }
  }, [router]);

  return children;
};

export default ProtectedRoute;
