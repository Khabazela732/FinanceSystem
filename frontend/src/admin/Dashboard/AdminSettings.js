import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  Grid,
  Snackbar,
  Alert,
  Backdrop,
  Card,
  CardContent,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3001";

export default function AdminSettings() {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({
    company: "",
    fullname: "",
    lastname: "",
    email: "",
    street: "",
    town: "",
    province: "",
    postalcode: "",
    reg: "",
    vat: "",
    noi: "",
    tel: "",
    cell: "",
  });
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [blurActive, setBlurActive] = useState(false);

  // Same blue focus styling as Clients
  const darkBlueTextFieldSx = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: '#1976d2',
      },
      '&:hover fieldset': {
        borderColor: '#1565c0',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#2196f3',
      },
    },
  };

  // Load clients
  useEffect(() => {
    async function loadClients() {
      setLoadingClients(true);
      try {
        const res = await fetch(`${API_BASE}/api/clients`, {
          credentials: "include",
        });
        if (!res.ok) {
          if (res.status === 401) {
            alert("Please log in first.");
            navigate("/login");
            return;
          }
          throw new Error("Failed to load clients");
        }
        const data = await res.json();
        setClients(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error loading clients", e);
      } finally {
        setLoadingClients(false);
      }
    }
    loadClients();
  }, [navigate]);

  // Load form data
  useEffect(() => {
    if (!selectedId) return;
    
    async function loadFullDetails() {
      try {
        const res = await fetch(`${API_BASE}/api/clients/${selectedId}/details`, {
          credentials: "include",
        });
        
        if (!res.ok) {
          const basicData = clients.find(c => String(c.id) === String(selectedId));
          setForm({
            company: basicData?.company || "",
            fullname: basicData?.fullname || "",
            lastname: basicData?.lastname || "",
            email: basicData?.email || "",
            street: basicData?.street || "",
            town: basicData?.town || "",
            province: basicData?.province || "",
            postalcode: basicData?.postalcode || "",
            reg: basicData?.reg || "",
            vat: basicData?.vat || "",
            noi: basicData?.noi || "",
            tel: basicData?.tel || "",
            cell: basicData?.cell || "",
          });
          return;
        }
        
        const fullData = await res.json();
        setForm({
          company: fullData.company || "",
          fullname: fullData.fullname || "",
          lastname: fullData.lastname || "",
          email: fullData.email || "",
          street: fullData.street || "",
          town: fullData.town || "",
          province: fullData.province || "",
          postalcode: fullData.postalcode || "",
          reg: fullData.reg || "",
          vat: fullData.vat || "",
          noi: fullData.noi || "",
          tel: fullData.tel || "",
          cell: fullData.cell || "",
        });
      } catch (e) {
        console.error("Error loading full details", e);
      }
    }
    
    loadFullDetails();
  }, [selectedId, clients]);

  const handleChangeField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSuccessSnackbarClose = () => {
    setSnackbarOpen(false);
    setBlurActive(false);
    setTimeout(() => {
      navigate("/clients");
    }, 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) {
      alert("Please select a host company first.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/clients/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        if (res.status === 401) {
          alert("Session expired. Please log in again.");
          navigate("/login");
          return;
        }
        throw new Error(`Update failed: ${res.status}`);
      }

      setBlurActive(true);
      setSnackbarOpen(true);
      
      // Refresh clients list
      const clientRes = await fetch(`${API_BASE}/api/clients`, {
        credentials: "include",
      });
      const clientData = await clientRes.json();
      setClients(Array.isArray(clientData) ? clientData : []);
      
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update details.");
    } finally {
      setSaving(false);
    }
  };

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
      {/* ✅ SAME PREMIUM CONTAINER AS CLIENTS */}
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
        {/* ✅ SAME HEADER LAYOUT AS CLIENTS */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#000000",
              letterSpacing: ".01em",
              lineHeight: 1.2,
            }}
          >
            Edit Client ({clients.length} available)
          </Typography>
          
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/clients")}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              View All Clients
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate("/dashboard")}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                textTransform: "none",
                px: 3,
                boxShadow: "0 2px 8px rgba(25,118,210,0.13)",
              }}
            >
              Dashboard
            </Button>
          </Box>
        </Box>

        {/* ✅ BLUR BACKDROP */}
        <Backdrop
          sx={{ 
            zIndex: 1, 
            backdropFilter: blurActive ? "blur(4px)" : "none",
            backgroundColor: "rgba(0,0,0,0.1)",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 3
          }}
          open={blurActive}
        />

        {/* ✅ SUCCESS SNACKBAR */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={2500}
          onClose={handleSuccessSnackbarClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          sx={{ zIndex: 1300, top: { xs: 80, md: 100 } }}
        >
          <Alert
            onClose={handleSuccessSnackbarClose}
            severity="success"
            variant="filled"
            sx={{ 
              width: "100%", 
              fontSize: "1.1rem",
              fontWeight: 600
            }}
          >
            ✔ Company details updated successfully!
          </Alert>
        </Snackbar>

        {/* ✅ CLIENT SELECTION CARD */}
        <Card
          sx={{
            mb: 4,
            borderRadius: 3,
            boxShadow: "0px 6px 18px rgba(25, 118, 210, 0.16)",
            bgcolor: "#fdfdff",
            transition: "transform 0.19s, box-shadow 0.19s",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0px 12px 28px rgba(25,118,210,0.2)",
            },
          }}
        >
          <CardContent sx={{ p: 3 }}>
            {loadingClients ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : (
              <TextField
                select
                fullWidth
                label="Select Host Company"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                sx={{ 
                  mb: 1, 
                  ...darkBlueTextFieldSx 
                }}
              >
                <MenuItem value="">Select a company...</MenuItem>
                {clients.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.company} - {c.fullname} (ID: {c.id})
                  </MenuItem>
                ))}
              </TextField>
            )}
          </CardContent>
        </Card>

        {/* ✅ FORM WITH SAME GRID LAYOUT */}
        {!loadingClients && selectedId && (
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              opacity: selectedId ? 1 : 0.5,
              pointerEvents: selectedId ? "auto" : "none",
            }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField 
                  label="Company" 
                  name="company" 
                  value={form.company} 
                  onChange={handleChangeField} 
                  fullWidth 
                  sx={darkBlueTextFieldSx} 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField 
                  label="Registration No" 
                  name="reg" 
                  value={form.reg} 
                  onChange={handleChangeField} 
                  fullWidth 
                  sx={darkBlueTextFieldSx} 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField 
                  label="Full name" 
                  name="fullname" 
                  value={form.fullname} 
                  onChange={handleChangeField} 
                  fullWidth 
                  sx={darkBlueTextFieldSx} 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField 
                  label="Last name" 
                  name="lastname" 
                  value={form.lastname} 
                  onChange={handleChangeField} 
                  fullWidth 
                  sx={darkBlueTextFieldSx} 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField 
                  label="Email" 
                  name="email" 
                  type="email" 
                  value={form.email} 
                  onChange={handleChangeField} 
                  fullWidth 
                  sx={darkBlueTextFieldSx} 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField 
                  label="VAT No" 
                  name="vat" 
                  value={form.vat} 
                  onChange={handleChangeField} 
                  fullWidth 
                  sx={darkBlueTextFieldSx} 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField 
                  label="Street" 
                  name="street" 
                  value={form.street} 
                  onChange={handleChangeField} 
                  fullWidth 
                  sx={darkBlueTextFieldSx} 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField 
                  label="Town" 
                  name="town" 
                  value={form.town} 
                  onChange={handleChangeField} 
                  fullWidth 
                  sx={darkBlueTextFieldSx} 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField 
                  label="Province" 
                  name="province" 
                  value={form.province} 
                  onChange={handleChangeField} 
                  fullWidth 
                  sx={darkBlueTextFieldSx} 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField 
                  label="Postal code" 
                  name="postalcode" 
                  value={form.postalcode} 
                  onChange={handleChangeField} 
                  fullWidth 
                  sx={darkBlueTextFieldSx} 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField 
                  label="Number of Interns" 
                  name="noi" 
                  value={form.noi} 
                  onChange={handleChangeField} 
                  fullWidth 
                  sx={darkBlueTextFieldSx} 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField 
                  label="Telephone" 
                  name="tel" 
                  value={form.tel} 
                  onChange={handleChangeField} 
                  fullWidth 
                  sx={darkBlueTextFieldSx} 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField 
                  label="Cell" 
                  name="cell" 
                  value={form.cell} 
                  onChange={handleChangeField} 
                  fullWidth 
                  sx={darkBlueTextFieldSx} 
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button
                type="submit" 
                variant="contained" 
                disabled={saving || !selectedId}
                size="large"
                sx={{
                  fontWeight: 700,
                  px: 4,
                  borderRadius: 2,
                  textTransform: "none",
                  boxShadow: "0 2px 8px rgba(25,118,210,0.13)",
                }}
              >
                {saving ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </Box>
          </Box>
        )}

        {/* Empty state */}
        {clients.length === 0 && !loadingClients && (
          <Card
            sx={{
              mt: 4,
              p: 6,
              textAlign: "center",
              borderRadius: 3,
              bgcolor: "#fafafa",
              border: "2px dashed #e0e0e0",
            }}
          >
            <Typography variant="h6" sx={{ color: "#666", mb: 2 }}>
              No clients available
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate("/clients")}
              sx={{ borderRadius: 2 }}
            >
              Create Clients First
            </Button>
          </Card>
        )}
      </Box>
    </Box>
  );
}
