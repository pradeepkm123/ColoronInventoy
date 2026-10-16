import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import {
  PersonOutline,
  EmailOutlined,
  LockOutlined,
  BadgeOutlined,
  LocationOnOutlined,
  PersonAddOutlined,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Fav from '../assets/img/fav.png';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563eb' },
    background: { default: '#f8fafc' },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
});

const API_BASE =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5002/api'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5002/api');

const ROLES = [
  'Super Admin',
  'Admin',
  'Manager',
  'Warehouse',
  'Service Person',
  'Staff',
  'Customer',
];

// Roles that require an extra location/store text field
const ROLE_TEXT_FIELD_CONFIG = {
  Warehouse: {
    label: 'Warehouse Name',
    placeholder: 'Enter warehouse name (e.g. Jaipur Warehouse)',
    errorMsg: 'Warehouse Name is required',
  },
  'Service Person': {
    label: 'Service Center',
    placeholder: 'Enter service center (e.g. Avadi Service Center)',
    errorMsg: 'Service Center is required',
  },
  Staff: {
    label: 'Staff Location',
    placeholder: 'Enter staff location (e.g. Jaipur Location)',
    errorMsg: 'Staff Location is required',
  },
  Customer: {
    label: 'Store Name',
    placeholder: 'Enter store name (e.g. CCTV Shoppee Avadi)',
    errorMsg: 'Store Name is required',
  },
};

const SignUpSchema = Yup.object().shape({
  name: Yup.string().required('Full Name is required'),
  role: Yup.string().required('Role is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required'),
  locationTag: Yup.string().when('role', {
    is: (val) => Boolean(ROLE_TEXT_FIELD_CONFIG[val]),
    then: (schema) => schema.trim().required('This field is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
});

export default function SignUpDesign() {
  const formik = useFormik({
    initialValues: {
      name: '',
      role: '',
      email: '',
      password: '',
      confirmPassword: '',
      locationTag: '', // extra optional field value
    },
    validationSchema: SignUpSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        // Build payload — map locationTag to the right field name
        const payload = {
          name: values.name,
          role: values.role,
          email: values.email,
          password: values.password,
          confirmPassword: values.confirmPassword,
        };
        const loc = (values.locationTag || '').trim();
        if (loc) {
          payload.locationTag = loc;
          payload.assignedLocation = loc;
          if (values.role === 'Warehouse') payload.warehouseName = loc;
          else if (values.role === 'Service Person') payload.serviceCenter = loc;
          else if (values.role === 'Staff') payload.staffLocation = loc;
          else if (values.role === 'Customer') payload.customerStore = loc;
        }

        const response = await fetch(`${API_BASE}/users/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          toast.success('Account created successfully!');
          resetForm();
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Failed to create account.');
        }
      } catch (error) {
        toast.error('Server unreachable. Please ensure the backend is running.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const showLocationField = Boolean(ROLE_TEXT_FIELD_CONFIG[formik.values.role]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          backgroundColor: '#f8fafc',
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: { xs: 4, md: 6 },
          px: 2,
        }}
      >
        <Container maxWidth="md">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 5, md: 6 },
              borderRadius: 4,
              boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
            }}
          >
            {/* Header */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  backgroundColor: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <img src={Fav} alt="Logo" style={{ height: 48, objectFit: 'contain' }} />
              </Box>
              <Typography
                component="h1"
                variant="h4"
                sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', textAlign: 'center' }}
              >
                Create an Account
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, color: '#64748b', textAlign: 'center' }}>
                Register a new user for the Inventory Management System
              </Typography>
            </Box>

            <form onSubmit={formik.handleSubmit}>
              <Grid container spacing={3}>
                {/* Full Name */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Full Name"
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutline sx={{ color: '#64748b' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                      },
                    }}
                  />
                </Grid>

                {/* Role */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    required
                    label="Role"
                    name="role"
                    value={formik.values.role}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.role && Boolean(formik.errors.role)}
                    helperText={formik.touched.role && formik.errors.role}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeOutlined sx={{ color: '#64748b' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                      },
                    }}
                  >
                    {ROLES.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Location text field */}
                {showLocationField && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label={ROLE_TEXT_FIELD_CONFIG[formik.values.role]?.label}
                      placeholder={ROLE_TEXT_FIELD_CONFIG[formik.values.role]?.placeholder}
                      name="locationTag"
                      value={formik.values.locationTag}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.locationTag && Boolean(formik.errors.locationTag)}
                      helperText={
                        formik.touched.locationTag && formik.errors.locationTag
                          ? formik.errors.locationTag
                          : ''
                      }
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOnOutlined sx={{ color: '#64748b' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2.5,
                        },
                      }}
                    />
                  </Grid>
                )}

                {/* Email Address */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    type="email"
                    label="Email Address"
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlined sx={{ color: '#64748b' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                      },
                    }}
                  />
                </Grid>

                {/* Password */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="password"
                    label="Password"
                    name="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined sx={{ color: '#64748b' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                      },
                    }}
                  />
                </Grid>

                {/* Confirm Password */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="password"
                    label="Confirm Password"
                    name="confirmPassword"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)
                    }
                    helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined sx={{ color: '#64748b' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                      },
                    }}
                  />
                </Grid>

                {/* Submit Button */}
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <Button
                    fullWidth
                    size="large"
                    type="submit"
                    variant="contained"
                    disabled={formik.isSubmitting}
                    startIcon={!formik.isSubmitting && <PersonAddOutlined />}
                    sx={{
                      py: 1.6,
                      borderRadius: 2.5,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 700,
                      backgroundColor: '#2563eb',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: '#1d4ed8',
                        boxShadow: '0 6px 20px rgba(37, 99, 235, 0.45)',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    {formik.isSubmitting ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} color="inherit" />
                        <span>Creating Account...</span>
                      </Box>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </Grid>
              </Grid>
            </form>

            <Typography
              variant="caption"
              sx={{ mt: 3, display: 'block', textAlign: 'center', color: '#94a3b8' }}
            >
              By signing up you agree to our Terms &amp; Privacy Policy.
            </Typography>
          </Paper>
        </Container>
      </Box>
      <ToastContainer />
    </ThemeProvider>
  );
}
