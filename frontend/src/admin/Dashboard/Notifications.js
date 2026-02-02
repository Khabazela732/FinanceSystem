import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Badge, IconButton, Chip,
  TablePagination, Button, Divider, Alert
} from "@mui/material";
import {
  Home as HomeIcon, 
  ArrowBack as ArrowBackIcon,
  Notifications as NotificationsIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // VIEW OVERLAY STATE
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);

  // 🔥 OPTIMIZED FETCH WITH CALLBACK
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:3001/api/notifications", {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      
      const unread = Array.isArray(data) ? data.filter(n => n.viewed === 0).length : 0;
      setUnreadCount(unread);
      setNotifications(Array.isArray(data) ? data : []);
      setPage(0);
    } catch (err) {
      console.error("Fetch notifications error:", err);
      setError(err.message);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/notifications/${id}/read`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark notification as read");

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, viewed: 1 } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Mark as read error:", err);
      fetchNotifications(); // Refresh on error
    }
  };

  // OPEN OVERLAY + AUTO MARK AS READ
  const handleViewNotification = (notification) => {
    setSelectedNotification(notification);
    setViewOpen(true);

    // AUTO MARK AS READ when viewing
    if (notification.viewed === 0) {
      handleMarkAsRead(notification.id);
    }
  };

  const handleCloseView = () => {
    setViewOpen(false);
    setSelectedNotification(null);
  };

  const handleRowClick = (notification) => {
    handleViewNotification(notification);
  };

  const sortedNotifications = [...notifications].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  const paginatedNotifications = sortedNotifications.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading && notifications.length === 0) {
    return (
      <Box sx={{ 
        minHeight: "100vh", 
        bgcolor: "#f8f9fa", 
        display: "flex", 
        flexDirection: "column",
        justifyContent: "center", 
        alignItems: "center", 
        p: 4 
      }}>
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          Loading notifications...
        </Typography>
      </Box>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <Box sx={{ 
        minHeight: "100vh", 
        bgcolor: "#f8f9fa", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        p: 4
      }}>
        <Paper sx={{ p: 6, borderRadius: 3, textAlign: "center", maxWidth: 500 }}>
          <Typography variant="h5" color="error" gutterBottom>
            ❌ Error loading notifications
          </Typography>
          <Typography color="textSecondary" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={fetchNotifications}
            sx={{ borderRadius: 2 }}
            startIcon={<RefreshIcon />}
          >
            Retry
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: "100vh", 
      bgcolor: "#f8f9fa", 
      py: 4, 
      px: { xs: 2, md: 4 },
      position: "relative",
      overflow: "hidden"
    }}>
      {/* 🔵 VIEW OVERLAY */}
      {viewOpen && selectedNotification && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 1300,
            backdropFilter: "blur(6px)",
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={handleCloseView}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              width: { xs: "90%", sm: 500 },
              maxWidth: "90vw",
              maxHeight: "80vh",
              bgcolor: "white",
              borderRadius: 3,
              boxShadow: "0 24px 72px rgba(0,0,0,0.4)",
              p: 3,
              transform: "scale(1)",
              animation: "notifZoomIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <NotificationsIcon sx={{ color: "#1976d2" }} />
                <Typography variant="h6" fontWeight={700}>
                  Notification Details
                </Typography>
              </Box>
              <IconButton onClick={handleCloseView} size="small" sx={{ color: "#666" }}>
                <ArrowBackIcon />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Message */}
            <Box sx={{ 
              mb: 3, 
              maxHeight: 300,
              overflowY: "auto",
              p: 2,
              bgcolor: "#f8f9fa",
              borderRadius: 2,
              border: "1px solid #e0e0e0"
            }}>
              <Typography sx={{ 
                lineHeight: 1.6, 
                fontSize: "1.1rem",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                whiteSpace: "pre-wrap",
              }}>
                {selectedNotification.message}
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              📅 {new Date(selectedNotification.created_at).toLocaleString("en-ZA")}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <CheckCircleIcon sx={{ color: "#4caf50", fontSize: 24 }} />
              <Typography variant="body2" sx={{ color: "#4caf50", fontWeight: 600 }}>
                Marked as read
              </Typography>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleCloseView}
                sx={{ borderRadius: 2, textTransform: "none" }}
              >
                Close
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* 🔥 HEADER WITH REFRESH BUTTON */}
      <Paper 
        sx={{ 
          bgcolor: "#2464a3", 
          color: "white", 
          p: { xs: 2, md: 3 }, 
          borderRadius: 0,
          mb: 4,
          position: "sticky",
          top: 0,
          zIndex: 10
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => navigate("/dashboard")} sx={{ color: "white" }}>
            <HomeIcon />
          </IconButton>
          <IconButton onClick={() => navigate(-1)} sx={{ color: "white" }}>
            <ArrowBackIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" fontWeight={700} sx={{ color: "white" }}>
              Notification History
            </Typography>
            <Typography sx={{ opacity: 0.9 }}>
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
            </Typography>
          </Box>
          
          {/* 🔥 REFRESH BUTTON + NOTIFICATION BADGE */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* REFRESH BUTTON */}
            <IconButton 
              onClick={fetchNotifications}
              disabled={loading}
              size="large"
              sx={{ 
                color: loading ? "grey.400" : "white",
                borderRadius: 2,
                p: 1.5,
                position: "relative",
                "&:hover": { 
                  bgcolor: loading ? "transparent" : "rgba(255,255,255,0.2)",
                  transform: "scale(1.05)"
                }
              }}
              title={loading ? "Refreshing..." : "Refresh notifications"}
            >
              {loading ? (
                <CircularProgress size={20} thickness={5} sx={{ color: "white" }} />
              ) : (
                <RefreshIcon sx={{ fontSize: 28 }} />
              )}
            </IconButton>

            {/* NOTIFICATION BADGE */}
            <Badge 
              badgeContent={unreadCount} 
              color="error"
              sx={{ 
                "& .MuiBadge-badge": { fontSize: "1rem", minWidth: 24, height: 24 }
              }}
              invisible={unreadCount === 0}
            >
              <NotificationsIcon sx={{ fontSize: 32, color: "white" }} />
            </Badge>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        <Paper sx={{ 
          borderRadius: 2, 
          border: "1px solid #e0e0e0", 
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
        }}>
          <TableContainer sx={{ maxHeight: 700 }}>
            <Table stickyHeader sx={{ minWidth: 1000 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8f9fa", height: 64 }}>
                  {["#", "Message", "Date", "Time", "Status", "Actions"].map((header) => (
                    <TableCell
                      key={header}
                      align={header === "Message" ? "left" : "center"}
                      sx={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: "#212121",
                        py: 3,
                        borderBottom: "3px solid #e0e0e0",
                        backgroundColor: "#f8f9fa !important",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedNotifications.map((notification, index) => {
                  const rowNumber = index + 1 + (page * rowsPerPage);
                  const createdDate = new Date(notification.created_at);
                  const date = createdDate.toLocaleDateString("en-ZA");
                  const time = createdDate.toLocaleTimeString("en-ZA", { 
                    hour: "2-digit", 
                    minute: "2-digit" 
                  });
                  const isUnread = notification.viewed === 0;

                  return (
                    <TableRow
                      key={notification.id}
                      sx={{
                        height: 72,
                        bgcolor: isUnread ? "white" : "#f8f9fa",
                        borderBottom: "1px solid #f0f0f0",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        "&:hover": { bgcolor: isUnread ? "#f0f7ff" : "#f0f8f0" },
                      }}
                      onClick={() => handleRowClick(notification)}
                    >
                      <TableCell align="center" sx={{ fontWeight: 600, color: "#424242", width: 80 }}>
                        {rowNumber}
                      </TableCell>
                      
                      <TableCell sx={{ 
                        fontWeight: isUnread ? 700 : 500, 
                        color: isUnread ? "#1a1a1a" : "#4a4a4a",
                        fontSize: "0.95rem",
                        maxWidth: 400,
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        lineHeight: 1.4,
                      }}>
                        {notification.message}
                      </TableCell>
                      
                      <TableCell align="center" sx={{ fontWeight: 500, color: "#424242", fontSize: "0.9rem" }}>
                        {date}
                      </TableCell>
                      
                      <TableCell align="center" sx={{ fontWeight: 500, color: "#616161", fontSize: "0.85rem" }}>
                        {time}
                      </TableCell>
                      
                      <TableCell align="center">
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                          <Chip
                            label={isUnread ? "Unread" : "Read"}
                            color={isUnread ? "primary" : "success"}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              height: 24,
                              bgcolor: isUnread ? "#e3f2fd" : "#e8f5e8",
                              color: isUnread ? "#1976d2" : "#2e7d32",
                            }}
                          />
                          {!isUnread && (
                            <CheckCircleIcon 
                              sx={{ 
                                color: "#4caf50", 
                                fontSize: 20,
                                opacity: 0.8
                              }} 
                            />
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell align="center" sx={{ py: 1 }}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewNotification(notification);
                            }}
                            title="View Details"
                            size="small"
                            sx={{ 
                              color: "#1976d2", 
                              "&:hover": { bgcolor: "rgba(25, 118, 210, 0.08)" }
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {paginatedNotifications.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 8, textAlign: "center" }}>
                      <NotificationsIcon sx={{ fontSize: 64, color: "action.disabled", mb: 2 }} />
                      <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                        No notifications yet
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        Sent invoices and other updates will appear here.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {sortedNotifications.length > 10 && (
            <Box sx={{ p: 2, borderTop: "1px solid #e0e0e0", bgcolor: "#fafafa" }}>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={sortedNotifications.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                    fontSize: "0.85rem",
                    color: "#424242",
                  }
                }}
              />
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}

export default Notifications;
