import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Snackbar,
  Alert,
  TablePagination,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Close as CloseIcon,
  NotificationsActive as NotificationsActiveIcon,
  Visibility as VisibilityIcon,
  PictureAsPdf as PdfIcon,
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  Drafts as DraftsIcon,
} from "@mui/icons-material";
import InvoicePrintView from "./InvoicePrintView";


const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [fullInvoice, setFullInvoice] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const navigate = useNavigate();

  // ✅ NEW: Update invoice status function
  const updateInvoiceStatus = async (invoiceId, newStatus) => {
    setUpdatingStatusId(invoiceId);
    try {
      const response = await axios.patch(
        `http://localhost:3001/api/invoices/${invoiceId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );

      // Optimistic UI update
      setInvoices(prev => 
        prev.map(inv => 
          inv.id === invoiceId ? { ...inv, status: newStatus } : inv
        )
      );

      setSnackbar({
        open: true,
        severity: "success",
        message: `Invoice marked as ${newStatus.replace('_', ' ').toUpperCase()}`,
      });
    } catch (err) {
      console.error("Status update error:", err);
      setSnackbar({
        open: true,
        severity: "error",
        message: "Failed to update status. Please try again.",
      });
      // Revert optimistic update on error
      loadInvoices();
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3001/api/invoices", {
        withCredentials: true,
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setInvoices(data);
      setPage(0);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      if (err.response?.status === 401) {
        setSnackbar({
          open: true,
          severity: "warning",
          message: "Please log in as admin.",
        });
        navigate("/login");
      } else {
        setSnackbar({
          open: true,
          severity: "error",
          message: "Failed to load invoices. Check backend.",
        });
      }
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: Filter for waiting, partially_paid, or overdue
  const filteredInvoices = invoices.filter((inv) => {
    const status = inv.status?.toLowerCase();
    const amountDueNum = Number(inv.amount_due || 0);
    const isOverdue = inv.due_date && new Date(inv.due_date) < new Date() && amountDueNum > 0;
    return status === 'waiting_for_payment' || status === 'partially_paid' || isOverdue;
  });

  const sortedInvoices = [...filteredInvoices].sort((a, b) => 
    new Date(b.invoice_date) - new Date(a.invoice_date)
  );

  const paginatedInvoices = sortedInvoices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const goToDrafts = () => {
    navigate("/invoices/drafts");
  };

  const handleView = async (invoice) => {
    setSelectedInvoice(invoice);
    setOpenDialog(true);
    setFullInvoice(null);
    setLoadingDetail(true);
    try {
      const res = await axios.get(`http://localhost:3001/api/invoices/${invoice.id}`, {
        withCredentials: true,
      });
      setFullInvoice(res.data);
    } catch (err) {
      console.error("Error fetching full invoice:", err);
      setSnackbar({
        open: true,
        severity: "error",
        message: "Failed to load invoice details.",
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInvoice(null);
    setFullInvoice(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendReminder = async (invoiceId) => {
    setSendingReminderId(invoiceId);
    try {
      const res = await axios.post(
        `http://localhost:3001/api/reminders/payment/${invoiceId}`,
        {},
        { withCredentials: true }
      );
      setSnackbar({
        open: true,
        severity: "success",
        message: res.data?.message || "Payment reminder sent successfully!",
      });
      setTimeout(() => loadInvoices(), 1500);
    } catch (err) {
      console.error("Error sending payment reminder:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.status === 404
          ? "Reminder endpoint missing. Check server.js."
          : "Failed to send reminder.";
      setSnackbar({
        open: true,
        severity: "error",
        message: msg,
      });
    } finally {
      setSendingReminderId(null);
    }
  };

  const handleSnackbarClose = (_e, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((s) => ({ ...s, open: false }));
  };

const StatusChip = ({ status, amountDueNum = 0, isOverdue = false, amountPaid = 0 }) => {
  const getStatusConfig = () => {
    const statusLower = (status || '').toLowerCase().trim();

    // ✅ PRIORITY 1: PAID (amount_due = 0 OR status = 'paid')
    if (statusLower === 'paid' || amountDueNum === 0) {
      return { 
        label: 'PAID', 
        textColor: '#2e7d32', 
        borderColor: '#28a745',
        bgColor: '#d4edda'
      };
    }

    // ✅ PRIORITY 2: PARTIALLY PAID
    if (statusLower === 'partially_paid') {
      return { 
        label: 'PARTIAL', 
        textColor: '#f57c00', 
        borderColor: '#ff9800',
        bgColor: '#fff3cd'
      };
    }

    // ✅ PRIORITY 3: OVERDUE (overrides waiting)
    if (isOverdue) {
      return { 
        label: 'OVERDUE', 
        textColor: '#d32f2f', 
        borderColor: '#dc3545',
        bgColor: '#f8d7da'
      };
    }

    // ✅ PRIORITY 4: WAITING FOR PAYMENT
    if (statusLower === 'waiting_for_payment') {
      return { 
        label: 'WAITING', 
        textColor: '#1976d2', 
        borderColor: '#42a5f5',
        bgColor: '#cce7ff'
      };
    }

    // ✅ FALLBACK: DRAFT/UNKNOWN
    return { 
      label: 'DRAFT', 
      textColor: '#212121', 
      borderColor: '#9e9e9e',
      bgColor: '#f5f5f5'
    };
  };

  const config = getStatusConfig();

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 72,
        height: 32,
        px: 1.5,
        py: 0.5,
        borderRadius: 20,
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'UPPERCASE',
        color: config.textColor,
        bgcolor: config.bgColor,
        border: `2px solid ${config.borderColor}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        cursor: 'default',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }
      }}
    >
      {config.label}
    </Box>
  );
};



  useEffect(() => {
    loadInvoices();
  }, []);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9fa", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", p: 4 }}>
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography variant="h6" color="textSecondary">Loading active invoices...</Typography>
      </Box>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .invoice-print-content, .invoice-print-content * { visibility: visible !important; }
          .invoice-print-content { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; }
          .invoice-print-content button, .invoice-print-content .MuiButton-root, .invoice-print-content [class*="print"], .invoice-print-content svg, .invoice-print-content .MuiIconButton-root, .invoice-print-content .print-no-show { visibility: hidden !important; display: none !important; }
          .MuiDialog-paper, .MuiDialogTitle-root, .MuiDialogContent-root > *:not(.invoice-print-content) { visibility: hidden !important; }
          @page { margin: 1cm; size: A4; }
        }
      `}</style>

      <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9fa", py: 4, px: { xs: 1, md: 2 } }}>
        <Paper sx={{ bgcolor: "#42a5f5", color: "white", p: { xs: 2, md: 2.5 }, borderRadius: 2, mb: 3, position: "sticky", top: 0, zIndex: 10, boxShadow: "0 4px 20px rgba(66, 165, 245, 0.3)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton onClick={() => navigate("/dashboard")} sx={{ color: "white" }}><HomeIcon /></IconButton>
            <IconButton onClick={() => navigate(-1)} sx={{ color: "white" }}><ArrowBackIcon /></IconButton>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" fontWeight={700} sx={{ color: "white", fontSize: '1.4rem' }}>
                Active Invoices
              </Typography>
              <Typography sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
                {sortedInvoices.length} waiting/overdue invoices
              </Typography>
            </Box>
            
            <Button
              variant="outlined"
              onClick={goToDrafts}
              size="small"
              startIcon={<DraftsIcon />}
              sx={{ 
                fontWeight: 600, fontSize: '0.8rem', px: 2, mr: 1,
                borderRadius: 2, textTransform: "none",
                color: "white", borderColor: "rgba(255,255,255,0.5)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.2)", borderColor: "white" }
              }}
            >
              View Drafts
            </Button>
            
            <Button
              variant="contained"
              onClick={loadInvoices}
              size="small"
              sx={{ fontWeight: 600, textTransform: "none", borderRadius: 2, fontSize: '0.8rem', px: 2, boxShadow: "0 2px 8px rgb(97, 210, 255)" }}
              startIcon={<CircularProgress size={16} sx={{ opacity: 0.7 }} />}
            >
              Refresh
            </Button>
          </Box>
        </Paper>

        {/* ✅ UPDATED TABLE - NO CLIENT ID, STATUS DROPDOWN */}
        <Box sx={{ maxWidth: "100%", mx: "auto", overflowX: "auto" }}>
          <Paper sx={{ borderRadius: 2, border: "1px solid #e0e0e0", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", minWidth: 1000 }}>
            <TableContainer sx={{ maxHeight: 700 }}>
              <Table stickyHeader sx={{ minWidth: 1000 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8f9fa", height: 56 }}>
                    {["#", "Company", "Ref", "Date", "Amount", "Due", "Status", "Actions"].map((header) => (
                      <TableCell key={header} align={header === "Company" ? "left" : "center"} sx={{
                        border: "1.5px solid #e0e0e0", fontWeight: 700, fontSize: "0.8rem", color: "#212121",
                        py: 2, px: 1.2, backgroundColor: "#f8f9fa !important", whiteSpace: "nowrap",
                        position: "sticky", top: 0, zIndex: 2
                      }}>
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedInvoices.map((inv, idx) => {
                    const rowNumber = idx + 1 + (page * rowsPerPage);
                    const invoiceDate = inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString("en-ZA") : "";
                    const amount = inv.amount != null ? Number(inv.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
                    const amountDueNum = inv.amount_due != null ? Number(inv.amount_due) : 0;
                    const amountDue = amountDueNum.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const isPaid = inv.status?.toLowerCase() === "paid";
                    const isOverdue = inv.due_date && new Date(inv.due_date) < new Date() && amountDueNum > 0;

                    return (
                      <TableRow key={inv.id} sx={{
                        height: 64, bgcolor: amountDueNum === 0 ? "#f0f8f0" : "white",
                        borderBottom: "1.5px solid #e0e0e0", transition: "all 0.2s ease",
                        cursor: "default", "&:hover": { bgcolor: amountDueNum === 0 ? "#f0f8f0" : "#f8f9fa" }
                      }}>
                        <TableCell align="center" sx={{ border: "1.5px solid #e0e0e0", borderLeft: "none", fontWeight: 600, color: "#424242", fontSize: "0.85rem", width: 60, py: 1.5, px: 1 }}>{rowNumber}</TableCell>
                        <TableCell sx={{ border: "1.5px solid #e0e0e0", fontWeight: 500, color: "#212121", fontSize: "0.8rem", width: 160, py: 1.5, px: 1.2, overflow: "hidden", textOverflow: "ellipsis" }}>{inv.company_name || "-"}</TableCell>
                        <TableCell align="center" sx={{ border: "1.5px solid #e0e0e0", fontWeight: 500, color: "#616161", fontSize: "0.75rem", width: 80, py: 1.5, px: 1 }}>{inv.customer_reference || "-"}</TableCell>
                        <TableCell align="center" sx={{ border: "1.5px solid #e0e0e0", fontWeight: 500, color: "#424242", fontSize: "0.8rem", width: 90, py: 1.5, px: 1 }}>{invoiceDate}</TableCell>
                        <TableCell align="center" sx={{ border: "1.5px solid #e0e0e0", fontWeight: 700, color: "#1976d2", fontSize: "0.85rem", width: 100, py: 1.5, px: 1 }}>R{amount}</TableCell>
                        <TableCell align="center" sx={{ border: "1.5px solid #e0e0e0", fontWeight: 700, fontSize: "0.85rem", color: amountDueNum === 0 ? "#4caf50" : "#d32f2f", width: 100, py: 1.5, px: 1 }}>R{amountDue}</TableCell>
                        
                        {/* ✅ NEW STATUS DROPDOWN */}
                        <TableCell align="center" sx={{ border: "1.5px solid #e0e0e0", width: 120, py: 0.5, px: 0.5 }}>
                          <FormControl size="small" fullWidth>
                            <Select
                              value={inv.status || "waiting_for_payment"}
                              onChange={(e) => updateInvoiceStatus(inv.id, e.target.value)}
                              disabled={updatingStatusId === inv.id || isPaid}
                              sx={{ 
                                fontSize: "0.8rem", 
                                minHeight: 32,
                                "& .MuiSelect-select": {
                                  py: 0.5,
                                  display: "flex",
                                  alignItems: "center"
                                }
                              }}
                            >
                              <MenuItem value="waiting_for_payment">⏳ Waiting</MenuItem>
                              <MenuItem value="partially_paid">🟡 Partially Paid</MenuItem>
                              <MenuItem value="paid">✅ Paid</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        
                        <TableCell align="center" sx={{ border: "1.5px solid #e0e0e0", borderRight: "none", width: 140, py: 0.8, px: 0.5 }}>
                          <Box sx={{ display: "flex", gap: 0.3, justifyContent: "center", alignItems: "center" }}>
                            <IconButton onClick={(e) => { e.stopPropagation(); handleView(inv); }} size="small" title="View" sx={{ color: "#1976d2", border: "1px solid #1976d2", borderRadius: 1, height: 28, width: 28, "&:hover": { bgcolor: "#1976d2", color: "white" } }}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            {!isPaid && amountDueNum > 0 && (
                              <Button variant="outlined" size="small" startIcon={<NotificationsActiveIcon fontSize="small" />} onClick={(e) => { e.stopPropagation(); handleSendReminder(inv.id); }} disabled={sendingReminderId === inv.id} sx={{
                                fontSize: "0.7rem", fontWeight: 600, color: "#d32f2f", borderColor: "#d32f2f", textTransform: "none",
                                py: 0.3, px: 1, height: 28, minWidth: 72, "&:hover": { borderColor: "#b71c1c", bgcolor: "rgba(211, 47, 47, 0.04)" }, "&:disabled": { color: "#bdbdbd", borderColor: "#bdbdbd" }
                              }}>
                                {sendingReminderId === inv.id ? "..." : "Remind"}
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            {sortedInvoices.length > 10 && (
              <Box sx={{ p: 1.5, borderTop: "1.5px solid #e0e0e0", bgcolor: "#fafafa" }}>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={sortedInvoices.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                  sx={{
                    "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.8rem", color: "#424242" },
                    "& .MuiTablePagination-actions": { marginLeft: 0 }
                  }}
                />
              </Box>
            )}
          </Paper>

          {sortedInvoices.length === 0 && !loading && (
            <Paper sx={{ mt: 4, p: 6, textAlign: "center", borderRadius: 3, bgcolor: "#fafafa", border: "2px dashed #e0e0e0", maxWidth: 500, mx: "auto" }}>
              <Typography variant="h6" sx={{ color: "#666", mb: 2, fontSize: '1.1rem' }}>
                No waiting/overdue invoices found
              </Typography>
              <Typography color="textSecondary" sx={{ mb: 3, fontSize: '0.9rem' }}>
                All invoices are paid or check drafts page for unfinished invoices.
              </Typography>
              <Button variant="outlined" onClick={loadInvoices} sx={{ borderRadius: 2, px: 3, fontSize: '0.9rem', mr: 1 }}>Refresh</Button>
              <Button variant="contained" onClick={goToDrafts} startIcon={<DraftsIcon />} sx={{ borderRadius: 2, px: 3, fontSize: '0.9rem' }}>
                View Drafts
              </Button>
            </Paper>
          )}
        </Box>

        {/* Dialog & Snackbar - UNCHANGED */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: 12, maxHeight: "90vh" } }}>
          <DialogTitle sx={{ p: 3, borderBottom: "1px solid #e0e0e0", position: "sticky", top: 0, bgcolor: "white", zIndex: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#1a1a1a" }}>
                Invoice #{fullInvoice?.invoice_number || selectedInvoice?.invoice_number}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }} className="print-no-show">
                <Button variant="contained" size="small" startIcon={<PdfIcon />} onClick={handlePrint} sx={{ fontWeight: 600, bgcolor: "#1976d2", "&:hover": { bgcolor: "#1565c0" } }}>Print</Button>
                <IconButton onClick={handleCloseDialog} sx={{ color: "#666" }}><CloseIcon /></IconButton>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3, overflow: "auto" }}>
            {loadingDetail ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <CircularProgress />
                <Typography mt={2}>Loading invoice details...</Typography>
              </Box>
            ) : fullInvoice ? (
              <div className="invoice-print-content">
                <InvoicePrintView invoice={fullInvoice} />
              </div>
            ) : (
              <Typography color="error">Failed to load invoice details</Typography>
            )}
          </DialogContent>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default Invoices;
