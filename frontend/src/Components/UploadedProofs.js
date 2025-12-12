import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
} from "@mui/material";
import {
  OpenInNew as OpenInNewIcon,
  ArrowBack as ArrowBackIcon,
  UploadFile as UploadProofIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const mainBg = "#f5f5f5";

export default function UploadedProofs() {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3001/api/payment-proofs", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch uploaded proofs");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setProofs(data);
        else setProofs([]);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleProofClick = (fileUrl) => {
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  // ---------- SIMPLE LOADING STATE ----------
  if (loading)
    return (
      <Box
        sx={{
          minHeight: "60vh",
          bgcolor: mainBg,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 2,
        }}
      >
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: 1,
            bgcolor: "white",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: 260,
          }}
        >
          <UploadProofIcon sx={{ fontSize: 36, color: "#1976d2", mb: 1.5 }} />
          <CircularProgress size={28} sx={{ color: "#1976d2", mb: 1.5 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            Loading proofs...
          </Typography>
        </Paper>
      </Box>
    );

  // ---------- SIMPLE ERROR STATE ----------
  if (error)
    return (
      <Box
        sx={{
          minHeight: "60vh",
          bgcolor: mainBg,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 2,
        }}
      >
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: 1,
            bgcolor: "white",
            maxWidth: 360,
            width: "100%",
            textAlign: "center",
          }}
        >
          <UploadProofIcon
            sx={{ fontSize: 36, color: "error.main", mb: 1.5 }}
          />
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, mb: 1, color: "#1a1a1a" }}
          >
            Error loading proofs
          </Typography>
          <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
            {error}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Back to dashboard
          </Button>
        </Paper>
      </Box>
    );

  // ---------- EMPTY STATE ----------
  if (!proofs.length)
    return (
      <Box
        sx={{
          minHeight: "60vh",
          bgcolor: mainBg,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 2,
        }}
      >
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: 1,
            bgcolor: "white",
            maxWidth: 420,
            width: "100%",
            textAlign: "center",
          }}
        >
          <UploadProofIcon sx={{ fontSize: 44, color: "#9e9e9e", mb: 2 }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, mb: 1, color: "#1a1a1a" }}
          >
            No proofs uploaded
          </Typography>
          <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
            Clients have not uploaded any payment proofs yet.
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 3,
            }}
          >
            Back to dashboard
          </Button>
        </Paper>
      </Box>
    );

  // ---------- MAIN LIST ----------
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: mainBg,
        p: { xs: 2, md: 3 },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          maxWidth: 960,
          mx: "auto",
          mb: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{
            textTransform: "none",
            fontSize: 14,
            color: "#1976d2",
            "&:hover": { color: "#1565c0", bgcolor: "transparent" },
          }}
        >
          Back to dashboard
        </Button>
      </Box>

      <Box
        sx={{
          maxWidth: 960,
          mx: "auto",
        }}
      >
        <Box
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <UploadProofIcon sx={{ fontSize: 28, color: "#1976d2" }} />
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, color: "#1a1a1a" }}
          >
            Uploaded proofs
          </Typography>
          <Box
            sx={{
              ml: "auto",
              px: 1.5,
              py: 0.25,
              bgcolor: "#1976d2",
              color: "white",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {proofs.length}
          </Box>
        </Box>

        <Paper
          sx={{
            borderRadius: 2,
            boxShadow: 1,
            bgcolor: "white",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: "1px solid #e0e0e0",
              bgcolor: "#fafafa",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "#424242" }}
            >
              Payment proofs ({proofs.length})
            </Typography>
          </Box>

          <List sx={{ p: 0 }}>
            {proofs.map((proof, index) => {
              const fileUrl = `http://localhost:3001/uploads/proofs/${
                proof.file_path || proof.filename
              }`;

              return (
                <React.Fragment key={proof.id}>
                  <ListItem
                    dense
                    button
                    alignItems="center"
                    onClick={() => handleProofClick(fileUrl)}
                    sx={{
                      px: 2,
                      py: 1.25,
                      "&:hover": {
                        bgcolor: "#f5f5f5",
                      },
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 48 }}>
                      <Avatar
                        sx={{
                          bgcolor: "#1976d2",
                          width: 32,
                          height: 32,
                          fontSize: 18,
                        }}
                      >
                        <VisibilityIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                    </ListItemAvatar>

                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 1,
                          mb: 0.25,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          Proof #{proof.id}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "#616161" }}
                        >
                          Client ID: {proof.client_id}
                        </Typography>
                      </Box>

                      <Typography
                        variant="body2"
                        sx={{
                          color: "#757575",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: { xs: "100%", md: "80%" },
                        }}
                      >
                        {proof.comment || "No comment provided"}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        ml: 2,
                        textAlign: "right",
                        minWidth: 120,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ display: "block", color: "#9e9e9e", mb: 0.5 }}
                      >
                        {proof.uploaded_at
                          ? new Date(
                              proof.uploaded_at
                            ).toLocaleDateString()
                          : "Unknown date"}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<OpenInNewIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProofClick(fileUrl);
                        }}
                        sx={{
                          borderRadius: 999,
                          textTransform: "none",
                          fontSize: 12,
                          px: 1.5,
                          py: 0.25,
                        }}
                      >
                        View
                      </Button>
                    </Box>
                  </ListItem>
                  {index < proofs.length - 1 && <Divider component="li" />}
                </React.Fragment>
              );
            })}
          </List>
        </Paper>
      </Box>
    </Box>
  );
}
