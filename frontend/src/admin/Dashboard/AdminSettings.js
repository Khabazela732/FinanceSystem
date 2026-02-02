import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Backdrop,
  Paper,
  Divider,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  AccountCircle,
  Business,
  Email,
  LocationOn as LocationIcon,
  Phone,
  PhoneAndroid,
  Home,
  PinDrop,
  Groups,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from "@mui/icons-material";

const API_BASE = "http://localhost:3001";

function AdminSettings() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({
    company: "", fullname: "", lastname: "", email: "",
    street: "", town: "", province: "", postalcode: "",
    reg: "", vat: "", noi: "", tel: "", cell: "",
  });
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [blurActive, setBlurActive] = useState(false);

  // Professional blue theme matching your system
  const theme = {
    primary: "#1976d2",
    primaryDark: "#1565c0",
    primaryLight: "#60a5fa",
    textPrimary: "#1a202c",
    textSecondary: "#4a5568",
    success: "#48bb78",
    error: "#f56565",
    bgLight: "#f7fafc",
    border: "#e2e8f0",
  };

  const commonFieldSx = {
    mb: 2.5,
    width: "100%",
    "& .MuiOutlinedInput-root": {
      bgcolor: "#ffffff",
      borderRadius: 2,
      "& fieldset": {
        borderColor: theme.border,
        borderWidth: 2,
      },
      "&:hover fieldset": {
        borderColor: theme.primaryLight,
        borderWidth: 2,
      },
      "&.Mui-focused fieldset": {
        borderColor: theme.primary,
        borderWidth: 2,
      },
    },
    "& .MuiInputLabel-root": {
      color: theme.textSecondary,
      fontWeight: 600,
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

  const handleBack = () => navigate("/clients");

  return (
    <Box sx={{ 
      minHeight: "100vh", 
      bgcolor: "#f8fafc", 
      py: 6, 
      px: { xs: 2, md: 4 }
    }}>
      <Box sx={{ maxWidth: 700, mx: "auto", width: "100%" }}>
        {/* Header Card */}
        <Paper 
          elevation={0} 
          sx={{ 
            mb: 5, 
            p: 4, 
            borderRadius: 3, 
            bgcolor: "white", 
            border: `1px solid ${theme.border}`,
            boxShadow: "0 4px 6px -1px rgba(0, 0,0, 0.1)"
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton 
                onClick={handleBack} 
                sx={{ 
                  color: theme.textSecondary,
                  "&:hover": { bgcolor: theme.bgLight }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 800, 
                    color: theme.textPrimary,
                    mb: 0.5
                  }}
                >
                  Edit Client Details
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ color: theme.textSecondary }}
                >
                  Select a client to update their information ({clients.length} available)
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Client Selection Card */}
        <Card sx={{ 
          mb: 5,
          boxShadow: "0 20px 25px -5px rgba(0, 0,0, 0.1), 0 10px 10px -5px rgba(0, 0,0, 0.04)",
          borderRadius: 3, 
          border: `1px solid ${theme.border}`,
          overflow: "hidden"
        }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 3, 
                fontWeight: 700, 
                color: theme.textPrimary,
                display: "flex", 
                alignItems: "center", 
                gap: 1
              }}
            >
              <Business sx={{ fontSize: 24, color: theme.primary }} />
              Select Client to Edit
            </Typography>
            
            {loadingClients ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress size={40} sx={{ color: theme.primary }} />
              </Box>
            ) : (
              <TextField
                select
                fullWidth
                label="Choose Host Company"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                sx={commonFieldSx}
              >
                <MenuItem value="" disabled>
                  Select a company to edit...
                </MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Business sx={{ fontSize: 20, color: theme.primary }} />
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {client.company}
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                          {client.fullname} (ID: {client.id})
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            )}
          </CardContent>
        </Card>

        {/* Main Edit Form */}
        {selectedId && !loadingClients && (
          <Card sx={{ 
            boxShadow: "0 20px 25px -5px rgba(0, 0,0, 0.1), 0 10px 10px -5px rgba(0, 0,0, 0.04)",
            borderRadius: 3, 
            border: `1px solid ${theme.border}`,
            overflow: "hidden"
          }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
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
              
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 4, 
                  fontWeight: 700, 
                  color: theme.textPrimary,
                  display: "flex", 
                  alignItems: "center", 
                  gap: 1
                }}
              >
                <EditIcon sx={{ fontSize: 24, color: theme.primary }} />
                Update Client Information
              </Typography>

              <Box component="form" onSubmit={handleSubmit} sx={{ opacity: selectedId ? 1 : 0.5, pointerEvents: selectedId ? "auto" : "none" }}>
                {/* Company Section */}
                <Box sx={{ mb: 5 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      mb: 2.5, 
                      fontWeight: 600, 
                      color: theme.textPrimary 
                    }}
                  >
                    Company Details
                  </Typography>
                  
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                    <TextField
                      name="company"
                      label="Company Name"
                      value={form.company}
                      onChange={handleChangeField}
                      sx={commonFieldSx}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Business sx={{ color: theme.primary }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    
                    <Box sx={{ display: "flex", gap: 2.5 }}>
                      <TextField
                        name="reg"
                        label="Company Registration No"
                        value={form.reg}
                        onChange={handleChangeField}
                        sx={{ ...commonFieldSx, flex: 1 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Business sx={{ color: theme.primary }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        name="vat"
                        label="VAT Number"
                        value={form.vat}
                        onChange={handleChangeField}
                        sx={{ ...commonFieldSx, flex: 1 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Business sx={{ color: theme.primary }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ my: 4 }} />

                {/* Contact Section */}
                <Box sx={{ mb: 5 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      mb: 2.5, 
                      fontWeight: 600, 
                      color: theme.textPrimary 
                    }}
                  >
                    Contact Information
                  </Typography>
                  
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                    <TextField
                      name="email"
                      label="Email Address"
                      type="email"
                      value={form.email}
                      onChange={handleChangeField}
                      sx={commonFieldSx}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ color: theme.primary }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    
                    <Box sx={{ display: "flex", gap: 2.5 }}>
                      <TextField
                        name="tel"
                        label="Telephone"
                        value={form.tel}
                        onChange={handleChangeField}
                        sx={{ ...commonFieldSx, flex: 1 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Phone sx={{ color: theme.primary }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        name="cell"
                        label="Cellphone"
                        value={form.cell}
                        onChange={handleChangeField}
                        sx={{ ...commonFieldSx, flex: 1 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneAndroid sx={{ color: theme.primary }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ my: 4 }} />

                {/* Address Section */}
                <Box sx={{ mb: 5 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      mb: 2.5, 
                      fontWeight: 600, 
                      color: theme.textPrimary 
                    }}
                  >
                    Address Details
                  </Typography>
                  
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                    <TextField
                      name="street"
                      label="Street Address"
                      value={form.street}
                      onChange={handleChangeField}
                      sx={commonFieldSx}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Home sx={{ color: theme.primary }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    
                    <Box sx={{ display: "flex", gap: 2.5 }}>
                      <TextField
                        name="town"
                        label="Town/City"
                        value={form.town}
                        onChange={handleChangeField}
                        sx={{ ...commonFieldSx, flex: 1 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationIcon sx={{ color: theme.primary }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        name="province"
                        label="Province"
                        value={form.province}
                        onChange={handleChangeField}
                        sx={{ ...commonFieldSx, flex: 1 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationIcon sx={{ color: theme.primary }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>

                    <Box sx={{ display: "flex", gap: 2.5 }}>
                      <TextField
                        name="postalcode"
                        label="Postal Code"
                        value={form.postalcode}
                        onChange={handleChangeField}
                        sx={{ ...commonFieldSx, flex: 1 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PinDrop sx={{ color: theme.primary }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        name="noi"
                        label="Number of Interns"
                        type="number"
                        value={form.noi}
                        onChange={handleChangeField}
                        sx={{ ...commonFieldSx, flex: 1 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Groups sx={{ color: theme.primary }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
                  <Button
                    onClick={handleBack}
                    variant="outlined"
                    disabled={saving}
                    sx={{
                      flex: 1,
                      minWidth: 140,
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      borderColor: theme.border,
                      color: theme.textSecondary,
                      fontWeight: 600,
                      "&:hover": {
                        borderColor: theme.primary,
                        bgcolor: `${theme.primary}08`,
                      },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving || !selectedId}
                    sx={{
                      flex: 1,
                      minWidth: 140,
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      bgcolor: theme.primary,
                      fontWeight: 700,
                      textTransform: "none",
                      boxShadow: "0 4px 14px 0 rgba(25,118,210,0.4)",
                      "&:hover": {
                        bgcolor: theme.primaryDark,
                        boxShadow: "0 6px 20px 0 rgba(25,118,210,0.5)",
                        transform: "translateY(-1px)",
                      },
                    }}
                    endIcon={saving ? <CircularProgress size={20} sx={{ color: "inherit" }} /> : <SaveIcon />}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </Box>
              </Box>

              {/* Success Snackbar */}
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
                  ✔ Client details updated successfully!
                </Alert>
              </Snackbar>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loadingClients && clients.length === 0 && !selectedId && (
          <Card sx={{
            mt: 5,
            p: 8,
            textAlign: "center",
            borderRadius: 3,
            bgcolor: "#fafbfc",
            border: `2px dashed ${theme.border}`,
          }}>
            <Business sx={{ fontSize: 64, color: `${theme.primary}40`, mb: 3 }} />
            <Typography variant="h6" sx={{ color: theme.textSecondary, mb: 2, fontWeight: 600 }}>
              No clients available
            </Typography>
            <Typography variant="body1" sx={{ color: theme.textSecondary, mb: 4 }}>
              Create some clients first to edit their details
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/clients")}
              sx={{ 
                borderRadius: 2, 
                px: 4, 
                py: 1.5,
                fontWeight: 600,
                bgcolor: theme.primary,
                textTransform: "none"
              }}
            >
              Create New Client
            </Button>
          </Card>
        )}
      </Box>
    </Box>
  );
}

export default AdminSettings;
