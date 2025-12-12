import React, { useEffect, useState } from "react";
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Button,
  Breadcrumbs,
  Link,
  Grid,
  Paper,
  Divider,
} from "@mui/material";

import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Visibility as VisibilityIcon,
  ReceiptLong as ReceiptIcon,
  LibraryAdd as AddInvoiceIcon,
  UploadFile as UploadProofIcon,
  OpenInNew as OpenInNewIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
} from "@mui/icons-material";

import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const drawerWidth = 280;

const sidebarBg = "#3166AE";
const sidebarText = "#ffffff";
const hoverBg = "rgba(255, 255, 255, 0.1)";
const mainBg = "#f8f9fa";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function DashboardHome({ clients, uploads }) {
  const hasClients = clients.length > 0;

  const uniqueCompanies = new Set(
    clients.map((c) => c.company?.trim()).filter(Boolean)
  );

  // total uploads across all companies (for percentage based on uploads)
  const totalUploadsAcrossCompanies = uploads.length;

  const companiesWithData = Array.from(uniqueCompanies)
    .map((company) => {
      const companyClients = clients.filter(
        (c) => c.company?.trim() === company
      );
      const companyUploads = uploads.filter((u) =>
        companyClients.some((client) => client.id === u.client_id)
      );

      const uploadsCount = companyUploads.length;
      const percentage =
        totalUploadsAcrossCompanies > 0
          ? (uploadsCount / totalUploadsAcrossCompanies) * 100
          : 0;

      return {
        name: company,
        clients: companyClients.length,
        uploads: uploadsCount,
        percentage,
      };
    })
    // sort by uploads, not clients
    .sort((a, b) => b.uploads - a.uploads);

  const kpis = [
    { label: "Total Clients", value: clients.length, icon: "👥" },
    { label: "Unique Companies", value: uniqueCompanies.size, icon: "🏢" },
    { label: "Total Uploads", value: uploads.length, icon: "📎" },
    {
      label: "Active Companies",
      value: companiesWithData.filter((c) => c.uploads > 0).length,
      icon: "⚡",
    },
  ];

  const timelineData = MONTH_NAMES.map((m, i) => ({
    month: m,
    uploads: uploads.filter((upload) => {
      const date = upload.uploaded_at ? new Date(upload.uploaded_at) : null;
      return date && date.getMonth() === i;
    }).length,
    clients: clients.filter((client) => {
      const date = client.created_at ? new Date(client.created_at) : null;
      return date && date.getMonth() === i;
    }).length,
  }));

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#a4de6c",
    "#d0ed57",
  ];

  // Build pie data based on uploads per company, group smaller ones into "Other uploads"
  const buildPieData = (raw) => {
    if (!hasClients || totalUploadsAcrossCompanies === 0) return [];

    const sorted = [...raw].sort((a, b) => b.uploads - a.uploads);
    const major = [];
    let otherTotal = 0;

    sorted.forEach((item, idx) => {
      if (idx < 12) {
        major.push(item);
      } else {
        otherTotal += item.uploads;
      }
    });

    const result = major.map((c, index) => ({
      name: c.name,
      value: c.uploads, // value is uploads count
      fill: COLORS[index % COLORS.length],
    }));

    if (otherTotal > 0) {
      result.push({
        name: "Other uploads",
        value: otherTotal,
        fill: "#cfd8dc",
      });
    }

    return result;
  };

  const pieData = buildPieData(companiesWithData);
  const topCompanies = companiesWithData.slice(0, 5);

  const renderLegend = ({ payload }) => {
    if (!hasClients || !payload || !payload.length) return null;
    return (
      <Box sx={{ maxHeight: 280, overflowY: "auto", pl: 1.5, pr: 0.5 }}>
        {payload.map((entry) => (
          <Box
            key={entry.value}
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 0.5,
              fontSize: 12,
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: entry.color,
                mr: 1,
              }}
            />
            <Typography variant="body2" sx={{ fontSize: 12 }}>
              {entry.value}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <>
      <Typography
        variant="h4"
        fontWeight={600}
        sx={{ mb: 3, color: "#1a1a1a" }}
      >
        📊 Dashboard overview
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpis.map((k) => (
          <Grid item xs={12} sm={6} md={3} key={k.label}>
            <Paper
              sx={{
                p: 2.5,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 2,
                boxShadow: 2,
                bgcolor: "white",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                <Typography
                  variant="h5"
                  fontWeight={500}
                  sx={{ color: "#1a1a1a", mr: 1 }}
                >
                  {k.icon}
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight={600}
                  sx={{ color: "#1a1a1a" }}
                >
                  {k.value}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", fontWeight: 400 }}
              >
                {k.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Centered Company Distribution + Top Companies */}
      <Grid container spacing={3} justifyContent="center" sx={{ mb: 3 }}>
        <Grid item xs={12} md={6} lg={5}>
          <Paper
            sx={{
              p: 2.5,
              height: 420,
              borderRadius: 2,
              boxShadow: 2,
              bgcolor: "white",
            }}
          >
            <Typography
              variant="h6"
              fontWeight={600}
              gutterBottom
              sx={{
                mb: 1.5,
                color: "#1a1a1a",
                display: "flex",
                alignItems: "center",
              }}
            >
              🏢 Company distribution
              <PieChartIcon sx={{ ml: 1, fontSize: 22 }} />
            </Typography>
            <Typography
              variant="body2"
              sx={{ mb: 2, color: "text.secondary" }}
            >
              {hasClients && totalUploadsAcrossCompanies > 0
                ? "Share of uploaded proofs per company, grouping smaller segments into “Other uploads” for clarity."
                : "No upload data yet. Once clients upload proofs, this chart will show distribution by company."}
            </Typography>

            <Box sx={{ height: 290 }}>
              {!hasClients || totalUploadsAcrossCompanies === 0 ? (
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", textAlign: "center" }}
                  >
                    Add clients and receive uploaded proofs to see company
                    distribution based on real uploads.
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="45%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={110}
                      paddingAngle={1.5}
                      cornerRadius={4}
                      labelLine={false}
                      // Recharts label percent is already based on value (uploads)
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, _name, props) => [
                        value,
                        props.payload?.name ?? "",
                      ]}
                    />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      iconType="circle"
                      iconSize={8}
                      content={renderLegend}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={5}>
          <Paper
            sx={{
              p: 2.5,
              height: 420,
              borderRadius: 2,
              boxShadow: 2,
              bgcolor: "white",
            }}
          >
            <Typography
              variant="h6"
              fontWeight={600}
              gutterBottom
              sx={{
                mb: 1.5,
                color: "#1a1a1a",
                display: "flex",
                alignItems: "center",
              }}
            >
              ⭐ Top 5 companies
              <BarChartIcon sx={{ ml: 1, fontSize: 22 }} />
            </Typography>
            <Typography
              variant="body2"
              sx={{ mb: 2, color: "text.secondary" }}
            >
              Ranked by number of uploaded proofs, with client counts shown for
              context.
            </Typography>

            <Box sx={{ overflow: "auto", maxHeight: 320 }}>
              <Box sx={{ display: "grid", gap: 1.5 }}>
                {topCompanies.length > 0 ? (
                  topCompanies.map((company) => (
                    <Paper
                      key={company.name}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr auto",
                        alignItems: "center",
                        p: 1.5,
                        bgcolor: "grey.50",
                        borderRadius: 1.5,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        noWrap
                        sx={{ color: "#1a1a1a" }}
                      >
                        {company.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ color: "#1976d2" }}
                      >
                        {company.clients} clients
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ color: "#4caf50" }}
                      >
                        {company.uploads} uploads
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ color: "#666" }}
                      >
                        {company.percentage.toFixed(1)}%
                      </Typography>
                    </Paper>
                  ))
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      py: 4,
                      textAlign: "center",
                      color: "text.secondary",
                    }}
                  >
                    No company upload data available yet.
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Monthly Timeline */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2.5,
              borderRadius: 2,
              boxShadow: 2,
              bgcolor: "white",
            }}
          >
            <Typography
              variant="h6"
              fontWeight={600}
              gutterBottom
              sx={{ mb: 2, color: "#1a1a1a" }}
            >
              📅 Monthly activity
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                "& > *": { minWidth: 120, flex: 1 },
              }}
            >
              {timelineData.map((data, i) => (
                <Paper
                  key={i}
                  sx={{
                    p: 2,
                    textAlign: "center",
                    borderRadius: 1.5,
                    bgcolor: "grey.50",
                  }}
                >
                  <Typography
                    variant="h5"
                    fontWeight={600}
                    sx={{ color: "#1976d2", mb: 0.5 }}
                  >
                    {data.uploads}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{ color: "#1a1a1a", fontWeight: 700, mb: 0.25 }}
                  >
                    {data.month}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    ({data.clients} new clients)
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}

function UploadedProofs() {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3001/api/payment-proofs", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch payment proofs");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setProofs(data);
        else setProofs([]);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <Typography
        variant="h5"
        sx={{ py: 8, textAlign: "center", color: "textSecondary" }}
      >
        ⏳ Loading proofs...
      </Typography>
    );
  if (error)
    return (
      <Typography
        variant="h5"
        color="error"
        sx={{ py: 8, textAlign: "center" }}
      >
        ❌ Error: {error}
      </Typography>
    );
  if (proofs.length === 0)
    return (
      <Typography
        variant="h5"
        sx={{ py: 8, textAlign: "center", color: "textSecondary" }}
      >
        📭 No proofs available
      </Typography>
    );

  return (
    <Box>
      <Typography
        variant="h4"
        fontWeight={600}
        gutterBottom
        sx={{ mb: 3, color: "#1a1a1a" }}
      >
        📎 Uploaded proofs
      </Typography>
      <Grid container spacing={3}>
        {proofs.map((proof) => {
          const fileUrl = `http://localhost:3001/uploads/proofs/${
            proof.file_path || proof.filename
          }`;
          return (
            <Grid item xs={12} md={6} lg={4} key={proof.id}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  boxShadow: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1.5,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    sx={{ color: "#1a1a1a" }}
                  >
                    Client #{proof.client_id}
                  </Typography>
                  <Button
                    variant="outlined"
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<OpenInNewIcon />}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 600,
                      px: 2.5,
                      textTransform: "none",
                    }}
                  >
                    📥 Download
                  </Button>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="body2" sx={{ color: "#666", mb: 0.75 }}>
                  💬 {proof.comment || "No comment"}
                </Typography>
                <Typography variant="caption" sx={{ color: "textSecondary" }}>
                  📅{" "}
                  {proof.created_at
                    ? new Date(proof.created_at).toLocaleDateString()
                    : ""}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

function Dashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch("http://localhost:3001/api/clients", {
          credentials: "include",
        });
        if (!res.ok) {
          if (res.status === 401) {
            alert("You are not authorized. Please log in.");
            navigate("/login");
          }
          setClients([]);
          return;
        }
        const data = await res.json();
        setClients(Array.isArray(data) ? data : []);
      } catch {
        setClients([]);
      }
    }
    loadClients();
  }, [navigate]);

  useEffect(() => {
    fetch("http://localhost:3001/api/payment-proofs", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => setUploads(Array.isArray(data) ? data : []))
      .catch(() => setUploads([]));
  }, []);

  useEffect(() => {
    fetch("http://localhost:3001/api/notifications", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setUnreadNotifications(
            data.filter((n) => n.viewed === 0).length
          );
        }
      })
      .catch(() => setUnreadNotifications(0));
  }, []);

  const handleDrawerToggle = () => setDrawerOpen(!drawerOpen);

  const sidebarItems = [
    { label: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { label: "View Clients", icon: <VisibilityIcon />, path: "/clients" },
    { label: "All Invoices", icon: <ReceiptIcon />, path: "/invoices" },
    { label: "Create Invoice", icon: <AddInvoiceIcon />, path: "/invoices/new" },
    {
      label: "Uploaded Proofs",
      icon: <UploadProofIcon />,
      path: "/uploaded-proofs",
    },
    { label: "Settings", icon: <SettingsIcon />, path: "/settings" },
    {
      label: "Notifications",
      icon: <NotificationsIcon />,
      action: () => navigate("/notifications"),
    },
    {
      label: "Logout",
      icon: <LogoutIcon />,
      action: () => navigate("/login"),
      isButton: true,
    },
  ];

  const activePath = location.pathname;

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: sidebarBg,
        color: sidebarText,
        width: drawerWidth,
      }}
    >
      <Toolbar
        sx={{ px: 3, py: 3, flexDirection: "column", alignItems: "flex-start" }}
      >
        <Typography variant="h6" fontWeight={700} sx={{ color: sidebarText }}>
          Internship Success
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.85 }}>
          Dashboard
        </Typography>
      </Toolbar>

      <List sx={{ flexGrow: 1, px: 2 }}>
        {sidebarItems.map((item, index) =>
          item.isButton ? (
            <Box key={index} sx={{ my: 1 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={item.icon}
                onClick={item.action}
                sx={{
                  bgcolor: sidebarText,
                  color: sidebarBg,
                  fontWeight: 700,
                  borderRadius: 2,
                  py: 1.5,
                  "&:hover": {
                    bgcolor: "#f0f0f0",
                  },
                }}
              >
                {item.label}
              </Button>
            </Box>
          ) : (
            <ListItemButton
              key={index}
              selected={activePath === item.path}
              onClick={() =>
                item.action ? item.action() : navigate(item.path)
              }
              sx={{
                borderRadius: 2,
                mx: 1,
                my: 0.5,
                "&:hover": {
                  bgcolor: hoverBg,
                },
                "&.Mui-selected": {
                  bgcolor: hoverBg,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
                },
              }}
            >
              <ListItemIcon sx={{ color: sidebarText, minWidth: 48 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: activePath === item.path ? 700 : 600,
                }}
              />
            </ListItemButton>
          )
        )}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", bgcolor: mainBg, minHeight: "100vh" }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: sidebarBg,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}
      >
        <Toolbar sx={{ px: 3 }}>
          <IconButton
            edge="start"
            sx={{
              mr: 0.9,
              color: sidebarText,
              "&:hover": { bgcolor: hoverBg },
            }}
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              color: sidebarText,
            }}
          >
            Admin dashboard
          </Typography>

          <IconButton
            sx={{
              color: sidebarText,
              mr: 1,
              "&:hover": { bgcolor: hoverBg },
            }}
            onClick={() => navigate("/")}
          >
            <HomeIcon />
          </IconButton>

          <IconButton
            sx={{ color: sidebarText, "&:hover": { bgcolor: hoverBg } }}
            onClick={() => navigate("/notifications")}
          >
            {unreadNotifications > 0 ? (
              <Badge badgeContent={unreadNotifications} color="error">
                <NotificationsIcon />
              </Badge>
            ) : (
              <NotificationsIcon />
            )}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            bgcolor: sidebarBg,
            color: sidebarText,
            boxShadow: "8px 0 24px rgba(0,0,0,0.3)",
          },
        }}
        ModalProps={{ keepMounted: true }}
      >
        {drawer}
      </Drawer>

      <Box sx={{ flexGrow: 1, p: 3, mt: "72px" }}>
        <Breadcrumbs sx={{ mb: 3, color: "#666" }}>
          <Link
            underline="hover"
            sx={{
              cursor: "pointer",
              color: "#1976d2",
              fontWeight: 600,
              "&:hover": { color: "#1565c0" },
            }}
            onClick={() => navigate("/")}
          >
            🏠 Home
          </Link>
          <Typography sx={{ fontWeight: 600, color: "#1a1a1a" }}>
            {
              {
                "/dashboard": "Dashboard",
                "/clients": "Clients",
                "/invoices": "Invoices",
                "/invoices/new": "Create Invoice",
                "/uploaded-proofs": "Uploaded Proofs",
                "/settings": "Settings",
              }[activePath] || "Dashboard"
            }
          </Typography>
        </Breadcrumbs>

        <Routes>
          <Route
            path="/dashboard"
            element={<DashboardHome clients={clients} uploads={uploads} />}
          />
          <Route path="/uploaded-proofs" element={<UploadedProofs />} />
          <Route
            path="*"
            element={<DashboardHome clients={clients} uploads={uploads} />}
          />
        </Routes>
      </Box>
    </Box>
  );
}

export default Dashboard;
