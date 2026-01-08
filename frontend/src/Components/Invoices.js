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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Close as CloseIcon,
  NotificationsActive as NotificationsActiveIcon,
  Visibility as VisibilityIcon,
  PictureAsPdf as PdfIcon,
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

  const navigate = useNavigate();

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3001/api/invoices", {
        withCredentials: true,
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setInvoices(data);
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
      const msg = err.response?.data?.message || 
        err.response?.status === 404 ? 
        "Reminder endpoint missing. Check server.js." :
        "Failed to send reminder.";
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
      {/* ✅ BULLETPROOF PRINT CSS - Hides ALL invoice content buttons */}
      <style>{`
        @media print {
          /* Hide EVERYTHING except invoice content */
          body * { visibility: hidden !important; }
          
          /* Show ONLY invoice content */
          .invoice-print-content, 
          .invoice-print-content * { 
            visibility: visible !important; 
          }
          
          /* Position invoice perfectly */
          .invoice-print-content { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
          }
          
          /* ✅ FORCE HIDE ALL PRINT/DOWNLOAD BUTTONS IN INVOICE CONTENT */
          .invoice-print-content button,
          .invoice-print-content .MuiButton-root,
          .invoice-print-content [class*="print"],
          .invoice-print-content [class*="download"],
          .invoice-print-content [class*="Print"],
          .invoice-print-content [class*="Download"],
          .invoice-print-content svg,
          .invoice-print-content .MuiIconButton-root,
          .invoice-print-content .print-no-show { 
            visibility: hidden !important; 
            display: none !important; 
          }
          
          /* Hide dialog UI elements */
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

      <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9fa", pt: 6, pb: 8, px: { xs: 2, sm: 4, md: 6 } }}>
        {/* Back Button */}
        <Button
          onClick={() => navigate(-1)}
          variant="outlined"
          sx={{
            mb: 4,
            borderRadius: 99,
            px: 2,
            py: 1,
            textTransform: "none",
            fontWeight: 600,
            color: "#333",
            boxShadow: 1,
            "&:hover": { bgcolor: "rgba(0,0,0,0.05)", boxShadow: 3 },
          }}
        >
          ← Back
        </Button>

        {/* Header */}
        <Typography variant="h3" fontWeight={900} color="#111" textAlign="center" gutterBottom>
          Invoices Management
        </Typography>
        <Typography variant="h6" color="text.secondary" textAlign="center" mb={6}>
          View and send payment reminders for all created invoices.
        </Typography>

        {/* Invoice Table - UNCHANGED */}
        <Paper
          elevation={4}
          sx={{
            maxWidth: 1200,
            mx: "auto",
            bgcolor: "white",
            borderRadius: 4,
            boxShadow: "0 12px 36px rgba(0,0,0,0.12)",
            p: { xs: 3, md: 5 },
          }}
        >
          <Typography variant="h5" fontWeight={700} mb={3} color="#222" sx={{ userSelect: "none" }}>
            All Invoices ({invoices.length})
          </Typography>

          {loading ? (
            <Box sx={{ textAlign: "center", py: 12 }}>
              <CircularProgress size={40} color="primary" />
              <Typography mt={2}>Loading invoices...</Typography>
            </Box>
          ) : invoices.length === 0 ? (
            <Typography variant="h6" textAlign="center" color="textSecondary" py={8}>
              No invoices found. Try creating one from "Create Invoice".
            </Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 600, overflow: "auto" }}>
              <Table stickyHeader sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    {[
                      "Company",
                      "Document No",
                      "Customer Ref",
                      "Client ID",
                      "Date",
                      "Due Date",
                      "Total Amount",
                      "Amount Due",
                      "Status",
                      "Actions",
                    ].map((header) => (
                      <TableCell
                        key={header}
                        align="center"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          color: "#222",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((inv, idx) => {
                    const invoiceDate = inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString("en-ZA") : "";
                    const dueDate = inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-ZA") : "";
                    const amount = inv.amount != null ? Number(inv.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
                    const amountDueNum = inv.amount_due != null ? Number(inv.amount_due) : 0;
                    const amountDue = amountDueNum.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                    const isPaid = inv.status?.toLowerCase() === "paid";
                    const isOverdue = inv.due_date && new Date(inv.due_date) < new Date() && amountDueNum > 0;

                    return (
                      <TableRow
                        key={inv.id}
                        sx={{
                          bgcolor: idx % 2 === 0 ? "white" : "#fafafa",
                          "&:hover": {
                            bgcolor: "#e3f2fd",
                            cursor: "pointer",
                            transition: "background-color 0.3s ease",
                          },
                        }}
                      >
                        <TableCell align="center" sx={{ fontSize: "0.9rem" }}>{inv.company_name || "-"}</TableCell>
                        <TableCell align="center" sx={{ fontSize: "0.9rem" }}>{inv.invoice_number}</TableCell>
                        <TableCell align="center" sx={{ fontSize: "0.9rem" }}>{inv.customer_reference || "-"}</TableCell>
                        <TableCell align="center" sx={{ fontSize: "0.9rem" }}>{inv.client_id}</TableCell>
                        <TableCell align="center" sx={{ fontSize: "0.9rem" }}>{invoiceDate}</TableCell>
                        <TableCell align="center" sx={{ fontSize: "0.9rem", color: isOverdue ? "#d32f2f" : "inherit", fontWeight: isOverdue ? 600 : "inherit" }}>
                          {dueDate}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: "0.9rem", fontWeight: 600, color: "#1976d2" }}>R {amount}</TableCell>
                        <TableCell align="center" sx={{ fontSize: "0.9rem", fontWeight: 600, color: amountDueNum === 0 ? "#4caf50" : "#d32f2f" }}>
                          R {amountDue}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: "0.9rem", fontWeight: 600, color: isPaid ? "#4caf50" : isOverdue ? "#d32f2f" : "#757575", textTransform: "capitalize" }}>
                          {inv.status || "draft"}
                        </TableCell>
                        <TableCell align="center" sx={{ display: "flex", justifyContent: "center", gap: 0.5, flexWrap: "wrap", py: 1 }}>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(inv);
                            }}
                            title="View Details"
                            size="small"
                            sx={{ color: "#1976d2", "&:hover": { bgcolor: "#e3f2fd" } }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          {!isPaid && amountDueNum > 0 && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<NotificationsActiveIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendReminder(inv.id);
                              }}
                              disabled={sendingReminderId === inv.id}
                              sx={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "#d32f2f",
                                borderColor: "#d32f2f",
                                textTransform: "none",
                                py: 0.5,
                                px: 1.5,
                                minWidth: "auto",
                                "&:hover": {
                                  borderColor: "#b71c1c",
                                  bgcolor: "rgba(211, 47, 47, 0.04)",
                                },
                              }}
                            >
                              {sendingReminderId === inv.id ? "Sending..." : "Reminder"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* ✅ ONLY THIS Print Button - Dialog Header */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: 12,
              maxHeight: "90vh",
              width: "100%",
              maxWidth: "900px",
            },
          }}
        >
          <DialogTitle
            sx={{
              p: 3,
              borderBottom: "1px solid #e0e0e0",
              position: "sticky",
              top: 0,
              bgcolor: "white",
              zIndex: 1,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#1a1a1a" }}>
                Invoice #{fullInvoice?.invoice_number || selectedInvoice?.invoice_number}
              </Typography>
              {/* ✅ KEEP THIS Print Button - HIDDEN during print */}
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
    </>
  );
};

export default Invoices;
