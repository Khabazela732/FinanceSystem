import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { 
  Box, Typography, Paper, Button, Container, Stack, Chip, Fade, CircularProgress 
} from "@mui/material";
import { 
  ArrowForward as ArrowForwardIcon, 
  Business as BusinessIcon,
  Person as PersonIcon 
} from "@mui/icons-material";
import "./App.css";
import logo from "./assets/clean.png";

import Signup from "./Components/SignUp";
import Login from "./Components/Login";
import Dashboard from "./Components/Dashboard";
import Notifications from "./Components/Notifications";
import ClientForm from "./Components/ClientForm";
import Clients from "./Components/Clients";
import InvoiceForm from "./Components/InvoiceForm";
import Invoices from "./Components/Invoices";
import ResetPassword from "./Components/ResetPassword";
import ClientLogin from "./Components/ClientLoginPage";
import ClientDashboard from "./Components/ClientDashboard";
import UploadedProofs from "./Components/UploadedProofs";
import ClientUpdateDetails from "./Components/ClientUpdateDetails"; 
import AdminSettings from "./Components/AdminSettings";
import ProofViewer from "./Components/ProofViewer";





function EntranceScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setTimeout(() => setContentVisible(true), 200);
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Box sx={{ 
        height: "100vh", 
        display: "flex", 
        flexDirection: "column",
        justifyContent: "center", 
        alignItems: "center", 
        bgcolor: "#f8f9fa" 
      }}>
        <CircularProgress size={64} sx={{ mb: 3, color: "#1976d2" }} />
        <Stack alignItems="center" spacing={2}>
          <img src={logo} alt="Logo" style={{ height: "48px" }} />
          <Typography variant="h6" sx={{ color: "#666", fontWeight: 500 }}>
            Loading Financial System...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Fade in={contentVisible} timeout={800}>
      <Box sx={{ 
        minHeight: "100vh", 
        bgcolor: "#f8f9fa", 
        py: 8, 
        px: { xs: 2, md: 4 }
      }}>
        <Container maxWidth="lg">
          <Paper
            elevation={12}
            sx={{
              borderRadius: 5,
              p: { xs: 6, md: 8 },
              boxShadow: "0 32px 96px rgba(0,0,0,0.15)",
              transition: "all 0.4s ease",
              "&:hover": {
                boxShadow: "0 40px 120px rgba(0,0,0,0.2)",
                transform: "translateY(-8px)",
              },
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
              bgcolor: "white",
              mb: 8
            }}
          >
            {/* Animated Background Gradient */}
            <Box sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(135deg, rgba(25,118,210,0.03) 0%, rgba(33,150,243,0.03) 100%)",
              zIndex: 0
            }} />

            <Box sx={{ position: "relative", zIndex: 1 }}>
              {/* Logo */}
              <Stack alignItems="center" mb={4}>
                <img
                  src={logo}
                  alt="Logo"
                  style={{ height: "80px", mb: 2 }}
                />
              </Stack>

              {/* Main Title */}
              <Typography 
                variant="h2" 
                fontWeight={900} 
                sx={{ 
                  color: "#1a1a1a", 
                  mb: 2,
                  lineHeight: 1.2
                }}
              >
                Financial Debt Collection System
              </Typography>

              {/* Subtitle */}
              <Typography 
                variant="h4" 
                sx={{ 
                  color: "#666", 
                  mb: 6, 
                  fontWeight: 500,
                  maxWidth: 600,
                  mx: "auto"
                }}
              >
                Secure & Efficient Debt Management
              </Typography>

              {/* Feature Chips */}
              <Stack 
                direction={{ xs: "column", sm: "row" }} 
                spacing={2} 
                justifyContent="center" 
                mb={8}
                sx={{ maxWidth: 500, mx: "auto" }}
              >
                <Chip 
                  icon={<BusinessIcon sx={{ color: "#1976d2" }} />}
                  label="Professional Dashboard" 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: "1rem",
                    bgcolor: "#e3f2fd",
                    color: "#1976d2",
                    borderRadius: 3,
                    px: 2,
                    py: 1
                  }} 
                />
                <Chip 
                  icon={<PersonIcon sx={{ color: "#1976d2" }} />}
                  label="Client Portal Access" 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: "1rem",
                    bgcolor: "#e3f2fd",
                    color: "#1976d2",
                    borderRadius: 3,
                    px: 2,
                    py: 1
                  }} 
                />
              </Stack>

              {/* Action Buttons */}
              <Stack 
                direction={{ xs: "column", md: "row" }} 
                spacing={3} 
                justifyContent="center"
                sx={{ maxWidth: 500, mx: "auto" }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate("/login")}
                  sx={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    px: 6,
                    py: 2,
                    borderRadius: 3,
                    bgcolor: "#1976d2",
                    boxShadow: "0 12px 32px rgba(25,118,210,0.35)",
                    transition: "all 0.3s ease",
                    minWidth: 220,
                    "&:hover": {
                      bgcolor: "#1565c0",
                      boxShadow: "0 16px 40px rgba(25,118,210,0.45)",
                      transform: "translateY(-3px)"
                    }
                  }}
                  endIcon={<ArrowForwardIcon />}
                >
                  System Admin
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/clients/login")}
                  sx={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    px: 6,
                    py: 2,
                    borderRadius: 3,
                    borderColor: "#1976d2",
                    color: "#1976d2",
                    minWidth: 220,
                    boxShadow: "0 4px 16px rgba(25,118,210,0.15)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      borderColor: "#1565c0",
                      color: "#1565c0",
                      bgcolor: "rgba(25,118,210,0.04)",
                      boxShadow: "0 8px 24px rgba(25,118,210,0.25)",
                      transform: "translateY(-2px)"
                    }
                  }}
                  endIcon={<ArrowForwardIcon />}
                >
                  Client Portal
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Fade>
  );
}

export default function App() {
  return (
<Routes>
  <Route path="/" element={<EntranceScreen />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/login" element={<Login />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/notifications" element={<Notifications />} />
  <Route path="/clients/new" element={<ClientForm />} />
  <Route path="/clients" element={<Clients />} />
  <Route path="/clients/login" element={<ClientLogin />} />
  <Route path="/invoices" element={<Invoices />} />
  <Route path="/invoices/new" element={<InvoiceForm />} />
  <Route path="/reset-password/:token" element={<ResetPassword />} />
  <Route path="/clients/dashboard/:id" element={<ClientDashboard />} />
  <Route path="/uploaded-proofs" element={<UploadedProofs />} />
  <Route path="/clients/update-company" element={<ClientUpdateDetails />} />
  <Route path="/settings" element={<AdminSettings />} />
  {/* NEW: Proof Viewer Route */}
  <Route path="/proofs/:id" element={<ProofViewer />} />
</Routes>

  );
}
