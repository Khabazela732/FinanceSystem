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

    if (!form.username) errs.username = "Username required";
    if (!form.fullname) errs.fullname = "Full name required";
    if (!form.lastname) errs.lastname = "Last name required";
    if (!form.company) errs.company = "Company name required";

    if (!form.email) errs.email = "Email required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      errs.email = "Enter valid email";

    if (!form.password) errs.password = "Password required";
    if (!form.confirmPassword) errs.confirmPassword = "Confirm password";
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords must match";

    if (!form.street) errs.street = "Street required";

    if (!form.province) errs.province = "Province required";

    const finalTown =
      form.province === "Mpumalanga" && form.town === "Other"
        ? form.customTown
        : form.town;
    if (!finalTown) errs.town = "Town required";

    if (!form.postalcode) errs.postalcode = "Postal code required";
    else if (!/^\d{4}$/.test(form.postalcode))
      errs.postalcode = "Postal code must be 4 digits";

    if (!form.reg) errs.reg = "Company registration number required";
    if (!form.vat) errs.vat = "VAT number required";

    if (!form.noi) errs.noi = "Number of interns required";
    else if (isNaN(Number(form.noi)) || Number(form.noi) < 1)
      errs.noi = "Number of interns must be a positive number";

    if (!form.tel) errs.tel = "Telephone required";
    if (!form.cell) errs.cell = "Cellphone required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    const finalTown =
      form.province === "Mpumalanga" && form.town === "Other"
        ? form.customTown
        : form.town;

    try {
      const response = await fetch("http://localhost:3001/api/clients/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: form.username,
          fullname: form.fullname,
          lastname: form.lastname,
          company: form.company,
          email: form.email,
          password: form.password,
          street: form.street,
          town: finalTown,
          province: form.province,
          postalcode: form.postalcode,
          reg: form.reg,
          vat: form.vat,
          noi: form.noi,
          tel: form.tel,
          cell: form.cell,
        }),
      });

      if (response.ok) {
        setForm({
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
        setErrors({});
        navigate("/clients");
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Error creating client!");
      }
    } catch (error) {
      alert("Network error: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Shared styling for fields (clean white inputs, dark text, subtle borders)
  const commonFieldSx = {
    mb: 1.5,
    "& .MuiOutlinedInput-root": {
      bgcolor: "#ffffff",
    },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f4f5f7",      // light background
        p: 4,
      }}
    >
      <Card
        sx={{
          maxWidth: 820,
          width: "100%",
          borderRadius: 3,
          bgcolor: "#ffffff",
          color: "#111827",
          boxShadow: "0 18px 45px rgba(15,23,42,0.18)",
          border: "1px solid #e5e7eb",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header row to echo dashboard feel */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 3,
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, color: "#111827", mb: 0.5 }}
              >
                Register HostEmployer
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#6b7280" }}
              >
                Capture company and contact details for the client dashboard.
              </Typography>
            </Box>
          </Box>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", width: "100%" }}
            noValidate
          >
            {/* Section 1 */}
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 1,
                color: "#374151",
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              Account & Contact Person
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={form.username}
                onChange={handleChange}
                error={!!errors.username}
                helperText={errors.username}
                sx={commonFieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircle color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                sx={commonFieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Full Name"
                name="fullname"
                value={form.fullname}
                onChange={handleChange}
                error={!!errors.fullname}
                helperText={errors.fullname}
                sx={commonFieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Last Name"
                name="lastname"
                value={form.lastname}
                onChange={handleChange}
                error={!!errors.lastname}
                helperText={errors.lastname}
                sx={commonFieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                sx={commonFieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                sx={commonFieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Section 2 */}
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 1,
                color: "#374151",
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              Company Details & Address
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField
                fullWidth
                label="Company Name"
                name="company"
                value={form.company}
                onChange={handleChange}
                error={!!errors.company}
                helperText={errors.company}
                sx={commonFieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Tel"
                name="tel"
                value={form.tel}
                onChange={handleChange}
                error={!!errors.tel}
                helperText={errors.tel}
                sx={commonFieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Cell"
                name="cell"
                value={form.cell}
                onChange={handleChange}
                error={!!errors.cell}
                helperText={errors.cell}
                sx={commonFieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneAndroid color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Street Address"
                name="street"
                value={form.street}
                onChange={handleChange}
                error={!!errors.street}
                helperText={errors.street}
                sx={commonFieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Home color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl
                fullWidth
                error={!!errors.province}
                sx={commonFieldSx}
              >
                <InputLabel id="province-label">Province</InputLabel>
                <Select
                  labelId="province-label"
                  label="Province"
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                >
                  {SOUTH_AFRICAN_PROVINCES.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
                {errors.province && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, ml: 1 }}
                  >
                    {errors.province}
                  </Typography>
                )}
              </FormControl>

              {form.province === "Mpumalanga" ? (
                <>
                  <FormControl
                    fullWidth
                    error={!!errors.town}
                    sx={commonFieldSx}
                  >
                    <InputLabel id="town-label">Town</InputLabel>
                    <Select
                      labelId="town-label"
                      label="Town"
                      name="town"
                      value={form.town}
                      onChange={handleChange}
                    >
                      {MPUMALANGA_TOWNS.map((t) => (
                        <MenuItem key={t} value={t}>
                          {t}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.town && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ mt: 0.5, ml: 1 }}
                      >
                        {errors.town}
                      </Typography>
                    )}
                  </FormControl>

                  {form.town === "Other" && (
                    <TextField
                      fullWidth
                      label="Custom Town"
                      name="customTown"
                      value={form.customTown}
                      onChange={handleChange}
                      sx={commonFieldSx}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                </>
              ) : (
                <TextField
                  fullWidth
                  label="Town"
                  name="town"
                  value={form.town}
                  onChange={handleChange}
                  error={!!errors.town}
                  helperText={errors.town}
                  sx={commonFieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              <TextField
                fullWidth
                label="Postal Code"
                name="postalcode"
                value={form.postalcode}
                onChange={handleChange}
                error={!!errors.postalcode}
                helperText={errors.postalcode}
                sx={commonFieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PinDrop color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Company Reg. No"
                name="reg"
                value={form.reg}
                onChange={handleChange}
                error={!!errors.reg}
                helperText={errors.reg}
                sx={commonFieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="VAT No"
                name="vat"
                value={form.vat}
                onChange={handleChange}
                error={!!errors.vat}
                helperText={errors.vat}
                sx={commonFieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Number of Interns"
                name="noi"
                value={form.noi}
                onChange={handleChange}
                error={!!errors.noi}
                helperText={errors.noi}
                sx={commonFieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Groups color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                mt: 3,
              }}
            >
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
                  "&:hover": {
                    bgcolor: "#020617",
                  },
                }}
                endIcon={
                  submitting ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null
                }
              >
                {submitting ? "Submitting..." : "Create Company"}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ClientForm;
