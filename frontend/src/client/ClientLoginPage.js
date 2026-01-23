import React, { useState } from "react";
import axios from "axios";
import logo from "../assets/clean.png";
import {
  Box, Typography, Paper, TextField, Button, Container, Alert, Stack, Chip, CircularProgress
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export default function ClientLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Both fields are required.");
      return;
    }
    setLoading(true);
    setError("");
    
    try {
      console.log("🚀 Attempting client login:", form.email);
      
      const res = await axios.post(
        "http://localhost:3001/api/clients/login",
        {
          email: form.email,
          password: form.password,
        },
        {
          withCredentials: true,
        }
      );

      console.log("📡 Login response:", res.data);

      // ✅ FIXED: Server returns clientId, NOT userId
      if (res.status === 200 && (res.data.clientId || res.data.id)) {
        const clientId = res.data.clientId || res.data.id;
        const company = res.data.company || "Client";
        
        console.log(`✅ CLIENT LOGGED IN: ${company} (${clientId})`);
        localStorage.setItem("clientId", clientId); // Backup storage
        
        // ✅ CORRECT ROUTE with clientId
        navigate(`/clients/dashboard/${clientId}`);
      } else {
        setError("Login failed. Server response invalid.");
      }
    } catch (err) {
      console.error("❌ Login error:", err.response?.data || err.message);
      
      if (err.response?.status === 401) {
        setError("Invalid email or password.");
      } else if (err.code === 'ECONNREFUSED') {
        setError("Server not running. Check localhost:3001");
      } else {
        setError(
          err?.response?.data?.message ||
          "Login failed. Please check your credentials."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
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
          {/* Logo + Title */}
          <Stack alignItems="center" mb={4} spacing={1}>
            <img
              src={logo}
              alt="Logo"
              style={{ height: "60px" }}
            />
            <Typography variant="h3" fontWeight={900} sx={{ color: "#1a1a1a" }}>
              Client Portal
            </Typography>
          </Stack>

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
              placeholder="client@example.com"
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
              disabled={loading || !form.email || !form.password}
              sx={{
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 700,
                borderRadius: 3,
                bgcolor: loading ? "#bdbdbd" : "#1976d2",
                boxShadow: loading 
                  ? "none" 
                  : "0 8px 24px rgba(25,118,210,0.35)",
                transition: "all 0.3s ease",
                "&:hover": {
                  bgcolor: "#1565c0",
                  boxShadow: "0 12px 32px rgba(25,118,210,0.45)",
                  transform: "translateY(-2px)"
                }
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: "white" }} />
                  Logging in...
                </>
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
  onClick={() => navigate('/clients/forgot-password')}
  sx={{ mt: 2, textTransform: 'none' }}
>
  Forgot Password?
</Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};
