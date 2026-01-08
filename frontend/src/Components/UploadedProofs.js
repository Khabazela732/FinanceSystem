import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
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
  const navigate = useNavigate();

  // ✅ FIXED: useCallback prevents infinite re-renders
  const fetchProofs = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const response = await fetch("http://localhost:3001/api/payment-proofs", {
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
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
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  // ✅ FIXED: Added fetchProofs dependency
  useEffect(() => {
    fetchProofs();
  }, [fetchProofs]);

  // ✅ SAFE VIEW - Direct Cloudinary URL
  const handleViewProof = (proof) => {
    if (!proof?.public_url) {
      alert("No URL available for this proof");
      return;
    }
    window.open(proof.public_url, "_blank", "noopener,noreferrer");
  };

  // ✅ SAFE DOWNLOAD - Works for PDFs/Images
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

  // ✅ FIXED: Better file type detection
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

  // ---------- LOADING STATE ----------
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

  // ---------- ERROR STATE ----------
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

  // ---------- EMPTY STATE ----------
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

  // ---------- MAIN LIST ----------
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: mainBg, p: { xs: 2, md: 3 } }}>
      <Box sx={{ maxWidth: 960, mx: "auto", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ textTransform: "none", fontSize: 14, color: "#1976d2", "&:hover": { color: "#1565c0", bgcolor: "transparent" } }}
        >
          Back to dashboard
        </Button>
      </Box>

      <Box sx={{ maxWidth: 960, mx: "auto" }}>
        <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
          <UploadProofIcon sx={{ fontSize: 28, color: "#1976d2" }} />
          <Typography variant="h5" sx={{ fontWeight: 600, color: "#1a1a1a" }}>
            Uploaded Proofs ({proofs.length})
          </Typography>
          <Chip label={proofs.length} size="small" sx={{ ml: "auto", bgcolor: "#1976d2", color: "white", fontWeight: 600 }} />
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={fetchProofs} disabled={refreshing} sx={{ ml: 1 }}>
            Refresh
          </Button>
        </Box>

        <Paper sx={{ borderRadius: 2, boxShadow: 1, bgcolor: "white", overflow: "hidden" }}>
          <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #e0e0e0", bgcolor: "#fafafa" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#424242" }}>
              Payment proofs list
            </Typography>
          </Box>

          <List sx={{ p: 0 }}>
            {proofs.map((proof, index) => {
              if (!proof?.public_url) {
                return (
                  <Alert key={proof.id || index} severity="warning" sx={{ mx: 2, mt: 2, borderRadius: 1 }}>
                    Proof #{proof.id || index + 1}: No URL available
                  </Alert>
                );
              }

              return (
                <ListItem
                  key={proof.id || index}
                  dense
                  sx={{
                    px: 2,
                    py: 1.5,
                    "&:hover": { bgcolor: "#f8f9fa" },
                    borderBottom: index < proofs.length - 1 ? "1px solid #f0f0f0" : "none",
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 48 }}>
                    <Avatar sx={{ bgcolor: "#e3f2fd", width: 36, height: 36, fontSize: 20 }}>
                      {getFileIcon(proof)}
                    </Avatar>
                  </ListItemAvatar>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1a1a1a" }}>
                        Proof #{proof.id || index + 1}
                      </Typography>
                      <Chip label={`Client #${proof.client_id}`} size="small" sx={{ fontSize: 11, height: 22, fontWeight: 600 }} />
                    </Box>

                    <Typography variant="body2" sx={{ color: "#424242", mb: 0.5, fontWeight: 500 }}>
                      {proof.comment || "No comment provided"}
                    </Typography>

                    <Typography variant="caption" sx={{ color: "#9e9e9e" }}>
                      📅 {proof.uploaded_at ? new Date(proof.uploaded_at).toLocaleString() : "Unknown date"}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 0.5, ml: 1 }}>
                    <IconButton
                      onClick={() => handleViewProof(proof)}
                      title="View proof"
                      size="small"
                      sx={{ color: "#1976d2", "&:hover": { bgcolor: "#e3f2fd" } }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDownloadProof(proof)}
                      title="Download proof"
                      size="small"
                      sx={{ color: "#4caf50", "&:hover": { bgcolor: "#e8f5e8" } }}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItem>
              );
            })}
          </List>
        </Paper>
      </Box>
    </Box>
  );
}
