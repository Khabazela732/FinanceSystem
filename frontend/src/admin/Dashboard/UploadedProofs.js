import React, { useEffect, useState, useCallback } from "react";
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
  TablePagination,
  CircularProgress,
  IconButton,
  Chip,
  Alert,
} from "@mui/material";
import {
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
  UploadFile as UploadProofIcon,
  Visibility as VisibilityIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const mainBg = "#f5f5f5";

export default function UploadedProofs() {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  // ✅ PAGINATION STATES
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();

  const fetchProofs = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const response = await fetch("http://localhost:3001/api/payment-proofs", {
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch proofs`);
      }

      const data = await response.json();
      setProofs(Array.isArray(data) ? data : []);
      setPage(0); // Reset to first page
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProofs();
  }, [fetchProofs]);

  const handleViewProof = (proof) => {
    if (!proof?.public_url) {
      alert("No URL available for this proof");
      return;
    }
    window.open(proof.public_url, "_blank", "noopener,noreferrer");
  };

  const handleDownloadProof = async (proof) => {
    if (!proof?.public_url) {
      alert("No file available for download");
      return;
    }

    const link = document.createElement('a');
    link.href = proof.public_url;
    link.download = `proof-${proof.id || proof.client_id}-${Date.now()}${getFileExtension(proof)}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (proof) => {
    if (!proof?.public_url) return <ImageIcon sx={{ fontSize: 18 }} />;
    
    const url = proof.public_url.toLowerCase();
    if (url.includes('.pdf') || proof.file_type?.includes('pdf')) {
      return <PdfIcon sx={{ fontSize: 18, color: '#d32f2f' }} />;
    }
    if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || proof.file_type?.includes('image')) {
      return <ImageIcon sx={{ fontSize: 18, color: '#1976d2' }} />;
    }
    return <UploadProofIcon sx={{ fontSize: 18, color: '#666' }} />;
  };

  const getFileExtension = (proof) => {
    if (!proof?.public_url) return '.pdf';
    
    const url = proof.public_url.toLowerCase();
    if (url.includes('.pdf')) return '.pdf';
    if (url.includes('.jpg') || url.includes('.jpeg')) return '.jpg';
    if (url.includes('.png')) return '.png';
    return '.pdf';
  };

  const handleBack = () => navigate("/dashboard");

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ✅ CALCULATE ROW NUMBERS (1-N based on total proofs)
  const getRowNumber = (index) => {
    return index + 1 + (page * rowsPerPage);
  };

  // Paginated proofs
  const paginatedProofs = proofs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Loading state
  if (loading)
    return (
      <Box sx={{ minHeight: "60vh", bgcolor: mainBg, display: "flex", justifyContent: "center", alignItems: "center", p: 2 }}>
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 1, bgcolor: "white", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 260 }}>
          <UploadProofIcon sx={{ fontSize: 36, color: "#1976d2", mb: 1.5 }} />
          <CircularProgress size={28} sx={{ color: "#1976d2", mb: 1.5 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Loading proofs...</Typography>
        </Paper>
      </Box>
    );

  if (error)
    return (
      <Box sx={{ minHeight: "60vh", bgcolor: mainBg, display: "flex", justifyContent: "center", alignItems: "center", p: 2 }}>
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 1, bgcolor: "white", maxWidth: 360, width: "100%", textAlign: "center" }}>
          <UploadProofIcon sx={{ fontSize: 36, color: "error.main", mb: 1.5 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: "#1a1a1a" }}>Error loading proofs</Typography>
          <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>{error}</Typography>
          <Box sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: "wrap" }}>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchProofs} disabled={refreshing}>
              Retry
            </Button>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBack}>
              Back to dashboard
            </Button>
          </Box>
        </Paper>
      </Box>
    );

  if (!proofs.length)
    return (
      <Box sx={{ minHeight: "60vh", bgcolor: mainBg, display: "flex", justifyContent: "center", alignItems: "center", p: 2 }}>
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 1, bgcolor: "white", maxWidth: 420, width: "100%", textAlign: "center" }}>
          <UploadProofIcon sx={{ fontSize: 44, color: "#9e9e9e", mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: "#1a1a1a" }}>No proofs uploaded</Typography>
          <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>Clients have not uploaded any payment proofs yet.</Typography>
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchProofs} sx={{ borderRadius: 2, textTransform: "none", px: 3 }}>
            Refresh
          </Button>
        </Paper>
      </Box>
    );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: mainBg, p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ maxWidth: 1200, mx: "auto", mb: 3 }}>
        <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ textTransform: "none", fontSize: 14, color: "#1976d2" }}
          >
            Back to dashboard
          </Button>
          <UploadProofIcon sx={{ fontSize: 32, color: "#1976d2" }} />
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a1a1a" }}>
            Payment Proofs ({proofs.length})
          </Typography>
          <Box sx={{ ml: "auto", display: "flex", gap: 1, alignItems: "center" }}>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<RefreshIcon />} 
              onClick={fetchProofs} 
              disabled={refreshing}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* ✅ ENTERPRISE TABLE WITH FIXED HEADER */}
        <Paper sx={{ borderRadius: 2, border: "1px solid #e0e0e0", overflow: "hidden", boxShadow: 2 }}>
          {/* Fixed Header Bar */}
          <Box sx={{ position: "sticky", top: 0, zIndex: 10, bgcolor: "#1976d2", p: 2.5, borderBottom: "2px solid #1565c0" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "white", flexShrink: 0 }}>
                Payment Proofs Directory
              </Typography>
              <Chip label={`${proofs.length} total`} color="primary" sx={{ bgcolor: "rgba(255,255,255,0.2)", "& .MuiChip-label": { color: "white" } }} />
            </Box>
          </Box>

          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader sx={{ minWidth: 1000 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8f9fa", height: 56 }}>
                  {["#", "Date", "Time", "Proof Count", "Client ID", "Comment", "Actions"].map((header) => (
                    <TableCell 
                      key={header}
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "#212121",
                        borderBottom: "2px solid #e0e0e0",
                        py: 2,
                        whiteSpace: "nowrap",
                        backgroundColor: "#f8f9fa !important",
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              
              <TableBody>
                {paginatedProofs.map((proof, index) => {
                  const rowNumber = getRowNumber(index);
                  const uploadedDate = proof.uploaded_at ? new Date(proof.uploaded_at) : null;
                  const date = uploadedDate ? uploadedDate.toLocaleDateString("en-ZA") : "-";
                  const time = uploadedDate ? uploadedDate.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }) : "-";

                  return (
                    <TableRow
                      key={proof.id || index}
                      sx={{
                        height: 64,
                        borderBottom: "1px solid #f0f0f0",
                        bgcolor: "white",
                        transition: "none",
                        "&:hover": { bgcolor: "#f8f9fa" },
                      }}
                    >
                      {/* Row Number */}
                      <TableCell align="center" sx={{ fontWeight: 600, color: "#424242", width: 70 }}>
                        {rowNumber}
                      </TableCell>
                      
                      {/* Date */}
                      <TableCell align="center" sx={{ fontWeight: 500, color: "#424242", fontSize: "0.9rem" }}>
                        {date}
                      </TableCell>
                      
                      {/* Time */}
                      <TableCell align="center" sx={{ fontWeight: 500, color: "#616161", fontSize: "0.85rem" }}>
                        {time}
                      </TableCell>
                      
                      {/* Proof Count */}
                      <TableCell align="center" sx={{ fontWeight: 600, color: "#1976d2", fontSize: "0.95rem" }}>
                        1
                      </TableCell>
                      
                      {/* Client ID */}
                      <TableCell align="center">
                        <Chip
                          label={`#${proof.client_id}`}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            height: 28,
                            bgcolor: "#e3f2fd",
                            color: "#1976d2",
                          }}
                        />
                      </TableCell>
                      
                      {/* Comment */}
                      <TableCell sx={{ fontWeight: 500, color: "#212121", maxWidth: 250 }}>
                        {proof.comment || "No comment"}
                      </TableCell>
                      
                      {/* Actions */}
                      <TableCell align="center" sx={{ py: 1 }}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <IconButton
                            onClick={() => handleViewProof(proof)}
                            title="View proof"
                            size="small"
                            sx={{ color: "#1976d2", "&:hover": { bgcolor: "rgba(25, 118, 210, 0.08)" } }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDownloadProof(proof)}
                            title="Download proof"
                            size="small"
                            sx={{ color: "#4caf50", "&:hover": { bgcolor: "rgba(76, 175, 80, 0.08)" } }}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* ✅ PAGINATION */}
          <Box sx={{ p: 2, borderTop: "1px solid #e0e0e0", bgcolor: "#fafafa" }}>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={proofs.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                  fontSize: "0.85rem",
                  color: "#424242",
                },
                "& .MuiTablePagination-actions": {
                  marginLeft: "auto",
                }
              }}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
