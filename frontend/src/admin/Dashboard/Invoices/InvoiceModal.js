import React, { useState } from "react";
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Modal, 
  Alert, 
  CircularProgress,
  Divider 
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 450,
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflowY: 'auto'
};

const InvoiceModal = ({ open, client, invoiceData, onClose }) => {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSend = async () => {
    if (!comment.trim()) {
      setError("Please add a comment before sending the invoice.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_name: invoiceData.company_name || client.company,
          invoice_number: invoiceData.invoice_number,
          customer_reference: invoiceData.customer_reference || "General Services",
          client_id: client.id,
          invoice_date: invoiceData.invoice_date || new Date().toISOString().split('T')[0],
          due_date: invoiceData.due_date,
          amount: invoiceData.amount,
          amount_due: invoiceData.amount_due || invoiceData.amount,
          status: "waiting_for_payment",
          comment: comment.trim()
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        // Auto redirect after 2 seconds
        setTimeout(() => {
          navigate("/admin/invoices");
        }, 2000);
      } else {
        setError(result.message || "Failed to create and send invoice");
      }
    } catch (err) {
      console.error("Invoice send error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Modal open={open} onClose={onClose}>
        <Box sx={modalStyle}>
          <Typography variant="h5" color="success.main" align="center" mb={3} gutterBottom>
            Invoice Sent Successfully
          </Typography>
          <Alert severity="success" sx={{ mb: 2 }}>
            Invoice #{invoiceData?.invoice_number} has been created and emailed to {client.company}.
          </Alert>
          <Typography variant="body2" color="text.secondary" align="center" mb={3}>
            Redirecting to invoices list...
          </Typography>
          <CircularProgress size={24} sx={{ display: 'block', mx: 'auto' }} />
        </Box>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" component="h2" mb={3} gutterBottom>
          Send New Invoice
        </Typography>

        {/* Invoice Summary */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" mb={1.5}>
            Invoice Details
          </Typography>
          <Alert severity="info" variant="outlined" sx={{ fontSize: '0.875rem' }}>
            <strong>Client:</strong> {client.company || client.name}<br />
            <strong>Invoice #:</strong> {invoiceData.invoice_number}<br />
            <strong>Amount:</strong> R {Number(invoiceData.amount || 0).toLocaleString()}<br />
            <strong>Due Date:</strong> {invoiceData.due_date ? new Date(invoiceData.due_date).toLocaleDateString('en-ZA') : 'Not set'}
          </Alert>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Comment Field */}
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Message to Client (Required)"
          variant="outlined"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Enter your message to the client. This will be included with the invoice email."
          disabled={loading}
          error={!!error}
          helperText={error || "Provide payment instructions or terms for your client."}
          sx={{ mb: 3 }}
        />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleSend}
            disabled={!comment.trim() || loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? "Creating Invoice..." : "Create & Send Invoice"}
          </Button>
        </Box>

        {/* Helper Text */}
        <Typography 
          variant="caption" 
          display="block" 
          sx={{ 
            mt: 2, 
            color: 'text.secondary', 
            textAlign: 'center', 
            width: '100%',
            fontStyle: 'italic'
          }}
        >
          This will create the invoice record and send a PDF copy to the client via email.
        </Typography>
      </Box>
    </Modal>
  );
};

export default InvoiceModal;
