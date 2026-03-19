import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, CircularProgress, Alert, AppBar, Toolbar,
  IconButton, Backdrop, Button, Divider, Chip, LinearProgress,
  TextField,Grid
} from "@mui/material";
import { 
  Menu as MenuIcon, Close as CloseIcon, Dashboard as DashboardIcon, Receipt as ReceiptIcon, 
  UploadFile, Edit as EditIcon, Bolt as BoltIcon, Home as HomeIcon, Logout as LogoutIcon,
  TrendingUp as TrendingUpIcon, PieChart as PieChartIcon,
  BarChart as BarChartIcon, Payment as PaymentIcon, 
  Person as PersonIcon, Phone as PhoneIcon,
  Email as EmailIcon, LocationOn as LocationOnIcon, Business as BusinessIcon,
  BusinessCenter as BusinessCenterIcon,
  LocationCity as LocationCityIcon,
  Map as MapIcon,
  ContactMail as ContactMailIcon
} from "@mui/icons-material";
import {
  PieChart,Pie,Cell,
  ResponsiveContainer,Tooltip,Legend,BarChart,
  Bar,XAxis,YAxis,CartesianGrid,LineChart,Line
} from "recharts";

// LIGHT BLUE THEME COLORS - Matching Admin Dashboard
const sidebarBg = "#3166AE";
const sidebarText = "#ffffff";
const hoverBg = "rgba(255, 255, 255, 0.1)";
const mainBg = "#e3f2fd"; // ✅ LIGHT BLUE BACKGROUND
const primaryBlue = "#1976d2";
const successGreen = "#4caf50";
const textPrimary = "#1a1a1a";

// Chart colors
const CYAN_BAR = "#1976d2";        
const INVOICE_BLUE = "#4caf50";
const INTERACTION_PURPLE = "#ff9800";

// PIE CHART COLORS
const PIE_COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8",
  "#82ca9d", "#ffc658", "#ff7300", "#a4de6c", "#d0ed57",
];

const navButtonStyle = (active) => ({
  padding: "12px 16px",
  borderRadius: 2,
  backgroundColor: active ? "rgba(255,255,255,0.2)" : "transparent",
  color: sidebarText,
  fontWeight: active ? 700 : 600,
  fontSize: "0.95rem",
  cursor: "pointer",
  border: "1px solid transparent",
  textAlign: "left",
  width: "100%",
  mb: 1,
  transition: "all 0.3s ease",
  justifyContent: "flex-start",
  textTransform: "none",
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  "&:hover": { 
    backgroundColor: hoverBg,
    borderColor: "rgba(255,255,255,0.3)",
    transform: "translateX(4px)"
  },
});

export default function ClientDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [client, setClient] = useState(null);
  const [loadingClient, setLoadingClient] = useState(true);
  const [proofs, setProofs] = useState([]);
  const [loadingProofs, setLoadingProofs] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [showProfile, setShowProfile] = useState(true);
