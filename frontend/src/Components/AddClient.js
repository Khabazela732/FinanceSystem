import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError("");
      
      // ✅ FIXED: Admin auth + error handling
      const response = await fetch("http://localhost:3001/api/clients", {
        credentials: "include",  // Admin session
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("🚨 Clients fetch error:", err);
      setError("Failed to load clients. Please login as admin.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Refresh button
  const handleRefresh = () => fetchClients();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: { xs: 2, md: 6 },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "1200px",
          bgcolor: "rgba(255,255,255,0.96)",
          borderRadius: 3,
          boxShadow: "0 6px 18px rgba(25,118,210,0.13)",
          px: { xs: 2, md: 4 },
          py: { xs: 2, md: 5 },
          mb: 4,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#1976d2",
              letterSpacing: ".01em",
              lineHeight: 1.2,
            }}
          >
            Clients ({clients.length})
          </Typography>
          
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              size="large"
              onClick={handleRefresh}
              sx={{ borderRadius: 2, textTransform: "none" }}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate("/clients/new")}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                textTransform: "none",
                px: 3,
                boxShadow: "0 2px 8px rgba(25,118,210,0.13)",
              }}
            >
              Add Client
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
            <Button size="small" onClick={handleRefresh} sx={{ ml: 2 }}>
              Retry
            </Button>
          </Alert>
        )}

        {clients.length === 0 && !loading ? (
          <Typography
            color="text.secondary"
            sx={{ mt: 4, fontStyle: "italic", textAlign: "center" }}
          >
            No clients found.{" "}
            <Button onClick={() => navigate("/clients/new")} size="small">
              Create first client
            </Button>
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {clients.map((client) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={client.id}>
                <Card
                  elevation={5}
                  sx={{
                    borderRadius: 3,
                    boxShadow: "0px 6px 18px rgba(25, 118, 210, 0.16)",
                    transition: "transform 0.19s, box-shadow 0.19s",
                    bgcolor: "#fdfdff",
                    "&:hover": {
                      transform: "translateY(-5px) scale(1.03)",
                      boxShadow:
                        "0px 14px 32px rgba(25,118,210,0.15), 0 4px 18px #b6cfff22",
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => navigate(`/clients/${client.id}`)}
                    sx={{ borderRadius: 3 }}
                  >
                    <CardContent>
                      {/* ✅ FIXED: Use correct database fields! */}
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: "#0d47a1",
                          fontSize: "1.16rem",
                          mb: 0.5,
                        }}
                        gutterBottom
                      >
                        {client.fullname}  {/* ✅ Database: fullname */}
                      </Typography>
                      <Typography
                        sx={{
                          color: "#5f6368",
                          fontStyle: "italic",
                          fontWeight: 500,
                          fontSize: ".98rem",
                        }}
                      >
                        {client.company}    {/* ✅ Database: company */}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "#9e9e9e", display: "block", mt: 0.5 }}
                      >
                        {client.email}      {/* ✅ Database: email */}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "#9e9e9e", display: "block" }}
                      >
                        {client.cell || client.tel}  {/* Phone */}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}

export default Clients;
