// ResetPassword.js - ENTERPRISE READY PASSWORD RESET
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  Stepper,
  Step,
  StepLabel,
  LinearProgress
} from '@mui/material';
import {
  LockReset as LockResetIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
  VerifiedUser as VerifiedUserIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

// ✅ SYSTEM THEME COLORS - Enterprise Financial System
const sidebarBg = "#3166AE";
const mainBg = "#e3f2fd";
const primaryBlue = "#1976d2";
const successGreen = "#4caf50";
const warningOrange = "#ff9800";
const errorRed = "#f44336";
const textPrimary = "#1a1a1a";
const lightText = "#666666";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(0); // 0: OTP + Passwords, 1: Success
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const email = searchParams.get('email');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!email) {
      setError('Please use a valid reset link from your email');
    }
  }, [email]);

  // Password strength checker
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    setPasswordStrength(strength);
  }, [password]);

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength === 1) return 'Weak';
    if (passwordStrength === 2) return 'Fair';
    if (passwordStrength === 3) return 'Good';
    return 'Strong';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return '#ccc';
    if (passwordStrength === 1) return errorRed;
    if (passwordStrength === 2) return warningOrange;
    if (passwordStrength === 3) return '#ff9800';
    return successGreen;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (otp.length !== 6) {
      setError('Enter the complete 6-digit code');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/clients/verify-otp-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp, password })
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess('Password reset successful!');
        setStep(1);
        setTimeout(() => navigate('/clients/login'), 3000);
      } else {
        setError(result.message || 'Invalid code or reset failed');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Reset password error:', err);
    }
    
    setLoading(false);
  };

  if (!email) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: mainBg,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4
        }}
      >
        <Container maxWidth="sm">
          <Paper
            sx={{
              p: 4,
              borderRadius: 3,
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12)',
              textAlign: 'center'
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'rgba(244, 67, 54, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3
              }}
            >
              <ShieldIcon sx={{ fontSize: 48, color: errorRed }} />
            </Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              Invalid Reset Link
            </Typography>
            <Typography variant="body2" sx={{ color: lightText, mb: 3 }}>
              The reset link appears to be invalid or has expired. Please request a new code.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/clients/forgot-password')}
              sx={{
                height: 48,
                borderRadius: 2,
                fontWeight: 700,
                bgcolor: primaryBlue,
                boxShadow: `0 4px 16px rgba(25, 118, 210, 0.3)`,
                '&:hover': {
                  bgcolor: sidebarBg,
                  boxShadow: `0 8px 24px rgba(25, 118, 210, 0.4)`
                }
              }}
            >
              Request New Code
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

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
        {/* BACK BUTTON */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/clients/forgot-password')}
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
          Request New Code
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
                <LockResetIcon sx={{ fontSize: 48 }} />
              </Box>
              <Typography
                variant="h5"
                fontWeight={700}
                sx={{ mb: 1 }}
              >
                Reset Your Password
              </Typography>
              <Typography
                variant="body2"
                sx={{ opacity: 0.95 }}
              >
                Complete the verification to create a new password
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
                <StepLabel>Verify & Reset</StepLabel>
              </Step>
              <Step completed={false}>
                <StepLabel>Complete</StepLabel>
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
                    color: errorRed
                  }
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {error}
                </Typography>
              </Alert>
            )}

            {/* SUCCESS STATE */}
            {step === 1 && success ? (
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
                  Password Reset Successfully
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: lightText, mb: 3 }}
                >
                  Your password has been changed. You will be redirected to login shortly.
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={100}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: successGreen
                    }
                  }}
                />
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
                  value={decodeURIComponent(email)}
                  disabled
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VerifiedUserIcon sx={{ color: successGreen, mr: 1 }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: '#f5f5f5'
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0'
                    }
                  }}
                />

                <Divider sx={{ my: 3 }} />

                {/* OTP INPUT */}
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ color: textPrimary, mb: 1 }}
                >
                  Verification Code (6 digits)
                </Typography>
                <TextField
                  fullWidth
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  inputProps={{
                    maxLength: 6,
                    style: {
                      fontSize: '2rem',
                      letterSpacing: '12px',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontFamily: 'monospace'
                    }
                  }}
                  variant="outlined"
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
                    }
                  }}
                  autoFocus
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
                  <ShieldIcon
                    sx={{
                      fontSize: 14,
                      mr: 0.5,
                      verticalAlign: 'text-bottom',
                      color: warningOrange
                    }}
                  />
                  Enter the 6-digit code sent to your email
                </Typography>

                <Divider sx={{ my: 3 }} />

                {/* NEW PASSWORD INPUT */}
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ color: textPrimary, mb: 1 }}
                >
                  New Password
                </Typography>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: primaryBlue, mr: 1 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          icon
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#999' }}
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </Button>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    mb: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: '#fafafa',
                      transition: 'all 0.3s ease',
                      '&:hover': { bgcolor: 'white' },
                      '&.Mui-focused': {
                        bgcolor: 'white',
                        boxShadow: `0 0 0 3px rgba(25, 118, 210, 0.1)`
                      }
                    }
                  }}
                />

                {/* PASSWORD STRENGTH */}
                {password && (
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" fontWeight={600} sx={{ color: lightText }}>
                        Password Strength
                      </Typography>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{ color: getPasswordStrengthColor() }}
                      >
                        {getPasswordStrengthLabel()}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={passwordStrength * 25}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getPasswordStrengthColor(),
                          borderRadius: 3
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: lightText, mt: 1, display: 'block' }}>
                      • At least 8 characters<br/>
                      • Include uppercase letter<br/>
                      • Include number and symbol
                    </Typography>
                  </Box>
                )}

                {/* CONFIRM PASSWORD INPUT */}
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ color: textPrimary, mb: 1 }}
                >
                  Confirm Password
                </Typography>
                <TextField
                  fullWidth
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: primaryBlue, mr: 1 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          icon
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          sx={{ color: '#999' }}
                        >
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </Button>
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
                    }
                  }}
                />

                {/* MATCH INDICATOR */}
                {confirmPassword && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      mb: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: password === confirmPassword ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                      border: `1px solid ${password === confirmPassword ? successGreen : errorRed}`
                    }}
                  >
                    {password === confirmPassword ? (
                      <>
                        <CheckCircleIcon sx={{ color: successGreen }} />
                        <Typography variant="body2" sx={{ color: successGreen, fontWeight: 600 }}>
                          Passwords match
                        </Typography>
                      </>
                    ) : (
                      <>
                        <ShieldIcon sx={{ color: errorRed }} />
                        <Typography variant="body2" sx={{ color: errorRed, fontWeight: 600 }}>
                          Passwords do not match
                        </Typography>
                      </>
                    )}
                  </Box>
                )}

                {/* SUBMIT BUTTON */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={
                    loading ||
                    otp.length !== 6 ||
                    password.length < 8 ||
                    password !== confirmPassword
                  }
                  sx={{
                    height: 48,
                    borderRadius: 2,
                    fontWeight: 700,
                    fontSize: '1rem',
                    bgcolor: successGreen,
                    boxShadow: `0 4px 16px rgba(76, 175, 80, 0.3)`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: '#45a049',
                      boxShadow: `0 8px 24px rgba(76, 175, 80, 0.4)`,
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
                        Resetting Password...
                      </Typography>
                    </>
                  ) : (
                    <>
                      <LockResetIcon sx={{ mr: 1 }} />
                      <Typography variant="inherit">
                        Reset Password
                      </Typography>
                    </>
                  )}
                </Button>
              </Box>
            )}
          </Box>

          {/* FOOTER */}
          {step === 0 && (
            <>
              <Divider sx={{ my: 0 }} />
              <Box
                sx={{
                  p: 3,
                  textAlign: 'center',
                  bgcolor: '#f9f9f9'
                }}
              >
                <Typography variant="body2" sx={{ color: lightText, mb: 1 }}>
                  Didn't receive the code?
                </Typography>
                <Button
                  onClick={() => navigate('/clients/forgot-password')}
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
                  Request a New Code
                </Button>
              </Box>
            </>
          )}
        </Paper>

        {/* SECURITY INFO FOOTER */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="caption" sx={{ color: lightText }}>
            © 2024 Internship Success. All rights reserved. Secure Password Reset
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
