import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import LanguageIcon from '@mui/icons-material/Language';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ColoronLogo from '../assets/img/coloron.png';
import Fav from '../assets/img/fav.png';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#E50914',
    },
    background: {
      default: '#000000',
      paper: 'rgba(20, 20, 28, 0.9)',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
});

const API = process.env.REACT_APP_API_URL || 'https://coloroninventoy.onrender.com/api';

const DEFAULT_ROLES_LIST = [
  'Super Admin',
  'Admin',
  'Manager',
  'Warehouse',
  'Service Person',
  'Staff',
  'Customer',
];

const ROLE_TEXT_FIELD_CONFIG = {
  Warehouse: {
    label: 'Warehouse Name',
    placeholder: 'Enter registered warehouse name (e.g. Jaipur Warehouse)',
    helperText: 'Enter the registered warehouse name for this account',
  },
  'Service Person': {
    label: 'Service Center',
    placeholder: 'Enter registered service center (e.g. Avadi Service Center)',
    helperText: 'Enter the registered service center for this account',
  },
  Staff: {
    label: 'Staff Location',
    placeholder: 'Enter registered staff location (e.g. Jaipur Location)',
    helperText: 'Enter the registered staff location for this account',
  },
  Customer: {
    label: 'Store Name',
    placeholder: 'Enter registered store name (e.g. CCTV Shoppee Avadi)',
    helperText: 'Enter the registered store name for this account',
  },
};

// High-resolution full-bleed background image of a person checking inventory
const INVENTORY_BG_IMAGE = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&auto=format&fit=crop&q=85';

