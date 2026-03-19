import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { 
  Box, 
  Typography, 
  Button, 
  Stack, 
  Fade, 
  CircularProgress,
  Grow, 
  Zoom
} from "@mui/material";
import { 
  ArrowForward as ArrowForwardIcon, 
  Info as InfoIcon,
  Analytics as AnalyticsIcon
} from "@mui/icons-material";
import "./App.css";
import logo from "./assets/clean.png";

import Signup from "./admin/SignUp";
import Login from "./admin/Login";
import Dashboard from "./admin/Dashboard/Dashboard";
import Notifications from "./admin/Dashboard/Notifications";
import ClientForm from "./admin/Dashboard/ClientForm";
import Clients from "./admin/Dashboard/Clients";
import InvoiceForm from "./admin/Dashboard/Invoices/InvoiceForm";
import Invoices from "./admin/Dashboard/Invoices/Invoices";
import DraftInvoices from './admin/Dashboard/Invoices/DraftInvoices';
import ResetPassword from './client/ResetPassword';
import ClientLogin from "./client/ClientLoginPage";
import ForgotPassword from './client/ForgotPassword';
import ClientDashboard from "./client/Dashboard/ClientDashboard";
import UploadedProofs from "./admin/Dashboard/UploadedProofs";
import ClientProfileUpdate from "./client/Dashboard/ClientProfileUpdate"; 
import AdminSettings from "./admin/Dashboard/AdminSettings";
import ProofViewer from "./admin/Dashboard/Invoices/ProofViewer";
import ClientProofUploadPage from './client/Dashboard/ClientProofUploadPage';
import ClientInvoicesPage from './client/Dashboard/ClientInvoicesPage';
import ClientPaymentPage from './client/Dashboard/ClientPaymentPage';
import MonthlyReports from './admin/Dashboard/MonthlyReports';
import ClientProfilePage from "./client/Dashboard/ClientProfilePage";

function EntranceScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const [buttonsVisible, setButtonsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setTimeout(() => {
        setContentVisible(true);
        setTimeout(() => setLogoVisible(true), 300);
        setTimeout(() => setTitleVisible(true), 600);
        setTimeout(() => setButtonsVisible(true), 1200);
      }, 200);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleNavClick = (action) => {
    console.log(`Nav clicked: ${action}`);
    if (action === 'call') window.location.href = 'tel:+27123456789';
    if (action === 'email') window.location.href = 'mailto:info@financesystem.com';
  };

  if (loading) {
    return (
      <Box sx={{ 
        height: "100vh", 
        width: "100vw",
        display: "flex", 
        flexDirection: "column",
        justifyContent: "center", 
        alignItems: "center", 
        bgcolor: "#f8f9fa",
        position: "fixed",
        top: 0,
        left: 0,
        p: 3
      }}>
        <Box sx={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          textAlign: "center",
          maxWidth: "90vw"
        }}>
          <Box
            component="img"
            src={logo}
            alt="Finance System"
            sx={{
              height: { xs: "110px", sm: "130px", md: "150px" },
              width: "auto",
              filter: "drop-shadow(0 8px 24px rgba(25,118,210,0.25))",
              mb: 5
            }}
          />
          <CircularProgress size={80} sx={{ mb: 5, color: "#1976d2" }} />
          <Typography variant="h4" sx={{ color: "#000000", fontWeight: 800, mb: 2 }}>
            Initializing Finance System
          </Typography>
          <Typography variant="h6" sx={{ color: "rgba(0, 0, 0, 0.8)", fontWeight: 500 }}>
            Professional Debt Collection Platform
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: "100vh",
      width: "100vw",
      bgcolor: "#f8f9fa",
      position: "fixed",
      top: 0,
      left: 0,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* CENTERED TOP NAVIGATION BAR */}
      <Box sx={{
        height: 70,
        bgcolor: "#1b5fa3f2",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.2)",
        display: "flex",
        alignItems: "center",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100
      }}>
        <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          gap: { xs: 0.5, sm: 1, md: 1.5 },
          px: { xs: 1, sm: 2, md: 3 },
          width: "100%",
          maxWidth: "1400px",
          mx: "auto",
          flexWrap: "wrap"
        }}>
          <Button
            variant="text"
            onClick={() => handleNavClick('about')}
            sx={{
              color: "white",
              fontWeight: 600,
              fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem" },
              py: 0.5,
              px: 1.5,
              borderRadius: 1.5,
              minWidth: "auto",
              height: "auto",
              whiteSpace: "nowrap",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.15)",
                transform: "translateY(-1px)"
              }
            }}
            startIcon={<InfoIcon sx={{ fontSize: 18 }} />}
          >
            About
          </Button>
          <Button
            variant="text"
            onClick={() => handleNavClick('insights')}
            sx={{
              color: "white",
              fontWeight: 600,
              fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem" },
              py: 0.5,
              px: 1.5,
              borderRadius: 1.5,
              minWidth: "auto",
              height: "auto",
              whiteSpace: "nowrap",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.15)",
                transform: "translateY(-1px)"
              }
            }}
            startIcon={<AnalyticsIcon sx={{ fontSize: 18 }} />}
          >
            Insights
          </Button>
          <Button
            variant="text"
            onClick={() => handleNavClick('contact')}
            sx={{
              color: "white",
              fontWeight: 600,
              fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem" },
              py: 0.5,
              px: 1.5,
              borderRadius: 1.5,
              minWidth: "auto",
              height: "auto",
              whiteSpace: "nowrap",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.15)",
                transform: "translateY(-1px)"
              }
            }}
            startIcon={<InfoIcon sx={{ fontSize: 18 }} />}
          >
            Contact
          </Button>
          <Button
            variant="text"
            onClick={() => handleNavClick('email')}
            sx={{
              color: "white",
              fontWeight: 600,
              fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem" },
              py: 0.5,
              px: 1.5,
              borderRadius: 1.5,
              minWidth: "auto",
              height: "auto",
              whiteSpace: "nowrap",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.15)",
                transform: "translateY(-1px)"
              }
            }}
            startIcon={<InfoIcon sx={{ fontSize: 18 }} />}
          >
            Email
          </Button>
        </Box>
      </Box>

      {/* MAIN CONTENT */}
      <Box sx={{ 
        flex: 1,
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center",
        pt: { xs: 10, md: 12 },
        pb: { xs: 20, md: 24 },
        px: { xs: 3, sm: 4, md: 6 },
        maxWidth: "1400px",
        mx: "auto",
        width: "100%"
      }}>
        <Fade in={contentVisible} timeout={1000}>
          <Box sx={{ width: "100%", textAlign: "center" }}>
            {/* Logo */}
           <Grow in={logoVisible} timeout={800}>
  <Box sx={{ mb: 6 }}>
    <Box
      component="img"
      src={logo}
      alt="Finance System"
      sx={{
        height: { xs: "100px", sm: "120px", md: "140px" },
        width: "auto",
        mx: "auto",
        filter: "drop-shadow(0 12px 32px rgba(25,118,210,0.2))",
        // PERFECT HOVER EFFECTS
        cursor: "pointer",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: "translateY(0)",
        "&:hover": {
          transform: "translateY(-8px) scale(1.05)",
          filter: "drop-shadow(0 20px 40px rgba(25,118,210,0.4)) brightness(1.1)",
          boxShadow: "0 25px 50px -12px rgba(25,118,210,0.5)"
        },
        "&:active": {
          transform: "translateY(-4px) scale(1.02)",
          transition: "all 0.15s ease-out"
        }
      }}
      onClick={() => {
        // Optional: Navigate home or do something
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
    />
  </Box>
</Grow>

            {/* Title with ENHANCED SHADOW */}
            <Zoom in={titleVisible} timeout={1000}>
              <Typography 
                variant="h1" 
                sx={{ 
                  color: "#1a1a1a", 
                  mb: 3,
                  lineHeight: 1.1,
                  fontSize: { xs: "2.2rem", sm: "2.8rem", md: "3.2rem", lg: "3.8rem" },
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  textShadow: "0 4px 16px rgba(0,0,0,0.25), 0 0 40px rgba(25,118,210,0.15)"
                }}
              >
                Financial Debt Collection System
              </Typography>
            </Zoom>

            {/* Subtitle */}
            <Fade in={titleVisible} timeout={1200}>
              <Typography variant="h4" sx={{ 
                color: "#64748b", 
                mb: 8, 
                fontWeight: 400,
                fontSize: { xs: "1.2rem", sm: "1.4rem", md: "1.6rem" },
                maxWidth: 650,
                mx: "auto"
              }}>
                Secure platform for efficient debt management and payment tracking
              </Typography>
            </Fade>

            {/* Main Action Buttons */}
            <Grow in={buttonsVisible} timeout={1400}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3} justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate("/login")}
                  sx={{
                    fontSize: { xs: "1.1rem", md: "1.3rem" },
                    fontWeight: 800,
                    px: 6,
                    py: 3,
                    borderRadius: 2.5,
                    bgcolor: "#1976d2",
                    boxShadow: "0 12px 32px rgba(25,118,210,0.35)",
                    minWidth: 280,
                    height: 70,
                    "&:hover": {
                      bgcolor: "#1565c0",
                      boxShadow: "0 20px 48px rgba(25,118,210,0.45)",
                      transform: "translateY(-4px)"
                    }
                  }}
                  endIcon={<ArrowForwardIcon />}
                >
                  Admin Login
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/clients/login")}
                  sx={{
                    fontSize: { xs: "1.1rem", md: "1.3rem" },
                    fontWeight: 800,
                    px: 6,
                    py: 3,
                    borderRadius: 2.5,
                    borderColor: "#1976d2",
                    borderWidth: 2,
                    color: "#1976d2",
                    minWidth: 280,
                    height: 70,
                    boxShadow: "0 8px 24px rgba(25,118,210,0.2)",
                    "&:hover": {
                      borderColor: "#1565c0",
                      bgcolor: "rgba(25,118,210,0.08)",
                      boxShadow: "0 16px 40px rgba(25,118,210,0.3)"
                    }
                  }}
                  endIcon={<ArrowForwardIcon />}
                >
                  Client Portal
                </Button>
              </Stack>
            </Grow>
          </Box>
        </Fade>
      </Box>

      {/* FIXED FOOTER BAR */}
      <Box sx={{
        height: 70,
        bgcolor: "#1c62a8f2",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10
      }}>
        <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          gap: 2,
          px: 3,
          width: "100%",
          maxWidth: "1200px",
          mx: "auto"
        }}>
          <Typography variant="body2" sx={{ 
            color: "white", 
            fontWeight: 600,
            fontSize: "0.9rem"
          }}>
            © 2026 Finance Debt Collection System
          </Typography>
          <Box sx={{ height: 16, width: 1.5, bgcolor: "rgba(255,255,255,0.3)" }} />
          <Typography variant="body2" sx={{ 
            color: "rgba(255,255,255,0.9)", 
            fontWeight: 500,
            fontSize: "0.85rem"
          }}>
            Enterprise Grade Security
          </Typography>
        </Box>
      </Box>
    </Box>
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
      <Route path="/clients/forgot-password" element={<ForgotPassword />} />
      <Route path="/invoices" element={<Invoices />} />
      <Route path="/invoices/new" element={<InvoiceForm />} />
      <Route path="/invoices/drafts" element={<DraftInvoices />} />
      <Route path="/clients/reset-password" element={<ResetPassword />} />
      <Route path="/clients/dashboard/:id" element={<ClientDashboard />} />
      <Route path="/uploaded-proofs" element={<UploadedProofs />} />
      <Route path="/clients/ClientProfileUpdate" element={<ClientProfileUpdate />} />
      <Route path="/clients/ClientProfilePage" element={<ClientProfilePage />} />
      <Route path="/settings" element={<AdminSettings />} />
      <Route path="/proofs/:id" element={<ProofViewer />} />
      <Route path="/client/proof-upload/:id" element={<ClientProofUploadPage />} />
      <Route path="/client/invoices/:id" element={<ClientInvoicesPage />} />
      <Route path="/client/payments/:id" element={<ClientPaymentPage />} />
      <Route path="reports/monthly" element={<MonthlyReports />} />
       
    </Routes>
  );
}
