import React, { useEffect, useState, useCallback } from "react";
import {
  Box,CssBaseline,
  AppBar,Toolbar,Typography,IconButton,Drawer,List,
  ListItemButton,ListItemIcon,ListItemText,Badge,Button,
  Breadcrumbs,Link,Grid,Paper,
  Chip,CircularProgress,Alert,ListItem,ListItemSecondaryAction,LinearProgress,
  FormControl,InputLabel,Select,MenuItem,Divider 
} from "@mui/material";

import {
  Menu as MenuIcon,Dashboard as DashboardIcon,Visibility as VisibilityIcon,
  ReceiptLong as ReceiptIcon,LibraryAdd as AddInvoiceIcon,UploadFile as UploadProofIcon,
  OpenInNew as OpenInNewIcon, Notifications as NotificationsIcon,Logout as LogoutIcon,
  Home as HomeIcon,Settings as SettingsIcon, PieChart as PieChartIcon,
  BarChart as BarChartIcon,PictureAsPdf as PictureAsPdfIcon,Image as ImageIcon,
  Download as DownloadIcon,Refresh as RefreshIcon,Error as ErrorIcon,Assessment as AssessmentIcon,
} from "@mui/icons-material";

import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import {
  PieChart,Pie,Cell,Tooltip,Legend,ResponsiveContainer,AreaChart, Area, BarChart, Bar, 
  CartesianGrid, XAxis, YAxis, 
} from "recharts";

//LIGHT BLUE THEME COLORS
const drawerWidth = 280;
const sidebarBg = "#3166AE";
const sidebarText = "#ffffff";
const hoverBg = "rgba(255, 255, 255, 0.1)";
const mainBg = "#ffffff";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// BULLETPROOF FETCH
const safeFetch = async (url, options = {}) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      credentials: "include",
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      window.location.href = '/login';
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`Fetch timeout: ${url}`);
    } else {
      console.error(`Fetch failed ${url}:`, error);
    }
    return null;
  }
};

// PERFECT PDF/IMAGE HANDLING
const viewProof = (proof) => {
  if (!proof?.public_url) {
    alert("No file available");
    return;
  }

  try {
    const isPDF = proof.public_url.includes('.pdf') || proof.file_type?.includes('pdf');
    if (isPDF) {
      downloadProof(proof);
    } else {
      window.open(proof.public_url, '_blank', 'noopener,noreferrer');
    }
  } catch (error) {
    console.error("View failed:", error);
    downloadProof(proof);
  }
};

