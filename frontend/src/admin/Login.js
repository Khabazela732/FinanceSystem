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
        setLoginSuccess(true); // Show success animation
        setTimeout(() => navigate("/dashboard"), 2000); // Navigate after animation
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
        bgcolor: "#f8f9fa", 
        py: 8, 
        px: { xs: 2, md: 4 },
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <Fade in={loginSuccess} timeout={600}>
          <Paper
            elevation={12}
            sx={{
              borderRadius: 4,
              p: 8,
              textAlign: "center",
              boxShadow: "0 32px 96px rgba(25,118,210,0.25)",
              bgcolor: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
              maxWidth: 500,
              width: "100%"
            }}
          >
            <CircularProgress 
              size={64} 
              sx={{ mb: 3, color: "#1976d2" }} 
            />
            <Typography variant="h4" fontWeight={900} sx={{ color: "#1976d2", mb: 2 }}>
              Openning Finance System
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
      <Box sx={{ 
        minHeight: "100vh", 
        bgcolor: "#f8f9fa", 
        py: 8, 
        px: { xs: 2, md: 4 }
      }}>
        <Container maxWidth="sm">
          <Paper
            elevation={12}
            sx={{
              borderRadius: 4,
              p: { xs: 4, md: 6 },
              boxShadow: "0 24px 72px rgba(0,0,0,0.15)",
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: "0 32px 88px rgba(0,0,0,0.2)",
                transform: "translateY(-4px)",
              },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Title */}
            <Typography variant="h3" fontWeight={900} sx={{ color: "#1a1a1a", mb: 1 }}>
              Welcome Back
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                color: "#666", 
                mb: 6, 
                textAlign: "center",
                fontWeight: 500
              }}
            >
              Sign in to your dashboard
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
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 700,
                  borderRadius: 3,
                  bgcolor: loading ? "#1976d2" : "#1976d2",
                  boxShadow: "0 8px 24px rgba(25,118,210,0.35)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    bgcolor: "#1565c0",
                    boxShadow: "0 12px 32px rgba(25,118,210,0.45)",
                    transform: "translateY(-2px)"
                  }
                }}
              >
                {loading ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={20} sx={{ color: "white" }} />
                    <span>Signing in...</span>
                  </Stack>
                ) : (
                  "Login"
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
                  fontWeight: 500,
                  borderColor: "#666",
                  color: "#666",
                  borderRadius: 2,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#1976d2",
                    color: "#1976d2"
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
                  fontSize: "1rem",
                  "&:hover": {
                    textDecoration: "underline",
                    bgcolor: "transparent"
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
          bgcolor: "rgba(248, 249, 250, 0.95)",
          backdropFilter: "blur(8px)"
        }}
        open={loading && !loginSuccess}
      >
        <Stack alignItems="center" spacing={3}>
          <CircularProgress size={48} sx={{ color: "#1976d2" }} />
          <Typography variant="h6" sx={{ color: "#1a1a1a", fontWeight: 500 }}>
            Authenticating...
          </Typography>
        </Stack>
      </Backdrop>
    </>
  );
}

export default Login;
