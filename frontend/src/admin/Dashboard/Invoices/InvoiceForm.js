//  Dynamic status based on button clicked!
import React, { useState, useCallback, useMemo, memo } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormHelperText,
  Paper,
  Snackbar,
  CircularProgress,
  InputAdornment,
  Card,
  Divider,
  Chip,
  Fade
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Description as DocumentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  MonetizationOn as MonetizationIcon,
  AccountBalanceWallet as WalletIcon,
  Send as SendIcon,
  Save as SaveIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const mainBg = "#f8f9fa";
const primaryBlue = "#1976d2";
const darkText = "#1a1a1a";

const inputStyle = {
  mb: 2.5,
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    py: 1.5,
    fontSize: "0.95rem",
    bgcolor: "white",
    "& .MuiOutlinedInput-notchedOutline": {
      borderWidth: 1.5,
      borderColor: "divider",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: primaryBlue,
      borderWidth: 1.5,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: primaryBlue,
      borderWidth: 1.5,
      boxShadow: `0 0 0 2px ${primaryBlue}12`,
    },
  },
  "& .MuiInputLabel-root": {
    fontWeight: 600,
    color: darkText,
    fontSize: "0.9rem",
  },
  "& .MuiInputLabel-shrink": {
    transform: "translate(14px, -6px) scale(0.75)",
  },
};