// BULLETPROOF DOWNLOAD
const downloadProof = (proof) => {
  if (!proof?.public_url) {
    alert("No file available");
    return;
  }

  try {
    const link = document.createElement('a');
    link.href = proof.public_url;
    link.rel = 'noopener noreferrer';
    link.download = `proof-${proof.id || proof.client_id || Date.now()}.${proof.file_type?.split('/')[1] || 'pdf'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  } catch (error) {
    console.error("Download failed:", error);
    alert("Download failed - check console for details");
  }
};

function DashboardHome({ clients = [], uploads = [], invoices = [] }) {
  // Year dropdown state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // 2026 current year
  const [yearLoading, setYearLoading] = useState(false);

  const hasClients = (clients || []).length > 0;
  const uniqueCompanies = new Set(
    (clients || []).map((c) => c.company?.trim()).filter(Boolean)
  );
  const totalUploads = (uploads || []).length;

  // Generate years: previous (2025), current (2026), next 5 years (2027-2031)
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    years.push(currentYear - 1); // Previous year: 2025
    years.push(currentYear);     // Current year: 2026
    for (let i = 1; i <= 5; i++) {
      years.push(currentYear + i); // Future years: 2027-2031
    }
    return years;
  };

  const availableYears = getAvailableYears();

  const companiesWithData = Array.from(uniqueCompanies)
    .map((company) => {
      const companyClients = (clients || []).filter((c) => c.company?.trim() === company);
      const companyUploads = (uploads || []).filter((u) =>
        companyClients.some((client) => client.id == u.client_id)
      );

      return {
        name: company,
        clients: companyClients.length,
        uploads: companyUploads.length,
        percentage: totalUploads > 0 
          ? (companyUploads.length / totalUploads) * 100 
          : 0,
      };
    })
    .sort((a, b) => b.uploads - a.uploads);

  // YEAR-FILTERED KPIs for bar graph - counts for selected year only
  const yearKpis = [
    { 
      label: "Invoices", 
      value: (invoices || []).filter((invoice) => {
        try {
          const date = invoice.created_at || invoice.invoice_date ? 
                       new Date(invoice.created_at || invoice.invoice_date) : null;
          return date && date.getFullYear() === selectedYear;
        } catch {
          return false;
        }
      }).length,
      color: "#1976d2"
    },
    { 
      label: "Clients", 
      value: (clients || []).filter((client) => {
        try {
          const date = client.created_at ? new Date(client.created_at) : null;
          return date && date.getFullYear() === selectedYear;
        } catch {
          return false;
        }
      }).length,
      color: "#4caf50"
    },
    { 
      label: "Proofs", 
      value: (uploads || []).filter((upload) => {
        try {
          const date = upload.uploaded_at ? new Date(upload.uploaded_at) : null;
          return date && date.getFullYear() === selectedYear;
        } catch {
          return false;
        }
      }).length,
      color: "#ff9800"
    },
  ];

  // Filter data by selected year and generate monthly timeline
  const timelineData = MONTH_NAMES.map((m, i) => {
    const targetMonth = i; // 0=Jan, 1=Feb, etc.
    const targetYear = selectedYear;

    // Filter clients added in selected year/month
    const monthlyClients = (clients || []).filter((client) => {
      try {
        const date = client.created_at ? new Date(client.created_at) : null;
        return date && 
               date.getFullYear() === targetYear && 
               date.getMonth() === targetMonth;
      } catch {
        return false;
      }
    }).length;

    // Filter proofs uploaded in selected year/month  
    const monthlyUploads = (uploads || []).filter((upload) => {
      try {
        const date = upload.uploaded_at ? new Date(upload.uploaded_at) : null;
        return date && 
               date.getFullYear() === targetYear && 
               date.getMonth() === targetMonth;
      } catch {
        return false;
      }
    }).length;

    // Filter invoices issued in selected year/month
    const monthlyInvoices = (invoices || []).filter((invoice) => {
      try {
        const date = invoice.created_at || invoice.invoice_date ? 
                     new Date(invoice.created_at || invoice.invoice_date) : null;
        return date && 
               date.getFullYear() === targetYear && 
               date.getMonth() === targetMonth;
      } catch {
        return false;
      }
    }).length;

    return {
      month: m,
      invoices: monthlyInvoices,
      clients: monthlyClients,
      uploads: monthlyUploads,
    };
  });

  const COLORS = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8",
    "#82ca9d", "#ffc658", "#ff7300", "#a4de6c", "#d0ed57",
  ];

 const pieData = companiesWithData.slice(0, 10).map((c, index) => ({
  name: c.name.length > 20 ? `${c.name.substring(0, 17)}...` : c.name,
  value: c.uploads,  // Original proof uploads (for pie chart dataKey="value")
  proofs: c.uploads, // Keep for display purposes
  fill: COLORS[index % COLORS.length],
}));



  const topCompanies = companiesWithData.slice(0, 5);

  const renderLegend = ({ payload }) => (
    <Box sx={{ maxHeight: 200, overflowY: "auto", pl: 1.5, pr: 0.5 }}>
      {payload?.map((entry, idx) => (
        <Box key={idx} sx={{ display: "flex", alignItems: "center", mb: 0.5, fontSize: 12 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: entry.color, mr: 1 }} />
          <Typography variant="body2" sx={{ fontSize: 12 }}>
            {entry.value}
          </Typography>
        </Box>
      )) || null}
    </Box>
  );

  // Handle year selection change
  const handleYearChange = (event) => {
    setYearLoading(true);
    setSelectedYear(event.target.value);
    setTimeout(() => setYearLoading(false), 300); // Simulate loading
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
        <Typography 
          variant="h3" 
          fontWeight={700} 
          sx={{ 
            color: "#000000", 
            textAlign: 'center',
            fontSize: { xs: '1.8rem', md: '2.5rem' }
          }}
        >
          <PieChartIcon sx={{ mr: 1, fontSize: { xs: 28, md: 36 }, verticalAlign: 'middle' }} />
          Dashboard Overview - {selectedYear}
        </Typography>
      </Box>

      {/* Year Selection Dropdown */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Paper sx={{ 
          p: 2, 
          borderRadius: 3, 
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          border: "1px solid rgba(255,255,255,0.6)"
        }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Select Year</InputLabel>
            <Select
              value={selectedYear}
              onChange={handleYearChange}
              label="Select Year"
              disabled={yearLoading}
              endAdornment={
                yearLoading ? (
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                ) : null
              }
            >
              {availableYears.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary', textAlign: 'center' }}>
            Showing {selectedYear} data • Updates automatically
          </Typography>
        </Paper>
      </Box>

      {/* GRAPHS SECTION */}
      <Box sx={{ 
        mb: 8,
        display: "flex", 
        flexDirection: { xs: "column", lg: "row" }, 
        alignItems: "flex-start", 
        gap: 4,
        maxWidth: 1400,
        mx: "auto"
      }}>
        
        {/* PULSE GRAPH - Analytics Overview */}
        <Box sx={{ 
          mb: 8,
          width: "65%",
          height: 420,
          mx: "auto",
          position: "relative",
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          borderRadius: 3,
          p: 3,
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          border: "1px solid rgba(255,255,255,0.6)",
          backdropFilter: "blur(10px)"
        }}>
          <Typography 
            variant="h5" 
            fontWeight={800} 
            sx={{ 
              mb: 4, 
              color: "#1a1a1a",
              textAlign: "center",
              background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              position: "relative",
              zIndex: 2
            }}
          >
            📈 {selectedYear} Analytics Overview
          </Typography>

          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={timelineData}>
              <defs>
                {/* Invoices gradient */}
                <linearGradient id="invoicesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1976d2" stopOpacity={0.8}/>
                  <stop offset="50%" stopColor="#42a5f5" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#90caf9" stopOpacity={0.1}/>
                </linearGradient>
                {/* Clients gradient */}
                <linearGradient id="clientsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4caf50" stopOpacity={0.8}/>
                  <stop offset="50%" stopColor="#81c784" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#a5d6a7" stopOpacity={0.1}/>
                </linearGradient>
                {/* Uploads gradient */}
                <linearGradient id="uploadsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff9800" stopOpacity={0.8}/>
                  <stop offset="50%" stopColor="#ffb74d" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#ffe0b2" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
              <XAxis 
                dataKey="month" 
                stroke="#666" 
                fontSize={14} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#666" 
                fontSize={14} 
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{
                  background: "rgba(255,255,255,0.95)",
                  border: "1px solid rgba(25,118,210,0.2)",
                  borderRadius: 12,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12)"
                }}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: 16,
                  background: "rgba(255,255,255,0.9)",
                  borderRadius: 8,
                  padding: 12,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
                }}
              />
              
              {/* Three data series: Invoices, Clients, Uploads */}
              <Area 
                type="monotone" 
                dataKey="invoices" 
                stroke="#1976d2" 
                strokeWidth={4}
                fill="url(#invoicesGradient)"
                name="Invoices Issued"
                activeDot={{ 
                  fill: "#1976d2", 
                  strokeWidth: 3, 
                  r: 6,
                  stroke: "#ffffff"
                }}
              />
              <Area 
                type="monotone" 
                dataKey="clients" 
                stroke="#4caf50" 
                strokeWidth={4}
                fill="url(#clientsGradient)"
                name="Clients Added"
                activeDot={{ 
                  fill: "#4caf50", 
                  strokeWidth: 3, 
                  r: 6,
                  stroke: "#ffffff"
                }}
              />
              <Area 
                type="monotone" 
                dataKey="uploads" 
                stroke="#ff9800" 
                strokeWidth={4}
                fill="url(#uploadsGradient)"
                name="Proofs Uploaded"
                activeDot={{ 
                  fill: "#ff9800", 
                  strokeWidth: 3, 
                  r: 6,
                  stroke: "#ffffff"
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>

        {/* THIN BAR GRAPH - YEAR-FILTERED KPI METRICS */}
        <Paper sx={{ 
          flex: { xs: 1, lg: 1 },
          p: 3, 
          height: 400,
          borderRadius: 4,
          backdropFilter: "blur(20px)",
          background: "rgba(255, 255, 255, 0.95)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          border: "1px solid rgba(255,255,255,0.3)",
          display: "flex",
          flexDirection: "column"
        }}>
          <Typography variant="h6" fontWeight={800} sx={{ 
            mb: 3, 
            color: "#1a1a1a",
            textAlign: "center",
            background: "linear-gradient(135deg, #4caf50 0%, #81c784 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            📊 {selectedYear} Summary
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={yearKpis.map(kpi => ({ 
                name: kpi.label, 
                value: kpi.value,
                fill: kpi.color
              }))}
              layout="vertical"
              margin={{ right: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                type="number" 
                stroke="#666" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#666" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <Tooltip />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]} 
                barSize={30}
              >
                {yearKpis.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Box>

      {/* HORIZONTAL CARDS - Company Distribution + Top Companies */}
<Box sx={{ mb: 6 }}>
  <Paper sx={{ 
    p: 5,
    height: 580,
    borderRadius: 4,
    boxShadow: "0 32px 100px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.25)",
    backdropFilter: "blur(32px)",
    background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.85) 100%)",
    border: "1px solid rgba(255,255,255,0.4)",
    position: 'relative',
    overflow: 'hidden',
    mx: 'auto',
    maxWidth: 1000
  }}>
    {/* Premium Header */}
    <Box sx={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: 'center',
      mb: 4,
      position: 'relative'
    }}>
      <Box sx={{
        p: 2,
        mr: 2,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #1976d2, #42a5f5, #4caf50)',
        boxShadow: '0 12px 40px rgba(25,118,210,0.3)'
      }}>
        <PieChartIcon sx={{ fontSize: 32, color: 'white' }} />
      </Box>
      <Typography variant="h5" fontWeight={800} sx={{ 
        background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 50%, #4caf50 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        fontSize: { xs: '1.3rem', md: '1.5rem' },
        letterSpacing: '0.5px'
      }}>
        Company Distribution Analytics
      </Typography>
    </Box>

    {/* Split Layout: Companies List | Pie Chart */}
    <Box sx={{ 
      display: 'flex', 
      height: 450, 
      gap: 4,
      alignItems: 'stretch',
      flexDirection: { xs: 'column', lg: 'row' }
    }}>
      {/* LEFT: Company List */}
      <Box sx={{ 
        flex: { lg: 0.4 }, 
        minWidth: { lg: 280 },
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ 
          mb: 2.5, 
          color: "#1a202c",
          fontSize: '1rem'
        }}>
          Top Companies
        </Typography>
        
        {/* Company List with Gradient Bars */}
        <Box sx={{ 
          flexGrow: 1, 
          overflowY: 'auto',
          pr: 1
        }}>
          {pieData.slice(0, 10).map((company, idx) => (
            <Box key={idx} sx={{ 
              mb: 2.5, 
              p: 2.5, 
              borderRadius: 3,
              background: "rgba(255,255,255,0.7)",
              border: '1px solid rgba(255,255,255,0.5)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: "rgba(25,118,210,0.08)",
                transform: 'translateX(4px)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.12)'
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  bgcolor: company.fill, 
                  mr: 2,
                  boxShadow: `0 4px 12px ${company.fill}40`
                }} />
                <Typography variant="subtitle2" fontWeight={700} sx={{ 
                  color: "#1a202c",
                  fontSize: '0.95rem',
                  mr: 'auto',
                  minWidth: 0,
                  overflow: 'hidden'
                }}>
                  {company.name.length > 25 ? `${company.name.substring(0, 22)}...` : company.name}
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ 
                  color: company.fill,
                  fontSize: '0.9rem'
                }}>
                  {company.value}
                </Typography>
              </Box>
              {/* Animated Progress Bar */}
              <Box sx={{ 
                height: 6, 
                borderRadius: 3, 
                bgcolor: 'rgba(0,0,0,0.08)',
                overflow: 'hidden'
              }}>
                <Box sx={{
                  height: '100%',
                  borderRadius: 3,
                  bgcolor: company.fill,
                  width: `${Math.min((company.value / Math.max(...pieData.map(d => d.value))) * 100, 100)}%`,
                  transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: `0 0 12px ${company.fill}30`
                }} />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* VERTICAL DIVIDER */}
      <Box sx={{ 
        width: { lg: '1px' }, 
        mx: 2,
        background: 'linear-gradient(to bottom, transparent, #e2e8f0, transparent)',
        position: 'relative',
        '&::before, &::after': {
          content: '""',
          position: 'absolute',
          left: '50%',
          width: 3,
          height: 20,
          background: '#1976d2',
          transform: 'translateX(-50%)',
          borderRadius: '50%'
        },
        '&::before': { top: 0 },
        '&::after': { bottom: 0 }
      }} />

      {/* RIGHT: Premium Pie Chart */}
      <Box sx={{ 
        flex: 1, 
        minWidth: 0,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {pieData.length === 0 ? (
          <Box sx={{ 
            height: "100%", 
            display: "flex", 
            flexDirection: 'column',
            alignItems: "center", 
            justifyContent: "center",
            textAlign: 'center',
            p: 4
          }}>
            <PieChartIcon sx={{ 
              fontSize: 80, 
              color: 'rgba(0,0,0,0.08)', 
              mb: 3 
            }} />
            <Typography variant="h6" sx={{ 
              color: "text.secondary", 
              fontWeight: 600,
              mb: 1 
            }}>
              No Distribution Data
            </Typography>
            <Typography variant="body1" sx={{ color: "text.disabled" }}>
              {hasClients ? "No proofs uploaded yet" : "Add clients first"}
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* Main Pie with Enhanced Styling */}
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="25%"
                outerRadius="85%"
                paddingAngle={3}
                cornerRadius={12}
                strokeWidth={3}
                stroke="rgba(255,255,255,0.6)"
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill}
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth={3}
                  />
                ))}
              </Pie>
              
              {/* Animated Center Ring */}
              <Pie
                data={[{ value: 1 }]}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius="32%"
                outerRadius="36%"
                fill="#f8fafc"
                stroke="#e2e8f0"
                strokeWidth={4}
              />

              {/* Premium Tooltip */}
              <Tooltip 
                contentStyle={{
                  background: "rgba(255,255,255,0.98)",
                  border: "1px solid rgba(25,118,210,0.2)",
                  borderRadius: 20,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                  backdropFilter: 'blur(20px)',
                  padding: '16px'
                }}
                labelStyle={{ fontWeight: 700, color: '#1a1a1a', fontSize: '14px' }}
                itemStyle={{ fontWeight: 600, fontSize: '16px' }}
              />

              {/* Center Stats */}
              <text 
                x="50%" 
                y="50%" 
                textAnchor="middle" 
                dominantBaseline="middle"
                style={{
                  fontSize: '24px',
                  fontWeight: '800',
                  fill: '#1976d2',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {pieData.reduce((sum, d) => sum + d.value, 0)}
              </text>
              <text 
                x="50%" 
                y="50%" 
                textAnchor="middle" 
                dominantBaseline="middle"
                dy="28"
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  fill: '#64748b'
                }}
              >
                Total Proofs
              </text>
            </PieChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Box>
  </Paper>
</Box>



      {/* MONTHLY ACTIVITY */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 4, 
            borderRadius: 3, 
            backdropFilter: "blur(20px)",
            background: "rgba(255, 255, 255, 0.95)",
            border: "1px solid rgba(255,255,255,0.3)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.1)"
          }}>
            <Typography variant="h5" fontWeight={800} gutterBottom sx={{ 
              mb: 4, 
              color: "#1a1a1a", 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              fontSize: '1.4rem'
            }}>
              <BarChartIcon sx={{ fontSize: 28, color: "#1976d2" }} />
              {selectedYear} Monthly Activity
            </Typography>
            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", "& > *": { minWidth: 140, flex: 1 } }}>
              {timelineData.map((data, i) => (
                <Paper key={i} sx={{ 
                  p: 3, 
                  textAlign: "center", 
                  borderRadius: 3, 
                  backdropFilter: "blur(12px)",
                  background: "rgba(248, 249, 250, 0.95)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: "0 16px 32px rgba(0,0,0,0.15)"
                  },
                  flex: 1,
                  minWidth: 140
                }}>
                  <Typography variant="h4" fontWeight={800} sx={{ color: "#1976d2", mb: 1 }}>
                    {data.uploads}
                  </Typography>
                  <Typography variant="h6" sx={{ color: "#1a1a1a", fontWeight: 700, mb: 0.5 }}>
                    {data.month}
                  </Typography>
                  <Typography variant="body1" sx={{ color: "#666", fontWeight: 600 }}>
                    ({data.clients} new • {data.invoices} inv)
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

  const refreshProofs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await safeFetch("http://localhost:3001/api/payment-proofs");
      setProofs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load proofs. Backend may be down.");
      setProofs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProofs();
  }, [refreshProofs]);

  if (loading) return (
    <Box sx={{ py: 8, textAlign: "center" }}>
      <CircularProgress size={48} sx={{ mb: 2, color: "#3166AE" }} />
      <Typography variant="h5" sx={{ color: "text.secondary" }}>
        Loading proofs...
      </Typography>
    </Box>
  );

  if (error) return (
    <Box sx={{ py: 8, textAlign: "center" }}>
      <Alert severity="error" sx={{ mb: 2, maxWidth: 500, mx: "auto" }}>
        <ErrorIcon sx={{ mr: 1 }} />
        {error}
      </Alert>
      <Button 
        variant="contained" 
        startIcon={<RefreshIcon />} 
        onClick={refreshProofs}
        sx={{ mr: 1 }}
      >
        Retry
      </Button>
      <Button 
        variant="outlined" 
        onClick={() => window.location.reload()}
      >
        Reload Page
      </Button>
    </Box>
  );

  if (proofs.length === 0) return (
    <Box sx={{ py: 8, textAlign: "center" }}>
      <Alert severity="info" sx={{ mb: 2, maxWidth: 500, mx: "auto" }}>
        📭 No proofs uploaded yet
      </Alert>
      <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refreshProofs}>
        Refresh
      </Button>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight={600} sx={{ color: "#1a1a1a" }}>
          📎 Uploaded Proofs ({proofs.length})
        </Typography>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refreshProofs}>
          Refresh
        </Button>
      </Box>

      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
        <Box sx={{ maxHeight: 700, overflow: "auto" }}>
          {proofs.map((proof, index) => {
            const isPDF = proof.file_type?.includes('pdf') || proof.public_url?.includes('.pdf');
            const companyName = proof.company || `Client #${proof.client_id}`;
            
            return (
              <Paper 
                key={proof.id || `${proof.client_id}-${index}`} 
                sx={{ 
                  p: 3, 
                  mb: 2, 
                  borderRadius: 2, 
                  boxShadow: 1,
                  transition: "box-shadow 0.2s",
                  "&:hover": { boxShadow: 3 }
                }}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3 }}>
                  <Box sx={{ 
                    p: 2.5, 
                    bgcolor: isPDF ? "#ffebee" : "#e3f2fd", 
                    borderRadius: 2.5,
                    minWidth: 80,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {isPDF ? (
                      <PictureAsPdfIcon sx={{ color: '#D32F2F', fontSize: 48 }} />
                    ) : (
                      <ImageIcon sx={{ color: '#1976D2', fontSize: 48 }} />
                    )}
                  </Box>
                  
                  <Box sx={{ flexGrow: 1, pt: 0.5 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1, color: "#1a1a1a" }}>
                      {companyName}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666', mb: 1 }}>
                      Client #{proof.client_id} • Proof #{proofs.length - index}
                    </Typography>
                    {proof.comment && (
                      <Alert severity="info" sx={{ mb: 1.5, px: 2, py: 1 }}>
                        💬 {proof.comment}
                      </Alert>
                    )}
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      📅 {proof.uploaded_at ? new Date(proof.uploaded_at).toLocaleString() : 'Unknown date'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}>
                    <Chip
                      label={isPDF ? 'PDF Document' : 'Image File'}
                      size="small"
                      color={isPDF ? 'error' : 'primary'}
                      sx={{ fontWeight: 600, height: 32, fontSize: 0.75 }}
                    />
                    <Box sx={{ display: "flex", gap: 0.75 }}>
                      <Button
                        variant="outlined"
                        startIcon={<OpenInNewIcon />}
                        onClick={() => viewProof(proof)}
                        size="small"
                        sx={{ minWidth: 90 }}
                      >
                        {isPDF ? 'Preview' : 'View'}
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => downloadProof(proof)}
                        size="small"
                        sx={{ minWidth: 110 }}
                      >
                        Download
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}

function Dashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [clientsData, uploadsData, notificationsData] = await Promise.all([
        safeFetch("http://localhost:3001/api/clients"),
        safeFetch("http://localhost:3001/api/payment-proofs"),
        safeFetch("http://localhost:3001/api/notifications")
      ]);

      setClients(Array.isArray(clientsData) ? clientsData : []);
      setUploads(Array.isArray(uploadsData) ? uploadsData : []);
      
      if (Array.isArray(notificationsData)) {
        setUnreadNotifications(notificationsData.filter(n => n.viewed === 0).length);
      }
    } catch (error) {
      console.error("Dashboard initialization failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleDrawerToggle = () => setDrawerOpen(!drawerOpen);

  const sidebarItems = [
  { label: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
  { label: "View Clients", icon: <VisibilityIcon />, path: "/clients" },
  { label: "Create Invoice", icon: <AddInvoiceIcon />, path: "/invoices/new" },
  { label: "All Invoices", icon: <ReceiptIcon />, path: "/invoices" },
  { label: "Uploaded Proofs", icon: <UploadProofIcon />, path: "/uploaded-proofs" },
  { label: "Monthly Reports", icon: <AssessmentIcon />, path: "/reports/monthly" },
  { label: "Edit Client Form", icon: <SettingsIcon />, path: "/settings" },
  { label: "Notifications", icon: <NotificationsIcon />, action: () => navigate("/notifications") },
  { label: "Logout", icon: <LogoutIcon />, action: () => { localStorage.removeItem('token'); navigate("/login"); }, isButton: true },
];

  const activePath = location.pathname;

  if (loading) {
    return (
      <Box sx={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh", 
        bgcolor: mainBg 
      }}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={60} sx={{ color: sidebarBg, mb: 2 }} />
          <Typography variant="h6" sx={{ color: "text.secondary" }}>
            Loading Dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }

  const drawer = (
    <Box sx={{ 
      height: "100%", 
      display: "flex", 
      flexDirection: "column", 
      bgcolor: sidebarBg, 
      color: sidebarText, 
      width: drawerWidth 
    }}>
      <Box sx={{ px: 3, py: 3, flexDirection: "column", alignItems: "flex-start" }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: sidebarText, mb: 0.5 }}>
          Internship Success
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.85, color: sidebarText }}>
          Admin Dashboard
        </Typography>
      </Box>

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
                  "&:hover": { bgcolor: "#f0f0f0" },
                }}
              >
                {item.label}
              </Button>
            </Box>
          ) : (
            <ListItemButton
              key={index}
              selected={activePath === item.path}
              onClick={() => item.action ? item.action() : navigate(item.path)}
              sx={{
                borderRadius: 2,
                mx: 1,
                my: 0.5,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                transform: 'translateX(0)',
                "&:hover": { 
                  bgcolor: hoverBg,
                  transform: 'translateX(8px)',
                  boxShadow: '4px 0 20px rgba(255,255,255,0.3)',
                  marginRight: '8px !important'
                },
                "&.Mui-selected": { 
                  bgcolor: hoverBg, 
                  transform: 'translateX(8px)',
                  boxShadow: '4px 0 20px rgba(255,255,255,0.4)',
                  "&:hover": { 
                    bgcolor: "rgba(255,255,255,0.15)",
                    boxShadow: '6px 0 30px rgba(255,255,255,0.4)'
                  } 
                },
              }}
            >
              <ListItemIcon sx={{ 
                color: sidebarText, 
                minWidth: 48,
                transition: 'transform 0.3s ease',
                mr: { xs: 2, sm: 2.5 }
              }}>
                {React.cloneElement(item.icon, {
                  sx: {
                    fontSize: { xs: 22, sm: 24 },
                    transition: 'all 0.3s ease',
                  }
                })}
              </ListItemIcon>
              <ListItemText 
                primary={item.label} 
                primaryTypographyProps={{ 
                  fontWeight: activePath === item.path ? 700 : 600,
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                  transition: 'all 0.3s ease',
                  transform: 'translateX(0)',
                  letterSpacing: activePath === item.path ? '0.5px' : '0.2px'
                }} 
              />
            </ListItemButton>
          )
        )}
      </List>
    </Box>
  );

  return (
    <Box sx={{ 
      display: "flex", 
      bgcolor: mainBg,
      minHeight: "100vh" 
    }}>
      <CssBaseline />
      
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1, 
          bgcolor: sidebarBg, 
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)" 
        }}
      >
        <Toolbar sx={{ px: 3 }}>
          <IconButton 
            edge="start" 
            sx={{ mr: 0.9, color: sidebarText, "&:hover": { bgcolor: hoverBg } }} 
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            sx={{ flexGrow: 1, fontWeight: 700, color: sidebarText }}
          >
            Internship Success Finance Dashboard
          </Typography>
          
          <IconButton 
            sx={{ color: sidebarText, mr: 1, "&:hover": { bgcolor: hoverBg } }} 
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
            boxShadow: "8px 0 24px rgba(0,0,0,0.3)" 
          } 
        }} 
        ModalProps={{ keepMounted: true }}
      >
        {drawer}
      </Drawer>

      <Box sx={{ flexGrow: 1, p: 3, mt: "72px" }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link 
            underline="hover" 
            sx={{ 
              cursor: "pointer", 
              color: "#1976d2", 
              fontWeight: 600, 
              "&:hover": { color: "#1565c0" } 
            }} 
            onClick={() => navigate("/")}
          >
            🏠 Home
          </Link>
          <Typography sx={{ fontWeight: 600, color: "#1a1a1a" }}>
            {{
              "/dashboard": "Dashboard",

              "/clients": "Clients",

              "/invoices": "Invoices",

              "/invoices/new": "Create Invoice",

              "/uploaded-proofs": "Uploaded Proofs",
              
              "/settings": "Settings",
            }[activePath] || "Dashboard"}
          </Typography>
        </Breadcrumbs>

        <Routes>
          <Route path="/dashboard" element={<DashboardHome clients={clients} uploads={uploads} />} />
          <Route path="/uploaded-proofs" element={<UploadedProofs />} />
          <Route path="*" element={<DashboardHome clients={clients} uploads={uploads} />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default Dashboard;