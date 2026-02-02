import React, { useEffect, useState, useMemo, useCallback } from "react";
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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  PictureAsPdf as PdfIcon,
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Drafts as DraftsIcon,
} from "@mui/icons-material";
import InvoicePrintView from "./InvoicePrintView";


const DraftInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [fullInvoice, setFullInvoice] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const navigate = useNavigate();

  // 🔥 DATABASE-LEVEL DRAFTS ONLY
  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ BACKEND FILTER - Only fetches DRAFTS from database
      const res = await axios.get("http://localhost:3001/api/invoices?status=draft", {
        withCredentials: true,
      });
      
      const data = Array.isArray(res.data) ? res.data : [];

      // ✅ CLIENT-SIDE SAFETY CHECK - Double verify drafts
      const draftsOnly = data.filter((inv) => {
        const status = inv.status?.toString().toLowerCase().trim();
        return status === 'draft' || status?.includes('draft');
      });

      setInvoices(draftsOnly);
      setPage(0);
    } catch (err) {
      console.error("Load error:", err);
      if (err.response?.status === 401) {
        setSnackbar({ open: true, severity: "warning", message: "Please log in as admin." });
        navigate("/login");
      } else {
        setSnackbar({ open: true, severity: "error", message: "Failed to load draft invoices." });
      }
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ✅ SORT BY MOST RECENT
  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.invoice_date || a.created_at || 0);
      const dateB = new Date(b.updated_at || b.invoice_date || b.created_at || 0);
      return dateB - dateA;
    });
  }, [invoices]);

  const paginatedInvoices = sortedInvoices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleEditDraft = useCallback((invoice) => {
    navigate(`/invoices/new?edit=${invoice.id}`);
  }, [navigate]);

