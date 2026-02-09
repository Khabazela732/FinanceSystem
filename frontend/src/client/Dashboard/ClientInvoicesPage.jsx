// ClientInvoicesPage.jsx - FIXED: Works WITHOUT Admin Login
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,Typography,Paper,
  CircularProgress,
  Dialog,DialogTitle,
  DialogContent,IconButton,Button,AppBar,Toolbar,
  Backdrop,
  Chip,Divider,Alert,Table,
  TableBody,TableCell,
  TableContainer,TableHead,
  TableRow,Menu,MenuItem
} from "@mui/material";
import {
  Close as CloseIcon,Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,Download as DownloadIcon,
  Print as PrintIcon,MoreVert as MoreVertIcon,
  Receipt as ReceiptIcon,Home as HomeIcon,Logout as LogoutIcon,
  Dashboard as DashboardIcon,Info as InfoIcon
} from "@mui/icons-material";
import InvoicePrintView from "../../admin/Dashboard/Invoices/InvoicePrintView";

const API_BASE = "http://localhost:3001";

//LIGHT BLUE THEME COLORS - Matching Admin Dashboard
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

export default function ClientInvoicesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const clientId = id; // Extract client ID from URL

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [fullInvoice, setFullInvoice] = useState(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMenuInvoice, setSelectedMenuInvoice] = useState(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  //fetchInvoices - PUBLIC ENDPOINTS (No Admin Required!)
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      // Works WITHOUT admin login!
      const invoicesRes = await fetch(`${API_BASE}/api/client/${clientId}/invoices/public`);
      const proofsRes = await fetch(`${API_BASE}/api/client/${clientId}/proofs/public`);

      if (!invoicesRes.ok) throw new Error('Failed to load invoices');
      if (!proofsRes.ok) throw new Error('Failed to load proofs');

      const invoicesData = await invoicesRes.json();
      const proofsData = await proofsRes.json();

      // Sort invoices by newest first
      const sortedInvoices = Array.isArray(invoicesData) 
        ? invoicesData.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
        : [];

      setInvoices(sortedInvoices);
      setProofs(Array.isArray(proofsData) ? proofsData : []);

    } catch (error) {
      console.error('Client invoices error:', error);
      setError('Failed to load your invoices. Please try again.');
      setInvoices([]);
      setProofs([]);
    } finally {
      setLoading(false);
    }
  };

  // Load invoices on mount and when clientId changes
  useEffect(() => {
    if (clientId) {
      fetchInvoices();
    }
  }, [clientId]);

  // Get proof status for invoice
  const getProofStatus = (invoiceId) => {
    const hasProof = proofs.some(proof => String(proof.invoice_id) === String(invoiceId));
    return hasProof ? 'paid' : 'pending';
  };

  // Get status color
  const getStatusColor = (status) => {
    const lowerStatus = (status || '').toLowerCase();
    if (lowerStatus === 'paid') return successGreen;
    if (lowerStatus === 'pending') return warningOrange;
    if (lowerStatus === 'overdue') return errorRed;
    return '#999';
  };

  const handleViewInvoice = async (invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceDialogOpen(true);
    setFullInvoice(invoice);

    // Try to fetch full invoice details (optional - won't break if fails)
    try {
      const res = await fetch(`${API_BASE}/api/client/${clientId}/invoices/${invoice.id}/public`);
      if (res.ok) {
        const data = await res.json();
        setFullInvoice(data);
      }
    } catch (err) {
      console.error("Invoice details error:", err);
      // Use basic invoice data if detailed fetch fails
    }
  };

  const handleCloseInvoiceDialog = () => {
    setInvoiceDialogOpen(false);
    setSelectedInvoice(null);
    setFullInvoice(null);
    setAnchorEl(null);
  };

  // Download invoice as PDF (simulated)
  const handleDownloadInvoice = (invoice) => {
    try {
      const element = document.createElement('a');
      const file = new Blob([`Invoice ${invoice.invoice_number}`], {type: 'application/pdf'});
      element.href = URL.createObjectURL(file);
      element.download = `Invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  // Print invoice
  const handlePrintInvoice = (invoice) => {
    window.print();
  };

  const handleMenuOpen = (e, invoice) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
    setSelectedMenuInvoice(invoice);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMenuInvoice(null);
  };

  const renderInvoiceDetails = () => (
    <Dialog 
      open={invoiceDialogOpen} 
      onClose={handleCloseInvoiceDialog} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, boxShadow: 4 } }}
    >
      <DialogTitle sx={{ pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: primaryBlue, color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon />
          <Typography variant="h6" fontWeight={700}>
            Invoice: {fullInvoice?.invoice_number || selectedInvoice?.invoice_number}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <IconButton 
            size="small"
            onClick={() => handleDownloadInvoice(fullInvoice || selectedInvoice)}
            sx={{ color: 'white', "&:hover": { bgcolor: 'rgba(255,255,255,0.2)' } }}
            title="Download Invoice"
          >
            <DownloadIcon />
          </IconButton>
          <IconButton 
            size="small"
            onClick={() => handlePrintInvoice(fullInvoice || selectedInvoice)}
            sx={{ color: 'white', "&:hover": { bgcolor: 'rgba(255,255,255,0.2)' } }}
            title="Print Invoice"
          >
            <PrintIcon />
          </IconButton>
          <IconButton 
            onClick={handleCloseInvoiceDialog}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {fullInvoice ? (
          <Box sx={{ mt: 2 }}>
            <InvoicePrintView invoice={fullInvoice} />
          </Box>
        ) : (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress sx={{ display: "block", mx: "auto", mb: 2, color: primaryBlue }} />
            <Typography>Loading invoice details...</Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <Box sx={{ display: "flex", bgcolor: mainBg, minHeight: "100vh" }}>
      {/* SLIDE-IN SIDEBAR */}
      <Box
        sx={{
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
        onClick={(e) => e.stopPropagation()}
      >
        <Box sx={{ p: 3, borderBottom: "1px solid rgba(255,255,255,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.25, color: '#ffffff', fontSize: '1rem' }}>
              Internship Success
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.8rem' }}>
              Client Portal
            </Typography>
          </Box>
          <IconButton onClick={closeSidebar} sx={{ color: sidebarText, "&:hover": { bgcolor: hoverBg } }}>
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
        <Box sx={{ flexGrow: 1, p: 2 }}>
          <Button
            fullWidth
            onClick={() => { navigate(`/clients/dashboard/${id}`); closeSidebar(); }}
            sx={navButtonStyle(false)}
          >
            <DashboardIcon sx={{ fontSize: 18 }} />
            <span>Dashboard</span>
          </Button>
          <Button
            fullWidth
            onClick={() => closeSidebar()}
            sx={navButtonStyle(true)}
          >
            <ReceiptIcon sx={{ fontSize: 18 }} />
            <span>Invoices</span>
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
      <Box
        sx={{
          flexGrow: 1,
          pt: 2,
          pb: 5,
          bgcolor: mainBg,
          minHeight: "100vh",
          filter: sidebarOpen ? "blur(4px) brightness(0.85)" : "none",
          transition: "all 0.3s ease"
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, sm: 3, md: 4 }, py: 4 }}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Page Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon sx={{ fontSize: 32, color: primaryBlue }} />
              <Box>
                <Typography variant="h5" fontWeight={700} sx={{ color: textPrimary }}>
                  Your Invoices
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} on file
                </Typography>
              </Box>
            </Box>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/clients/dashboard/${id}`)}
              sx={{
                color: primaryBlue,
                fontWeight: 600,
                textTransform: 'none',
                bgcolor: 'white',
                boxShadow: 1,
                borderRadius: 1.5,
                px: 3,
                py: 1.2,
                transition: 'all 0.3s ease',
                "&:hover": {
                  bgcolor: '#f5f5f5',
                  boxShadow: 2,
                  transform: 'translateX(4px)'
                }
              }}
            >
              Back to Dashboard
            </Button>
          </Box>
          <Divider sx={{ mb: 3 }} />

          {/* Invoices List */}
          <Paper sx={{ borderRadius: 2, boxShadow: 2, overflow: 'hidden' }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress sx={{ color: primaryBlue }} />
              </Box>
            ) : invoices.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 12, px: 4 }}>
                <ReceiptIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ color: textPrimary, fontWeight: 700 }}>
                  No Invoices Yet
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
                  Your invoices will appear here when created by the admin
                </Typography>
                <Button
                  variant="outlined"
                  onClick={fetchInvoices}
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  Refresh
                </Button>
              </Box>
            ) : (
              <TableContainer sx={{ bgcolor: 'white' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5', borderBottom: `2px solid #e0e0e0` }}>
                      <TableCell sx={{ fontWeight: 700, color: textPrimary, py: 2 }}>
                        Invoice #
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: textPrimary, py: 2 }}>
                        Issue Date
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: textPrimary, py: 2 }}>
                        Due Date
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: textPrimary, py: 2 }}>
                        Payment Status
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: textPrimary, py: 2, textAlign: 'right' }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.map((invoice) => {
                      const paymentStatus = getProofStatus(invoice.id);
                      const isPaid = paymentStatus === 'paid';
                      
                      return (
                        <TableRow
                          key={invoice.id}
                          sx={{
                            borderBottom: '1px solid #e0e0e0',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            "&:hover": {
                              bgcolor: '#f9f9f9',
                              boxShadow: 'inset 0 0 10px rgba(25, 118, 210, 0.05)'
                            },
                            "&:last-child": { borderBottom: 'none' }
                          }}
                          onClick={() => handleViewInvoice(invoice)}
                        >
                          <TableCell sx={{ py: 2, fontWeight: 600, color: primaryBlue }}>
                            #{invoice.invoice_number}
                          </TableCell>
                          <TableCell sx={{ py: 2, color: textPrimary }}>
                            {new Date(invoice.created_at || invoice.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell sx={{ py: 2, color: textPrimary }}>
                            {new Date(invoice.due_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Chip
                              label={isPaid ? 'PAID' : 'PENDING'}
                              color={isPaid ? 'success' : 'warning'}
                              size="small"
                              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2, textAlign: 'right' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewInvoice(invoice);
                                }}
                                sx={{
                                  color: primaryBlue,
                                  bgcolor: 'rgba(25, 118, 210, 0.1)',
                                  "&:hover": { bgcolor: 'rgba(25, 118, 210, 0.2)' }
                                }}
                                title="View Details"
                              >
                                <InfoIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadInvoice(invoice);
                                }}
                                sx={{
                                  color: successGreen,
                                  bgcolor: 'rgba(76, 175, 80, 0.1)',
                                  "&:hover": { bgcolor: 'rgba(76, 175, 80, 0.2)' }
                                }}
                                title="Download PDF"
                              >
                                <DownloadIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuOpen(e, invoice)}
                                sx={{
                                  color: '#666',
                                  "&:hover": { bgcolor: '#e0e0e0' }
                                }}
                              >
                                <MoreVertIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* Summary Stats */}
          {!loading && invoices.length > 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3, mt: 4 }}>
              <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2, bgcolor: 'white', borderLeft: `4px solid ${primaryBlue}` }}>
                <Typography variant="body2" sx={{ color: '#666', fontWeight: 600, mb: 1 }}>
                  Total Invoices
                </Typography>
                <Typography variant="h5" fontWeight={700} sx={{ color: primaryBlue }}>
                  {invoices.length}
                </Typography>
              </Paper>
              <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2, bgcolor: 'white', borderLeft: `4px solid ${successGreen}` }}>
                <Typography variant="body2" sx={{ color: '#666', fontWeight: 600, mb: 1 }}>
                  Paid
                </Typography>
                <Typography variant="h5" fontWeight={700} sx={{ color: successGreen }}>
                  {proofs.filter(p => p.invoice_id).length}
                </Typography>
              </Paper>
              <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2, bgcolor: 'white', borderLeft: `4px solid ${warningOrange}` }}>
                <Typography variant="body2" sx={{ color: '#666', fontWeight: 600, mb: 1 }}>
                  Pending
                </Typography>
                <Typography variant="h5" fontWeight={700} sx={{ color: warningOrange }}>
                  {invoices.length - proofs.filter(p => p.invoice_id).length}
                </Typography>
              </Paper>
            </Box>
          )}
        </Box>
      </Box>

      {/* Invoice Details Dialog */}
      {renderInvoiceDetails()}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            handleDownloadInvoice(selectedMenuInvoice);
            handleMenuClose();
          }}
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <DownloadIcon sx={{ fontSize: 18 }} />
          Download PDF
        </MenuItem>
        <MenuItem
          onClick={() => {
            handlePrintInvoice(selectedMenuInvoice);
            handleMenuClose();
          }}
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <PrintIcon sx={{ fontSize: 18 }} />
          Print
        </MenuItem>
      </Menu>
    </Box>
  );
}
