// ClientInteractionGraph.jsx - PROFESSIONAL LINE GRAPH COMPONENT
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress
} from "@mui/material";
import { TrendingUp } from "@mui/icons-material";

// Colors (match dashboard)
const primaryBlue = "#1976d2";
const successGreen = "#4caf50";
const warningOrange = "#ff9800";

export default function ClientInteractionGraph({ proofs, invoices, loadingProofs, clientId }) {
  const [monthlyData, setMonthlyData] = useState([]);

  // Calculate real-time stats
  const totalPops = proofs.length;
  const totalInvoices = invoices.length;
  const outstandingInvoices = invoices.filter(inv => Number(inv.amount_due || 0) > 0).length;
  const outstandingAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount_due || 0), 0);

  // Generate monthly interaction data
  useEffect(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map((month, index) => {
      const monthProofs = proofs.filter(proof => {
        const date = new Date(proof.created_at || proof.uploaded_at);
        return date.getMonth() === index;
      });
      
      const monthInvoices = invoices.filter(inv => {
        const date = new Date(inv.created_at || inv.date);
        return date.getMonth() === index;
      });

      return {
        month,
        pops: monthProofs.length,
        invoices: monthInvoices.length,
        payments: 0 // Placeholder for future payment gateway
      };
    });

    setMonthlyData(data);
  }, [proofs, invoices]);

  const maxValue = Math.max(
    ...monthlyData.map(d => Math.max(d.pops, d.invoices, d.payments)),
    1
  );

  if (loadingProofs || loadingProofs === undefined) {
    return (
      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8, alignItems: "center", gap: 2 }}>
          <CircularProgress size={32} sx={{ color: primaryBlue }} />
          <Typography>Tracking interactions...</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ 
      p: 4, 
      borderRadius: 3, 
      boxShadow: "0 8px 32px rgba(25,118,210,0.12)",
      border: "1px solid rgba(25,118,210,0.1)",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          <Chip 
            icon={<TrendingUp fontSize="small" />} 
            label="Client Interactions" 
            size="small" 
            sx={{ 
              bgcolor: primaryBlue, 
              color: "white", 
              fontWeight: 600,
              height: 28
            }} 
          />
        </Box>
        <Typography variant="h6" fontWeight={700} sx={{ color: "#1a1a1a" }}>
          Real-time Activity Tracking
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          POP uploads, invoices received, payments (gateway coming soon)
        </Typography>
      </Box>

      {/* LINE GRAPH - X/Y AXIS */}
      <Box sx={{ height: 280, position: "relative", mb: 3 }}>
        <svg viewBox="0 0 700 240" style={{ width: "100%", height: "100%" }}>
          {/* Grid Lines */}
          <g stroke="#e5e7eb" strokeWidth="1" opacity="0.7">
            {[...Array(6)].map((_, i) => (
              <line key={`h-${i}`} x1="70" y1={i * 40 + 20} x2="670" y2={i * 40 + 20} />
            ))}
            {[...Array(13)].map((_, i) => (
              <line key={`v-${i}`} x1={70 + i * 46} y1="20" x2={70 + i * 46} y2="220" />
            ))}
          </g>

          {/* Y-Axis */}
          <line x1="65" y1="20" x2="65" y2="220" stroke="#374151" strokeWidth="2.5" />
          {/* X-Axis */}
          <line x1="70" y1="220" x2="670" y2="220" stroke="#374151" strokeWidth="2.5" />

          {/* POP Uploads Line (Blue) */}
          <polyline
            points={monthlyData.map((d, i) => `${70 + i * 46},${220 - (d.pops / maxValue) * 160}`).join(" ")}
            fill="none"
            stroke={primaryBlue}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Invoices Line (Green) */}
          <polyline
            points={monthlyData.map((d, i) => `${70 + i * 46},${220 - (d.invoices / maxValue) * 160}`).join(" ")}
            fill="none"
            stroke={successGreen}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Payments Line (Orange - Placeholder) */}
          <polyline
            points={monthlyData.map((d, i) => `${70 + i * 46},${220 - (d.payments / maxValue) * 160}`).join(" ")}
            fill="none"
            stroke={warningOrange}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="5,5"
            opacity="0.7"
          />

          {/* Data Points */}
          {monthlyData.map((d, i) => (
            <>
              <circle
                key={`pop-${i}`}
                cx={70 + i * 46}
                cy={220 - (d.pops / maxValue) * 160}
                r="8"
                fill={primaryBlue}
                stroke="white"
                strokeWidth="3"
              />
              <circle
                key={`inv-${i}`}
                cx={70 + i * 46}
                cy={220 - (d.invoices / maxValue) * 160}
                r="8"
                fill={successGreen}
                stroke="white"
                strokeWidth="3"
              />
              <circle
                key={`pay-${i}`}
                cx={70 + i * 46}
                cy={220 - (d.payments / maxValue) * 160}
                r="6"
                fill={warningOrange}
                stroke="white"
                strokeWidth="2"
                opacity="0.7"
              />
            </>
          ))}

          {/* Y-Axis Labels */}
          <text x="58" y="32" fontSize="12" fontWeight="600" fill="#6b7280" textAnchor="end">Max</text>
          <text x="58" y="122" fontSize="12" fontWeight="600" fill="#6b7280" textAnchor="end">50%</text>
          <text x="58" y="220" fontSize="12" fontWeight="600" fill="#6b7280" textAnchor="end">0</text>

          {/* Month Labels */}
          {monthlyData.map((d, i) => (
            <text 
              key={d.month} 
              x={70 + i * 46} 
              y="238" 
              fontSize="11" 
              fill="#6b7280" 
              textAnchor="middle"
              fontWeight="600"
            >
              {d.month}
            </text>
          ))}
        </svg>
      </Box>

      {/* REAL-TIME STATS */}
      <Box sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        flexWrap: "wrap", 
        gap: 2, 
        pt: 2, 
        borderTop: "1px solid #e5e7eb" 
      }}>
        {/* Legend */}
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 20, height: 4, bgcolor: primaryBlue, borderRadius: 2 }} />
            <Typography variant="body2" fontWeight={600}>POPs ({totalPops})</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 20, height: 4, bgcolor: successGreen, borderRadius: 2 }} />
            <Typography variant="body2" fontWeight={600}>Invoices ({totalInvoices})</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 20, height: 4, bgcolor: warningOrange, borderRadius: 2 }} />
            <Typography variant="body2" fontWeight={600}>Payments (0)*</Typography>
          </Box>
        </Box>

        {/* Live Stats Cards */}
        <Box sx={{ display: "flex", gap: 3 }}>
          <Box textAlign="center">
            <Typography variant="h4" fontWeight={800} sx={{ color: primaryBlue }}>
              {totalPops}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>POP Uploads</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h4" fontWeight={800} sx={{ color: successGreen }}>
              {totalInvoices}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Total Invoices</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h4" fontWeight={700} sx={{ color: warningOrange, opacity: 0.8 }}>
              R{outstandingAmount.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Outstanding</Typography>
          </Box>
        </Box>
      </Box>

      <Typography variant="caption" sx={{ display: "block", mt: 1, color: "text.secondary", fontStyle: "italic", fontSize: "0.75rem" }}>
        * Payments tracking will activate with payment gateway integration
      </Typography>
    </Paper>
  );
}
