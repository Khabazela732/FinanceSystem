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
  const [message, setMessage] = useState("");
  
  // ✅ NEW SNACKBAR + BLUR STATES
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [blurActive, setBlurActive] = useState(false);

  // ✅ VICE VERSA: Dark Blue → Light Blue FOCUS
  const darkBlueTextFieldSx = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: '#1976d2', // 🔵 DARK BLUE default
      },
      '&:hover fieldset': {
        borderColor: '#1565c0', // 🔵 Darker blue on hover
      },
      '&.Mui-focused fieldset': {
        borderColor: '#2196f3', // 💙 LIGHT BLUE on focus
      },
    },
  };

  // ... (useEffect functions unchanged - keeping your existing logic)
  useEffect(() => {
    async function loadClients() {
      setLoadingClients(true);
      setMessage("");
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
        setMessage("Failed to load clients list.");
      } finally {
        setLoadingClients(false);
      }
    }
    loadClients();
  }, [navigate]);

  useEffect(() => {
    if (!selectedId) return;
    
    async function loadFullDetails() {
      try {
        const res = await fetch(`${API_BASE}/api/clients/${selectedId}/details`, {
          credentials: "include",
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            alert("Session expired. Please log in.");
            navigate("/login");
            return;
          }
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
        setMessage("");
      } catch (e) {
        console.error("Error loading full details", e);
        const basicData = clients.find(c => String(c.id) === String(selectedId));
        if (basicData) {
          setForm({
            company: basicData.company || "",
            fullname: basicData.fullname || "",
            lastname: basicData.fullname || "",
            email: basicData.email || "",
            street: basicData.street || "",
            town: basicData.town || "",
            province: basicData.province || "",
            postalcode: basicData.postalcode || "",
            reg: basicData.reg || "",
            vat: basicData.vat || "",
            noi: basicData.noi || "",
            tel: basicData.tel || "",
            cell: basicData.cell || "",
          });
        }
      }
    }
    
    loadFullDetails();
  }, [selectedId, clients]);

  const handleChangeField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setMessage("");
  };

  // ✅ NEW: Success Snackbar + Blur + Auto-redirect
  const handleSuccessSnackbarClose = () => {
    setSnackbarOpen(false);
    setBlurActive(false);
    // Redirect to clients list after snackbar closes
    setTimeout(() => {
      navigate("/clients");
    }, 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) {
      setMessage("Please select a host company first.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      console.log("🚀 Sending PUT to:", `${API_BASE}/api/clients/${selectedId}`);
      const res = await fetch(`${API_BASE}/api/clients/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      console.log("📡 Response status:", res.status);
      
      if (!res.ok) {
        const errorData = await res.text();
        console.error("❌ Error response:", errorData);
        if (res.status === 401) {
          setMessage("Session expired. Please log in again.");
          navigate("/login");
          return;
        }
        setMessage(`Error: ${res.status} - ${errorData || "Update failed"}`);
        return;
      }

      const data = await res.json();
      
      // ✅ SHOW SNACKBAR + BLUR INSTEAD OF message
      setBlurActive(true);
      setSnackbarOpen(true);
      
      // Refresh clients list
      const clientRes = await fetch(`${API_BASE}/api/clients`, {
        credentials: "include",
      });
      const clientData = await clientRes.json();
      setClients(Array.isArray(clientData) ? clientData : []);
      
    } catch (err) {
      console.error("🚨 Update error:", err);
      setMessage("Failed to update details. Check console.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f5f5f5",
        display: "flex",
        justifyContent: "center",
        p: { xs: 2, md: 4 },
        position: "relative", // ✅ For backdrop
      }}
    >
      {/* ✅ BLUR BACKDROP */}
      <Backdrop
        sx={{ 
          zIndex: 1, 
          backdropFilter: blurActive ? "blur(4px)" : "none",
          backgroundColor: "rgba(0,0,0,0.1)"
        }}
        open={blurActive}
      />

      {/* ✅ CENTERED SNACKBAR OVERLAY */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2500}
        onClose={handleSuccessSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ zIndex: 2, top: { xs: 80, md: 100 } }}
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

      <Paper
        sx={{
          maxWidth: 900,
          width: "100%",
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h4" fontWeight={800}>
            Admin Settings – Host Companies
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate("/dashboard")} 
          >
            Back to Dashboard
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" mb={3}>
          Select a registered host employer and update their company details.
        </Typography>

        {loadingClients ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TextField
            select
            fullWidth
            label="Select Host Company"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            sx={{ 
              mb: 3, 
              ...darkBlueTextFieldSx 
            }}
          >
            <MenuItem value="">Select a company...</MenuItem>
            {clients.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.company} (ID: {c.id})
              </MenuItem>
            ))}
          </TextField>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            opacity: selectedId ? 1 : 0.5,
            pointerEvents: selectedId ? "auto" : "none",
          }}
        >
          <Grid container spacing={2}>
            {/* All your existing TextFields with darkBlueTextFieldSx - unchanged */}
            <Grid item xs={12} md={6}>
              <TextField label="Company" name="company" value={form.company} onChange={handleChangeField} fullWidth sx={darkBlueTextFieldSx} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Registration No" name="reg" value={form.reg} onChange={handleChangeField} fullWidth sx={darkBlueTextFieldSx} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Full name" name="fullname" value={form.fullname} onChange={handleChangeField} fullWidth sx={darkBlueTextFieldSx} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Last name" name="lastname" value={form.lastname} onChange={handleChangeField} fullWidth sx={darkBlueTextFieldSx} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChangeField} fullWidth sx={darkBlueTextFieldSx} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="VAT No" name="vat" value={form.vat} onChange={handleChangeField} fullWidth sx={darkBlueTextFieldSx} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Street" name="street" value={form.street} onChange={handleChangeField} fullWidth sx={darkBlueTextFieldSx} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Town" name="town" value={form.town} onChange={handleChangeField} fullWidth sx={darkBlueTextFieldSx} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Province" name="province" value={form.province} onChange={handleChangeField} fullWidth sx={darkBlueTextFieldSx} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Postal code" name="postalcode" value={form.postalcode} onChange={handleChangeField} fullWidth sx={darkBlueTextFieldSx} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Number of Interns" name="noi" value={form.noi} onChange={handleChangeField} fullWidth sx={darkBlueTextFieldSx} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Telephone" name="tel" value={form.tel} onChange={handleChangeField} fullWidth sx={darkBlueTextFieldSx} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Cell" name="cell" value={form.cell} onChange={handleChangeField} fullWidth sx={darkBlueTextFieldSx} />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button type="submit" variant="contained" disabled={saving || !selectedId}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </Box>

        {/* ❌ REMOVED: Old message Typography */}
      </Paper>
    </Box>
  );
}
