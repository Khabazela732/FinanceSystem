import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Typography,
  Button,
  CircularProgress,
  Breadcrumbs,
  Link,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

const mainBg = "#f8f9fa";
const primaryBlue = "#1976d2";
const darkText = "#1a1a1a";

const inputStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: "white",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "divider",
      borderWidth: 1.5,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: primaryBlue,
      borderWidth: 1.5,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: primaryBlue,
      borderWidth: 1.5,
      boxShadow: `0 0 0 2px ${primaryBlue}22`,
    },
  },
  "& .MuiInputLabel-root": {
    fontWeight: 600,
    color: darkText,
    fontSize: "0.9rem",
  },
};

export default function ClientUpdateCompany() {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const idFromQuery = searchParams.get("id");
  const idFromState = location.state && location.state.clientId;
  const clientId = idFromState || idFromQuery;

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    if (!clientId) {
      setError("Missing client id");
      setLoading(false);
      return;
    }

    async function loadClient() {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:3001/api/clients", {
          credentials: "include",
        });
        const data = await res.json();
        const current = Array.isArray(data)
          ? data.find((c) => String(c.id) === String(clientId))
          : null;
        if (!current) {
          setError("Client not found");
        } else {
          setForm({
            company: current.company || "",
            fullname: current.fullname || "",
            lastname: current.lastname || "",
            email: current.email || "",
            street: current.street || "",
            town: current.town || "",
            province: current.province || "",
            postalcode: current.postalcode || "",
            reg: current.reg || "",
            vat: current.vat || "",
            noi: current.noi || "",
            tel: current.tel || "",
            cell: current.cell || "",
          });
        }
      } catch (e) {
        console.error("Load client error", e);
        setError("Failed to load details");
      } finally {
        setLoading(false);
      }
    }

    loadClient();
  }, [clientId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(
        `http://localhost:3001/api/clients/${clientId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to update details");
      } else {
        setSuccess("Details updated successfully.");
        setSnackbarOpen(true);
      }
    } catch (e) {
      console.error("Update error", e);
      setError("Failed to update details");
    } finally {
      setSaving(false);
    }
  };

  const handleSnackbarClose = (_event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: mainBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: mainBg,
        display: "flex",
        justifyContent: "center",
        p: { xs: 2.5, md: 4 },
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 960 }}>
        <Breadcrumbs sx={{ mb: 2, color: "#666" }}>
          <Link
            underline="hover"
            sx={{
              cursor: "pointer",
              color: primaryBlue,
              fontWeight: 600,
              "&:hover": { color: "#1565c0" },
            }}
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </Link>
          <Link
            underline="hover"
            sx={{
              cursor: "pointer",
              color: primaryBlue,
              fontWeight: 600,
              "&:hover": { color: "#1565c0" },
            }}
            onClick={() => navigate("/clients")}
          >
            Clients
          </Link>
          <Typography sx={{ fontWeight: 600, color: darkText }}>
            Update Company
          </Typography>
        </Breadcrumbs>

        <Paper
          elevation={3}
          sx={{
            borderRadius: 3,
            boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
            p: { xs: 3, md: 4 },
            bgcolor: "white",
          }}
        >
          <Box
            sx={{
              mb: 2.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            <Box>
              <Typography
                variant="h5"
                fontWeight={700}
                sx={{ color: darkText, mb: 0.5 }}
              >
                Update company details
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary" }}
              >
                Edit client company and contact information to keep records accurate.
              </Typography>
            </Box>
            <Button
              variant="text"
              onClick={() => navigate(-1)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: primaryBlue,
              }}
            >
              Back
            </Button>
          </Box>

          <Divider sx={{ mb: 2.5 }} />

          {error && (
            <Typography color="error" sx={{ mb: 1.5, fontWeight: 500 }}>
              {error}
            </Typography>
          )}
          {success && (
            <Typography color="primary" sx={{ mb: 1.5, fontWeight: 500 }}>
              {success}
            </Typography>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            }}
          >
            <TextField
              label="Company"
              name="company"
              value={form.company}
              onChange={handleChange}
              fullWidth
              sx={inputStyle}
            />
            <TextField
              label="Registration No"
              name="reg"
              value={form.reg}
              onChange={handleChange}
              fullWidth
              sx={inputStyle}
            />
            <TextField
              label="Full name"
              name="fullname"
              value={form.fullname}
              onChange={handleChange}
              fullWidth
              sx={inputStyle}
            />
            <TextField
              label="Last name"
              name="lastname"
              value={form.lastname}
              onChange={handleChange}
              fullWidth
              sx={inputStyle}
            />
            <TextField
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
              fullWidth
              sx={inputStyle}
            />
            <TextField
              label="VAT No"
              name="vat"
              value={form.vat}
              onChange={handleChange}
              fullWidth
              sx={inputStyle}
            />
            <TextField
              label="Street"
              name="street"
              value={form.street}
              onChange={handleChange}
              fullWidth
              sx={inputStyle}
            />
            <TextField
              label="Town"
              name="town"
              value={form.town}
              onChange={handleChange}
              fullWidth
              sx={inputStyle}
            />
            <TextField
              label="Province"
              name="province"
              value={form.province}
              onChange={handleChange}
              fullWidth
              sx={inputStyle}
            />
            <TextField
              label="Postal code"
              name="postalcode"
              value={form.postalcode}
              onChange={handleChange}
              fullWidth
              sx={inputStyle}
            />
            <TextField
              label="Number of interns"
              name="noi"
              value={form.noi}
              onChange={handleChange}
              fullWidth
              sx={inputStyle}
            />
            <TextField
              label="Telephone"
              name="tel"
              value={form.tel}
              onChange={handleChange}
              fullWidth
              sx={inputStyle}
            />
            <TextField
              label="Cell"
              name="cell"
              value={form.cell}
              onChange={handleChange}
              fullWidth
              sx={inputStyle}
            />

            <Box
              sx={{
                gridColumn: { xs: "1 / -1", md: "1 / -1" },
                display: "flex",
                justifyContent: "space-between",
                mt: 2,
                gap: 1.5,
              }}
            >
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate(-1)}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                {saving ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <CircularProgress size={18} color="inherit" />
                    Saving...
                  </Box>
                ) : (
                  "Save changes"
                )}
              </Button>
            </Box>
          </Box>
        </Paper>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3500}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity="success"
            variant="filled"
            sx={{ width: "100%" }}
          >
            Details updated successfully.
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}
