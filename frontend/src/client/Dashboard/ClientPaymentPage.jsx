// ClientPaymentPage.jsx - Payment Gateway Integration (PayFast)
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Backdrop,
  Button,
  Divider,
  TextField,
  Card,
  CardContent,
  Grid,
  Alert
} from "@mui/material";
import {
  Close as CloseIcon,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  CreditCard as CreditCardIcon,
  Home as HomeIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  UploadFile,
  Payment as PaymentIcon
} from "@mui/icons-material";

// ✅ LIGHT BLUE THEME COLORS - Matching Client Dashboard
const sidebarBg = "#3166AE";
const sidebarText = "#ffffff";
const hoverBg = "rgba(255, 255, 255, 0.1)";
const mainBg = "#e3f2fd";
const primaryBlue = "#1976d2";
const successGreen = "#4caf50";
const warningOrange = "#ff9800";
const errorRed = "#f44336";
const textPrimary = "#1a1a1a";

const navButtonStyle = (active) => ({
  padding: "12px 16px",
  borderRadius: 2,
  backgroundColor: active ? "rgba(255,255,255,0.2)" : "transparent",
  color: sidebarText,
  fontWeight: active ? 700 : 600,
  fontSize: "0.95rem",
  cursor: "pointer",
  border: "1px solid transparent",
  textAlign: "left",
  width: "100%",
  mb: 1,
  transition: "all 0.3s ease",
  justifyContent: "flex-start",
  textTransform: "none",
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  "&:hover": {
    backgroundColor: hoverBg,
    borderColor: "rgba(255,255,255,0.3)",
    transform: "translateX(4px)"
  }
});

