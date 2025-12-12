import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress
} from "@mui/material";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const errs = {};
    if (!form.password) errs.password = "Password required";
    if (!form.confirmPassword) errs.confirmPassword = "Confirm password";
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords must match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      const response = await fetch(
        `http://localhost:3001/api/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: form.password })
        }
      );
      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setErrors({ server: data.message || "Reset failed." });
      }
    } catch (error) {
      setErrors({ server: "Network error: " + error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "transparent" }}>
      <Card sx={{ maxWidth: 440, width: "100%", py: 3, px: 4, boxShadow: "0 6px 18px rgba(25, 118, 210, 0.13)", borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h5" align="center" sx={{ fontWeight: 700, color: "#1976d2", mb: 2 }}>
            Reset Your Password
          </Typography>
          {success ? (
            <Typography color="primary" align="center" sx={{ mt: 4 }}>
              Password has been reset! Redirecting to login...
            </Typography>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}
            >
              <Grid container direction="column" alignItems="center" spacing={2} sx={{ width: "100%" }}>
                <Grid item sx={{ width: "100%" }}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="password"
                    type="password"
                    variant="outlined"
                    value={form.password}
                    onChange={handleChange}
                    error={!!errors.password}
                    helperText={errors.password}
                  />
                </Grid>
                <Grid item sx={{ width: "100%" }}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    variant="outlined"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                  />
                </Grid>
                {errors.server && (
                  <Grid item sx={{ width: "100%" }}>
                    <Typography color="error">{errors.server}</Typography>
                  </Grid>
                )}
                <Grid item sx={{ width: "100%" }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{
                      mt: 2,
                      fontWeight: 700,
                      py: 1.3,
                      borderRadius: 2,
                      textTransform: "none"
                    }}
                    disabled={submitting}
                    endIcon={submitting ? <CircularProgress color="inherit" size={24} /> : null}
                  >
                    {submitting ? "Resetting..." : "Reset Password"}
                  </Button>
                </Grid>
              </Grid>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default ResetPassword;
