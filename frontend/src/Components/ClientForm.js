import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  AccountCircle,
  Business,
  Email,
  Lock,
  LocationOn as LocationIcon,
  Phone,
  PhoneAndroid,
  Home,
  PinDrop,
  Groups,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";

const SOUTH_AFRICAN_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

const MPUMALANGA_TOWNS = [
  "Nelspruit",
  "Hazyview",
  "Sabie",
  "Malelane",
  "Lydenburg",
  "Barberton",
  "White River",
  "Other",
];

function ClientForm() {
  const [form, setForm] = useState({
    username: "",
    fullname: "",
    lastname: "",
    company: "",
    email: "",
    password: "",
    confirmPassword: "",
    street: "",
    town: "",
    customTown: "",
    province: "",
    postalcode: "",
    reg: "",
    vat: "",
    noi: "",
    tel: "",
    cell: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "province") {
      setForm((prev) => ({
        ...prev,
        province: value,
        town: "",
        customTown: "",
      }));
      return;
    }

    if (name === "town") {
      setForm((prev) => ({
        ...prev,
        town: value,
        customTown: value === "Other" ? prev.customTown : "",
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errs = {};

    if (!form.username.trim()) errs.username = "Username required";
    if (!form.fullname.trim()) errs.fullname = "First name required";
    if (!form.lastname.trim()) errs.lastname = "Last name required";
    if (!form.company.trim()) errs.company = "Company name required";

    if (!form.email.trim()) errs.email = "Email required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter valid email";

    if (!form.password || form.password.length < 6) errs.password = "Password must be 6+ characters";
    if (!form.confirmPassword) errs.confirmPassword = "Confirm password required";
    else if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords must match";

    if (!form.street.trim()) errs.street = "Street required";
    if (!form.province.trim()) errs.province = "Province required";

    const finalTown = form.province === "Mpumalanga" && form.town === "Other" ? form.customTown : form.town;
    if (!finalTown?.trim()) errs.town = "Town required";

    if (!form.postalcode.trim()) errs.postalcode = "Postal code required";
    else if (!/^\d{4}$/.test(form.postalcode)) errs.postalcode = "Postal code must be 4 digits";

    if (!form.reg.trim()) errs.reg = "Company registration number required";
    if (!form.vat.trim()) errs.vat = "VAT number required";

    if (!form.noi.trim()) errs.noi = "Number of interns required";
    else if (isNaN(Number(form.noi)) || Number(form.noi) < 1) errs.noi = "Must be positive number";

    if (!form.tel.trim()) errs.tel = "Telephone required";
    if (!form.cell.trim()) errs.cell = "Cellphone required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSuccessMessage("");

    if (!validate()) return;

    setSubmitting(true);

    const finalTown = form.province === "Mpumalanga" && form.town === "Other"
      ? form.customTown.trim()
      : form.town.trim();

    try {
      const payload = {
        username: form.username.trim(),
        fullname: form.fullname.trim(),
        lastname: form.lastname.trim(),
        company: form.company.trim(),
        email: form.email.trim(),
        password: form.password,
        street: form.street.trim(),
        town: finalTown,
        province: form.province,
        postalcode: form.postalcode.trim(),
        reg: form.reg.trim(),
        vat: form.vat.trim(),
        noi: parseInt(form.noi) || 1,
        tel: form.tel.trim(),
        cell: form.cell.trim(),
      };

      console.log("🚀 SENDING PAYLOAD:", payload);

      const response = await fetch("http://localhost:3001/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("📡 RESPONSE:", data);

      if (response.ok && data.success) {
        setSuccessMessage(`✅ "${payload.company}" created successfully! Welcome email sent. Redirecting to clients list...`);
        
        setForm({
          username: "", fullname: "", lastname: "", company: "", email: "",
          password: "", confirmPassword: "", street: "", town: "", customTown: "",
          province: "", postalcode: "", reg: "", vat: "", noi: "", tel: "", cell: ""
        });
        setErrors({});

        setTimeout(() => navigate("/clients"), 2500);
      } else {
        setSubmitError(data.message || `Error ${response.status}`);
      }
    } catch (error) {
      console.error("🚨 NETWORK ERROR:", error);
      setSubmitError("Network error - is backend running?");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => navigate("/clients");

  // ✅ UPDATED: Light blue border styling
  const commonFieldSx = {
    mb: 1.5,
    "& .MuiOutlinedInput-root": { 
      bgcolor: "#ffffff",
      "& fieldset": {
        borderColor: "#60a5fa", // Light blue border
        borderWidth: "2px",
      },
      "&:hover fieldset": {
        borderColor: "#3b82f6", // Slightly darker on hover
      },
      "&.Mui-focused fieldset": {
        borderColor: "#2563eb", // Darker blue when focused
        borderWidth: "2px",
      },
    },
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f4f5f7", p: 4 }}>
      <Card sx={{ maxWidth: 820, width: "100%", borderRadius: 3, bgcolor: "#ffffff", color: "#111827", boxShadow: "0 18px 45px rgba(15,23,42,0.18)", border: "1px solid #e5e7eb" }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 3, justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton onClick={handleBack} sx={{ color: "#6b7280", "&:hover": { bgcolor: "#f3f4f6" } }}>
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", mb: 0.5 }}>
                  Register HostEmployer
                </Typography>
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Admin login required. Fields match database exactly.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* SUCCESS & ERROR MESSAGES */}
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError("")}>
              {submitError}
            </Alert>
          )}
          {successMessage && (
            <Alert
              severity="success"
              sx={{ mb: 3, fontSize: "1.1rem", "& .MuiAlert-icon": { fontSize: "1.5rem" } }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  variant="outlined"
                  onClick={() => navigate("/clients")}
                  sx={{ borderRadius: 2, textTransform: "none" }}
                >
                  View Clients List
                </Button>
              }
              onClose={() => setSuccessMessage("")}
            >
              {successMessage}
            </Alert>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", width: "100%" }} noValidate>
            {/* Personal Info */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "#374151", textTransform: "uppercase", letterSpacing: 0.6 }}>
              Account & Contact Person
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              <TextField name="username" label="Username" value={form.username} onChange={handleChange} error={!!errors.username} helperText={errors.username} sx={commonFieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><AccountCircle color="action" /></InputAdornment> }} />
              <TextField name="email" label="Email Address" type="email" value={form.email} onChange={handleChange} error={!!errors.email} helperText={errors.email} sx={commonFieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> }} />
              <TextField name="fullname" label="First Name" value={form.fullname} onChange={handleChange} error={!!errors.fullname} helperText={errors.fullname} sx={commonFieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment> }} />
              <TextField name="lastname" label="Last Name" value={form.lastname} onChange={handleChange} error={!!errors.lastname} helperText={errors.lastname} sx={commonFieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment> }} />
              <TextField name="password" label="Password" type="password" value={form.password} onChange={handleChange} error={!!errors.password} helperText={errors.password} sx={commonFieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment> }} />
              <TextField name="confirmPassword" label="Confirm Password" type="password" value={form.confirmPassword} onChange={handleChange} error={!!errors.confirmPassword} helperText={errors.confirmPassword} sx={commonFieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment> }} />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Company Info */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "#374151", textTransform: "uppercase", letterSpacing: 0.6 }}>
              Company Details & Address
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              <TextField name="company" label="Company Name" value={form.company} onChange={handleChange} error={!!errors.company} helperText={errors.company} sx={commonFieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><Business color="action" /></InputAdornment> }} />
              <TextField name="tel" label="Telephone" value={form.tel} onChange={handleChange} error={!!errors.tel} helperText={errors.tel} sx={commonFieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><Phone color="action" /></InputAdornment> }} />
              <TextField name="cell" label="Cellphone" value={form.cell} onChange={handleChange} error={!!errors.cell} helperText={errors.cell} sx={commonFieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><PhoneAndroid color="action" /></InputAdornment> }} />
              <TextField name="street" label="Street Address" value={form.street} onChange={handleChange} error={!!errors.street} helperText={errors.street} sx={commonFieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><Home color="action" /></InputAdornment> }} />
              
              <FormControl fullWidth error={!!errors.province} sx={commonFieldSx}>
                <InputLabel>Province</InputLabel>
                <Select name="province" value={form.province} onChange={handleChange} label="Province">
                  {SOUTH_AFRICAN_PROVINCES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
                {errors.province && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>{errors.province}</Typography>}
              </FormControl>

              {form.province === "Mpumalanga" ? (
                <>
                  <FormControl fullWidth error={!!errors.town} sx={commonFieldSx}>
                    <InputLabel>Town</InputLabel>
                    <Select name="town" value={form.town} onChange={handleChange} label="Town">
                      {MPUMALANGA_TOWNS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                    {errors.town && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>{errors.town}</Typography>}
                  </FormControl>
                  {form.town === "Other" && (
                    <TextField name="customTown" label="Custom Town" value={form.customTown} onChange={handleChange} sx={commonFieldSx}
                      InputProps={{ startAdornment: <InputAdornment position="start"><LocationIcon color="action" /></InputAdornment> }} />
                  )}
                </>
              ) : (
                <TextField name="town" label="Town" value={form.town} onChange={handleChange} error={!!errors.town} helperText={errors.town} sx={commonFieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LocationIcon color="action" /></InputAdornment> }} />
              )}

              <TextField name="postalcode" label="Postal Code" value={form.postalcode} onChange={handleChange} error={!!errors.postalcode} helperText={errors.postalcode} sx={commonFieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><PinDrop color="action" /></InputAdornment> }} />
              <TextField name="reg" label="Company Reg. No" value={form.reg} onChange={handleChange} error={!!errors.reg} helperText={errors.reg} sx={commonFieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><Business color="action" /></InputAdornment> }} />
              <TextField name="vat" label="VAT No" value={form.vat} onChange={handleChange} error={!!errors.vat} helperText={errors.vat} sx={commonFieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><Business color="action" /></InputAdornment> }} />
              <TextField name="noi" label="Number of Interns" value={form.noi} onChange={handleChange} error={!!errors.noi} helperText={errors.noi} sx={commonFieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><Groups color="action" /></InputAdornment> }} />
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                sx={{
                  minWidth: 180,
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: 999,
                  bgcolor: "#111827",
                  "&:hover": { bgcolor: "#020617" },
                }}
                endIcon={submitting ? <CircularProgress color="inherit" size={20} /> : null}
              >
                {submitting ? "Creating..." : "Create Company"}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ClientForm;
