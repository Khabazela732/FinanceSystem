import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Pagination,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const mainBg = "#f5f5f5";

function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage] = useState(10);
  const navigate = useNavigate();

  // Safe data access utility
  const safeGet = (obj, path, defaultValue = "—") => {
    return path.split('.').reduce((current, key) => current?.[key], obj) || defaultValue;
  };

  // Format list number for current page
  const getListNumber = (index) => {
    const startIndex = (currentPage - 1) * clientsPerPage + index + 1;
    return startIndex.toString().padStart(2, '0');
  };

  // LOAD LIST OF CLIENTS
  const fetchClients = async () => {
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
  };

  useEffect(() => {
    fetchClients();
  }, [navigate]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // LOAD FULL CLIENT DETAILS
  const loadFullClientDetails = async (clientId) => {
    try {
      setLoadingDetails(true);
      const res = await fetch(`http://localhost:3001/api/clients/${clientId}/details`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          alert("Session expired. Please log in again.");
          navigate("/login");
          return null;
        }
        throw new Error("Failed to load client details");
      }

      const fullClientData = await res.json();
      console.log("✅ FULL CLIENT DETAILS LOADED:", fullClientData);
      return fullClientData;
    } catch (err) {
      console.error("🚨 Error loading full client details:", err);
      alert("Failed to load client details. Showing basic info only.");
      return null;
    } finally {
      setLoadingDetails(false);
    }
  };

  // 🔥 Delete DELETE CLIENT - Deletes EVERYTHING related to client
  const handleDeleteClient = async (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    // 💥 Delete CONFIRMATION
    if (!window.confirm(
      `💥 Delete "${client.company}"?\n\n` +
      `This PERMANENTLY deletes:\n` +
      `• Client account\n` +
      `• ALL invoices\n` +
      `• ALL payment proofs\n` +
      `• ALL notifications\n\n` +
      `This cannot be undone!`
    )) {
      return;
    }

    try {
      console.log(`💥 Initiating Delete for client ID: ${clientId}`);
      
      const res = await fetch(`http://localhost:3001/api/clients/${clientId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          alert("Session expired. Please log in again.");
          navigate("/login");
          return;
        }
        throw new Error(data.message || "Delete failed");
      }

      // ✅ SUCCESS - Refresh list + show detailed message
      alert(`✅ Delete COMPLETE!\n\n${data.message}`);
      fetchClients(); // Refresh entire list
      setDeleteDialog(false);
      setClientToDelete(null);
      
    } catch (err) {
      console.error("💥 Delete ERROR:", err);
      alert(`❌ ${err.message || 'Delete failed. Please try again.'}`);
    }
  };

  const filteredClients = Array.isArray(clients)
    ? clients.filter((c) =>
        safeGet(c, 'company', '').toLowerCase().includes(search.toLowerCase())
      )
    : [];

  // Pagination logic
  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);

  const handleBack = () => {
    navigate("/dashboard");
  };

  // Only View button opens modal
  const handleViewClient = async (client) => {
    const fullDetails = await loadFullClientDetails(client.id);
    setSelectedClient(fullDetails || client);
    setOpenDialog(true);
  };

  // Delete button handler - Opens confirmation dialog
  const handleDeleteClick = (client) => {
    setClientToDelete(client);
    setDeleteDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClient(null);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog(false);
    setClientToDelete(null);
  };

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        p: { xs: 2, md: 3 },
        mt: "72px",
        bgcolor: mainBg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 2, width: "100%", maxWidth: 1400 }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{
            textTransform: "none",
            fontSize: 14,
            color: "#000000",
            "&:hover": { color: "#1565c0", bgcolor: "transparent" },
          }}
        >
          Back to dashboard
        </Button>
      </Box>

      {/* Title & Controls */}
      <Box sx={{ mb: 2.5, display: "flex", alignItems: "center", gap: 1.5, width: "100%", maxWidth: 1400 }}>
        <VisibilityIcon sx={{ fontSize: 28, color: "#1976d2" }} />
        <Typography variant="h5" sx={{ fontWeight: 600, color: "#1a1a1a" }}>
          Registered Clients
        </Typography>
        <Box sx={{ ml: "auto", display: "flex", gap: 1, alignItems: "center" }}>
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
            Add Client
          </Button>
          <Box sx={{ px: 1.5, py: 0.5, bgcolor: "#1976d2", color: "white", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
            {filteredClients.length}
          </Box>
        </Box>
      </Box>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 1, bgcolor: "white", width: "100%", maxWidth: 1400 }}>
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

      {/* Enterprise Table */}
      <Box sx={{ width: "100%", maxWidth: 1400, flexGrow: 1 }}>
        {filteredClients.length === 0 ? (
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 1, bgcolor: "white", mx: "auto", width: "100%", textAlign: "center" }}>
            <VisibilityIcon sx={{ fontSize: 40, color: "#9e9e9e", mb: 1.5 }} />
            <Typography variant="h6" sx={{ color: "#1a1a1a", fontWeight: 600, mb: 0.5 }}>No clients found</Typography>
            <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
              {search ? "Try adjusting your search terms." : "No clients have been registered yet."}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/clients/new")}
              sx={{ borderRadius: 2, textTransform: "none", px: 3, py: 0.75, fontSize: 14 }}
            >
              Add first client
            </Button>
          </Paper>
        ) : (
          <>
            <Paper sx={{ borderRadius: 2, boxShadow: 1, bgcolor: "white", width: "100%", mx: "auto", overflow: "hidden" }}>
              {/* Table Header */}
              <Box sx={{ px: 2, py: 1.5, borderBottom: "2px solid #000000", bgcolor: "#f8f9fa" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#000000", fontSize: "0.9rem" }}>
                  Client Directory ({filteredClients.length} total)
                </Typography>
              </Box>

              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader sx={{ minWidth: 1400 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                      <TableCell sx={{ 
                        border: "1px solid #e0e0e0", 
                        fontWeight: 700, 
                        fontSize: "0.85rem", 
                        color: "#424242",
                        py: 1.25, px: 1.5,
                        width: 60
                      }}>
                        #
                      </TableCell>
                      <TableCell sx={{ 
                        border: "1px solid #e0e0e0", 
                        fontWeight: 700, 
                        fontSize: "0.85rem", 
                        color: "#424242",
                        py: 1.25, px: 1.5,
                        whiteSpace: "nowrap"
                      }}>
                        COMPANY NAME
                      </TableCell>
                      <TableCell sx={{ 
                        border: "1px solid #e0e0e0", 
                        fontWeight: 700, 
                        fontSize: "0.85rem", 
                        color: "#424242",
                        py: 1.25, px: 1.5,
                        whiteSpace: "nowrap"
                      }}>
                        CONTACT PERSON
                      </TableCell>
                      <TableCell sx={{ 
                        border: "1px solid #e0e0e0", 
                        fontWeight: 700, 
                        fontSize: "0.85rem", 
                        color: "#424242",
                        py: 1.25, px: 1.5,
                        whiteSpace: "nowrap"
                      }}>
                        EMAIL ADDRESS
                      </TableCell>
                      <TableCell sx={{ 
                        border: "1px solid #e0e0e0", 
                        fontWeight: 700, 
                        fontSize: "0.85rem", 
                        color: "#424242",
                        py: 1.25, px: 1.5,
                        whiteSpace: "nowrap"
                      }}>
                        CELLPHONE
                      </TableCell>
                      <TableCell sx={{ 
                        border: "1px solid #e0e0e0", 
                        fontWeight: 700, 
                        fontSize: "0.85rem", 
                        color: "#424242",
                        py: 1.25, px: 1.5,
                        whiteSpace: "nowrap"
                      }}>
                        ACTIONS
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentClients.map((client, index) => (
                      <TableRow
                        key={client.id}
                        hover
                        sx={{ 
                          "&:hover": { bgcolor: "#f5f7fa" },
                          "&:last-child td": { borderBottom: "none" }
                        }}
                      >
                        <TableCell sx={{ 
                          border: "1px solid #e0e0e0", 
                          py: 1.2, px: 1.5,
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: "#1976d2",
                          width: 60
                        }}>
                          {getListNumber(index)}
                        </TableCell>
                        <TableCell sx={{ 
                          border: "1px solid #e0e0e0", 
                          py: 1.2, px: 1.5,
                          fontSize: "0.9rem",
                          fontWeight: 600
                        }}>
                          {safeGet(client, 'company')}
                        </TableCell>
                        <TableCell sx={{ 
                          border: "1px solid #e0e0e0", 
                          py: 1.2, px: 1.5,
                          fontSize: "0.85rem"
                        }}>
                          {safeGet(client, 'fullname')} {safeGet(client, 'lastname')}
                        </TableCell>
                        <TableCell sx={{ 
                          border: "1px solid #e0e0e0", 
                          py: 1.2, px: 1.5,
                          fontSize: "0.85rem",
                          color: "#1976d2",
                          fontWeight: 500
                        }}>
                          {safeGet(client, 'email')}
                        </TableCell>
                        <TableCell sx={{ 
                          border: "1px solid #e0e0e0", 
                          py: 1.2, px: 1.5,
                          fontSize: "0.85rem",
                          color: "#1976d2",
                          fontWeight: 500
                        }}>
                          {safeGet(client, 'cell')}
                        </TableCell>
                        <TableCell sx={{ 
                          border: "1px solid #e0e0e0", 
                          py: 1.2, px: 1.5,
                          whiteSpace: "nowrap",
                          display: "flex",
                          gap: 0.5
                        }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleViewClient(client)}
                            sx={{
                              borderRadius: 1.5,
                              textTransform: "none",
                              fontSize: "0.75rem",
                              px: 1.5,
                              minWidth: "auto",
                              borderColor: "#1976d2",
                              color: "#1976d2",
                              flex: 1,
                              "&:hover": {
                                borderColor: "#1565c0",
                                color: "#1565c0",
                                bgcolor: "rgba(25, 118, 210, 0.04)"
                              }
                            }}
                          >
                            View
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DeleteIcon fontSize="small" />}
                            onClick={() => handleDeleteClick(client)}
                            sx={{
                              borderRadius: 1.5,
                              textTransform: "none",
                              fontSize: "0.75rem",
                              px: 1.5,
                              minWidth: "auto",
                              borderColor: "#d32f2f",
                              color: "#d32f2f",
                              flex: 1,
                              "&:hover": {
                                borderColor: "#b71c1c",
                                color: "#b71c1c",
                                bgcolor: "rgba(211, 47, 47, 0.04)"
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ mt: 3, display: "flex", justifyContent: "center", width: "100%" }}>
                <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: "white", boxShadow: 1 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                    siblingCount={1}
                    boundaryCount={1}
                  />
                </Paper>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Extended Client Details Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth 
        PaperProps={{ sx: { borderRadius: 3, boxShadow: 8, maxHeight: "90vh" } }}
      >
        <DialogTitle sx={{ p: 3, borderBottom: "2px solid #1976d2" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ 
              bgcolor: "#1976d2", 
              color: "white", 
              width: 48, 
              height: 48, 
              borderRadius: "50%", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontWeight: 700, 
              fontSize: "1.3rem" 
            }}>
              {safeGet(selectedClient, 'company', 'C').charAt(0).toUpperCase()}
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#1a1a1a" }}>
                {safeGet(selectedClient, 'company')}
              </Typography>
              <Typography variant="h6" sx={{ color: "#757575", fontWeight: 500 }}>
                {safeGet(selectedClient, 'fullname')} {safeGet(selectedClient, 'lastname')}
              </Typography>
            </Box>
            <IconButton size="medium" onClick={handleCloseDialog} sx={{ color: "#666" }}>
              <CloseIcon fontSize="medium" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3, overflowY: "auto" }}>
          {loadingDetails ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography sx={{ color: "#1976d2", fontSize: "1.1rem", mb: 1 }}>Loading client details...</Typography>
            </Box>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3 }}>
              {/* Contact Info */}
              <Paper sx={{ p: 3, bgcolor: "#f8f9fa", borderRadius: 2, boxShadow: 1 }}>
                <Typography variant="h6" sx={{ color: "#1976d2", fontWeight: 600, mb: 2.5 }}>
                  📞 Contact Information
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#9e9e9e", mb: 0.75 }}>Email Address</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "#1a1a1a" }}>{safeGet(selectedClient, 'email')}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#9e9e9e", mb: 0.75 }}>Telephone</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{safeGet(selectedClient, 'tel')}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#9e9e9e", mb: 0.75 }}>Mobile</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{safeGet(selectedClient, 'cell')}</Typography>
                </Box>
              </Paper>

              {/* Company Info */}
              <Paper sx={{ p: 3, bgcolor: "#f8f9fa", borderRadius: 2, boxShadow: 1 }}>
                <Typography variant="h6" sx={{ color: "#1976d2", fontWeight: 600, mb: 2.5 }}>
                  🏢 Company Details
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#9e9e9e", mb: 0.75 }}>Registration Number</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "#1a1a1a" }}>{safeGet(selectedClient, 'reg')}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#9e9e9e", mb: 0.75 }}>VAT Number</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{safeGet(selectedClient, 'vat')}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#9e9e9e", mb: 0.75 }}>Number of Interns</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{safeGet(selectedClient, 'noi')}</Typography>
                </Box>
              </Paper>

              {/* Full Address */}
              <Paper sx={{ p: 3, bgcolor: "#f8f9fa", borderRadius: 2, boxShadow: 1, gridColumn: { xs: "1 / -1", lg: "auto" } }}>
                <Typography variant="h6" sx={{ color: "#1976d2", fontWeight: 600, mb: 2.5 }}>
                  📍 Full Address
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: "#9e9e9e", mb: 0.75 }}>Street Address</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "#1a1a1a" }}>{safeGet(selectedClient, 'street')}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: "#9e9e9e", mb: 0.75 }}>Town / City</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "#1a1a1a" }}>{safeGet(selectedClient, 'town')}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: "#9e9e9e", mb: 0.75 }}>Province</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{safeGet(selectedClient, 'province')}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: "#9e9e9e", mb: 0.75 }}>Postal Code</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{safeGet(selectedClient, 'postalcode')}</Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Action Buttons */}
              <Box sx={{ 
                gridColumn: { xs: "1 / -1" }, 
                mt: 2, 
                display: "flex", 
                justifyContent: "flex-end", 
                gap: 2,
                pt: 2,
                borderTop: "1px solid #e0e0e0"
              }}>
                <Button
                  variant="contained"
                  size="medium"
                  onClick={handleCloseDialog}
                  sx={{ 
                    textTransform: "none", 
                    borderRadius: 2, 
                    px: 4, 
                    py: 1.2,
                    bgcolor: "#1976d2",
                    fontWeight: 600,
                    "&:hover": { bgcolor: "#1565c0" }
                  }}
                >
                  Close
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* 🔥 Delete DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteDialog} onClose={handleCloseDeleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ p: 3, bgcolor: "#ffebee", borderBottom: "2px solid #d32f2f" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ 
              bgcolor: "#d32f2f", 
              color: "white", 
              width: 48, 
              height: 48, 
              borderRadius: "50%", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center" 
            }}>
              <DeleteIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#d32f2f" }}>
                💥 Delete Client
              </Typography>
              <Typography variant="body1" sx={{ color: "#666", fontWeight: 500 }}>
                {safeGet(clientToDelete, 'company')}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography sx={{ mb: 2, lineHeight: 1.6, fontSize: "1.1rem", fontWeight: 500 }}>
            ⚠️ This will PERMANENTLY DELETE:
          </Typography>
          <Box sx={{ mb: 3, pl: 2 }}>
            <Typography variant="body1" sx={{ color: "#d32f2f", fontWeight: 600, mb: 0.5 }}>
              • {safeGet(clientToDelete, 'company')}
            </Typography>
            <Typography variant="body1" sx={{ color: "#d32f2f", fontWeight: 600, mb: 0.5 }}>
              • ALL associated invoices
            </Typography>
            <Typography variant="body1" sx={{ color: "#d32f2f", fontWeight: 600 }}>
              • ALL payment proofs & notifications
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#666", fontWeight: 500, mb: 2, fontStyle: "italic" }}>
            Contact: {safeGet(clientToDelete, 'fullname')} {safeGet(clientToDelete, 'lastname')}
          </Typography>
          <Typography sx={{ color: "#d32f2f", fontWeight: 700, fontSize: "0.9rem" }}>
            This action cannot be undone!
          </Typography>
        </DialogContent>
        <Box sx={{ p: 3, display: "flex", gap: 2, justifyContent: "flex-end", borderTop: "1px solid #e0e0e0" }}>
          <Button
            variant="outlined"
            onClick={handleCloseDeleteDialog}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 3,
              borderColor: "#666",
              color: "#666",
              "&:hover": { borderColor: "#424242", color: "#424242" }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleDeleteClient(clientToDelete?.id)}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 4,
              bgcolor: "#d32f2f",
              fontWeight: 600,
              "&:hover": { bgcolor: "#b71c1c" }
            }}
          >
            Delete Client
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}

export default Clients;
