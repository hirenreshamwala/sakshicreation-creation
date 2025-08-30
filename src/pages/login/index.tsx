import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Endpoint from '@/API/apiConfig';
import { useRouter } from 'next/router';
import { useAppDispatch } from '@/store';
import { setAuth } from '@/store/slices/authSlice';
import { authService } from '@/services/auth.service';
import { Box, TextField, Button, Typography, CircularProgress, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'Admin' | 'Staff';
}

interface LoginResponse {
  success: boolean;
  message?: string;
  data?: { token: string; id: string; firstName: string; lastName: string; email: string; role: string };
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loader, setLoader] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false); 
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!router.isReady) return;

    const authToken = authService.getToken();
    if (authToken) {
      const redirectPath = (router.query.redirect as string) || '/';
      router.push(redirectPath);
    } else {
      setLoader(false);
    }
  }, [router.isReady, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(Endpoint.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      // Log response status and headers for debugging
      console.log('Response Status:', response.status);
      console.log('Response Headers:', [...response.headers.entries()]);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON Response:', text);
        throw new Error('Server returned a non-JSON response. Check the endpoint or server configuration.');
      }

      const data: LoginResponse = await response.json();
      console.log('API Response:', data);

      if (data.success && data.data) {
        const { token, id, firstName, lastName, email, role } = data.data;
        const user: UserData = { id, firstName, lastName, email, role };

        const isProduction = process.env.NODE_ENV === 'production';

        // Store in cookies
        Cookies.set('auth_token', token, {
          expires: 1,
          secure: isProduction,
          sameSite: isProduction ? 'None' : 'Lax',
        });
        Cookies.set('user', JSON.stringify(user), {
          expires: 1,
          secure: isProduction,
          sameSite: isProduction ? 'None' : 'Lax',
        });

        // Store in authService and Redux
        authService.setToken(token);
        authService.setUser(user);
        dispatch(setAuth({ token, user }));

        // Debug: Log stored values
        console.log('Cookies - auth_token:', Cookies.get('auth_token'));
        console.log('Cookies - user:', Cookies.get('user'));
        console.log('localStorage - auth_token:', localStorage.getItem('auth_token'));
        console.log('localStorage - user:', localStorage.getItem('user'));

        // Redirect to intended page or default
        const redirectPath = (router.query.redirect as string) || '/';
        setTimeout(() => {
          console.log('Redirecting after login to:', redirectPath);
          router.push(redirectPath);
        }, 100);
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again later.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  if (loader) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(140deg, #a1c4fd 10%, #c2e9fb 50%, #d4a0fc 100%)',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(140deg, #a1c4fd 10%, #c2e9fb 50%, #d4a0fc 100%)',
      }}
    >
      <Box
        sx={{
          background: 'rgba(255,255,255,0.85)',
          borderRadius: 5,
          boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
          p: { xs: 3, sm: 5 },
          minWidth: { xs: 300, sm: 600 },
          minHeight: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 4,
            color: 'rgba(140, 82, 255, 0.8)',
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          Login
        </Typography>
        {error && (
          <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
            {error}
          </Typography>
        )}
        <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
          <TextField
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            sx={{ mb: 3 }}
          />
          <TextField
            type={showPassword ? 'text' : 'password'}
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            sx={{ mb: 4 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            disabled={loading}
            fullWidth
            variant="contained"
            sx={{
              py: 1.5,
              background: loading
                ? 'gray'
                : 'linear-gradient(90deg, #a259f7 0%, #7f56d9 100%)',
              fontWeight: 600,
              fontSize: 18,
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;