export default function ClientPaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [client, setClient] = useState(null);
  const [loadingClient, setLoadingClient] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Fetch client data
  useEffect(() => {
    async function fetchClient() {
      try {
        const res = await fetch("http://localhost:3001/api/client/me", {
          credentials: "include",
          headers: { "Cache-Control": "no-cache" }
        });
        if (res.ok) {
          const data = await res.json();
          setClient(data);
        } else {
          navigate("/clients/login");
        }
      } catch (error) {
        console.error("Client fetch error:", error);
        navigate("/clients/login");
      } finally {
        setLoadingClient(false);
      }
    }
    fetchClient();
  }, [navigate]);

  // Fetch pending invoices
  useEffect(() => {
    async function fetchInvoices() {
      setLoadingInvoices(true);
      try {
        const res = await fetch("http://localhost:3001/api/invoices", {
          credentials: "include",
          headers: { "Cache-Control": "no-cache" }
        });

        if (res.ok) {
          const allInvoices = await res.json();
          const clientInvoices = Array.isArray(allInvoices)
            ? allInvoices.filter(inv => String(inv.client_id) === String(id))
            : [];

          // Filter for unpaid invoices
          const unpaidInvoices = clientInvoices.filter(
            inv => inv.status?.toLowerCase() === "pending" || inv.status?.toLowerCase() === "overdue"
          );

          setInvoices(unpaidInvoices);
        } else {
          setInvoices([]);
        }
      } catch (error) {
        console.error("Invoices fetch error:", error);
        setInvoices([]);
      } finally {
        setLoadingInvoices(false);
      }
    }

    if (id) fetchInvoices();
  }, [id]);

  // Handle payment initiation
  const handleMakePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (selectedInvoice && parseFloat(amount) > parseFloat(selectedInvoice.amount_due)) {
      alert(`Payment amount cannot exceed invoice amount (R${selectedInvoice.amount_due})`);
      return;
    }

    setProcessingPayment(true);

    try {
      // TODO: Integrate PayFast payment gateway
      // For now, just show a placeholder message
      console.log({
        clientId: id,
        invoiceId: selectedInvoice?.id,
        amount: parseFloat(amount),
        description: description
      });

      alert("Payment gateway integration coming soon!\nThis will redirect to PayFast.");
      
      // After PayFast integration:
      // - Initialize PayFast payment request
      // - Redirect to PayFast payment page
      // - Handle callback/verification
      
    } catch (error) {
      console.error("Payment error:", error);
      alert("Error processing payment. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleInvoiceSelect = (invoice) => {
    setSelectedInvoice(invoice);
    setAmount(invoice.amount_due || "");
    setDescription(`Payment for Invoice #${invoice.invoice_number}`);
  };

  if (loadingClient || loadingInvoices) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", bgcolor: mainBg }}>
        <CircularProgress sx={{ color: primaryBlue }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: "flex", 
      bgcolor: mainBg,
      minHeight: "100vh"
    }}>
      {/* FIXED TOPBAR */}
      <AppBar position="fixed" sx={{
        zIndex: 1400, 
        bgcolor: sidebarBg,
        height: 72,
        minHeight: 72,
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        borderBottom: "none"
      }}>
        <Toolbar sx={{ height: 72, justifyContent: "space-between", px: 3, alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton 
              onClick={toggleSidebar} 
              sx={{ 
                color: sidebarText,
                "&:hover": { bgcolor: hoverBg }
              }}
            >
              <MenuIcon sx={{ fontSize: 24 }} />
            </IconButton>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: sidebarText, lineHeight: 1 }}>
                Make Payment
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: '0.8rem' }}>
                {client?.company || "Payment Portal"}
              </Typography>
            </Box>
          </Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/clients/dashboard/${id}`)}
            sx={{ color: sidebarText, textTransform: "none", fontWeight: 600 }}
          >
            Back to Dashboard
          </Button>
        </Toolbar>
      </AppBar>

      {/* SLIDE-IN SIDEBAR */}
      <Box sx={{ 
        position: "fixed", 
        top: 0, 
        left: sidebarOpen ? 0 : -280, 
        width: 280, 
        height: "100vh", 
        zIndex: 1300, 
        transition: "left 0.3s ease", 
        bgcolor: sidebarBg, 
        color: sidebarText, 
        boxShadow: sidebarOpen ? "8px 0 24px rgba(0,0,0,0.3)" : "none"
      }} 
      onClick={(e) => e.stopPropagation()}>
        <Box sx={{ p: 3, borderBottom: "1px solid rgba(255,255,255,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.25, color: '#ffffff', fontSize: '1rem' }}>Internship Success</Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.8rem' }}>Client Portal</Typography>
          </Box>
          <IconButton onClick={closeSidebar} sx={{ color: sidebarText, "&:hover": { bgcolor: hoverBg } }}>
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
        <Box sx={{ flexGrow: 1, p: 2 }}>
          <Button 
            fullWidth
            onClick={() => { navigate(`/client/dashboard/${id}`); closeSidebar(); }} 
            sx={navButtonStyle(false)}
          >
            <DashboardIcon sx={{ fontSize: 18 }} /> 
            <span>Analytics</span>
          </Button>
          <Button 
            fullWidth
            onClick={() => { navigate(`/client/invoices/${id}`); closeSidebar(); }} 
            sx={navButtonStyle(false)}
          >
            <ReceiptIcon sx={{ fontSize: 18 }} /> 
            <span>Invoices</span>
          </Button>
          <Button 
            fullWidth
            onClick={() => { navigate(`/client/proof-upload/${id}`); closeSidebar(); }} 
            sx={navButtonStyle(false)}
          >
            <UploadFile sx={{ fontSize: 18 }} /> 
            <span>Upload Proof</span>
          </Button>
          <Button 
            fullWidth
            onClick={() => closeSidebar()} 
            sx={navButtonStyle(true)}
          >
            <PaymentIcon sx={{ fontSize: 18 }} /> 
            <span>Make Payment</span>
          </Button>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", my: 1.5 }} />
          <Button 
            fullWidth
            onClick={() => { navigate("/clients/login"); closeSidebar(); }} 
            variant="contained"
            sx={{ 
              bgcolor: "#ffffff", 
              color: "#3166AE", 
              fontWeight: 700, 
              borderRadius: 1.5, 
              py: 1.2, 
              fontSize: "0.9rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              transition: 'all 0.3s ease',
              "&:hover": { 
                bgcolor: "#f5f5f5", 
                transform: "translateY(-2px)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.3)"
              }
            }}
          >
            <LogoutIcon sx={{ mr: 1, fontSize: 18 }} /> 
            Sign Out
          </Button>
        </Box>
      </Box>

      <Backdrop 
        sx={{ 
          zIndex: 1200, 
          bgcolor: sidebarOpen ? "rgba(0,0,0,0.5)" : "transparent", 
          backdropFilter: sidebarOpen ? "blur(4px)" : "none"
        }} 
        open={sidebarOpen} 
        onClick={closeSidebar} 
      />

      {/* MAIN CONTENT */}
      <Box sx={{ 
        flexGrow: 1, 
        p: 4, 
        pt: "104px",
        maxWidth: "1400px",
        mx: "auto",
        width: "100%"
      }}>
        <Grid container spacing={3}>
          {/* Left Column - Pending Invoices */}
          <Grid item xs={12} md={6}>
            <Paper sx={{
              p: 3,
              borderRadius: 2,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              border: "1px solid #e0e0e0"
            }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <ReceiptIcon sx={{ fontSize: 28, color: primaryBlue, mr: 1.5 }} />
                <Typography variant="h6" fontWeight={700} sx={{ color: textPrimary }}>
                  Pending Invoices
                </Typography>
              </Box>

              {loadingInvoices ? (
                <CircularProgress sx={{ color: primaryBlue }} />
              ) : invoices.length === 0 ? (
                <Alert severity="info">No pending invoices at this time</Alert>
              ) : (
                <Box>
                  {invoices.map((invoice) => (
                    <Card
                      key={invoice.id}
                      onClick={() => handleInvoiceSelect(invoice)}
                      sx={{
                        mb: 2,
                        cursor: "pointer",
                        border: selectedInvoice?.id === invoice.id ? `2px solid ${primaryBlue}` : "1px solid #e0e0e0",
                        backgroundColor: selectedInvoice?.id === invoice.id ? "rgba(25, 118, 210, 0.05)" : "transparent",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
                          border: `2px solid ${primaryBlue}`
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ color: textPrimary }}>
                            #{invoice.invoice_number}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            fontWeight={700} 
                            sx={{ color: invoice.status?.toLowerCase() === "overdue" ? errorRed : warningOrange }}
                          >
                            {invoice.status?.toUpperCase()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: "#666", mb: 0.5 }}>
                          {invoice.company_name}
                        </Typography>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1.5 }}>
                          <Typography variant="caption" sx={{ color: "#999" }}>
                            Amount Due:
                          </Typography>
                          <Typography variant="body2" fontWeight={700} sx={{ color: successGreen }}>
                            R{parseFloat(invoice.amount_due || 0).toFixed(2)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Right Column - Payment Form */}
          <Grid item xs={12} md={6}>
            <Paper sx={{
              p: 3,
              borderRadius: 2,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              border: "1px solid #e0e0e0"
            }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <CreditCardIcon sx={{ fontSize: 28, color: primaryBlue, mr: 1.5 }} />
                <Typography variant="h6" fontWeight={700} sx={{ color: textPrimary }}>
                  Payment Details
                </Typography>
              </Box>

              {selectedInvoice ? (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Selected Invoice: <strong>#{selectedInvoice.invoice_number}</strong>
                  </Alert>

                  <TextField
                    fullWidth
                    label="Payment Amount (R)"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    inputProps={{ step: "0.01", min: "0" }}
                    sx={{ mb: 2 }}
                    variant="outlined"
                  />

                  <TextField
                    fullWidth
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    multiline
                    rows={3}
                    placeholder="Payment description or reference"
                    sx={{ mb: 2 }}
                    variant="outlined"
                  />

                  <Box sx={{
                    p: 2,
                    bgcolor: "rgba(76, 175, 80, 0.1)",
                    borderRadius: 1,
                    border: `1px solid ${successGreen}`,
                    mb: 2
                  }}>
                    <Typography variant="caption" sx={{ color: "#666" }}>
                      Total Amount to Pay
                    </Typography>
                    <Typography variant="h5" fontWeight={700} sx={{ color: successGreen }}>
                      R{parseFloat(amount || 0).toFixed(2)}
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleMakePayment}
                    disabled={processingPayment || !amount}
                    sx={{
                      bgcolor: primaryBlue,
                      color: "#ffffff",
                      fontWeight: 700,
                      py: 1.5,
                      fontSize: "1rem",
                      borderRadius: 1.5,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        bgcolor: "#1565c0",
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 24px rgba(25, 118, 210, 0.3)"
                      },
                      "&:disabled": {
                        bgcolor: "#ccc",
                        color: "#666",
                        cursor: "not-allowed"
                      }
                    }}
                  >
                    {processingPayment ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1, color: "#ffffff" }} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <PaymentIcon sx={{ mr: 1 }} />
                        Proceed to PayFast
                      </>
                    )}
                  </Button>
                </Box>
              ) : (
                <Alert severity="warning">
                  Please select an invoice from the left to make a payment
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