const InvoiceForm = memo(() => {
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [form, setForm] = useState({
    company_name: "",
    invoice_number: "",
    customer_reference: "",
    client_id: "",
    invoice_date: "",
    due_date: "",
    amount: "",
    amount_due: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const navigate = useNavigate();

  const fetchClients = useCallback(async () => {
    try {
      setLoadingClients(true);
      const res = await axios.get("http://localhost:3001/api/clients", {
        withCredentials: true
      });
      setClients(res.data || []);
    } catch (err) {
      console.error("Clients fetch error:", err);
      const msg = err?.response?.status === 401 
        ? "Please login to create invoices" 
        : "Failed to load clients.";
      setSnackbarMsg(msg);
      setSnackbarOpen(true);
      if (err?.response?.status === 401) {
        setTimeout(() => navigate("/login?return=/invoices/new"), 1500);
      }
    } finally {
      setLoadingClients(false);
    }
  }, [navigate]);

  React.useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    if (name === "client_id" && value) {
      const selectedClient = clients.find((c) => c.id === parseInt(value, 10));
      if (selectedClient) {
        setForm((prev) => ({
          ...prev,
          client_id: value,
          company_name: selectedClient.company || "",
        }));
        return;
      }
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }, [clients]);

  const validate = useCallback(() => {
    const errs = {};
    if (!form.company_name?.trim()) errs.company_name = "Company name required";
    if (!form.invoice_number?.trim()) errs.invoice_number = "Document no required";
    if (!form.client_id) errs.client_id = "Client required";
    if (!form.invoice_date) errs.invoice_date = "Invoice date required";
    if (!form.due_date) errs.due_date = "Due date required";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      errs.amount = "Valid total amount required";
    if (!form.amount_due || isNaN(Number(form.amount_due)) || Number(form.amount_due) < 0)
      errs.amount_due = "Valid amount due required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  // FIXED: Dynamic status from button!
  const createPayload = useCallback((status) => ({
    company_name: form.company_name?.trim() || "",
    invoice_number: form.invoice_number?.trim() || "",
    customer_reference: form.customer_reference?.trim() || null,
    client_id: parseInt(form.client_id) || 0,
    invoice_date: form.invoice_date || "",
    due_date: form.due_date || "",
    amount: parseFloat(form.amount) || 0,
    amount_due: parseFloat(form.amount_due) || 0,
    status: status  //  DYNAMIC: "draft" OR "sent"
  }), [form]);

  // FIXED: Pass status parameter
  const submitInvoice = useCallback(async (status) => {
    if (!validate()) return;
    setSubmitting(true);

    try {
      const payload = createPayload(status);  // ✅ Gets correct status!
      
      const cleanPayload = {
        ...payload,
        client_id: Number(payload.client_id),
        amount: Number(payload.amount),
        amount_due: Number(payload.amount_due)
      };

      console.log("Sending payload:", cleanPayload);

      await axios.post("http://localhost:3001/api/invoices", cleanPayload, {
        withCredentials: true,
        timeout: 10000
      });

      // CORRECT MESSAGE BASED ON BUTTON
      const message = status === "draft" 
        ? "Invoice saved as draft!" 
        : "Invoice sent successfully! Client notified via email.";
      
      setSnackbarMsg(message);
      setSnackbarOpen(true);
      setTimeout(() => {
        setSnackbarOpen(false);
        navigate("/invoices");
      }, 1800);
    } catch (err) {
      console.error("🚨 Invoice submit error:", err.response?.data || err);
      const serverMsg = err?.response?.data?.message || "Failed to create invoice";
      setSnackbarMsg(serverMsg);
      setSnackbarOpen(true);
      
      if (err?.response?.status === 401) {
        setTimeout(() => navigate("/login?return=/invoices/new"), 1500);
      }
    } finally {
      setSubmitting(false);
    }
  }, [form, navigate, validate, createPayload]);

  const handleSaveDraft = useCallback((e) => {
    e.preventDefault();
    submitInvoice("draft");  // ✅ Sends "draft"
  }, [submitInvoice]);

  const handleCreateAndSend = useCallback((e) => {
    e.preventDefault();
    submitInvoice("sent");   // ✅ Sends "sent" 
  }, [submitInvoice]);

  const clientsCount = useMemo(() => clients.length, [clients]);

  return (
    <Fade in timeout={600}>
      <Box sx={{ flexGrow: 1, p: { xs: 2.5, sm: 3, md: 4 }, mt: "72px", bgcolor: mainBg, minHeight: "100vh" }}>
        {/* Back Button */}
        <Box sx={{ mb: 2 }}>
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              fontWeight: 600, color: primaryBlue, fontSize: 14, px: 0,
              textTransform: "none", "&:hover": { bgcolor: `${primaryBlue}10`, color: `${primaryBlue}E0` }
            }}
          >
            Back to invoices
          </Button>
        </Box>

        <Card elevation={4} sx={{ maxWidth: 720, mx: "auto", borderRadius: 3, boxShadow: "0 12px 40px rgba(0,0,0,0.12)", border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
          {/* Header */}
          <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2.5, bgcolor: "white", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: "30%", bgcolor: `${primaryBlue}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MonetizationIcon sx={{ fontSize: 22, color: primaryBlue }} />
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h5" fontWeight={700} sx={{ color: darkText, lineHeight: 1.2 }}>
                New tax invoice
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
                Create professional invoices for your clients
              </Typography>
            </Box>
          </Box>

          {/* 🚀 FIXED: Two separate handlers, no form submit */}
          <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2.5 }}>
            {loadingClients ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                <Typography>Loading clients...</Typography>
              </Box>
            ) : (
              <>
                <FormControl fullWidth error={!!errors.client_id} sx={{ mb: 2.5 }}>
                  <InputLabel sx={{ color: darkText, fontWeight: 600, fontSize: "0.95rem" }}>Client Company *</InputLabel>
                  <Select
                    name="client_id"
                    value={form.client_id}
                    onChange={handleChange}
                    label="Client Company"
                    sx={inputStyle}
                  >
                    <MenuItem value="" disabled sx={{ fontStyle: "italic" }}>Select a client company</MenuItem>
                    {clients.map((client) => (
                      <MenuItem key={client.id} value={client.id} sx={{ py: 1.25 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <BusinessIcon sx={{ color: primaryBlue, fontSize: 20 }} />
                          <Box>
                            <Typography fontWeight={600}>{client.company}</Typography>
                            <Typography variant="body2" color="text.secondary">{client.email}</Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.client_id && <FormHelperText sx={{ color: "#d32f2f", fontWeight: 500 }}>{errors.client_id}</FormHelperText>}
                </FormControl>

                <TextField
                  label="Invoice Number *"
                  name="invoice_number"
                  value={form.invoice_number}
                  onChange={handleChange}
                  required
                  error={!!errors.invoice_number}
                  helperText={errors.invoice_number}
                  placeholder="INV-2025-001"
                  fullWidth
                  InputProps={{ startAdornment: <InputAdornment position="start"><DocumentIcon sx={{ color: primaryBlue }} /></InputAdornment> }}
                  sx={inputStyle}
                />

                <TextField
                  label="Customer Reference"
                  name="customer_reference"
                  value={form.customer_reference}
                  onChange={handleChange}
                  placeholder="Optional PO/Reference"
                  fullWidth
                  InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: primaryBlue }} /></InputAdornment> }}
                  sx={inputStyle}
                />

                <TextField
                  label="Invoice Date *"
                  name="invoice_date"
                  type="date"
                  value={form.invoice_date}
                  onChange={handleChange}
                  required
                  error={!!errors.invoice_date}
                  helperText={errors.invoice_date}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><CalendarIcon sx={{ color: primaryBlue }} /></InputAdornment> }}
                  sx={inputStyle}
                />

                <TextField
                  label="Due Date *"
                  name="due_date"
                  type="date"
                  value={form.due_date}
                  onChange={handleChange}
                  required
                  error={!!errors.due_date}
                  helperText={errors.due_date}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><CalendarIcon sx={{ color: primaryBlue }} /></InputAdornment> }}
                  sx={inputStyle}
                />

                <TextField
                  label="Total Amount (incl. VAT) *"
                  name="amount"
                  type="number"
                  value={form.amount}
                  onChange={handleChange}
                  required
                  error={!!errors.amount}
                  helperText={errors.amount}
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><MonetizationIcon sx={{ color: primaryBlue }} /></InputAdornment>,
                    inputProps: { step: "0.01" }
                  }}
                  sx={inputStyle}
                />

                <TextField
                  label="Amount Due *"
                  name="amount_due"
                  type="number"
                  value={form.amount_due}
                  onChange={handleChange}
                  required
                  error={!!errors.amount_due}
                  helperText={errors.amount_due}
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><WalletIcon sx={{ color: primaryBlue }} /></InputAdornment>,
                    inputProps: { step: "0.01" }
                  }}
                  sx={inputStyle}
                />
              </>
            )}
          </Box>

          <Divider />
          <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2, bgcolor: "grey.50", display: "flex", gap: 2, justifyContent: "flex-end", alignItems: "center" }}>
            <Chip label={loadingClients ? 'Loading...' : `${clientsCount} Clients Available`} color="primary" variant="outlined" size="small" sx={{ fontWeight: 600 }} />
            <Box sx={{ display: "flex", gap: 1.5 }}>
              {/* 🚀 ✅ Save Draft Button */}
              <Button
                onClick={handleSaveDraft}
                disabled={submitting || loadingClients}
                variant="outlined"
                size="medium"
                startIcon={<SaveIcon />}
                sx={{
                  minWidth: 140, borderRadius: 2, fontSize: 14, fontWeight: 600,
                  color: darkText, borderColor: "text.secondary", textTransform: "none",
                  "&:hover": { borderColor: primaryBlue, bgcolor: `${primaryBlue}08`, color: primaryBlue }
                }}
              >
                {submitting ? "Saving..." : "💾 Save Draft"}
              </Button>
              
              {/* 🚀 ✅ Send Invoice Button */}
              <Button
                onClick={handleCreateAndSend}
                disabled={submitting || loadingClients}
                variant="contained"
                size="medium"
                startIcon={<SendIcon />}
                sx={{
                  minWidth: 160, borderRadius: 2, fontSize: 14, fontWeight: 700,
                  textTransform: "none", px: 3,
                  bgcolor: `linear-gradient(135deg, ${primaryBlue} 0%, #1565c0 100%)`,
                  boxShadow: "0 8px 32px rgba(25, 118, 210, 0.4)",
                  "&:hover": { bgcolor: primaryBlue, background: `linear-gradient(135deg, ${primaryBlue} 0%, #0d47a1 100%)` }
                }}
              >
                {submitting ? (
                  <>
                    <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
                    Sending...
                  </>
                ) : (
                  "📧 Send Invoice"
                )}
              </Button>
            </Box>
          </Box>
        </Card>

        <Snackbar
          open={snackbarOpen}
          onClose={() => setSnackbarOpen(false)}
          autoHideDuration={4000}
          message={snackbarMsg}
          sx={{ "& .MuiSnackbarContent-root": { bgcolor: primaryBlue } }}
        />
      </Box>
    </Fade>
  );
});

InvoiceForm.displayName = "InvoiceForm";
export default InvoiceForm;
