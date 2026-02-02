// src/components/ClientNotifications.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Paper, Typography, List, ListItem, ListItemText, ListItemAvatar,
  Badge, IconButton, Chip, Divider, CircularProgress
} from '@mui/material';
import { Notifications, Check, Download, Schedule } from '@mui/icons-material';

export default function ClientNotifications() {
  const { id } = useParams();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3001/api/notifications/client/${id}`, {
        credentials: 'include'
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Notifications fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`http://localhost:3001/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include'
      });
      fetchNotifications(); // Refresh
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, [id]);

  return (
    <Box sx={{ p: 3, maxWidth: 800 }}>
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          <Notifications sx={{ mr: 2, verticalAlign: 'middle', color: 'primary.main' }} />
          Payment Proof Notifications
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center">
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
        </Typography>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Notifications sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No proof notifications yet
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ maxHeight: 600, overflow: 'auto' }}>
          <List>
            {notifications.map((notif) => (
              <ListItem 
                key={notif.id}
                secondaryAction={
                  <Box>
                    <IconButton 
                      edge="end" 
                      href={notif.public_url} 
                      download
                      size="small"
                    >
                      <Download />
                    </IconButton>
                    {!notif.is_read && (
                      <IconButton 
                        edge="end" 
                        onClick={() => markAsRead(notif.id)}
                        size="small"
                      >
                        <Check />
                      </IconButton>
                    )}
                  </Box>
                }
                sx={{ 
                  bgcolor: !notif.is_read ? '#fff3e0' : 'transparent',
                  '&:hover': { bgcolor: !notif.is_read ? '#ffe0b2' : 'grey.50' }
                }}
              >
                <ListItemAvatar>
                  <Badge 
                    color="primary" 
                    variant="dot"
                    invisible={notif.is_read}
                  >
                    <Schedule />
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {notif.title}
                      </Typography>
                      <Chip label={`Invoice #${notif.invoice_number}`} size="small" />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2">{notif.message}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(notif.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}
