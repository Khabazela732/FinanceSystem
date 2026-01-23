// ForgotPassword.jsx - ENTERPRISE READY PASSWORD RECOVERY
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  CircularProgress,
  InputAdornment,
  Divider,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Link,
  Backdrop
} from '@mui/material';
import {
  LockReset as LockResetIcon,
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  SecurityOutlined as SecurityIcon,
  AssignmentOutlined as AssignmentIcon
} from '@mui/icons-material';

// ✅ SYSTEM THEME COLORS - Enterprise Financial System
const sidebarBg = "#3166AE";
const mainBg = "#e3f2fd";
const primaryBlue = "#1976d2";
const successGreen = "#4caf50";
const warningOrange = "#ff9800";
const textPrimary = "#1a1a1a";
const lightText = "#666666";

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(0); // 0: Email form, 1: Success
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  // Auto-redirect after success
  useEffect(() => {
    if (step === 1) {
      const timer = setTimeout(() => {
        navigate('/clients/login');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [step, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:3001/api/clients/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage(`A verification code has been sent to ${email}`);
        setEmailSent(true);
        setStep(1);
      } else {
        setError(result.message || 'Failed to send recovery code. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Forgot password error:', err);
    }
    
    setLoading(false);
  };

  const handleReset = () => {
    setEmail('');
    setMessage('');
    setError('');
    setStep(0);
    setEmailSent(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: mainBg,
        backgroundImage: `linear-gradient(135deg, ${mainBg} 0%, rgba(25, 118, 210, 0.05) 100%)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        {/* HEADER */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/clients/login')}
          sx={{
            mb: 3,
            color: primaryBlue,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.95rem',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateX(-4px)',
              bgcolor: 'rgba(25, 118, 210, 0.08)'
            }
          }}
        >
          Back to Login
        </Button>

        {/* MAIN CARD */}
        <Paper
          sx={{
            borderRadius: 3,
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12)',
            overflow: 'hidden',
            border: '1px solid rgba(25, 118, 210, 0.1)',
            bgcolor: 'white'
          }}
        >
          {/* HEADER SECTION */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${sidebarBg} 0%, ${primaryBlue} 100%)`,
              p: 4,
              textAlign: 'center',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Decorative elements */}
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }}
            />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box
                sx={{
                  width: 88,
                  height: 88,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  backdropFilter: 'blur(4px)',
                  border: '2px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <SecurityIcon sx={{ fontSize: 48 }} />
              </Box>
              <Typography
                variant="h5"
                fontWeight={700}
                sx={{ mb: 1 }}
              >
                Recover Your Account
              </Typography>
              <Typography
                variant="body2"
                sx={{ opacity: 0.95 }}
              >
                Enter your email to receive a secure verification code
              </Typography>
            </Box>
          </Box>

          {/* CONTENT SECTION */}
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            {/* STEPPER */}
            <Stepper
              activeStep={step}
              sx={{
                mb: 4,
                '& .MuiStepLabel-label': {
                  fontSize: '0.9rem',
                  fontWeight: 500
                },
                '& .MuiStepIcon-root': {
                  color: '#e0e0e0',
                  '&.Mui-active': {
                    color: primaryBlue
                  },
                  '&.Mui-completed': {
                    color: successGreen
                  }
                }
              }}
            >
              <Step completed={step > 0}>
                <StepLabel>Enter Email</StepLabel>
              </Step>
              <Step completed={false}>
                <StepLabel>Verify Code</StepLabel>
              </Step>
            </Stepper>

            {/* ERROR ALERT */}
            {error && (
              <Alert
                severity="error"
                onClose={() => setError('')}
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  bgcolor: 'rgba(244, 67, 54, 0.1)',
                  border: '1px solid rgba(244, 67, 54, 0.2)',
                  '& .MuiAlert-icon': {
                    color: '#f44336'
                  }
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {error}
                </Typography>
              </Alert>
            )}

            {/* SUCCESS STATE */}
            {step === 1 && message ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'rgba(76, 175, 80, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                    animation: 'pulse 2s infinite'
                  }}
                >
                  <CheckCircleIcon
                    sx={{
                      fontSize: 48,
                      color: successGreen
                    }}
                  />
                </Box>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ color: textPrimary, mb: 1 }}
                >
                  Email Sent Successfully
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: lightText, mb: 3 }}
                >
                  {message}
                </Typography>
                <Paper
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(25, 118, 210, 0.05)',
                    border: `1px solid ${primaryBlue}`,
                    mb: 3
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <AssignmentIcon
                      sx={{
                        color: primaryBlue,
                        mt: 0.5,
                        flexShrink: 0
                      }}
                    />
                    <Box>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ color: textPrimary, mb: 1 }}
                      >
                        Next Steps:
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: lightText, display: 'block', lineHeight: 1.6 }}
                      >
                        • Check your email for the 6-digit verification code<br/>
                        • If not in inbox, check your spam folder<br/>
                        • The code will expire within 1 hour<br/>
                        • You'll be redirected to login shortly
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
                <Button
                  onClick={() => navigate('/clients/login')}
                  variant="contained"
                  fullWidth
                  sx={{
                    height: 48,
                    borderRadius: 2,
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    bgcolor: successGreen,
                    boxShadow: `0 4px 16px rgba(76, 175, 80, 0.3)`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: '#45a049',
                      boxShadow: `0 8px 24px rgba(76, 175, 80, 0.4)`,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Return to Login
                </Button>
              </Box>
            ) : (
              // FORM STATE
              <Box component="form" onSubmit={handleSubmit}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ color: textPrimary, mb: 2 }}
                >
                  Email Address
                </Typography>
                <TextField
                  fullWidth
                  type="email"
                  placeholder="your.email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: primaryBlue, mr: 1 }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: '#fafafa',
                      transition: 'all 0.3s ease',
                      '&:hover': { bgcolor: 'white' },
                      '&.Mui-focused': {
                        bgcolor: 'white',
                        boxShadow: `0 0 0 3px rgba(25, 118, 210, 0.1)`
                      }
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0'
                    }
                  }}
                />

                <Typography
                  variant="caption"
                  sx={{
                    color: lightText,
                    display: 'block',
                    mb: 3,
                    lineHeight: 1.5
                  }}
                >
                  <EmailIcon
                    sx={{
                      fontSize: 14,
                      mr: 0.5,
                      verticalAlign: 'text-bottom',
                      color: warningOrange
                    }}
                  />
                  A 6-digit verification code will be sent to this email address
                </Typography>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading || !email}
                  sx={{
                    height: 48,
                    borderRadius: 2,
                    fontWeight: 700,
                    fontSize: '1rem',
                    bgcolor: primaryBlue,
                    boxShadow: `0 4px 16px rgba(25, 118, 210, 0.3)`,
                    transition: 'all 0.3s ease',
                    mb: 2,
                    '&:hover': {
                      bgcolor: sidebarBg,
                      boxShadow: `0 8px 24px rgba(25, 118, 210, 0.4)`,
                      transform: 'translateY(-2px)'
                    },
                    '&:disabled': {
                      bgcolor: '#ccc'
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress
                        size={20}
                        sx={{ mr: 1.5, color: 'white' }}
                      />
                      <Typography variant="inherit">
                        Sending Code...
                      </Typography>
                    </>
                  ) : (
                    <>
                      <LockResetIcon sx={{ mr: 1 }} />
                      <Typography variant="inherit">
                        Send Recovery Code
                      </Typography>
                    </>
                  )}
                </Button>

                <Divider sx={{ my: 3 }} />

                {/* FOOTER INFO */}
                <Paper
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(25, 118, 210, 0.05)',
                    border: '1px solid rgba(25, 118, 210, 0.1)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <SecurityIcon
                      sx={{
                        color: successGreen,
                        mt: 0.3,
                        flexShrink: 0
                      }}
                    />
                    <Box>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ color: textPrimary, mb: 0.5 }}
                      >
                        Your account is secure
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: lightText }}
                      >
                        We use industry-standard encryption to protect your account recovery process.
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            )}
          </Box>

          {/* FOOTER */}
          {step === 0 && (
            <Divider sx={{ my: 0 }} />
          )}
          {step === 0 && (
            <Box
              sx={{
                p: 3,
                textAlign: 'center',
                bgcolor: '#f9f9f9'
              }}
            >
              <Typography variant="body2" sx={{ color: lightText, mb: 1 }}>
                Remember your password?
              </Typography>
              <Button
                onClick={() => navigate('/clients/login')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  color: primaryBlue,
                  fontSize: '0.95rem',
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.08)'
                  }
                }}
              >
                Sign In Instead
              </Button>
            </Box>
          )}
        </Paper>

        {/* SECURITY INFO FOOTER */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="caption" sx={{ color: lightText }}>
            © 2026 Internship Success. All rights reserved. Secure Password Recovery
          </Typography>
        </Box>
      </Container>

      {/* ANIMATION STYLES */}
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
          }
        }
      `}</style>
    </Box>
  );
}
