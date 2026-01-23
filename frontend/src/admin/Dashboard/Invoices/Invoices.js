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
  Chip,
  TablePagination,  // ✅ ADDED Pagination
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
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });
  // ✅ PAGINATION STATE
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const navigate = useNavigate();

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3001/api/invoices", {
        withCredentials: true,
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setInvoices(data);
      setPage(0); // Reset to first page
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

  useEffect(() => {
    loadInvoices();
  }, []);

  // ✅ PAGINATION HANDLERS
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter and sort invoices for pagination
  const sortedInvoices = [...invoices].sort((a, b) => 
    new Date(b.invoice_date) - new Date(a.invoice_date)
  );

  const paginatedInvoices = sortedInvoices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .invoice-print-content, 
          .invoice-print-content * { 
            visibility: visible !important; 
          }
          .invoice-print-content { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
          }
          .invoice-print-content button,
          .invoice-print-content .MuiButton-root,
          .invoice-print-content [class*="print"],
          .invoice-print-content svg,
          .invoice-print-content .MuiIconButton-root,
          .invoice-print-content .print-no-show { 
            visibility: hidden !important; 
            display: none !important; 
          }
          .MuiDialog-paper,
          .MuiDialogTitle-root,
          .MuiDialogContent-root > *:not(.invoice-print-content) {
            visibility: hidden !important;
          }
          @page { 
            margin: 1cm; 
            size: A4;
          }
        }
      `}</style>

      <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9fa", py: 4, px: { xs: 2, md: 4 } }}>
        {/* ✅ NOTIFICATIONS-STYLE HEADER BAR */}
        <Paper 
          sx={{ 
            bgcolor: "#1976d2", 
            color: "white", 
            p: { xs: 2, md: 3 }, 
            borderRadius: 0,
            mb: 4,
            position: "sticky",
            top: 0,
            zIndex: 100
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton onClick={() => navigate("/dashboard")} sx={{ color: "white" }}>
              <HomeIcon />
            </IconButton>
            <IconButton onClick={() => navigate(-1)} sx={{ color: "white" }}>
              <ArrowBackIcon />
            </IconButton>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" fontWeight={700} sx={{ color: "white" }}>
                Invoices Management
              </Typography>
              <Typography sx={{ opacity: 0.9 }}>
                {invoices.length} total invoices • {sortedInvoices.length - paginatedInvoices.length} on other pages
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              onClick={loadInvoices}
              sx={{ 
                fontWeight: 600, 
                textTransform: "none", 
                borderRadius: 2,
                boxShadow: "0 2px 8px rgb(97, 210, 255)",
              }}
              startIcon={<CircularProgress size={20} sx={{ opacity: 0.7 }} />}
            >
              Refresh
            </Button>
          </Box>
        </Paper>

        <Box sx={{ maxWidth: 1400, mx: "auto" }}>
          {/* ✅ ENTERPRISE TABLE WITH SAME STYLE */}
          <Paper sx={{ 
            borderRadius: 2, 
            border: "1px solid #e0e0e0", 
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
          }}>
            <TableContainer sx={{ maxHeight: 700 }}>
              <Table stickyHeader sx={{ minWidth: 1200 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8f9fa", height: 64 }}>
                    {[
                      "#",
                      "Company Name",
                      "Client Reference", 
                      "Client ID",
                      "Date",
                      "Amount",
                      "Amount Due",
                      "Status",
                      "Actions"
                    ].map((header) => (
                      <TableCell
                        key={header}
                        align={header === "Company Name" ? "left" : "center"}
                        sx={{
                          fontWeight: 700,
                          fontSize: "1rem",
                          color: "#212121",
                          py: 3,
                          borderBottom: "3px solid #e0e0e0",
                          backgroundColor: "#f8f9fa !important",
                          whiteSpace: "nowrap",
                        }}
                      >
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
                      <TableRow
                        key={inv.id}
                        sx={{
                          height: 72,
                          bgcolor: "white",
                          borderBottom: "1px solid #f0f0f0",
                          transition: "none",
                          cursor: "pointer",
                          "&:hover": { bgcolor: "#f8f9fa" },
                        }}
                      >
                        <TableCell align="center" sx={{ fontWeight: 600, color: "#424242", width: 80 }}>
                          {rowNumber}
                        </TableCell>
                        
                        <TableCell sx={{ fontWeight: 500, color: "#212121", fontSize: "0.95rem", maxWidth: 250 }}>
                          {inv.company_name || "-"}
                        </TableCell>
                        
                        <TableCell align="center" sx={{ fontWeight: 500, color: "#616161", fontSize: "0.9rem" }}>
                          {inv.customer_reference || "-"}
                        </TableCell>
                        
                        <TableCell align="center" sx={{ fontWeight: 600, color: "#424242", fontSize: "0.9rem" }}>
                          {inv.client_id}
                        </TableCell>
                        
                        <TableCell align="center" sx={{ fontWeight: 500, color: "#424242", fontSize: "0.9rem" }}>
                          {invoiceDate}
                        </TableCell>
                        
                        <TableCell align="center" sx={{ fontWeight: 700, color: "#1976d2", fontSize: "1rem" }}>
                          R {amount}
                        </TableCell>
                        
                        <TableCell align="center" sx={{ 
                          fontWeight: 700, 
                          fontSize: "1rem", 
                          color: amountDueNum === 0 ? "#4caf50" : "#d32f2f" 
                        }}>
                          R {amountDue}
                        </TableCell>
                        
                        <TableCell align="center">
                          <Chip
                            label={inv.status || "draft"}
                            size="small"
                            color={
                              inv.status?.toLowerCase() === "sent" 
                                ? "success" 
                                : inv.status?.toLowerCase() === "paid" 
                                ? "success" 
                                : isOverdue 
                                ? "error" 
                                : "default"
                            }
                            sx={{
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              textTransform: "capitalize",
                              height: 32,
                            }}
                          />
                        </TableCell>
                        
                        <TableCell align="center" sx={{ py: 1 }}>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleView(inv);
                              }}
                              title="View Details"
                              size="small"
                              sx={{ 
                                color: "#1976d2", 
                                "&:hover": { bgcolor: "rgba(25, 118, 210, 0.08)" }
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            {!isPaid && amountDueNum > 0 && (
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<NotificationsActiveIcon fontSize="small" />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSendReminder(inv.id);
                                }}
                                disabled={sendingReminderId === inv.id}
                                sx={{
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  color: "#d32f2f",
                                  borderColor: "#d32f2f",
                                  textTransform: "none",
                                  py: 0.5,
                                  px: 1.5,
                                  height: 36,
                                  minWidth: 90,
                                  "&:hover": {
                                    borderColor: "#b71c1c",
                                    bgcolor: "rgba(211, 47, 47, 0.04)",
                                  },
                                  "&:disabled": {
                                    color: "#bdbdbd",
                                    borderColor: "#bdbdbd",
                                  }
                                }}
                              >
                                {sendingReminderId === inv.id ? "Sending..." : "Reminder"}
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

            {/* ✅ PAGINATION - SAME AS NOTIFICATIONS */}
            {sortedInvoices.length > 10 && (
              <Box sx={{ p: 2, borderTop: "1px solid #e0e0e0", bgcolor: "#fafafa" }}>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={sortedInvoices.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  sx={{
                    "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                      fontSize: "0.85rem",
                      color: "#424242",
                    }
                  }}
                />
              </Box>
            )}
          </Paper>

          {/* ✅ EMPTY STATE */}
          {sortedInvoices.length === 0 && !loading && (
            <Paper sx={{ 
              mt: 4, 
              p: 8, 
              textAlign: "center", 
              borderRadius: 3, 
              bgcolor: "#fafafa",
              border: "2px dashed #e0e0e0",
              maxWidth: 600,
              mx: "auto"
            }}>
              <Typography variant="h5" sx={{ color: "#666", mb: 2 }}>
                No invoices found
              </Typography>
              <Typography color="textSecondary" sx={{ mb: 4 }}>
                Create invoices from the dashboard to manage them here.
              </Typography>
              <Button 
                variant="outlined" 
                onClick={loadInvoices}
                sx={{ borderRadius: 2, px: 4 }}
              >
                Refresh
              </Button>
            </Paper>
          )}

          {/* DIALOG & SNACKBAR - UNCHANGED */}
          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: 12, maxHeight: "90vh" } }}>
            <DialogTitle sx={{ p: 3, borderBottom: "1px solid #e0e0e0", position: "sticky", top: 0, bgcolor: "white", zIndex: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#1a1a1a" }}>
                  Invoice #{fullInvoice?.invoice_number || selectedInvoice?.invoice_number}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }} className="print-no-show">
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PdfIcon />}
                    onClick={handlePrint}
                    sx={{
                      fontWeight: 600,
                      bgcolor: "#1976d2",
                      "&:hover": { bgcolor: "#1565c0" },
                    }}
                  >
                    Print
                  </Button>
                  <IconButton onClick={handleCloseDialog} sx={{ color: "#666" }}>
                    <CloseIcon />
                  </IconButton>
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

          <Snackbar
            open={snackbar.open}
            autoHideDuration={5000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </>
  );
};

export default Invoices;
