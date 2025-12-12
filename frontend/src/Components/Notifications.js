import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, List, ListItem, ListItemText, IconButton,
  Breadcrumbs, Link, Divider, CircularProgress, Badge, Stack, Container,
  Modal, Fade, Backdrop, Button, Alert
} from "@mui/material";
import {
  Home as HomeIcon, 
  ArrowBackIosNew as ArrowBackIcon,
  ArrowForwardIos as ArrowForwardIcon,
  NotificationsNone as NotificationsIcon,
  Close as CloseIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:3001/api/notifications", {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch notifications");
        const data = await res.json();
        setNotifications(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    setModalOpen(true);
  };

  const handleMarkAsRead = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/notifications/${id}/read`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark notification as read");
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, viewed: 1 } : notif
        )
      );
      if (selectedNotification?.id === id) {
        setSelectedNotification({ ...selectedNotification, viewed: 1 });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => n.viewed === 0).length;
  const sortedNotifications = [...notifications].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  if (loading) {
    return (
      <Box sx={{ 
        height: "100vh", 
        display: "flex", 
        flexDirection: "column",
        justifyContent: "center", 
        alignItems: "center", 
        bgcolor: "#f8f9fa" 
      }}>
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          Loading notifications...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        minHeight: "100vh", 
        bgcolor: "#f8f9fa", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        p: 4
      }}>
        <Paper sx={{ p: 6, borderRadius: 3, textAlign: "center" }}>
          <Typography variant="h5" color="error" gutterBottom>
            ❌ Error loading notifications
          </Typography>
          <Typography color="textSecondary">
            {error}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: "100vh", 
      bgcolor: "#f8f9fa", 
      py: 6, 
      px: { xs: 2, md: 4 }
    }}>
      <Container maxWidth="md">
        <Paper
          elevation={12}
          sx={{
            borderRadius: 4,
            p: { xs: 4, md: 6 },
            boxShadow: "0 24px 72px rgba(0,0,0,0.15)",
            transition: "all 0.3s ease",
            "&:hover": {
              boxShadow: "0 32px 88px rgba(0,0,0,0.2)",
              transform: "translateY(-4px)",
            },
            minHeight: "80vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Navigation Bar */}
          <Stack direction="row" alignItems="center" spacing={1} mb={4}>
            <IconButton 
              onClick={() => navigate(-1)}
              sx={{ 
                bgcolor: "#fafafa",
                "&:hover": { bgcolor: "#f0f0f0", transform: "scale(1.05)" }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <IconButton 
              onClick={() => navigate(1)}
              sx={{ 
                bgcolor: "#fafafa",
                "&:hover": { bgcolor: "#f0f0f0", transform: "scale(1.05)" }
              }}
            >
              <ArrowForwardIcon />
            </IconButton>
            <IconButton 
              onClick={() => navigate("/dashboard")}
              sx={{ 
                bgcolor: "#fafafa",
                "&:hover": { bgcolor: "#f0f0f0", transform: "scale(1.05)" }
              }}
            >
              <HomeIcon />
            </IconButton>
          </Stack>

          {/* Breadcrumbs */}
          <Breadcrumbs sx={{ mb: 4, color: "#666" }}>
            <Link 
              underline="hover" 
              sx={{ 
                cursor: "pointer", 
                color: "#1976d2",
                fontWeight: 600,
                "&:hover": { color: "#1565c0" }
              }}
              onClick={() => navigate("/dashboard")}
            >
              🏠 Dashboard
            </Link>
            <Typography sx={{ fontWeight: 700, color: "#1a1a1a" }}>
              Notifications
            </Typography>
          </Breadcrumbs>

          {/* Header */}
          <Stack direction="row" alignItems="center" mb={4}>
            <Badge 
              badgeContent={unreadCount} 
              color="error"
              sx={{ mr: 2 }}
              invisible={unreadCount === 0}
            >
              <NotificationsIcon sx={{ fontSize: 32, color: "#1976d2" }} />
            </Badge>
            <Box>
              <Typography variant="h3" fontWeight={500} sx={{ color: "#1a1a1a" }}>
                🔔 Your Notifications
              </Typography>
              <Typography variant="h6" sx={{ color: "#666", mt: 0.5 }}>
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ mb: 4 }} />

          {/* Notifications List */}
          {sortedNotifications.length === 0 ? (
            <Paper sx={{ 
              p: 8, 
              textAlign: "center", 
              borderRadius: 3, 
              bgcolor: "#fafafa",
              border: "2px dashed #e0e0e0"
            }}>
              <NotificationsIcon sx={{ fontSize: 64, color: "#ccc", mb: 3 }} />
              <Typography variant="h5" sx={{ color: "#666", mb: 1 }}>
                No notifications yet
              </Typography>
              <Typography color="textSecondary">
                Sent invoices and other updates will appear here.
              </Typography>
            </Paper>
          ) : (
            <Paper sx={{ 
              flexGrow: 1, 
              borderRadius: 3, 
              overflow: "hidden",
              bgcolor: "#fafafa",
              border: "1px solid #e8e8e8"
            }}>
              <List sx={{ p: 0, height: "400px", overflow: "auto" }}>
                {sortedNotifications.map((item) => (
                  <ListItem
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    sx={{
                      borderRadius: 3,
                      mb: 2,
                      mx: 2,
                      cursor: "pointer",
                      bgcolor: item.viewed === 0 
                        ? "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)"
                        : "#ffffff",
                      boxShadow: item.viewed === 0 
                        ? "0 4px 16px rgba(25, 118, 210, 0.2)"
                        : "0 2px 8px rgba(0,0,0,0.08)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: item.viewed === 0 
                          ? "0 8px 24px rgba(25, 118, 210, 0.3)"
                          : "0 4px 12px rgba(0,0,0,0.12)",
                      },
                      borderLeft: item.viewed === 0 
                        ? "4px solid #1976d2" 
                        : "4px solid transparent",
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: item.viewed === 0 ? "bold" : "normal",
                            color: item.viewed === 0 ? "#1a1a1a" : "#888",
                            lineHeight: 1.4
                          }}
                        >
                          {item.message}
                        </Typography>
                      }
                      secondary={
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: "#666",
                            fontSize: "0.9rem",
                            mt: 0.5
                          }}
                        >
                          📅 {new Date(item.created_at).toLocaleString()}
                          {item.viewed === 0 && (
                            <Typography 
                              component="span" 
                              sx={{ 
                                ml: 1, 
                                color: "#1976d2",
                                fontWeight: 600,
                                fontSize: "0.8rem"
                              }}
                            >
                              • New
                            </Typography>
                          )}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Paper>
      </Container>

      {/* Notification Detail Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 300,
          },
        }}
      >
        <Fade in={modalOpen}>
          <Paper
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { xs: "95%", sm: 600 },
              maxHeight: "80vh",
              bgcolor: "white",
              borderRadius: 4,
              boxShadow: "0 24px 72px rgba(0,0,0,0.3)",
              p: { xs: 4, md: 6 },
              outline: "none",
              overflowY: "auto",
            }}
          >
            {selectedNotification && (
              <>
                <Stack 
                  direction="row" 
                  justifyContent="space-between" 
                  alignItems="center" 
                  mb={4}
                >
                  <Typography variant="h4" fontWeight={900} sx={{ color: "#1a1a1a" }}>
                    📢 Notification
                  </Typography>
                  <IconButton
                    onClick={() => setModalOpen(false)}
                    sx={{
                      bgcolor: "#fafafa",
                      "&:hover": { bgcolor: "#f0f0f0" }
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Stack>

                <Alert 
                  severity={selectedNotification.viewed === 0 ? "info" : "success"}
                  sx={{ mb: 4, fontSize: "1.1rem" }}
                >
                  {selectedNotification.message}
                </Alert>

                <Divider sx={{ my: 3 }} />

                <Stack direction="row" spacing={2} justifyContent="space-between">
                  <Typography variant="body1" color="textSecondary">
                    📅 {new Date(selectedNotification.created_at).toLocaleString()}
                  </Typography>
                  
                  <Button
                    variant="contained"
                    onClick={() => {
                      handleMarkAsRead(selectedNotification.id);
                      setModalOpen(false);
                    }}
                    disabled={selectedNotification.viewed === 1}
                    sx={{
                      fontWeight: 700,
                      borderRadius: 2,
                      px: 4,
                      bgcolor: selectedNotification.viewed === 1 ? "#ccc" : "#1976d2",
                    }}
                  >
                    {selectedNotification.viewed === 1 ? "✓ Read" : "Mark as Read"}
                  </Button>
                </Stack>
              </>
            )}
          </Paper>
        </Fade>
      </Modal>
    </Box>
  );
}

export default Notifications;