const handleDeleteDraft = useCallback(async (invoiceId) => {
  if (!window.confirm('Delete this draft permanently?')) return;
  setDeletingId(invoiceId);
  try {
    // Function that supports the /api/drafts/:id endpoint
    await axios.delete(`http://localhost:3001/api/drafts/${invoiceId}`, { 
      withCredentials: true 
    });
    setSnackbar({ open: true, severity: "success", message: "Draft deleted successfully!" });
    setTimeout(() => loadInvoices(), 1000);
  } catch (err) {
    setSnackbar({ open: true, severity: "error", message: "Failed to delete draft." });
  } finally {
    setDeletingId(null);
  }
}, [loadInvoices]);


  const handleView = useCallback(async (invoice) => {
    setSelectedInvoice(invoice);
    setOpenDialog(true);
    setFullInvoice(null);
    setLoadingDetail(true);
    try {
      const res = await axios.get(`http://localhost:3001/api/invoices/${invoice.id}`, { 
        withCredentials: true 
      });
      setFullInvoice(res.data);
    } catch (err) {
      setSnackbar({ open: true, severity: "error", message: "Failed to load invoice details." });
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedInvoice(null);
    setFullInvoice(null);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleSnackbarClose = useCallback((_e, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((s) => ({ ...s, open: false }));
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: "100vh", 
        bgcolor: "background.default", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center", 
        p: 4 
      }}>
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          Loading draft invoices...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .invoice-print-content, .invoice-print-content * { visibility: visible !important; }
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
          @page { margin: 1cm; size: A4; }
        }
      `}</style>

      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4, px: { xs: 2, md: 3 } }}>
        {/* 🔵 HEADER */}
        <Paper sx={{ 
          bgcolor: "primary.main", 
          color: "white", 
          p: { xs: 2, md: 3 }, 
          borderRadius: 2, 
          mb: 4, 
          boxShadow: 3 
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton onClick={() => navigate("/dashboard")} sx={{ color: "white" }}>
              <HomeIcon />
            </IconButton>
            <IconButton onClick={() => navigate("/invoices")} sx={{ color: "white" }}>
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.5rem", md: "1.75rem" } }}>
                Draft Invoices
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {sortedInvoices.length} draft invoice{sortedInvoices.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            <Button
              variant="contained"
              href="/invoices/new"
              size="medium"
              startIcon={<DraftsIcon />}
              sx={{ 
                fontWeight: 600, 
                textTransform: "none", 
                borderRadius: 2, 
                px: 3,
                boxShadow: 2
              }}
            >
              New Draft
            </Button>
            <Button
              variant="outlined"
              onClick={loadInvoices}
              size="medium"
              sx={{ 
                fontWeight: 600, 
                textTransform: "none", 
                borderRadius: 2, 
                px: 3,
                color: "white",
                borderColor: "rgba(255,255,255,0.6)",
                "&:hover": { 
                  bgcolor: "rgba(255,255,255,0.1)",
                  borderColor: "white"
                }
              }}
            >
              Refresh
            </Button>
          </Box>
        </Paper>

        {/* 📋 DRAFTS TABLE */}
        <Box sx={{ maxWidth: "100%", mx: "auto", overflowX: "auto" }}>
          <Paper sx={{ 
            borderRadius: 2, 
            border: "1px solid", 
            borderColor: "divider", 
            overflow: "hidden", 
            boxShadow: 1,
            minWidth: 1300 
          }}>
            <TableContainer sx={{ maxHeight: 700 }}>
              <Table stickyHeader sx={{ minWidth: 1300 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.50", height: 56 }}>
                    {["#", "Company", "Ref", "Client ID", "Date", "Amount", "Due", "Status", "Actions"].map((header) => (
                      <TableCell 
                        key={header} 
                        align={header === "Company" ? "left" : "center"} 
                        sx={{
                          borderBottom: "2px solid",
                          borderColor: "divider",
                          fontWeight: 700, 
                          fontSize: "0.85rem", 
                          color: "text.primary",
                          py: 2.5, 
                          px: 2,
                          whiteSpace: "nowrap",
                          position: "sticky", 
                          top: 0, 
                          zIndex: 2,
                          bgcolor: "grey.50"
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
                    const amount = Number(inv.amount || 0).toLocaleString("en-ZA", { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    });
                    const amountDue = Number(inv.amount_due || 0).toLocaleString("en-ZA", { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    });

                    return (
                      <TableRow 
                        key={inv.id} 
                        sx={{
                          height: 72, 
                          bgcolor: "background.paper",
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          transition: "all 0.2s ease",
                          cursor: "default", 
                          "&:hover": { bgcolor: "action.hover" }
                        }}
                      >
                        <TableCell align="center" sx={{ border: "1px solid", borderColor: "divider", fontWeight: 600, color: "text.primary", fontSize: "0.9rem", width: 70, py: 2 }}>
                          {rowNumber}
                        </TableCell>
                        <TableCell sx={{ border: "1px solid", borderColor: "divider", fontWeight: 500, color: "text.primary", fontSize: "0.85rem", width: 180, py: 2, px: 2 }}>
                          {inv.company_name || "-"}
                        </TableCell>
                        <TableCell align="center" sx={{ border: "1px solid", borderColor: "divider", fontWeight: 500, color: "text.secondary", fontSize: "0.8rem", width: 90, py: 2 }}>
                          {inv.customer_reference || "-"}
                        </TableCell>
                        <TableCell align="center" sx={{ border: "1px solid", borderColor: "divider", fontWeight: 600, color: "text.primary", fontSize: "0.85rem", width: 100, py: 2 }}>
                          {inv.client_id || "-"}
                        </TableCell>
                        <TableCell align="center" sx={{ border: "1px solid", borderColor: "divider", fontWeight: 500, color: "text.primary", fontSize: "0.85rem", width: 110, py: 2 }}>
                          {invoiceDate}
                        </TableCell>
                        <TableCell align="center" sx={{ border: "1px solid", borderColor: "divider", fontWeight: 700, color: "primary.main", fontSize: "0.9rem", width: 120, py: 2 }}>
                          R {amount}
                        </TableCell>
                        <TableCell align="center" sx={{ border: "1px solid", borderColor: "divider", fontWeight: 700, fontSize: "0.9rem", color: "text.primary", width: 120, py: 2 }}>
                          R {amountDue}
                        </TableCell>
                        <TableCell align="center" sx={{ border: "1px solid", borderColor: "divider", width: 100, py: 1.5 }}>
                          <Box sx={{
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            minWidth: 75, 
                            height: 32, 
                            px: 2, 
                            py: 0.5, 
                            borderRadius: 2,
                            fontSize: '0.75rem', 
                            fontWeight: 700, 
                            textTransform: 'uppercase',
                            color: 'warning.main', 
                            bgcolor: 'warning.lighter',
                            border: `1px solid`,
                            borderColor: "warning.main"
                          }}>
                            DRAFT
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ border: "1px solid", borderColor: "divider", width: 200, py: 1 }}>
                          <Box sx={{ display: "flex", gap: 1, justifyContent: "center", alignItems: "center" }}>
                            <IconButton 
                              onClick={(e) => { e.stopPropagation(); handleEditDraft(inv); }} 
                              size="small" 
                              title="Edit Draft" 
                              sx={{ 
                                color: "primary.main",
                                border: "1px solid",
                                borderColor: "primary.main",
                                borderRadius: 1, 
                                height: 36, 
                                width: 36, 
                                "&:hover": { bgcolor: "primary.main", color: "white" } 
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              onClick={(e) => { e.stopPropagation(); handleView(inv); }} 
                              size="small" 
                              title="View" 
                              sx={{ 
                                color: "info.main",
                                border: "1px solid",
                                borderColor: "info.main",
                                borderRadius: 1, 
                                height: 36, 
                                width: 36, 
                                "&:hover": { bgcolor: "info.main", color: "white" } 
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              onClick={(e) => { e.stopPropagation(); handleDeleteDraft(inv.id); }} 
                              size="small" 
                              title="Delete Draft" 
                              disabled={deletingId === inv.id} 
                              sx={{ 
                                color: "error.main",
                                border: "1px solid",
                                borderColor: "error.main",
                                borderRadius: 1, 
                                height: 36, 
                                width: 36, 
                                "&:hover": { bgcolor: "error.main", color: "white" }, 
                                "&:disabled": { color: "action.disabled", borderColor: "action.disabled" } 
                              }}
                            >
                              {deletingId === inv.id ? <CircularProgress size={18} /> : <DeleteIcon fontSize="small" />}
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {paginatedInvoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} sx={{ py: 8, textAlign: "center" }}>
                        <DraftsIcon sx={{ fontSize: 64, color: "action.disabled", mb: 2 }} />
                        <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                          No draft invoices
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                          Drafts from the invoice form will appear here once saved as "Draft"
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {sortedInvoices.length > 10 && (
              <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={sortedInvoices.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(e) => { 
                    setRowsPerPage(parseInt(e.target.value, 10)); 
                    setPage(0); 
                  }}
                  sx={{
                    "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { 
                      fontSize: "0.85rem", 
                      color: "text.secondary" 
                    },
                    "& .MuiTablePagination-actions": { marginLeft: 0 }
                  }}
                />
              </Box>
            )}
          </Paper>
        </Box>

        {/* 👁️ VIEW DIALOG */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="md" 
          fullWidth 
          PaperProps={{ sx: { borderRadius: 3, boxShadow: 8, maxHeight: "90vh" } }}
        >
          <DialogTitle sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h5" fontWeight={700}>
                Invoice #{fullInvoice?.invoice_number || selectedInvoice?.invoice_number}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }} className="print-no-show">
                <Button 
                  variant="contained" 
                  size="small" 
                  startIcon={<PdfIcon />} 
                  onClick={handlePrint}
                >
                  Print
                </Button>
                <IconButton onClick={handleCloseDialog} sx={{ color: "text.secondary" }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3, overflow: "auto" }}>
            {loadingDetail ? (
              <Box sx={{ textAlign: "center", py: 12 }}>
                <CircularProgress />
                <Typography mt={2} color="textSecondary">
                  Loading invoice details...
                </Typography>
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

        {/* 📱 SNACKBAR */}
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

export default DraftInvoices;
