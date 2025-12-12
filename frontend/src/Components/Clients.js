import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  TextField,
  InputAdornment,
  Divider,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const mainBg = "#f5f5f5";

function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch("http://localhost:3001/api/clients", {
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 401) {
            alert("You are not authorized. Please log in first.");
            navigate("/login");
            setClients([]);
            return;
          }
          setClients([]);
          return;
        }

        const data = await res.json();
        setClients(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching clients:", err);
        setClients([]);
      }
    }

    loadClients();
  }, [navigate]);

  const filteredClients = Array.isArray(clients)
    ? clients.filter((c) =>
        (c.company || "").toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleClientClick = (client) => {
    setSelectedClient(client);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClient(null);
  };

  const handleEditClient = () => {
    if (!selectedClient) return;
    navigate(`/clients/update-company?id=${selectedClient.id}`, {
      state: { clientId: selectedClient.id },
    });
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        p: { xs: 2, md: 3 },
        mt: "72px",
        bgcolor: mainBg,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{
            textTransform: "none",
            fontSize: 14,
            color: "#1976d2",
            "&:hover": { color: "#1565c0", bgcolor: "transparent" },
          }}
        >
          Back to dashboard
        </Button>
      </Box>

      <Box
        sx={{
          mb: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <VisibilityIcon sx={{ fontSize: 28, color: "#1976d2" }} />
        <Typography variant="h5" sx={{ fontWeight: 600, color: "#1a1a1a" }}>
          Registered clients
        </Typography>
        <Box
          sx={{
            ml: "auto",
            display: "flex",
            gap: 1,
            alignItems: "center",
          }}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/clients/new")}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontSize: 14,
              px: 2.5,
              py: 0.75,
              bgcolor: "#1976d2",
              "&:hover": { bgcolor: "#1565c0" },
            }}
          >
            Add client
          </Button>
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              bgcolor: "#1976d2",
              color: "white",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {filteredClients.length}
          </Box>
        </Box>
      </Box>

      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          boxShadow: 1,
          bgcolor: "white",
          maxWidth: 900,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Search clients by company name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#9e9e9e" }} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {filteredClients.length === 0 ? (
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: 1,
            bgcolor: "white",
            maxWidth: 480,
            mx: "auto",
            textAlign: "center",
          }}
        >
          <VisibilityIcon sx={{ fontSize: 40, color: "#9e9e9e", mb: 1.5 }} />
          <Typography
            variant="h6"
            sx={{ color: "#1a1a1a", fontWeight: 600, mb: 0.5 }}
          >
            No clients found
          </Typography>
          <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
            {search
              ? "Try adjusting your search terms."
              : "No clients have been registered yet."}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/clients/new")}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 3,
              py: 0.75,
              fontSize: 14,
            }}
          >
            Add first client
          </Button>
        </Paper>
      ) : (
        <Paper
          sx={{
            borderRadius: 2,
            boxShadow: 1,
            bgcolor: "white",
            maxWidth: 1024,
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: "1px solid #e0e0e0",
              bgcolor: "#fafafa",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "#424242" }}
            >
              Client directory ({filteredClients.length})
            </Typography>
          </Box>

          <List dense sx={{ p: 0 }}>
            {filteredClients.map((client, index) => {
              const company = client?.company || "Unnamed company";
              const initial = company.charAt(0).toUpperCase();

              return (
                <React.Fragment key={client.id}>
                  <ListItem
                    button
                    alignItems="center"
                    onClick={() => handleClientClick(client)}
                    sx={{
                      px: 2,
                      py: 1.25,
                      "&:hover": { bgcolor: "#f5f5f5" },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: "#1a1a1a",
                          fontWeight: 600,
                          color: "#fff",
                          width: 36,
                          height: 36,
                          fontSize: 16,
                        }}
                      >
                        {initial}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 1.5,
                          }}
                        >
                          <Box>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 600, mb: 0.25 }}
                            >
                              {company}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: "#757575" }}
                            >
                              {client.fullname} {client.lastname}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: { xs: "flex-start", sm: "flex-end" },
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ color: "#9e9e9e", mb: 0.25 }}
                            >
                              Contact
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500, color: "#424242" }}
                            >
                              {client.email || "—"}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "#9e9e9e", mt: 0.25 }}
                            >
                              Reg: {client.reg || "—"}
                            </Typography>
                          </Box>

                          <Button
                            variant="outlined"
                            size="small"
                            sx={{
                              borderRadius: 2,
                              textTransform: "none",
                              fontSize: 12,
                              px: 2,
                            }}
                          >
                            View details
                          </Button>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < filteredClients.length - 1 && (
                    <Divider component="li" />
                  )}
                </React.Fragment>
              );
            })}
          </List>
        </Paper>
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 6,
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 2.5,
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Avatar
              sx={{
                bgcolor: "#1a1a1a",
                color: "#fff",
                width: 40,
                height: 40,
                fontWeight: 600,
              }}
            >
              {(selectedClient?.company || "C").charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, color: "#1a1a1a" }}
              >
                {selectedClient?.company}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#757575" }}
              >
                {selectedClient?.fullname} {selectedClient?.lastname}
              </Typography>
            </Box>
            <IconButton size="small" onClick={handleCloseDialog}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography
                variant="subtitle2"
                sx={{ color: "#1976d2", fontWeight: 600, mb: 1 }}
              >
                Contact information
              </Typography>
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: "#9e9e9e" }}>
                  Email
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {selectedClient?.email || "—"}
                </Typography>
              </Box>
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: "#9e9e9e" }}>
                  Telephone
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {selectedClient?.tel || "—"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "#9e9e9e" }}>
                  Cell
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {selectedClient?.cell || "—"}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography
                variant="subtitle2"
                sx={{ color: "#1976d2", fontWeight: 600, mb: 1 }}
              >
                Company details
              </Typography>
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: "#9e9e9e" }}>
                  Registration no.
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {selectedClient?.reg || "—"}
                </Typography>
              </Box>
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: "#9e9e9e" }}>
                  VAT no.
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {selectedClient?.vat || "—"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "#9e9e9e" }}>
                  Number of interns
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {selectedClient?.noi || "—"}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography
                variant="subtitle2"
                sx={{ color: "#1976d2", fontWeight: 600, mb: 1 }}
              >
                Address
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: "#fafafa",
                  borderRadius: 1.5,
                  boxShadow: "none",
                }}
              >
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={6}>
                    <Typography
                      variant="caption"
                      sx={{ color: "#9e9e9e" }}
                    >
                      Street
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selectedClient?.street || "—"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography
                      variant="caption"
                      sx={{ color: "#9e9e9e" }}
                    >
                      Town/City
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selectedClient?.town || "—"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography
                      variant="caption"
                      sx={{ color: "#9e9e9e" }}
                    >
                      Province
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selectedClient?.province || "—"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography
                      variant="caption"
                      sx={{ color: "#9e9e9e" }}
                    >
                      Postal code
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selectedClient?.postalcode || "—"}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1.5,
                }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleCloseDialog}
                  sx={{ textTransform: "none", borderRadius: 2 }}
                >
                  Close
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleEditClient}
                  sx={{ textTransform: "none", borderRadius: 2 }}
                >
                  Edit details
                </Button>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Clients;
