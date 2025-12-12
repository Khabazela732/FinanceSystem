// src/Components/AdminSettings.js
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
} from "@mui/material";
import { useNavigate } from "react-router-dom"; // NEW

const API_BASE = "http://localhost:3001";

export default function AdminSettings() {
  const navigate = useNavigate(); // NEW

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

  // load all host companies for dropdown
  useEffect(() => {
    async function loadClients() {
      setLoadingClients(true);
      setMessage("");
      try {
        const res = await fetch(`${API_BASE}/api/clients`);
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
  }, []);

  // when admin picks a client, prefill form
  useEffect(() => {
    if (!selectedId) return;
    const current = clients.find(
      (c) => String(c.id) === String(selectedId)
    );
    if (!current) return;
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
    setMessage("");
  }, [selectedId, clients]);

  const handleChangeField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setMessage("");
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
      const res = await fetch(`${API_BASE}/api/clients/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Failed to update details.");
      } else {
        setMessage("✔ Company details updated successfully.");
      }
    } catch (err) {
      console.error("Admin update client error", err);
      setMessage("Failed to update details.");
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
      }}
    >
      <Paper
        sx={{
          maxWidth: 900,
          width: "100%",
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
        }}
      >
        {/* Header row with title + back button */}
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

        {/* select company */}
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
            sx={{ mb: 3 }}
          >
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
            {/* all your TextFields unchanged */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Company"
                name="company"
                value={form.company}
                onChange={handleChangeField}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Registration No"
                name="reg"
                value={form.reg}
                onChange={handleChangeField}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Full name"
                name="fullname"
                value={form.fullname}
                onChange={handleChangeField}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Last name"
                name="lastname"
                value={form.lastname}
                onChange={handleChangeField}
                fullWidth
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
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="VAT No"
                name="vat"
                value={form.vat}
                onChange={handleChangeField}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Street"
                name="street"
                value={form.street}
                onChange={handleChangeField}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Town"
                name="town"
                value={form.town}
                onChange={handleChangeField}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Province"
                name="province"
                value={form.province}
                onChange={handleChangeField}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Postal code"
                name="postalcode"
                value={form.postalcode}
                onChange={handleChangeField}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Number of Interns"
                name="noi"
                value={form.noi}
                onChange={handleChangeField}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Telephone"
                name="tel"
                value={form.tel}
                onChange={handleChangeField}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Cell"
                name="cell"
                value={form.cell}
                onChange={handleChangeField}
                fullWidth
              />
            </Grid>
          </Grid>

          <Box
            sx={{
              mt: 3,
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
            }}
          >
            <Button
              type="submit"
              variant="contained"
              disabled={saving || !selectedId}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </Box>

        {message && (
          <Typography
            variant="body2"
            sx={{
              mt: 2,
              color: message.startsWith("✔") ? "success.main" : "error.main",
            }}
          >
            {message}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
