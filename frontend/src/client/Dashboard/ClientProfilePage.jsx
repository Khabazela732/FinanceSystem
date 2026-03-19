import React from 'react';
import {
  Box, Typography, Paper, Grid, Avatar, IconButton, Button, TextField
} from "@mui/material";
import { 
  Person as PersonIcon,Business as BusinessIcon,   
  BusinessCenter as BusinessCenterIcon,LocationOn as LocationOnIcon,
  LocationCity as LocationCityIcon,Map as MapIcon,
  Email as EmailIcon,Phone as PhoneIcon,
  ContactMail as ContactMailIcon,Close as CloseIcon,Edit as EditIcon
} from "@mui/icons-material";

const ClientProfilePage = ({ 
  client, 
  showProfile, 
  setShowProfile, 
  isEditing, 
  setIsEditing, 
  profileImagePreview, 
  setProfileImagePreview, 
  formData, 
  setFormData 
}) => {
  
  // FieldRow Component
  const FieldRow = ({ icon, label, value, editing, onChange, type = "text" }) => (
    <Grid item xs={12}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
        <Box sx={{ 
          width: 48, height: 48, borderRadius: 2.5,
          bgcolor: "rgba(30,58,138,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          {icon}
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="caption" fontWeight={600} sx={{ color: "#64748b", mb: 1 }}>
            {label}
          </Typography>
          {editing ? (
            <TextField
              fullWidth
              size="small"
              type={type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "white" } }}
            />
          ) : (
            <Typography variant="body1" fontWeight={700} sx={{ color: "#1e293b" }}>
              {value}
            </Typography>
          )}
        </Box>
      </Box>
    </Grid>
  );

  if (!showProfile) return null;

  return (
    <>
      {/* FULL SCREEN OVERLAY */}
      <Box sx={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 1300, backdropFilter: "blur(25px) saturate(180%)",
        background: "rgba(0,0,0,0.8)"
      }} />

      {/* CENTERED PROFILE PAGE */}
      <Box sx={{
        position: "fixed", top: 72, left: "50%", transform: "translateX(-50%)",
        width: { xs: "95vw", sm: 700, md: 850, lg: 1000 }, maxWidth: "95vw",
        minHeight: "calc(100vh - 72px)", bgcolor: "white",
        borderRadius: "16px", boxShadow: "0 40px 140px rgba(0,0,0,0.5)",
        display: "flex", flexDirection: "column", zIndex: 1301,
        overflow: "visible"
      }}>
        {/* HEADER */}
        <Box sx={{ 
          p: { xs: 3, md: 4 }, 
          background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)",
          color: "white", position: "relative", borderRadius: "16px 16px 0 0"
        }}>
          <Box sx={{ position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)", opacity: 0.15, fontSize: { xs: "3rem", md: "4rem" } }}>
            <PersonIcon />
          </Box>
          <IconButton onClick={() => { setShowProfile(false); setIsEditing(false); }} sx={{ position: "absolute", top: 20, right: 20, color: "white", width: 48, height: 48, bgcolor: "rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}>
            <CloseIcon sx={{ fontSize: 22 }} />
          </IconButton>
          
          <Avatar src={profileImagePreview || client?.profile_image} sx={{ width: { xs: 90, sm: 110 }, height: { xs: 90, sm: 110 }, mx: "auto", mt: { xs: 1, sm: 2 }, display: "block", border: "5px solid rgba(255,255,255,0.4)", fontSize: { xs: "2rem", sm: "2.5rem" }, fontWeight: 800, bgcolor: "rgba(255,255,255,0.25)", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
            {(client?.fullname || client?.company || "C")?.charAt(0).toUpperCase()}
          </Avatar>

          <IconButton component="label" sx={{ position: "absolute", bottom: -15, right: "50%", transform: "translateX(50%)", width: 44, height: 44, bgcolor: "white", color: "#1e3a8a", boxShadow: "0 10px 30px rgba(0,0,0,0.3)", border: "3px solid white", "&:hover": { bgcolor: "#f8fafc" } }}>
            <input type="file" hidden accept="image/*" onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  setProfileImagePreview(reader.result);
                  setFormData(prev => ({...prev, profile_image: reader.result}));
                };
                reader.readAsDataURL(file);
              }
            }} />
            <EditIcon sx={{ fontSize: 18 }} />
          </IconButton>

          <Box sx={{ textAlign: "center", mt: { xs: 6, md: 8 } }}>
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.5px", fontSize: { xs: "1.6rem", md: "2.2rem" } }}>
              {client?.fullname || "Client Profile"}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontSize: { xs: "1rem", md: "1.3rem" }, mt: 0.5 }}>
              {client?.company || "Company Name"}
            </Typography>
          </Box>
        </Box>

        {/* CONTENT */}
        <Box sx={{ flex: 1, p: { xs: 3, md: 5 }, pb: 20, overflowY: "auto", bgcolor: "#f8fafc" }}>
          <Box sx={{ mb: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h5" fontWeight={800} sx={{ color: "#1e293b" }}>Profile Details</Typography>
            <Button variant={isEditing ? "outlined" : "contained"} startIcon={isEditing ? <CloseIcon /> : <EditIcon />} onClick={() => {
              if (isEditing) { setIsEditing(false); console.log("SAVING:", formData); } 
              else { setIsEditing(true); setFormData(client || {}); }
            }} sx={{ fontWeight: 700, px: 4 }}>
              {isEditing ? "Cancel Edit" : "Edit Profile"}
            </Button>
          </Box>

          <Grid container spacing={4}>
            {/* Company Section */}
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 4, borderRadius: 3, bgcolor: "white", boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
                  <Box sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: "rgba(30,58,138,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <BusinessIcon sx={{ fontSize: 28, color: "#1e3a8a" }} />
                  </Box>
                  <Typography variant="h6" fontWeight={800} sx={{ color: "#1e293b" }}>Company Information</Typography>
                </Box>
                <Grid container spacing={3}>
                  <FieldRow icon={<BusinessCenterIcon />} label="Company Name" value={formData.company || client?.company || "N/A"} editing={isEditing} onChange={(value) => setFormData({...formData, company: value})} />
                  <FieldRow icon={<LocationOnIcon />} label="Street Address" value={formData.street || client?.street || "N/A"} editing={isEditing} onChange={(value) => setFormData({...formData, street: value})} />
                  <FieldRow icon={<LocationCityIcon />} label="Town / City" value={formData.town || client?.town || "N/A"} editing={isEditing} onChange={(value) => setFormData({...formData, town: value})} />
                  <FieldRow icon={<MapIcon />} label="Province" value={formData.province || client?.province || "N/A"} editing={isEditing} onChange={(value) => setFormData({...formData, province: value})} />
                </Grid>
              </Paper>
            </Grid>

            {/* Contact Section */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 4, borderRadius: 3, bgcolor: "white", boxShadow: "0 10px 40px rgba(0,0,0,0.08)", height: "fit-content" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
                  <Box sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: "rgba(30,58,138,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ContactMailIcon sx={{ fontSize: 28, color: "#1e3a8a" }} />
                  </Box>
                  <Typography variant="h6" fontWeight={800} sx={{ color: "#1e293b" }}>Contact Details</Typography>
                </Box>
                <Grid container spacing={3}>
                  <FieldRow icon={<EmailIcon />} label="Email Address" value={formData.email || client?.email || "N/A"} editing={isEditing} onChange={(value) => setFormData({...formData, email: value})} type="email" />
                  <FieldRow icon={<PhoneIcon />} label="Phone Number" value={formData.phone || client?.phone || "N/A"} editing={isEditing} onChange={(value) => setFormData({...formData, phone: value})} />
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* ACTION BAR */}
        <Box sx={{ position: "sticky", bottom: 0, p: 4, borderTop: "1px solid #e2e8f0", backgroundColor: "white", display: "flex", gap: 3, justifyContent: "flex-end", zIndex: 10 }}>
          <Button variant="outlined" onClick={() => { setShowProfile(false); setIsEditing(false); }} sx={{ fontWeight: 700, px: 4 }}>Close</Button>
          {isEditing && (
            <Button variant="contained" onClick={() => { console.log("SAVING:", formData); setIsEditing(false); }} sx={{ fontWeight: 800, px: 6 }}>Save Changes</Button>
          )}
        </Box>
      </Box>
    </>
  );
};

export default ClientProfilePage;
