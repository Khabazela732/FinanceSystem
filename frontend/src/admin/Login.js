import React, { useState } from "react";
import {
  Box, Typography, Paper, TextField, Button, Container, Alert, Stack,
  Backdrop, CircularProgress, Fade
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
        credentials: "include",
      });
      if (response.ok) {
        localStorage.setItem("loggedInUser", JSON.stringify({ email: form.email }));
        setLoginSuccess(true);
        setTimeout(() => navigate("/dashboard"), 2000);
      } else {
        const data = await response.json();
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Server error or network issue");
    } finally {
      if (!loginSuccess) setLoading(false);
    }
  };

  if (loginSuccess) {
    return (
      <Box sx={{ 
        minHeight: "100vh", 
        bgcolor: "rgba(248, 249, 250, 0.98)", 
        py: 8, 
        px: { xs: 2, md: 4 },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // ✅ BLUR ENTRANCE BACKGROUND
        backgroundImage: `url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(12px)",
          zIndex: -1
        }
      }}>
        <Fade in={loginSuccess} timeout={600}>
          <Paper
            elevation={12}
            sx={{
              borderRadius: 4,
              p: 8,
              textAlign: "center",
              boxShadow: "0 32px 96px rgba(25,118,210,0.25)",
              bgcolor: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              maxWidth: 500,
              width: "100%"
            }}
          >
            <CircularProgress 
              size={64} 
              sx={{ mb: 3, color: "#1976d2" }} 
            />
            <Typography variant="h4" fontWeight={900} sx={{ color: "#1976d2", mb: 2 }}>
              Opening Finance System
            </Typography>
            <Typography variant="h6" sx={{ color: "#666", fontWeight: 500 }}>
              Redirecting to Dashboard...
            </Typography>
          </Paper>
        </Fade>
      </Box>
    );
  }

  return (
    <>
      {/* ✅ BLUR BACKGROUND CONTAINER */}
      <Box sx={{ 
        minHeight: "100vh",
        // ✅ BEAUTIFUL BLURRED FINANCE BACKGROUND
        backgroundImage: `
          linear-gradient(rgba(227, 242, 253, 0.9), rgba(187, 222, 251, 0.9)),
          url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        position: "relative",
        py: { xs: 4, md: 8 },
        px: { xs: 2, md: 4 }
      }}>
        {/* ✅ SUBTLE BACKGROUND OVERLAY */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(135deg, rgba(25,118,210,0.05) 0%, rgba(33,150,243,0.03) 100%)",
            backdropFilter: "blur(2px)",
            zIndex: 0
          }}
        />
        
        <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              p: { xs: 4, md: 6 },
              boxShadow: "0 32px 96px rgba(0,0,0,0.12)",
              backdropFilter: "blur(24px)",
              background: "rgba(255, 255, 255, 0.92)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                boxShadow: "0 48px 120px rgba(0,0,0,0.18)",
                transform: "translateY(-8px)",
                border: "1px solid rgba(25, 118, 210, 0.2)"
              },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Title */}
            <Typography variant="h3" fontWeight={800} sx={{ 
              color: "#1a1a1a", 
              mb: 1,
              background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: { xs: "2rem", md: "2.5rem" }
            }}>
              Sign in to Admin Panel
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                color: "#666", 
                mb: 6, 
                textAlign: "center",
                fontWeight: 500,
                fontSize: { xs: "1.1rem", md: "1.25rem" }
              }}
            >
              Login to your dashboard
            </Typography>

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%", maxWidth: 400 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 3, fontWeight: 500 }}>
                  {error}
                </Alert>
              )}

              <TextField
  fullWidth
  margin="normal"
  required
  id="email"
  label="Email Address"
  name="email"
  autoComplete="username"
  autoFocus
  placeholder="admin@example.com"
  value={form.email}
  onChange={handleChange}
  disabled={loading}
  sx={{ 
    mb: 2, 
    "& .MuiOutlinedInput-root": {
      fontWeight: 500,
      borderRadius: 3,
      "& fieldset": { borderColor: "#e0e0e0" },
      "&:hover fieldset": { borderColor: "#1976d2" },
      "&.Mui-focused fieldset": { borderColor: "#1976d2", borderWidth: 2 }
    }
  }}
/>

<TextField
  fullWidth
  margin="normal"
  required
  name="password"
  label="Password"
  type="password"
  id="password"
  autoComplete="current-password"
  placeholder="Enter your password"
  value={form.password}
  onChange={handleChange}
  disabled={loading}
  sx={{ 
    mb: 3,
    "& .MuiOutlinedInput-root": {
      fontWeight: 500,
      borderRadius: 3,
      "& fieldset": { borderColor: "#e0e0e0" },
      "&:hover fieldset": { borderColor: "#1976d2" },
      "&.Mui-focused fieldset": { borderColor: "#1976d2", borderWidth: 2 }
    }
  }}
/>


              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.8,
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  borderRadius: 3,
                  bgcolor: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                  boxShadow: "0 12px 36px rgba(25,118,210,0.4)",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    bgcolor: "linear-gradient(135deg, #1565c0 0%, #2196f3 100%)",
                    boxShadow: "0 20px 48px rgba(25,118,210,0.5)",
                    transform: "translateY(-4px) scale(1.02)"
                  },
                  "&:active": {
                    transform: "translateY(-2px) scale(1.01)"
                  }
                }}
              >
                {loading ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={22} sx={{ color: "white" }} />
                    <span>Signing in...</span>
                  </Stack>
                ) : (
                  "Sign In"
                )}
              </Button>
            </Box>

            {/* Navigation Links */}
            <Stack direction="row" justifyContent="space-between" mt={4} sx={{ width: "100%", maxWidth: 400 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate("/")}
                disabled={loading}
                sx={{
                  fontWeight: 600,
                  borderColor: "rgba(102, 102, 102, 0.3)",
                  color: "#666",
                  borderRadius: 2.5,
                  backdropFilter: "blur(10px)",
                  background: "rgba(255, 255, 255, 0.6)",
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#1976d2",
                    color: "#1976d2",
                    background: "rgba(25, 118, 210, 0.08)"
                  }
                }}
              >
                Back to Home
              </Button>
              <Button
                component={Link}
                to="/signup"
                disabled={loading}
                sx={{
                  fontWeight: 700,
                  color: "#1976d2",
                  textTransform: "none",
                  fontSize: "1.05rem",
                  backdropFilter: "blur(10px)",
                  "&:hover": {
                    textDecoration: "underline",
                    background: "rgba(25, 118, 210, 0.05)"
                  }
                }}
              >
                Don't have an account? Signup
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>

      {/* Fullscreen Backdrop during login */}
      <Backdrop
        sx={{ 
          zIndex: 9999,
          color: '#fff',
          bgcolor: "rgba(248, 249, 250, 0.98)",
          backdropFilter: "blur(16px)"
        }}
        open={loading && !loginSuccess}
      >
        <Stack alignItems="center" spacing={3}>
          <CircularProgress size={56} sx={{ color: "#1976d2" }} />
          <Typography variant="h5" sx={{ color: "#1a1a1a", fontWeight: 600 }}>
            Authenticating your credentials...
          </Typography>
        </Stack>
      </Backdrop>
    </>
  );
}

export default Login;
