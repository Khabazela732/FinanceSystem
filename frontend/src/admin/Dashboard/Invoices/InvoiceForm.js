import React, { useState, useCallback, useMemo, useEffect } from "react";
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
  Alert,
  CircularProgress,
  InputAdornment,
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
  Save as SaveIcon,
  Edit as EditIcon
} from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const mainBg = "#f8f9fa";
const primaryBlue = "#1976d2";
const darkText = "#1a1a1a";

const inputStyle = {
  mb: 2.5,
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    py: 1.75,
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

const InvoiceForm = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingInvoiceNumber, setLoadingInvoiceNumber] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    invoice_number: "",
    customer_reference: "",
    client_id: "",
    invoice_date: "",
    due_date: "",
    amount: "",
    amount_due: "",
    retainer_fee: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });
  const navigate = useNavigate();

  //LOAD EXISTING INVOICE FOR EDITING (Drafts work perfectly here)
  const loadInvoiceForEdit = useCallback(async (id) => {
    if (!id) return;
    
    setLoadingEdit(true);
    try {
      const res = await axios.get(`http://localhost:3001/api/invoices/${id}`, {
        withCredentials: true,
      });
      
      const invoice = res.data;
      setForm({
        company_name: invoice.company_name || "",
        invoice_number: invoice.invoice_number || "",
        customer_reference: invoice.customer_reference || "",
        client_id: invoice.client_id?.toString() || "",
        invoice_date: invoice.invoice_date ? new Date(invoice.invoice_date).toISOString().split('T')[0] : "",
        due_date: invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : "",
        amount: invoice.amount?.toString() || "",
        amount_due: invoice.amount_due?.toString() || "",
        retainer_fee: invoice.retainer_fee?.toString() || "",
      });
      
      setIsEditMode(true);
    } catch (err) {
      console.error("Error loading invoice:", err);
      setSnackbar({ open: true, severity: "error", message: "Failed to load invoice for editing" });
    } finally {
      setLoadingEdit(false);
    }
  }, []);

  useEffect(() => {
    if (editId) {
      loadInvoiceForEdit(editId);
    }
  }, [editId, loadInvoiceForEdit]);

  //GENERATE INVOICE NUMBER (NEW invoices only)
  const generateInvoiceNumber = useCallback(async () => {
    if (isEditMode) return;
    
    setLoadingInvoiceNumber(true);
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      
      const res = await axios.get("http://localhost:3001/api/invoices/number", {
        withCredentials: true
      });
      
      const seq = res.data?.number || Math.floor(Math.random() * 9999) + 1;
      const invoiceNum = `INV-${year}${month}${day}-${String(seq).padStart(4, '0')}`;
      
      setForm(prev => ({ ...prev, invoice_number: invoiceNum }));
    } catch (err) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const seq = Math.floor(1000 + Math.random() * 9000);
      const invoiceNum = `INV-${year}${month}${day}-${String(seq).padStart(4, '0')}`;
      setForm(prev => ({ ...prev, invoice_number: invoiceNum }));
    } finally {
      setLoadingInvoiceNumber(false);
    }
  }, [isEditMode]);

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
      setSnackbar({ open: true, severity: "error", message: msg });
      if (err?.response?.status === 401) {
        setTimeout(() => navigate("/login?return=/invoices/new"), 1500);
      }
    } finally {
      setLoadingClients(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchClients();
    if (!editId) {
      generateInvoiceNumber();
    }
  }, [fetchClients, generateInvoiceNumber, editId]);

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
    if (!form.invoice_number?.trim()) errs.invoice_number = "Invoice number required";
    if (!form.client_id) errs.client_id = "Client required";
    if (!form.invoice_date) errs.invoice_date = "Invoice date required";
    if (!form.due_date) errs.due_date = "Due date required";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      errs.amount = "Valid total amount required";
    if (!form.amount_due || isNaN(Number(form.amount_due)) || Number(form.amount_due) < 0)
      errs.amount_due = "Valid amount due required";
    if (form.retainer_fee && (isNaN(Number(form.retainer_fee)) || Number(form.retainer_fee) < 0))
      errs.retainer_fee = "Valid retainer fee required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  //PERFECT DRAFT/SENT PAYLOAD - MATCHES BACKEND EXPECTATIONS
  const createPayload = useCallback((status) => ({
    company_name: form.company_name?.trim() || "",
    invoice_number: form.invoice_number?.trim() || "",
    customer_reference: form.customer_reference?.trim() || null,
    client_id: parseInt(form.client_id) || 0,
    invoice_date: form.invoice_date || "",
    due_date: form.due_date || "",
    amount: parseFloat(form.amount) || 0,
    amount_due: parseFloat(form.amount_due) || 0,
    retainer_fee: parseFloat(form.retainer_fee) || 0,
    status: status  //draft or sent - PERFECT for DraftInvoices filter
  }), [form]);

  const submitInvoice = useCallback(async (status) => {
    if (!validate()) return;
    setSubmitting(true);

    try {
      const payload = createPayload(status);
      const cleanPayload = {
        ...payload,
        client_id: Number(payload.client_id),
        amount: Number(payload.amount),
        amount_due: Number(payload.amount_due),
        retainer_fee: Number(payload.retainer_fee)
      };

      let response;
      if (isEditMode && editId) {
        response = await axios.put(`http://localhost:3001/api/invoices/${editId}`, cleanPayload, {
          withCredentials: true,
          timeout: 10000
        });
        setSnackbar({ 
          open: true, 
          severity: "success", 
          message: `Invoice ${payload.invoice_number} updated as ${status}!` 
        });
      } else {
        response = await axios.post("http://localhost:3001/api/invoices", cleanPayload, {
          withCredentials: true,
          timeout: 120000
        });
        setSnackbar({ 
          open: true, 
          severity: "success", 
          message: `Invoice ${payload.invoice_number} ${status === "draft" ? "saved as draft" : "sent successfully"}!` 
        });
      }

      setTimeout(() => {
        setSnackbar(prev => ({ ...prev, open: false }));
        navigate("/invoices");
      }, 2500);
    } catch (err) {
      console.error("Invoice submit error:", err.response?.data || err);
      setSnackbar({ 
        open: true, 
        severity: "error", 
        message: err?.response?.data?.message || "Failed to save invoice" 
      });
    } finally {
      setSubmitting(false);
    }
  }, [form, navigate, validate, createPayload, isEditMode, editId]);

  const handleSaveDraft = useCallback((e) => {
    e.preventDefault();
    submitInvoice("draft");  //SENDS status: "draft" → DraftInvoices shows it!
  }, [submitInvoice]);

  const handleCreateAndSend = useCallback((e) => {
    e.preventDefault();
    submitInvoice("sent");   //SENDS status: "sent" → Goes to All Invoices
  }, [submitInvoice]);

  const clientsCount = useMemo(() => clients.length, [clients]);
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Fade in timeout={600}>
      <Box sx={{ flexGrow: 1, p: { xs: 3, md: 4 }, mt: "72px", bgcolor: mainBg, minHeight: "100vh" }}>
        <Box sx={{ mb: 4 }}>
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              fontWeight: 600, 
              color: primaryBlue, 
              fontSize: "0.95rem",
              px: 0,
              textTransform: "none", 
              "&:hover": { bgcolor: `${primaryBlue}10` }
            }}
          >
            Back to invoices
          </Button>
        </Box>

        <Paper 
          elevation={3} 
          sx={{ 
            maxWidth: 600, 
            mx: "auto", 
            borderRadius: 3, 
            overflow: "hidden",
            boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
            border: "1px solid", 
            borderColor: "divider"
          }}
        >
          <Box sx={{ px: { xs: 3, md: 4 }, py: 3, bgcolor: "white", borderBottom: "1px solid", borderColor: "divider" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: 2, 
                bgcolor: `${primaryBlue}12`, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center" 
              }}>
                {isEditMode ? (
                  <EditIcon sx={{ fontSize: 24, color: "#ff9800" }} />
                ) : (
                  <MonetizationIcon sx={{ fontSize: 24, color: primaryBlue }} />
                )}
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ color: darkText }}>
                  {isEditMode ? "Edit Invoice" : "New Invoice"}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {isEditMode 
                    ? `Editing invoice ${form.invoice_number || '...'}` 
                    : "Create professional tax invoice"
                  }
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ px: { xs: 3, md: 4 }, py: 4 }}>
            {(loadingClients || loadingEdit) ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={28} sx={{ mr: 2, color: primaryBlue }} />
                <Typography>{loadingEdit ? "Loading invoice..." : "Loading clients..."}</Typography>
              </Box>
            ) : (
              <>
                <FormControl fullWidth error={!!errors.client_id} sx={{ mb: 2.5 }}>
                  <InputLabel>Client Company *</InputLabel>
                  <Select
                    name="client_id"
                    value={form.client_id}
                    onChange={handleChange}
                    label="Client Company"
                    sx={inputStyle}
                  >
                    <MenuItem value="" disabled sx={{ fontStyle: "italic" }}>
                      Select a client company
                    </MenuItem>
                    {clients.map((client) => (
                      <MenuItem key={client.id} value={client.id} sx={{ py: 1.5 }}>
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
  onChange={undefined}  // ✅ Completely disables typing
  error={!!errors.invoice_number}
  helperText={errors.invoice_number || `Generated today: ${new Date().toLocaleDateString('en-ZA')}`}
  fullWidth
  disabled={!isEditMode}  // ✅ Fully disabled when not in edit mode
  InputProps={{
    readOnly: true,  // ✅ Extra layer of protection
    startAdornment: (
      <>
        <InputAdornment position="start">
          <DocumentIcon sx={{ color: primaryBlue }} />
        </InputAdornment>
        {loadingInvoiceNumber && (
          <CircularProgress size={20} sx={{ ml: 2, color: primaryBlue }} />
        )}
      </>
    )
  }}
  sx={{
    ...inputStyle,
    "& .MuiOutlinedInput-root": {
      ...inputStyle["& .MuiOutlinedInput-root"],
      bgcolor: loadingInvoiceNumber ? `${primaryBlue}04` : !isEditMode ? `${primaryBlue}02` : "white",  // ✅ Visual cue when disabled
      opacity: !isEditMode ? 0.7 : 1
    },
    "& .MuiInputLabel-root": {
      color: !isEditMode ? `${primaryBlue}600` : "inherit"
    }
  }}
/>

{!isEditMode && (
  <Button
    fullWidth
    variant="contained"
    onClick={generateInvoiceNumber}
    disabled={loadingInvoiceNumber}
    sx={{
      mb: 2.5,
      height: 48,
      borderRadius: 2,
      fontSize: "0.9rem",
      fontWeight: 600,
      textTransform: "none",
      bgcolor: primaryBlue,
      "&:hover": { bgcolor: `${primaryBlue}800` },
      boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)"
    }}
  >
    {loadingInvoiceNumber ? "Generating..." : "🔄 Generate Invoice Number"}
  </Button>
)}


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

                <TextField
                  label="Retainer Fee (Optional)"
                  name="retainer_fee"
                  type="number"
                  value={form.retainer_fee}
                  onChange={handleChange}
                  error={!!errors.retainer_fee}
                  helperText={errors.retainer_fee || "Amount held as retainer (leave blank if none)"}
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><MonetizationIcon sx={{ color: primaryBlue }} /></InputAdornment>,
                    inputProps: { step: "0.01" }
                  }}
                  sx={inputStyle}
                />
              </>
            )}
          </Box>

          <Divider />
          <Box sx={{ px: { xs: 3, md: 4 }, py: 3, bgcolor: "grey.50", display: "flex", gap: 2, justifyContent: "flex-end", alignItems: "center" }}>
            <Chip 
              label={loadingClients ? 'Loading...' : `${clientsCount} Clients`} 
              color="primary" 
              variant="outlined" 
              size="small"
              sx={{ fontWeight: 600 }} 
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                onClick={handleSaveDraft}
                disabled={submitting || loadingClients || loadingEdit}
                variant="outlined"
                size="medium"
                startIcon={<SaveIcon />}
                sx={{
                  minWidth: 140, 
                  borderRadius: 2, 
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": { borderColor: primaryBlue, bgcolor: `${primaryBlue}08` }
                }}
              >
                {submitting ? "Saving..." : isEditMode ? "💾 Update Draft" : "💾 Save Draft"}
              </Button>
              
              <Button
                onClick={handleCreateAndSend}
                disabled={submitting || loadingClients || loadingEdit || hasErrors}
                variant="contained"
                size="medium"
                startIcon={<SendIcon />}
                sx={{
                  minWidth: 160, 
                  borderRadius: 2, 
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  textTransform: "none",
                  px: 3,
                  bgcolor: primaryBlue,
                  boxShadow: "0 8px 32px rgba(25,118,210,0.3)",
                  "&:hover": { bgcolor: "#1565c0" },
                  "&:disabled": { bgcolor: "grey.300" }
                }}
              >
                {submitting ? (
                  <>
                    <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
                    {isEditMode ? "Updating..." : "Sending..."}
                  </>
                ) : (
                  isEditMode ? "📧 Update & Send" : "📧 Send Invoice"
                )}
              </Button>
            </Box>
          </Box>
        </Paper>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={(e, reason) => {
            if (reason === "clickaway") return;
            setSnackbar(prev => ({ ...prev, open: false }));
          }}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
};

export default InvoiceForm;