const [isEditing, setIsEditing] = useState(false);
const [profileImagePreview, setProfileImagePreview] = useState(null);
const [formData, setFormData] = useState({});

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Fetch client data
  useEffect(() => {
    async function fetchClient() {
      setLoadingClient(true);
      try {
        const res = await fetch(`http://localhost:3001/api/clients/${id}/details`, {
          credentials: "include", headers: { "Cache-Control": "no-cache" }
        });
        if (!res.ok) {
          const backupRes = await fetch("http://localhost:3001/api/clients", { credentials: "include" });
          const allClients = await backupRes.json();
          setClient(Array.isArray(allClients) ? allClients.find(c => String(c.id) === String(id)) : null);
        } else {
          setClient(await res.json());
        }
      } catch (error) {
        console.error("Client fetch error:", error);
      } finally {
        setLoadingClient(false);
      }
    }
    if (id) fetchClient();
  }, [id]);

  // Fetch proofs and invoices with real-time monthly tracking
  useEffect(() => {
    async function fetchData() {
      setLoadingProofs(true);
      try {
        const [proofsRes, invoicesRes] = await Promise.all([
          fetch(`http://localhost:3001/api/proofs/client/${id}`, { credentials: "include", headers: { "Cache-Control": "no-cache" } }),
          fetch("http://localhost:3001/api/invoices", { credentials: "include", headers: { "Cache-Control": "no-cache" } })
        ]);
        
        if (proofsRes.ok) setProofs(await proofsRes.json());
        const allInvoices = await invoicesRes.json();
        setInvoices(Array.isArray(allInvoices) ? allInvoices.filter(inv => String(inv.client_id) === String(id)) : []);
      } catch (error) {
        console.error("Data fetch error:", error);
      } finally {
        setLoadingProofs(false);
      }
    }
    if (id) fetchData();
  }, [id]);

  //PIE CHART DATA - Overall Distribution
  const generatePieData = () => {
    return [
      { name: "Proofs Uploaded", value: proofs.length, fill: CYAN_BAR },
      { name: "Invoices Received", value: invoices.length, fill: INVOICE_BLUE },
      { name: "Total Interactions", value: proofs.length + invoices.length, fill: INTERACTION_PURPLE }
    ].filter(item => item.value > 0);
  };

  //MONTHLY ANALYTICS DATA - Last 12 Months
  const generateMonthlyData = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthShort = date.toLocaleDateString('en-US', { month: 'short' });
      const monthFull = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      // Count proofs for this month
      const monthProofs = proofs.filter(p => {
        try {
          const proofDate = new Date(p.uploaded_at || p.created_at);
          return proofDate.getFullYear() === date.getFullYear() && 
                 proofDate.getMonth() === date.getMonth();
        } catch {
          return false;
        }
      }).length;

      // Count invoices for this month
      const monthInvoices = invoices.filter(inv => {
        try {
          const invDate = new Date(inv.created_at || inv.date);
          return invDate.getFullYear() === date.getFullYear() && 
                 invDate.getMonth() === date.getMonth();
        } catch {
          return false;
        }
      }).length;

      const interactions = monthProofs + monthInvoices;
      const isCurrentMonth = i === 0;

      months.push({
        month: monthShort,
        monthFull,
        proofs: monthProofs,
        invoices: monthInvoices,
        interactions,
        totalActivity: interactions > 0 ? '✓ Active' : '○ Inactive',
        isActive: interactions > 0,
        isCurrentMonth
      });
    }
    return months;
  };

  const pieData = generatePieData();
  const monthlyData = generateMonthlyData();

  //CURRENT MONTH STATS
  const currentMonthData = monthlyData[monthlyData.length - 1];
  const proofGrowth = monthlyData.length > 1 
    ? ((monthlyData[monthlyData.length - 1].proofs - monthlyData[monthlyData.length - 2].proofs) / Math.max(monthlyData[monthlyData.length - 2].proofs, 1)) * 100
    : 0;
  const invoiceGrowth = monthlyData.length > 1 
    ? ((monthlyData[monthlyData.length - 1].invoices - monthlyData[monthlyData.length - 2].invoices) / Math.max(monthlyData[monthlyData.length - 2].invoices, 1)) * 100
    : 0;

  // Custom Pie Tooltip
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <Paper sx={{
          p: 2,
          bgcolor: '#ffffff',
          color: textPrimary,
          border: `2px solid ${data.payload.fill}`,
          borderRadius: 1.5,
          boxShadow: 2,
          minWidth: 160
        }}>
          <Typography variant="body2" fontWeight={700} sx={{ color: data.payload.fill, mb: 0.5 }}>
            {data.name}
          </Typography>
          <Typography variant="h6" fontWeight={800} sx={{ color: textPrimary }}>
            {data.value} {data.value === 1 ? 'item' : 'items'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.5 }}>
            {((data.value / (pieData.reduce((sum, item) => sum + item.value, 0)) * 100)).toFixed(1)}% of total
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  // Custom Monthly Tooltip
  const CustomMonthlyTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{
          p: 2.5,
          bgcolor: '#ffffff',
          color: textPrimary,
          border: `2px solid ${primaryBlue}`,
          borderRadius: 1.5,
          boxShadow: 3,
          minWidth: 200
        }}>
          <Typography variant="body2" fontWeight={800} sx={{ color: primaryBlue, mb: 1.5 }}>
            {data.monthFull}
          </Typography>
          
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2" fontWeight={600} sx={{ color: textPrimary }}>📄 Proofs</Typography>
              <Typography variant="h6" fontWeight={800} sx={{ color: CYAN_BAR }}>
                {data.proofs}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2" fontWeight={600} sx={{ color: textPrimary }}>💰 Invoices</Typography>
              <Typography variant="h6" fontWeight={800} sx={{ color: INVOICE_BLUE }}>
                {data.invoices}
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ bgcolor: '#e0e0e0', my: 1 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" fontWeight={700} sx={{ color: INTERACTION_PURPLE }}>
              🎯 Total
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ color: INTERACTION_PURPLE }}>
              {data.interactions}
            </Typography>
          </Box>
          
          <Box sx={{ mt: 1 }}>
            <Chip 
              label={data.totalActivity} 
              size="small"
              sx={{ 
                bgcolor: data.isActive ? 'rgba(76, 175, 80, 0.2)' : 'rgba(200, 200, 200, 0.2)',
                color: data.isActive ? successGreen : '#999',
                fontWeight: 700,
                fontSize: '0.7rem'
              }}
            />
          </Box>
        </Paper>
      );
    }
    return null;
  };

