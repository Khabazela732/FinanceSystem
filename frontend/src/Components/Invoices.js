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
} from "@mui/icons-material";
import InvoicePrintView from "./InvoicePrintView";

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedInvoice, setSelectedInvoice] = useState(null); // row data
  const [fullInvoice, setFullInvoice] = useState(null); // joined data for template
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
      if (err.response && err.response.status === 401) {
        alert("You are not authorized. Please log in as admin first.");
        navigate("/login");
      } else {
        alert(
          "Failed to load invoices. Check backend logs and browser console."
        );
      }
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  // open dialog and load full invoice for template
  const handleView = async (invoice) => {
    setSelectedInvoice(invoice);
    setOpenDialog(true);
    setFullInvoice(null);
    setLoadingDetail(true);
    try {
      const res = await axios.get(
        `http://localhost:3001/api/invoices/${invoice.id}/full`,
        { withCredentials: true }
      );
      setFullInvoice(res.data);
    } catch (err) {
      console.error("Error fetching full invoice:", err);
      alert("Failed to load full invoice details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInvoice(null);
    setFullInvoice(null);
  };

  // print current invoice template
  const handleDownload = () => {
    window.print();
  };

  // send payment reminder email for an invoice
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
        message: res.data?.message || "Payment reminder email sent.",
      });
    } catch (err) {
      console.error("Error sending payment reminder:", err);
      const msg =
        err.response?.data?.message ||
        "Failed to send payment reminder. Check backend logs.";
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
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f8f9fa",
        pt: 6,
        pb: 8,
        px: { xs: 2, sm: 4, md: 6 },
      }}
    >
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
          "&:hover": {
            bgcolor: "rgba(0,0,0,0.05)",
            boxShadow: 3,
          },
        }}
      >
        ← Back
      </Button>

      {/* Header */}
      <Typography
        variant="h3"
        fontWeight={900}
        color="#111"
        textAlign="center"
        gutterBottom
      >
        Invoices Management
      </Typography>
      <Typography
        variant="h6"
        color="text.secondary"
        textAlign="center"
        mb={6}
      >
        View, download, and send payment reminders for all created invoices.
      </Typography>

      {/* Invoice Table Container */}
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
        <Typography
          variant="h5"
          fontWeight={700}
          mb={3}
          color="#222"
          sx={{ userSelect: "none" }}
        >
          All Invoices
        </Typography>

        {loading ? (
          <Box sx={{ textAlign: "center", py: 12 }}>
            <CircularProgress size={40} color="primary" />
          </Box>
        ) : invoices.length === 0 ? (
          <Typography
            variant="h6"
            textAlign="center"
            color="textSecondary"
            py={8}
          >
            No invoices found. Try creating one from “Create Invoice”.
          </Typography>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
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
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((inv, idx) => {
                  const invoiceDate = inv.invoice_date
                    ? new Date(inv.invoice_date).toLocaleDateString()
                    : "";
                  const dueDate = inv.due_date
                    ? new Date(inv.due_date).toLocaleDateString()
                    : "";
                  const amount =
                    inv.amount != null ? Number(inv.amount).toFixed(2) : "0.00";
                  const amountDue =
                    inv.amount_due != null
                      ? Number(inv.amount_due).toFixed(2)
                      : amount;

                  const isPaid =
                    inv.status && inv.status.toLowerCase() === "paid";

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
                      <TableCell align="center" sx={{ fontSize: "0.9rem" }}>
                        {inv.company_name || "-"}
                      </TableCell>
                      <TableCell align="center" sx={{ fontSize: "0.9rem" }}>
                        {inv.invoice_number}
                      </TableCell>
                      <TableCell align="center" sx={{ fontSize: "0.9rem" }}>
                        {inv.customer_reference || "-"}
                      </TableCell>
                      <TableCell align="center" sx={{ fontSize: "0.9rem" }}>
                        {inv.client_id}
                      </TableCell>
                      <TableCell align="center" sx={{ fontSize: "0.9rem" }}>
                        {invoiceDate}
                      </TableCell>
                      <TableCell align="center" sx={{ fontSize: "0.9rem" }}>
                        {dueDate}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: "#1976d2",
                        }}
                      >
                        R {amount}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: "#d32f2f",
                        }}
                      >
                        R {amountDue}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: isPaid ? "#388e3c" : "#757575",
                          textTransform: "capitalize",
                        }}
                      >
                        {inv.status}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          gap: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleView(inv)}
                          sx={{ fontWeight: 700, color: "#111" }}
                        >
                          View
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleView(inv)}
                          sx={{ fontWeight: 700 }}
                        >
                          Download
                        </Button>
                        {!isPaid && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<NotificationsActiveIcon />}
                            onClick={() => handleSendReminder(inv.id)}
                            disabled={sendingReminderId === inv.id}
                            sx={{
                              fontWeight: 700,
                              color: "#d32f2f",
                              borderColor: "#d32f2f",
                              textTransform: "none",
                              "&:hover": {
                                borderColor: "#b71c1c",
                                bgcolor: "rgba(211, 47, 47, 0.04)",
                              },
                            }}
                          >
                            {sendingReminderId === inv.id
                              ? "Sending..."
                              : "Send reminder"}
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

      {/* Dialog for viewing invoice details with shared template */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, boxShadow: 12, maxHeight: "90vh" },
        }}
      >
        <DialogTitle
          sx={{
            p: 4,
            borderBottom: "1px solid #e0e0e0",
            position: "sticky",
            top: 0,
            bgcolor: "white",
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: "#1a1a1a" }}
            >
              Invoice #
              {fullInvoice?.invoice_number ||
                selectedInvoice?.invoice_number}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleDownload}
                sx={{ fontWeight: 600 }}
              >
                Download / Print
              </Button>
              <IconButton onClick={handleCloseDialog} sx={{ color: "#666" }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 4 }}>
          {loadingDetail ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : fullInvoice ? (
            <InvoicePrintView invoice={fullInvoice} />
          ) : (
            <Typography>No invoice selected</Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar for reminder feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Invoices;
