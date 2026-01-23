// ClientProofUploadPage.jsx - PROFESSIONAL UPLOAD PAGE WITH SYSTEM THEME
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  CircularProgress,
  Container,
  Backdrop,
  IconButton,
  Divider
} from "@mui/material";
import { CloudUpload, ArrowBack, Close, CheckCircle } from "@mui/icons-material";

// ✅ SYSTEM THEME COLORS - Matching entire system
const sidebarBg = "#3166AE";
const mainBg = "#e3f2fd";
const primaryBlue = "#1976d2";
const successGreen = "#4caf50";
const textPrimary = "#1a1a1a";

export default function ClientProofUploadPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [file, setFile] = useState(null);
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Redirect to dashboard after success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate(`/clients/dashboard/${id}`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, id, navigate]);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 50 * 1024 * 1024) {
        alert("File size must be less than 50MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.size > 50 * 1024 * 1024) {
        alert("File size must be less than 50MB");
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file before uploading.");
      return;
    }
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("proofFile", file);
      formData.append("clientId", id);
      formData.append("comment", comment);

      const res = await fetch("http://localhost:3001/api/proofs/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        setSuccess(true);
        setFile(null);
        setComment("");
      } else {
        alert("Upload failed. Please try again.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Network error. Please try again.");
    }
    setUploading(false);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: mainBg, display: "flex", flexDirection: "column" }}>
      {/* TOP BAR */}
      <Box
        sx={{
          bgcolor: sidebarBg,
          color: "white",
          height: 72,
          display: "flex",
          alignItems: "center",
          px: { xs: 2, md: 4 },
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          position: "relative"
        }}
      >
        <IconButton
          onClick={() => navigate(`/clients/dashboard/${id}`)}
          sx={{
            color: "white",
            mr: 2,
            "&:hover": { bgcolor: "rgba(255,255,255,0.2)" }
          }}
        >
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 0.25 }}>
            Upload Proof of Payment
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Submit your payment proof document
          </Typography>
        </Box>
      </Box>

      {/* MAIN CONTENT */}
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", py: 4 }}>
        <Container maxWidth="sm">
          <Paper
            sx={{
              p: { xs: 4, md: 6 },
              borderRadius: 3,
              boxShadow: "0 12px 48px rgba(0,0,0,0.1)",
              border: "1px solid #e0e0e0",
              bgcolor: "white"
            }}
          >
            {/* HEADER */}
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: "rgba(25, 118, 210, 0.1)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 3
                }}
              >
                <CloudUpload sx={{ fontSize: 56, color: primaryBlue }} />
              </Box>
              <Typography
                variant="h5"
                fontWeight={700}
                sx={{ color: textPrimary, mb: 1 }}
              >
                Upload Your Proof
              </Typography>
              <Typography variant="body2" sx={{ color: "#666", mb: 1 }}>
                PDF, JPG, or PNG format
              </Typography>
              <Typography variant="caption" sx={{ color: "#999" }}>
                Maximum file size: 50MB
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* FORM */}
            <Box component="form" onSubmit={handleUpload}>
              {/* FILE UPLOAD AREA */}
              <Box
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                sx={{
                  border: "2px dashed",
                  borderColor: dragActive ? primaryBlue : "#ccc",
                  borderRadius: 2,
                  p: 4,
                  textAlign: "center",
                  cursor: "pointer",
                  bgcolor: dragActive ? "rgba(25, 118, 210, 0.05)" : "rgba(0,0,0,0.01)",
                  transition: "all 0.3s ease",
                  mb: 3,
                  position: "relative",
                  "&:hover": {
                    borderColor: primaryBlue,
                    bgcolor: "rgba(25, 118, 210, 0.05)"
                  }
                }}
              >
                <input
                  type="file"
                  hidden
                  id="file-upload"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload" style={{ cursor: "pointer", display: "block" }}>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    sx={{ color: primaryBlue, mb: 1 }}
                  >
                    {file ? "✓ File Selected" : "Drag & Drop or Click to Browse"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#999" }}>
                    {file ? file.name : "Select a document to upload"}
                  </Typography>
                </label>
              </Box>

              {/* FILE INFO */}
              {file && (
                <Paper
                  sx={{
                    p: 2.5,
                    mb: 3,
                    borderRadius: 2,
                    bgcolor: "#f5f5f5",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: `1px solid ${primaryBlue}`
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={600} sx={{ color: textPrimary }}>
                      📄 {file.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#666" }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => setFile(null)}
                    sx={{ color: "#999" }}
                  >
                    <Close sx={{ fontSize: 20 }} />
                  </IconButton>
                </Paper>
              )}

              {/* COMMENT FIELD */}
              <TextField
                label="Add a comment (optional)"
                variant="outlined"
                multiline
                minRows={3}
                fullWidth
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: "#fafafa",
                    transition: "all 0.3s ease",
                    "&:hover": { backgroundColor: "white" },
                    "&.Mui-focused": { backgroundColor: "white" }
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e0e0e0"
                  }
                }}
                InputLabelProps={{
                  sx: { color: "#666", fontWeight: 600 }
                }}
                placeholder="e.g., Payment reference number, invoice details, etc."
              />

              {/* UPLOAD BUTTON */}
              <Button
                type="submit"
                disabled={uploading || !file}
                variant="contained"
                fullWidth
                sx={{
                  height: 54,
                  borderRadius: 2,
                  fontSize: "1rem",
                  fontWeight: 700,
                  bgcolor: successGreen,
                  boxShadow: "0 4px 16px rgba(76, 175, 80, 0.3)",
                  textTransform: "none",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    bgcolor: "#45a049",
                    boxShadow: "0 8px 24px rgba(76, 175, 80, 0.4)",
                    transform: "translateY(-2px)"
                  },
                  "&:disabled": { bgcolor: "#ccc" }
                }}
              >
                {uploading ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <CircularProgress size={24} sx={{ color: "white" }} />
                    <span>Uploading Proof...</span>
                  </Box>
                ) : (
                  "Upload Proof"
                )}
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* LOADING OVERLAY WITH BLUR */}
      <Backdrop
        open={uploading}
        sx={{
          zIndex: 1500,
          backdropFilter: "blur(8px)",
          bgcolor: "rgba(0,0,0,0.4)"
        }}
      >
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 3,
            bgcolor: "white",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            maxWidth: 300
          }}
        >
          <CircularProgress
            size={60}
            sx={{
              color: primaryBlue,
              mb: 2,
              display: "block",
              mx: "auto"
            }}
          />
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ color: textPrimary, mb: 1 }}
          >
            Uploading Your Proof
          </Typography>
          <Typography variant="body2" sx={{ color: "#666" }}>
            Please wait while we process your document...
          </Typography>
        </Paper>
      </Backdrop>

      {/* SUCCESS SNACKBAR - CIRCLE SHAPED */}
      <Backdrop
        open={success}
        sx={{
          zIndex: 1600,
          backdropFilter: "blur(8px)",
          bgcolor: "rgba(0,0,0,0.4)"
        }}
      >
        <Box
          sx={{
            width: 140,
            height: 140,
            borderRadius: "50%",
            bgcolor: "white",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            animation: "scaleIn 0.5s ease-out"
          }}
        >
          <CheckCircle
            sx={{
              fontSize: 80,
              color: successGreen,
              mb: 1,
              animation: "bounce 0.6s ease-out"
            }}
          />
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{
              color: textPrimary,
              textAlign: "center",
              fontSize: "0.9rem"
            }}
          >
            Success!
          </Typography>
        </Box>
      </Backdrop>

      {/* ANIMATION STYLES */}
      <style>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes bounce {
          0% {
            transform: scale(0.8);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </Box>
  );
}