const DetailRowSmall = ({ icon, label, value }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.5 }}>
    <Box sx={{ 
      minWidth: 28, 
      height: 28, 
      borderRadius: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1rem",
      fontWeight: "bold"
    }}>
      {icon}
    </Box>
    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
      <Typography variant="caption" fontWeight={600} sx={{ color: "#6b7280", display: "block" }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} sx={{ color: "#1f2937", mt: 0.25 }}>
        {value}
      </Typography>
    </Box>
  </Box>
);


const FieldRow = ({ icon, label, value, editing, onChange, type = "text" }) => (
  <Grid item xs={12}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
      <Box sx={{ 
        width: 48, 
        height: 48, 
        borderRadius: 2.5,
        bgcolor: "rgba(30,58,138,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {icon}
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="caption" fontWeight={600} sx={{ color: "#64748b", mb: 1, display: "block" }}>
          {label}
        </Typography>
        {editing ? (
          <TextField
            fullWidth
            size="small"
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            sx={{ 
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "white"
              }
            }}
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

  const renderOverview = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* PAGE TITLE */}
      <Box sx={{ mb: 2 }}>
        <Typography 
          variant="h4" 
          fontWeight={700} 
          sx={{ 
            color: textPrimary,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}
        >
          <PieChartIcon sx={{ fontSize: 32 }} />
          {loadingClient ? "Loading..." : client?.company || `Client Dashboard`}
        </Typography>
        <Typography variant="body1" sx={{ color: '#666', mt: 0.5 }}>
          Financial Analytics & Activity Tracking
        </Typography>
      </Box>

      {/* CLIENT INFO CARDS */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1.2fr" }, gap: 3 }}>
        <Paper sx={{ 
          p: 3, 
          borderRadius: 2, 
          boxShadow: 2, 
          bgcolor: "white",
          border: "1px solid #e0e0e0"
        }}>
          <Typography variant="h6" gutterBottom fontWeight={700} sx={{ color: textPrimary, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            👤 Client Profile
          </Typography>
          {loadingClient ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={32} sx={{ color: primaryBlue }} />
            </Box>
          ) : !client ? (
            <Alert severity="warning" sx={{ mt: 2 }}>No client data found.</Alert>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 2, mt: 1 }}>
              <Typography fontWeight={700} sx={{ color: '#666' }}>🏢 Company:</Typography>
              <Typography fontWeight={600} sx={{ color: textPrimary }}>{client.company}</Typography>
              <Typography fontWeight={700} sx={{ color: '#666' }}>👤 Contact:</Typography>
              <Typography fontWeight={600} sx={{ color: textPrimary }}>{client.fullname} {client.lastname}</Typography>
              <Typography fontWeight={700} sx={{ color: '#666' }}>📧 Email:</Typography>
              <Typography fontWeight={500} sx={{ color: primaryBlue }}>{client.email}</Typography>
            </Box>
          )}
        </Paper>
        
        <Paper sx={{ 
          p: 3, 
          borderRadius: 2, 
          boxShadow: 2, 
          bgcolor: "white",
          border: "1px solid #e0e0e0"
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <HomeIcon sx={{ color: primaryBlue, fontSize: 22 }} />
            <Typography variant="h6" fontWeight={700} sx={{ color: textPrimary }}>
              Address
            </Typography>
          </Box>
          {loadingClient ? (
            <CircularProgress size={24} sx={{ color: primaryBlue, display: 'block', mx: 'auto' }} />
          ) : (
            <Typography sx={{ lineHeight: 1.6, color: '#555', fontSize: '0.95rem' }}>
              {client?.street || 'N/A'}<br />
              {client?.town || ''}, {client?.province || ''} {client?.postalcode || ''}
            </Typography>
          )}
        </Paper>
      </Box>

      {/* PIE CHART + MONTHLY CHART SECTION */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 4 }}>
        {/* PIE CHART */}
        <Paper sx={{ 
          p: 3,
          borderRadius: 2,
          boxShadow: 2,
          bgcolor: "white",
          border: "1px solid #e0e0e0"
        }}>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ 
            mb: 2, 
            display: "flex", 
            alignItems: "center",
            gap: 1,
            color: textPrimary,
            fontSize: '1.1rem' 
          }}>
            <PieChartIcon sx={{ fontSize: 24, color: primaryBlue }} />
            Activity Distribution
          </Typography>
          
          {loadingProofs ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 10, gap: 2 }}>
              <CircularProgress size={40} sx={{ color: primaryBlue }} />
              <Typography variant="body2" sx={{ color: '#666' }}>Loading analytics...</Typography>
            </Box>
          ) : pieData.length === 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 10, gap: 2 }}>
              <Typography variant="body1" sx={{ color: '#999' }}>No data yet</Typography>
              <Typography variant="body2" sx={{ color: '#999' }}>Start uploading proofs or receiving invoices</Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={600}
                  animationEasing="ease-out"
                  label={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
          
          {pieData.length > 0 && (
            <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #e0e0e0", display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
              {pieData.map((item, idx) => (
                <Box key={idx} sx={{ textAlign: 'center' }}>
                  <Box sx={{ width: 10, height: 10, bgcolor: item.fill, borderRadius: '50%', mx: 'auto', mb: 0.75 }} />
                  <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5, fontSize: '0.8rem' }}>
                    {item.name}
                  </Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ color: item.fill, fontSize: '1rem' }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        {/* MONTHLY TREND */}
        <Paper sx={{ 
          p: 3,
          borderRadius: 2,
          boxShadow: 2,
          bgcolor: "white",
          border: "1px solid #e0e0e0"
        }}>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ 
            mb: 2, 
            display: "flex", 
            alignItems: "center",
            gap: 1,
            color: textPrimary,
            fontSize: '1.1rem'
          }}>
            <BarChartIcon sx={{ fontSize: 24, color: primaryBlue }} />
            12-Month Trends
          </Typography>
          
          {loadingProofs ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 10, gap: 2 }}>
              <CircularProgress size={40} sx={{ color: primaryBlue }} />
              <Typography variant="body2" sx={{ color: '#666' }}>Loading trends...</Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart 
                data={monthlyData}
                margin={{ top: 10, right: 15, left: -5, bottom: 10 }}
                barCategoryGap={6}
                barGap={2}
              >
                <CartesianGrid 
                  vertical={false}
                  strokeDasharray="4 4" 
                  stroke="#e0e0e0"
                  strokeOpacity={0.8}
                />
                
                <XAxis 
                  dataKey="month"
                  tickLine={false}
                  tick={{ 
                    fontSize: 11, 
                    fontWeight: 600, 
                    fill: '#666'
                  }}
                  axisLine={false}
                />
                
                <YAxis 
                  tickLine={false}
                  tick={{ 
                    fontSize: 11, 
                    fill: '#666',
                    fontWeight: 500
                  }}
                  axisLine={false}
                  tickMargin={8}
                />
                
                <Tooltip content={<CustomMonthlyTooltip />} />
                
                <Bar 
                  dataKey="proofs"
                  name="Proofs"
                  radius={[3, 3, 0, 0]}
                  fill={CYAN_BAR}
                  animationDuration={600}
                />
                
                <Bar 
                  dataKey="invoices"
                  name="Invoices"
                  radius={[3, 3, 0, 0]}
                  fill={INVOICE_BLUE}
                  animationDuration={600}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Paper>
      </Box>

      {/* CURRENT MONTH METRICS */}
      {!loadingProofs && currentMonthData && (
        <Paper sx={{ 
          p: 3,
          borderRadius: 2,
          boxShadow: 2,
          bgcolor: "white",
          border: "1px solid #e0e0e0"
        }}>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ 
            mb: 3,
            color: primaryBlue, 
            display: "flex", 
            alignItems: "center", 
            gap: 1,
            fontSize: '1.1rem'
          }}>
            <TrendingUpIcon sx={{ fontSize: 24 }} />
            {currentMonthData.monthFull} Performance
          </Typography>
          
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2.5 }}>
            {/* Proofs Card */}
            <Box sx={{ 
              p: 2.5,
              borderRadius: 1.5,
              bgcolor: "#f5f5f5",
              border: `1.5px solid ${CYAN_BAR}`,
              transition: 'all 0.2s ease'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ color: '#666', mb: 0.5 }}>
                    📄 Proofs This Month
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ color: CYAN_BAR }}>
                    {currentMonthData.proofs}
                  </Typography>
                </Box>
                <Chip 
                  label={proofGrowth >= 0 ? `+${proofGrowth.toFixed(0)}%` : `${proofGrowth.toFixed(0)}%`}
                  size="small"
                  sx={{ 
                    bgcolor: proofGrowth >= 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                    color: proofGrowth >= 0 ? successGreen : '#f44336',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.min((currentMonthData.proofs / Math.max(proofs.length / 12, 1)) * 100, 100)}
                sx={{ 
                  height: 5, 
                  borderRadius: 2,
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  '& .MuiLinearProgress-bar': { 
                    backgroundColor: CYAN_BAR,
                    borderRadius: 2
                  }
                }}
              />
            </Box>

            {/* Invoices Card */}
            <Box sx={{ 
              p: 2.5,
              borderRadius: 1.5,
              bgcolor: "#f5f5f5",
              border: `1.5px solid ${INVOICE_BLUE}`,
              transition: 'all 0.2s ease'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ color: '#666', mb: 0.5 }}>
                    💰 Invoices This Month
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ color: INVOICE_BLUE }}>
                    {currentMonthData.invoices}
                  </Typography>
                </Box>
                <Chip 
                  label={invoiceGrowth >= 0 ? `+${invoiceGrowth.toFixed(0)}%` : `${invoiceGrowth.toFixed(0)}%`}
                  size="small"
                  sx={{ 
                    bgcolor: invoiceGrowth >= 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                    color: invoiceGrowth >= 0 ? successGreen : '#f44336',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.min((currentMonthData.invoices / Math.max(invoices.length / 12, 1)) * 100, 100)}
                sx={{ 
                  height: 5, 
                  borderRadius: 2,
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  '& .MuiLinearProgress-bar': { 
                    backgroundColor: INVOICE_BLUE,
                    borderRadius: 2
                  }
                }}
              />
            </Box>

            {/* Interactions Card */}
            <Box sx={{ 
              p: 2.5,
              borderRadius: 1.5,
              bgcolor: "#f5f5f5",
              border: `1.5px solid ${INTERACTION_PURPLE}`,
              transition: 'all 0.2s ease'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ color: '#666', mb: 0.5 }}>
                    🎯 Total Interactions
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ color: INTERACTION_PURPLE }}>
                    {currentMonthData.interactions}
                  </Typography>
                </Box>
                <Chip 
                  label={currentMonthData.isActive ? 'Active' : 'Inactive'}
                  size="small"
                  sx={{ 
                    bgcolor: currentMonthData.isActive ? 'rgba(76, 175, 80, 0.2)' : 'rgba(200, 200, 200, 0.2)',
                    color: currentMonthData.isActive ? successGreen : '#999',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.min((currentMonthData.interactions / Math.max((proofs.length + invoices.length) / 12, 1)) * 100, 100)}
                sx={{ 
                  height: 5, 
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                  '& .MuiLinearProgress-bar': { 
                    backgroundColor: INTERACTION_PURPLE,
                    borderRadius: 2
                  }
                }}
              />
            </Box>
          </Box>
        </Paper>
      )}

      {/* OVERALL STATS CARDS */}
      {!loadingProofs && (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 3 }}>
          <Paper sx={{ 
            p: 4, 
            textAlign: "center", 
            borderRadius: 2, 
            boxShadow: 2,
            bgcolor: "white",
            border: "1px solid #e0e0e0",
            transition: 'all 0.2s ease',
            "&:hover": { boxShadow: 3, transform: 'translateY(-2px)' }
          }}>
            <Typography variant="h3" fontWeight={700} sx={{ color: CYAN_BAR, mb: 1 }}>
              {proofs.length}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ color: textPrimary, mb: 0.5 }}>
              Proofs Uploaded
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              All-time uploads tracked
            </Typography>
          </Paper>
          
          <Paper sx={{ 
            p: 4, 
            textAlign: "center", 
            borderRadius: 2, 
            boxShadow: 2,
            bgcolor: "white",
            border: "1px solid #e0e0e0",
            transition: 'all 0.2s ease',
            "&:hover": { boxShadow: 3, transform: 'translateY(-2px)' }
          }}>
            <Typography variant="h3" fontWeight={700} sx={{ color: INVOICE_BLUE, mb: 1 }}>
              {invoices.length}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ color: textPrimary, mb: 0.5 }}>
              Invoices Received
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Billing activity tracked
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 4, 
            textAlign: "center", 
            borderRadius: 2, 
            boxShadow: 2,
            bgcolor: "white",
            border: "1px solid #e0e0e0",
            transition: 'all 0.2s ease',
            "&:hover": { boxShadow: 3, transform: 'translateY(-2px)' }
          }}>
            <Typography variant="h3" fontWeight={700} sx={{ color: INTERACTION_PURPLE, mb: 1 }}>
              {proofs.length + invoices.length}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ color: textPrimary, mb: 0.5 }}>
              Total Interactions
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Combined activity tracked
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ 
      display: "flex", 
      bgcolor: mainBg,
      minHeight: "100vh"
    }}>
      {/* FIXED TOPBAR */}
      <AppBar position="fixed" sx={{
        zIndex: 1400, 
        bgcolor: sidebarBg,
        height: 72,
        minHeight: 72,
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        borderBottom: "none"
      }}>
        <Toolbar sx={{ height: 72, justifyContent: "space-between", px: 3, alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton 
              onClick={toggleSidebar} 
              sx={{ 
                color: sidebarText,
                "&:hover": { bgcolor: hoverBg }
              }}
            >
              <MenuIcon sx={{ fontSize: 24 }} />
            </IconButton>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: sidebarText, lineHeight: 1 }}>
                {loadingClient ? "Loading..." : client?.company || `Client Dashboard`}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: '0.8rem' }}>
                Financial Analytics
              </Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* SLIDE-IN SIDEBAR */}