function Login() {
  const { login } = useUser();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: '',
    locationTag: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState(DEFAULT_ROLES_LIST);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Load all roles on mount
  useEffect(() => {
    const loadRoles = async () => {
      setRolesLoading(true);
      try {
        const res = await fetch(`${API}/users/roles`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.roles) && data.roles.length > 0) {
          setRoles(data.roles);
        }
      } catch (e) {
        console.warn('Roles fetch fallback:', e.message);
      } finally {
        setRolesLoading(false);
      }
    };
    loadRoles();
  }, []);

  // Auto-detect role ONLY when email is typed
  useEffect(() => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API}/users/roles?email=${encodeURIComponent(formData.email.trim())}`
        );
        const data = await res.json();
        if (res.ok && Array.isArray(data.roles) && data.roles.length === 1) {
          setFormData((prev) => ({
            ...prev,
            role: prev.role || data.roles[0],
          }));
        }
      } catch (e) {
        // silent
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.email]);

  const emailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleChange = (e) => {
    const { name, value } = e.target;
    setServerError('');
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const temp = {};
    temp.email = emailValid(formData.email) ? '' : 'Email is not valid';
    temp.password = formData.password ? '' : 'Password is required';
    if (showLocationField && !formData.locationTag?.trim()) {
      temp.locationTag = `${ROLE_TEXT_FIELD_CONFIG[formData.role]?.label || 'Location'} is required`;
    }
    setErrors(temp);
    return Object.values(temp).every((x) => x === '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.password,
      };
      if (formData.role) payload.role = formData.role;
      const loc = (formData.locationTag || '').trim();
      if (loc) {
        payload.locationTag = loc;
        payload.assignedLocation = loc;
        if (formData.role === 'Staff') payload.staffLocation = loc;
        else if (formData.role === 'Service Person') payload.serviceCenter = loc;
        else if (formData.role === 'Customer') payload.customerStore = loc;
        else if (formData.role === 'Warehouse') payload.warehouseName = loc;
      }

      const res = await fetch(`${API}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data?.error || data?.message || 'Login failed';
        setServerError(errorMsg);
        toast.error(errorMsg, { autoClose: 5000 });
        return;
      }

      toast.success('Login successful!');
      const locTag = formData.locationTag || '';
      login({
        id: data?.user?.id,
        name: data?.user?.name,
        email: data?.user?.email,
        role: data?.user?.role,
        warehouseName: data?.user?.warehouseName || (formData.role === 'Warehouse' ? locTag : '') || locTag,
        serviceCenter: data?.user?.serviceCenter || (formData.role === 'Service Person' ? locTag : '') || locTag,
        staffLocation: data?.user?.staffLocation || (formData.role === 'Staff' ? locTag : '') || locTag,
        customerStore: data?.user?.customerStore || (formData.role === 'Customer' ? locTag : '') || locTag,
        assignedLocation: data?.user?.assignedLocation || locTag,
        token: data?.token || '',
      });
      navigate('/');
    } catch (e) {
      setServerError('Server unreachable. Please check if the backend API is online.');
      toast.error('Server unreachable. Please check if the backend API is online.');
    } finally {
      setSubmitting(false);
    }
  };

  const showLocationField = Boolean(ROLE_TEXT_FIELD_CONFIG[formData.role]);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />

      {/* Main Fullscreen Wrapper */}
      <Box
        sx={{
          position: 'relative',
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: '#000000',
          overflowX: 'hidden',
          overflowY: 'auto',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Full-bleed Single Inventory Background Image */}
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            backgroundImage: `url(${INVENTORY_BG_IMAGE})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transform: 'scale(1.05)',
            animation: 'subtleZoom 25s ease-in-out infinite alternate',
            '@keyframes subtleZoom': {
              '0%': { transform: 'scale(1.02)' },
              '100%': { transform: 'scale(1.08)' },
            },
          }}
        />

        {/* Dark Vignette & Gradient Overlays */}
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 1,
            pointerEvents: 'none',
            background: `
              radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.72) 65%, rgba(0, 0, 0, 0.95) 100%),
              linear-gradient(180deg, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.25) 45%, rgba(0, 0, 0, 0.88) 100%)
            `,
          }}
        />

        {/* Bottom Netflix Crimson Base Glow Line */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            zIndex: 2,
            background: 'linear-gradient(90deg, transparent 0%, #E50914 50%, transparent 100%)',
            boxShadow: '0 0 25px #E50914, 0 0 50px #E50914',
          }}
        />

        {/* Top Header Bar */}
        <Box
          component="header"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: { xs: 3, md: 7 },
            py: 3,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
          }}
        >
          {/* Top Left Coloron Logo from Assets */}
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <img
              src={ColoronLogo}
              alt="Coloron"
              style={{
                height: 48,
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 14px rgba(229, 9, 20, 0.6))',
              }}
            />
          </Box>

          {/* Right Language Badge */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.8,
              px: 2,
              py: 0.8,
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <LanguageIcon sx={{ fontSize: 16 }} />
            English ▾
          </Box>
        </Box>

        {/* Foreground Content - Centered Content & Login Card */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            px: 2,
            py: 8,
          }}
        >
          {/* Styled Premium Heading above Sign In Card */}
          <Box
            sx={{
              textAlign: 'center',
              mb: 3.5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Ambient Pill Badge */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 0.6,
                borderRadius: '20px',
                backgroundColor: 'rgba(229, 9, 20, 0.15)',
                border: '1px solid rgba(229, 9, 20, 0.4)',
                backdropFilter: 'blur(8px)',
                mb: 1.5,
                boxShadow: '0 0 15px rgba(229, 9, 20, 0.25)',
              }}
            >
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: '#E50914',
                  boxShadow: '0 0 8px #E50914',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: '#fca5a5',
                  fontWeight: 700,
                  fontSize: '11px',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                }}
              >
                Enterprise Portal
              </Typography>
            </Box>

            {/* Gradient Title */}
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '28px', sm: '38px', md: '42px' },
                letterSpacing: '-0.5px',
                lineHeight: 1.15,
                background: 'linear-gradient(135deg, #ffffff 30%, #fecaca 70%, #E50914 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.9))',
                mb: 1,
              }}
            >
              Inventory Management
            </Typography>

            {/* Glowing Accent Divider */}
            <Box
              sx={{
                width: 60,
                height: 3,
                borderRadius: '2px',
                background: 'linear-gradient(90deg, #E50914 0%, #f59e0b 100%)',
                boxShadow: '0 0 12px #E50914',
                mb: 1.2,
              }}
            />

            <Typography
              variant="body2"
              sx={{
                color: '#d1d5db',
                fontSize: { xs: '13px', sm: '15px' },
                fontWeight: 400,
                textShadow: '0 1px 8px rgba(0, 0, 0, 0.9)',
                maxWidth: '420px',
              }}
            >
              Sign in to manage stock, products, and warehouse operations
            </Typography>
          </Box>

          {/* Netflix-Style Glassmorphic Login Form Card */}
          <Box
            sx={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: 'rgba(15, 15, 20, 0.86)',
              backdropFilter: 'blur(24px)',
              borderRadius: '16px',
              p: { xs: 3.5, sm: 5 },
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 1px 1px rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: '#ffffff',
                mb: 3,
                fontSize: '28px',
                letterSpacing: '-0.5px',
              }}
            >
              Sign In
            </Typography>

            {serverError && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  backgroundColor: 'rgba(220, 38, 38, 0.25)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '8px',
                }}
              >
                {serverError}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              {/* Email Address */}
              <Box sx={{ mb: 2.5 }}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(22, 22, 30, 0.9)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.25)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#E50914' },
                    },
                    '& .MuiInputLabel-root': { color: '#9ca3af' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#E50914' },
                  }}
                />
              </Box>

              {/* Password */}
              <Box sx={{ mb: 2.5 }}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPwd ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errors.password}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(22, 22, 30, 0.9)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.25)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#E50914' },
                    },
                    '& .MuiInputLabel-root': { color: '#9ca3af' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#E50914' },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPwd((s) => !s)} edge="end" sx={{ color: '#9ca3af' }}>
                          {showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Role Dropdown */}
              <Box sx={{ mb: 2.5 }}>
                <TextField
                  select
                  label="Role"
                  required
                  fullWidth
                  variant="outlined"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={rolesLoading}
                  error={!!errors.role}
                  helperText={errors.role || (rolesLoading ? 'Loading roles...' : '')}
                  InputLabelProps={{ shrink: true }}
                  SelectProps={{ displayEmpty: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(22, 22, 30, 0.9)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.25)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#E50914' },
                    },
                    '& .MuiInputLabel-root': { color: '#9ca3af' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#E50914' },
                    '& .MuiSelect-icon': { color: '#9ca3af' },
                  }}
                >
                  <MenuItem value="" disabled>
                    <em style={{ color: '#6b7280' }}>Select Role</em>
                  </MenuItem>
                  {roles.map((r) => (
                    <MenuItem key={r} value={r} sx={{ color: '#fff', '&:hover': { backgroundColor: '#E50914' } }}>
                      {r}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Dynamic Location / Warehouse / Store Field */}
              {showLocationField && (
                <Box sx={{ mb: 2.5 }}>
                  <TextField
                    fullWidth
                    required
                    variant="outlined"
                    name="locationTag"
                    label={ROLE_TEXT_FIELD_CONFIG[formData.role]?.label}
                    placeholder={ROLE_TEXT_FIELD_CONFIG[formData.role]?.placeholder}
                    value={formData.locationTag}
                    onChange={handleChange}
                    error={!!errors.locationTag}
                    helperText={
                      errors.locationTag ||
                      ROLE_TEXT_FIELD_CONFIG[formData.role]?.helperText
                    }
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(22, 22, 30, 0.9)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.25)' },
                        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                        '&.Mui-focused fieldset': { borderColor: '#E50914' },
                      },
                      '& .MuiInputLabel-root': { color: '#9ca3af' },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#E50914' },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOnOutlined sx={{ color: '#E50914' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              )}

              {/* High-visibility Netflix Red Action Button */}
              <Button
                type="submit"
                fullWidth
                disabled={submitting}
                sx={{
                  mt: 1.5,
                  mb: 1.5,
                  py: 1.6,
                  fontWeight: 800,
                  fontSize: '17px',
                  borderRadius: '8px',
                  backgroundColor: '#E50914',
                  color: '#ffffff',
                  textTransform: 'none',
                  boxShadow: '0 4px 20px rgba(229, 9, 20, 0.5)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: '#f40612',
                    boxShadow: '0 6px 28px rgba(229, 9, 20, 0.75)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                {submitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <span>Get Started</span>
                    <ArrowForwardIosIcon sx={{ fontSize: 16 }} />
                  </Box>
                )}
              </Button>
            </Box>
          </Box>
        </Box>

        <ToastContainer position="top-right" autoClose={3500} theme="dark" newestOnTop />
      </Box>
    </ThemeProvider>
  );
}

export default Login;
