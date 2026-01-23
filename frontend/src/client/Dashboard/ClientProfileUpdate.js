import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Container,
  Alert,
  Stack,
  CircularProgress,
  Backdrop,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3001";

export default function ClientProfileUpdate() {
  const navigate = useNavigate();

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

  /* ============================
     LOAD LOGGED-IN CLIENT PROFILE
  ============================ */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/client/me`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (res.status === 401) {
          navigate("/clients/login");
          return;
        }

        if (res.status === 404) {
          setError("Your profile was not found.");
          return;
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        setForm({
          company: data.company ?? "",
          fullname: data.fullname ?? "",
          lastname: data.lastname ?? "",
          email: data.email ?? "",
          street: data.street ?? "",
          town: data.town ?? "",
          province: data.province ?? "",
          postalcode: data.postalcode ?? "",
          reg: data.reg ?? "",
          vat: data.vat ?? "",
          noi: data.noi ?? "",
          tel: data.tel ?? "",
          cell: data.cell ?? "",
        });
      } catch (err) {
        console.error("Profile load error:", err);
        setError("Unable to load your profile. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  /* ============================
     SUBMIT PROFILE UPDATE
  ============================ */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`${API_BASE}/api/client/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (res.status === 401) {
        navigate("/clients/login");
        return;
      }

      if (!res.ok) {
        throw new Error("Update failed");
      }

      navigate("/clientDashboard");
    } catch (err) {
      console.error("Update error:", err);
      setError("Unable to update details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ============================
     LOADING STATE
  ============================ */
  if (loading) {
    return (
      <Backdrop open sx={{ bgcolor: "#f8f9fa", zIndex: 9999 }}>
        <Stack spacing={3} alignItems="center">
          <CircularProgress size={48} sx={{ color: "#1976d2" }} />
          <Typography fontWeight={500}>Loading your profile…</Typography>
        </Stack>
      </Backdrop>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9fa", py: 8 }}>
      <Container maxWidth="sm">
        <Paper elevation={12} sx={{ borderRadius: 4, p: 6 }}>
          <Typography variant="h3" fontWeight={900} mb={1}>
            Update Profile
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            {Object.entries(form).map(([key, value]) => (
              <TextField
                key={key}
                fullWidth
                label={key.toUpperCase()}
                name={key}
                value={value}
                onChange={handleChange}
                sx={fieldStyle}
              />
            ))}

            <Stack direction="row" justifyContent="space-between" mt={4}>
  <Button
    variant="outlined"
    startIcon={<ArrowBackIcon />}
    onClick={() => navigate("/clients/ClientDashboard")}  // ✅ START WITH /
    sx={navButton}
  >
    Back
  </Button>

              <Button type="submit" variant="contained" enabled={saving} sx={primaryButton}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

/* ============================
   STYLES
============================ */
const fieldStyle = { mb: 2 };
const primaryButton = { px: 4, py: 1.4, fontWeight: 700 };
const navButton = { fontWeight: 600 };
