import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  Divider,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import InvoicePrintView from "./InvoicePrintView";

// Colors aligned with Admin Dashboard (Material primary blue)
const primaryBlue = "#1976d2";
const primaryBlueDark = "#115293";
const sidebarBg = primaryBlue;
const sidebarText = "#ffffff";
const hoverBg = "rgba(255,255,255,0.16)";

const navButtonStyle = (active) => ({
  padding: "12px 16px",
  borderRadius: 2,
  backgroundColor: active ? "rgba(255,255,255,0.22)" : "transparent",
  color: sidebarText,
  fontWeight: active ? 700 : 600,
  fontSize: "0.9rem",
  cursor: "pointer",
  border: "1px solid transparent",
  textAlign: "left",
  width: "100%",
  mb: 1.5,
  transition: "all 0.2s ease",
  justifyContent: "flex-start",
  textTransform: "none",
  "&:hover": {
    backgroundColor: hoverBg,
    borderColor: "rgba(255,255,255,0.35)",
    transform: "translateX(4px)",
  },
  "&:active": {
    transform: "translateX(2px)",
  },
});

function ClientProofUpload({ clientId }) {
  const [file, setFile] = useState(null);
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage("");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file before uploading.");
      return;
    }
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("proofFile", file);
      formData.append("clientId", clientId);
      formData.append("comment", comment);

      const res = await fetch("http://localhost:3001/api/proofs/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✓ Proof of payment uploaded successfully.");
        setFile(null);
        setComment("");
      } else {
        setMessage(`✗ ${data.message || "Upload failed."}`);
      }
    } catch {
      setMessage("✗ Upload error, please try again.");
    }
    setUploading(false);
  };

  return (
    <Box
      component="form"
      onSubmit={handleUpload}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
        color: sidebarText,
        p: 2,
        bgcolor: "rgba(21,101,192,0.2)",
        borderRadius: 2,
        border: "1px solid rgba(255,255,255,0.25)",
      }}
    >
      <Button
        variant="contained"
        component="label"
        sx={{
          textTransform: "none",
          bgcolor: "rgba(255,255,255,0.16)",
          color: sidebarText,
          fontWeight: 600,
          borderRadius: 1,
          px: 2,
          py: 1.5,
          boxShadow: "none",
          "&:hover": {
            bgcolor: "rgba(255,255,255,0.26)",
            boxShadow: "none",
          },
        }}
      >
        📎 Select Proof File (PDF/JPG/PNG)
        <input
          type="file"
          hidden
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
        />
      </Button>

      {file && (
        <Typography
          variant="body2"
          sx={{
            overflowWrap: "break-word",
            bgcolor: "rgba(255,255,255,0.16)",
            p: 1,
            borderRadius: 1,
            fontSize: "0.8rem",
          }}
        >
          📄 {file.name}
        </Typography>
      )}

      <TextField
        label="Comment (optional)"
        variant="filled"
        multiline
        minRows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        InputProps={{
          sx: {
            bgcolor: "rgba(255,255,255,0.16)",
            color: sidebarText,
            borderRadius: 1,
            "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
          },
        }}
        InputLabelProps={{ style: { color: sidebarText, opacity: 0.9 } }}
        sx={{
          "& .MuiFilledInput-root": { borderRadius: 1 },
          "& .MuiInputLabel-root.Mui-focused": { color: sidebarText },
        }}
      />

      <Button
        type="submit"
        disabled={uploading}
        variant="outlined"
        sx={{
          borderRadius: "999px",
          borderColor: "rgba(255,255,255,0.85)",
          color: sidebarText,
          bgcolor: "transparent",
          fontWeight: 600,
          fontSize: "0.875rem",
          cursor: uploading ? "not-allowed" : "pointer",
          alignSelf: "stretch",
          py: 1.2,
          "&:hover": {
            borderColor: "#ffffff",
            bgcolor: "rgba(255,255,255,0.2)",
          },
          "&:disabled": { opacity: 0.5 },
        }}
      >
        {uploading ? "⏳ Uploading..." : "🚀 Upload Proof"}
      </Button>

      {message && (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: message.includes("✓") ? "#c8e6c9" : "#ffcccb",
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}

export default function ClientDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [loadingClient, setLoadingClient] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [activeView, setActiveView] = useState("overview");

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [fullInvoice, setFullInvoice] = useState(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchClient() {
      try {
        const res = await fetch("http://localhost:3001/api/clients");
        const data = await res.json();
        const found = Array.isArray(data)
          ? data.find((c) => String(c.id) === String(id))
          : null;
        setClient(found || null);
      } catch {
        setClient(null);
      } finally {
        setLoadingClient(false);
      }
    }
    if (id) fetchClient();
  }, [id]);

  useEffect(() => {
    async function fetchInvoices() {
      setLoadingInvoices(true);
      try {
        const res = await fetch(
          `http://localhost:3001/api/clients/${id}/invoices`
        );
        if (!res.ok) {
          throw new Error("Failed to load invoices");
        }
        const data = await res.json();
        setInvoices(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching client invoices:", err);
        setInvoices([]);
      } finally {
        setLoadingInvoices(false);
      }
    }
    if (id) fetchInvoices();
  }, [id]);

  const handleViewInvoice = async (invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceDialogOpen(true);
    setFullInvoice(null);
    try {
      const res = await fetch(
        `http://localhost:3001/api/clients/me/invoices/${invoice.id}?clientId=${id}`
      );
      if (!res.ok) throw new Error("Failed to load invoice details");
      const data = await res.json();
      setFullInvoice(data);
    } catch (err) {
      console.error("Error loading full invoice:", err);
    }
  };

  const handleCloseInvoiceDialog = () => {
    setInvoiceDialogOpen(false);
    setSelectedInvoice(null);
    setFullInvoice(null);
  };

  const renderOverview = () => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "2fr 1.3fr" },
        gap: 3,
      }}
    >
      <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 2 }}>
        <Typography variant="h6" gutterBottom fontWeight={700}>
          👤 Client Overview
        </Typography>
        {loadingClient ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : !client ? (
          <Typography color="error" sx={{ textAlign: "center", py: 4 }}>
            ❌ Client record not found
          </Typography>
        ) : (
          <Box
            component="dl"
            sx={{
              display: "grid",
              gridTemplateColumns: "140px 1fr",
              gap: 2,
              fontSize: "1rem",
              color: "#333",
              mt: 2,
            }}
          >
            <Typography
              component="dt"
              fontWeight={600}
              color="textSecondary"
            >
              🏢 Company:
            </Typography>
            <Typography component="dd" fontWeight={500}>
              {client.company}
            </Typography>

            <Typography
              component="dt"
              fontWeight={600}
              color="textSecondary"
            >
              👤 Contact:
            </Typography>
            <Typography component="dd" fontWeight={500}>
              {client.fullname} {client.lastname}
            </Typography>

            <Typography
              component="dt"
              fontWeight={600}
              color="textSecondary"
            >
              📧 Email:
            </Typography>
            <Typography component="dd" fontWeight={500}>
              {client.email}
            </Typography>

            <Typography
              component="dt"
              fontWeight={600}
              color="textSecondary"
            >
              📞 Phone:
            </Typography>
            <Typography component="dd" fontWeight={500}>
              {client.tel || "-"}
            </Typography>

            <Typography
              component="dt"
              fontWeight={600}
              color="textSecondary"
            >
              📱 Cell:
            </Typography>
            <Typography component="dd" fontWeight={500}>
              {client.cell || "-"}
            </Typography>
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 2 }}>
        <Typography variant="h6" gutterBottom fontWeight={700}>
          📍 Company Address
        </Typography>
        {loadingClient ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : !client ? (
          <Typography sx={{ textAlign: "center", py: 4 }}>
            No address available
          </Typography>
        ) : (
          <Typography
            sx={{
              whiteSpace: "pre-line",
              fontSize: "1rem",
              color: "#333",
              lineHeight: 1.6,
              bgcolor: "grey.50",
              p: 2,
              borderRadius: 1,
              fontWeight: 500,
            }}
          >
            {client.street}
            {"\n"}
            {client.town}
            {"\n"}
            {client.province} {client.postalcode}
          </Typography>
        )}
      </Paper>
    </Box>
  );

  const renderInvoiceDetails = () => (
    <Dialog
      open={invoiceDialogOpen}
      onClose={handleCloseInvoiceDialog}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          Invoice #{fullInvoice?.invoice_number || selectedInvoice?.invoice_number}
        </Typography>
        <IconButton onClick={handleCloseInvoiceDialog}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
        {fullInvoice ? (
          <InvoicePrintView invoice={fullInvoice} />
        ) : (
          <CircularProgress sx={{ display: "block", mx: "auto", mt: 4 }} />
        )}
      </DialogContent>
    </Dialog>
  );

  const renderInvoices = () => (
    <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 2 }}>
      <Typography variant="h6" gutterBottom fontWeight={700}>
        💰 Invoices ({invoices.length})
      </Typography>
      {loadingInvoices ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      ) : invoices.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, color: "textSecondary" }}>
          <Typography variant="h6" gutterBottom>
            No invoices found
          </Typography>
          <Typography variant="body2">
            Invoices will appear here when created
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            mt: 2,
          }}
        >
          {invoices.map((invoice) => (
            <Paper
              key={invoice.id}
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: "grey.50",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                "&:hover": {
                  boxShadow: 3,
                  transform: "translateY(-2px)",
                  transition: "all 0.2s ease",
                },
              }}
              onClick={() => handleViewInvoice(invoice)}
            >
              <Box>
                <Typography fontWeight={600}>
                  #{invoice.invoice_number}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {invoice.status} • Due{" "}
                  {new Date(invoice.due_date).toLocaleDateString()}
                </Typography>
              </Box>
              <Typography variant="h6" color="primary">
                R {Number(invoice.amount_due).toFixed(2)}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}
      {renderInvoiceDetails()}
    </Paper>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#e3f2fd",
        display: "flex",
        justifyContent: "center",
        p: { xs: 2, md: 4 },
      }}
    >
      <Box
        sx={{
          bgcolor: "#fff",
          borderRadius: 4,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          maxWidth: 1300,
          width: "100%",
          display: "flex",
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* Sidebar in blue like admin */}
        <Box
          sx={{
            width: { xs: 260, md: 280 },
            bgcolor: sidebarBg,
            color: sidebarText,
            display: "flex",
            flexDirection: "column",
            p: { xs: 3, md: 4 },
            minHeight: "100vh",
          }}
        >
          <Box
            sx={{
              mb: 5,
              pb: 3,
              borderBottom: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
              Internship Success
            </Typography>
            <Typography
              variant="body2"
              sx={{ opacity: 0.9, fontWeight: 500 }}
            >
              Client Dashboard
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Button
              onClick={() => setActiveView("overview")}
              sx={navButtonStyle(activeView === "overview")}
            >
              🏠 Dashboard
            </Button>
            <Button
              onClick={() => setActiveView("invoices")}
              sx={navButtonStyle(activeView === "invoices")}
            >
              💰 View Invoices
            </Button>
            {/* Updated button: pass client id to update page */}
            <Button
              onClick={() =>
                navigate(`/clients/update-company?id=${id}`, {
                  state: { clientId: id },
                })
              }
              sx={navButtonStyle(false)}
            >
              ✏️ Update Company Details
            </Button>
            <Button
              onClick={() => navigate("/")}
              sx={navButtonStyle(false)}
            >
              ← Back to Home
            </Button>
          </Box>

          <Divider
            sx={{ borderColor: "rgba(255,255,255,0.25)", my: 3 }}
          />

          {client && (
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ mb: 2, opacity: 0.95 }}
              >
                📤 Upload Proof
              </Typography>
              <ClientProofUpload clientId={client.id} />
            </Box>
          )}

          <Button
            onClick={() => navigate("/clients/login")}
            variant="contained"
            sx={{
              bgcolor: "#ffffff",
              color: primaryBlueDark,
              fontWeight: 700,
              borderRadius: 999,
              py: 1.5,
              px: 3,
              fontSize: "0.95rem",
              boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
              "&:hover": {
                bgcolor: "#fafafa",
                boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
              },
            }}
          >
            🚪 Logout
          </Button>
        </Box>

        {/* Main content */}
        <Box sx={{ flexGrow: 1, p: { xs: 3, md: 5 } }}>
          <Typography
            variant="h4"
            fontWeight={800}
            gutterBottom
            sx={{
              color: primaryBlueDark,
              mb: 4,
            }}
          >
            {client ? client.company : "Client Dashboard"}
          </Typography>
          {activeView === "overview" ? renderOverview() : renderInvoices()}
        </Box>
      </Box>
    </Box>
  );
}