<Box sx={{ flexGrow: 1, p: 2 }}>
  <Button fullWidth onClick={() => closeSidebar()} sx={navButtonStyle(true)}>
    <DashboardIcon sx={{ fontSize: 18 }} /> <span>Analytics</span>
  </Button>
  
  <Button fullWidth onClick={() => { navigate(`/client/invoices/${id}`); closeSidebar(); }} sx={navButtonStyle(false)}>
    <ReceiptIcon sx={{ fontSize: 18 }} /> <span>Invoices</span>
  </Button>
  
  <Button fullWidth onClick={() => { navigate(`/client/proof-upload/${id}`); closeSidebar(); }} sx={navButtonStyle(false)}>
    <UploadFile sx={{ fontSize: 18 }} /> <span>Upload Proof</span>
  </Button>
  
  <Button fullWidth onClick={() => { navigate(`/client/payments/${id}`); closeSidebar(); }} sx={navButtonStyle(false)}>
    <PaymentIcon sx={{ fontSize: 18 }} /> <span>Make Payment</span>
  </Button>
  
  <Button fullWidth onClick={() => { navigate("/clients/ClientProfilePage"); closeSidebar(); }} sx={navButtonStyle(false)}>
    <PersonIcon sx={{ fontSize: 18 }} /> <span>My Profile</span>
  </Button>
  
  <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", my: 1.5 }} />
  
  <Button fullWidth onClick={() => { navigate("/clients/login"); closeSidebar(); }} variant="contained" sx={{ /* your logout styles */ }}>
    <LogoutIcon sx={{ mr: 1, fontSize: 18 }} /> Sign Out
  </Button>
