import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Container,
  Alert,
  Stack,
  Backdrop,
  CircularProgress
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useNavigate, Link } from "react-router-dom";

function SignUp() {
  const navigate = useNavigate();

  // ORIGINAL STATE (UNCHANGED)
  const [form, setForm] = useState({
    username: "",
    fullname: "",
    lastname: "",
    company: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ORIGINAL HANDLERS (UNCHANGED)
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (
      !form.username ||
      !form.fullname ||
      !form.lastname ||
      !form.company ||
      !form.email ||
      !form.password
    ) {
      setError("All fields are required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:3001/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          fullname: form.fullname,
          lastname: form.lastname,
          company: form.company,
          email: form.email,
          password: form.password,
        }),
      });

      if (response.ok) {
        navigate("/login");
      } else {
        const data = await response.json();
        setError(data.message || "Signup failed");
      }
    } catch (err) {
      setError("Network error or server unavailable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#f8f9fa",
          py: 8,
          px: { xs: 2, md: 4 },
        }}
      >
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
            <Typography variant="h3" fontWeight={900} sx={{ mb: 1 }}>
              Create Account
            </Typography>
            <Typography
              variant="h5"
              sx={{ color: "#666", mb: 6, textAlign: "center" }}
            >
              Register to access the finance portal
            </Typography>

            {/* FORM */}
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ width: "100%", maxWidth: 420 }}
            >
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <TextField fullWidth label="Username" name="username" value={form.username} onChange={handleChange} required sx={fieldStyle} />
              <TextField fullWidth label="Full Name" name="fullname" value={form.fullname} onChange={handleChange} required sx={fieldStyle} />
              <TextField fullWidth label="Last Name" name="lastname" value={form.lastname} onChange={handleChange} required sx={fieldStyle} />
              <TextField fullWidth label="Company Name" name="company" value={form.company} onChange={handleChange} required sx={fieldStyle} />
              <TextField fullWidth label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} required sx={fieldStyle} />
              <TextField fullWidth label="Password" name="password" type="password" value={form.password} onChange={handleChange} required sx={fieldStyle} />
              <TextField fullWidth label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required sx={{ ...fieldStyle, mb: 3 }} />

              <Button type="submit" fullWidth variant="contained" disabled={loading} sx={buttonStyle}>
                {loading ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={20} sx={{ color: "white" }} />
                    <span>Creating account...</span>
                  </Stack>
                ) : (
                  "Sign Up"
                )}
              </Button>
            </Box>

            {/* NAV */}
            <Stack direction="row" justifyContent="space-between" mt={4} sx={{ width: "100%", maxWidth: 420 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate("/")}
                sx={navButtonStyle}
              >
                Back to Home
              </Button>

              <Button
                component={Link}
                to="/login"
                sx={linkStyle}
              >
                Already have an account? Login
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>

      {/* Backdrop */}
      <Backdrop
        sx={{
          zIndex: 9999,
          bgcolor: "rgba(248,249,250,0.95)",
          backdropFilter: "blur(8px)",
        }}
        open={loading}
      >
        <Stack spacing={3} alignItems="center">
          <CircularProgress size={48} sx={{ color: "#1976d2" }} />
          <Typography fontWeight={500}>Creating your account…</Typography>
        </Stack>
      </Backdrop>
    </>
  );
}

/* 🔁 Shared styles copied from Login */
const fieldStyle = {
  mb: 2,
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
    "& fieldset": { borderColor: "#e0e0e0" },
    "&:hover fieldset": { borderColor: "#1976d2" },
    "&.Mui-focused fieldset": { borderColor: "#1976d2", borderWidth: 2 },
  },
};

const buttonStyle = {
  py: 1.5,
  fontWeight: 700,
  borderRadius: 3,
  bgcolor: "#1976d2",
  boxShadow: "0 8px 24px rgba(25,118,210,0.35)",
  "&:hover": {
    bgcolor: "#1565c0",
    boxShadow: "0 12px 32px rgba(25,118,210,0.45)",
    transform: "translateY(-2px)",
  },
};

const navButtonStyle = {
  fontWeight: 500,
  borderColor: "#666",
  color: "#666",
  borderRadius: 2,
  textTransform: "none",
};

const linkStyle = {
  fontWeight: 700,
  color: "#1976d2",
  textTransform: "none",
};

export default SignUp;