</Box>


      <Backdrop 
        sx={{ 
          zIndex: 1200, 
          bgcolor: sidebarOpen ? "rgba(0,0,0,0.5)" : "transparent", 
          backdropFilter: sidebarOpen ? "blur(4px)" : "none"
        }} 
        open={sidebarOpen} 
        onClick={closeSidebar} 
      />

      {/* MAIN CONTENT */}
<Box sx={{ 
  flexGrow: 1, 
  pt: 11, 
  pb: 5, 
  bgcolor: mainBg,
  minHeight: "100vh",
  opacity: showProfile ? 0 : 1,        
  visibility: showProfile ? "hidden" : "visible",  
  pointerEvents: showProfile ? "none" : "auto",   
  transition: "all 0.3s ease",
  position: showProfile ? "fixed" : "relative",   
  top: showProfile ? -100 : 0                    
}}>

  <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2, sm: 3, md: 4 }, py: 4 }}>
    {renderOverview()}
  </Box>
</Box>

<ClientProfilePage
  client={client}
  showProfile={showProfile}
  setShowProfile={setShowProfile}
  isEditing={isEditing}
  setIsEditing={setIsEditing}
  profileImagePreview={profileImagePreview}
  setProfileImagePreview={setProfileImagePreview}
  formData={formData}
  setFormData={setFormData}
/>
    </Box>
  );
}