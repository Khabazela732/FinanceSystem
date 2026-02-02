import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// ✅ FIXED: trackActivity exported as TOP-LEVEL function (fixes ESLint line 288)
export const trackActivity = async (action, invoiceId = null, proofId = null, duration = 0) => {
  try {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    await fetch(`${API_BASE_URL}/api/track-activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action, invoiceId, proofId, duration })
    });
    console.log(`✅ TRACKED: ${action}`);
  } catch (error) {
    console.error('Track activity failed:', error);
  } 
};

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const MonthlyReports = () => {
  const [reports, setReports] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [noWeeklyData, setNoWeeklyData] = useState(false);
  const [error, setError] = useState(null);

  // Fetch monthly data - FIXED
  const fetchMonthlyReport = useCallback(async (year, month) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/monthly/${year}/${month}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Map API response to match frontend expectations
      const mappedData = data.map(log => ({
        date: log.activity_date || log.date,
        client_company: log.client_company,
        action: log.action,
        count: parseInt(log.count) || 0,
        total_time: parseInt(log.total_time_seconds || log.total_time) || 0,
        invoice_id: log.invoice_id
      }));
      
      // Check for weekly gaps
      const hasWeeklyData = mappedData.some(log => 
        ['invoice_issued', 'proof_uploaded'].includes(log.action)
      );
      setNoWeeklyData(!hasWeeklyData);
      setReports(mappedData);
      
    } catch (err) {
      console.error('Report error:', err);
      setError('Failed to load reports');
      setReports([]);
      setNoWeeklyData(true);
    }
    setLoading(false);
  }, []);

  // Load data on mount and month change
  useEffect(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth() + 1;
    fetchMonthlyReport(year, month);
  }, [selectedMonth, fetchMonthlyReport]);

  // Charts data - OPTIMIZED with useMemo
  const chartData = useMemo(() => {
    return reports.reduce((acc, log) => {
      const existing = acc.find(item => item.action === log.action);
      if (existing) {
        existing.count += log.count;
      } else {
        acc.push({ action: log.action.replace('_', ' ').toUpperCase(), count: log.count });
      }
      return acc;
    }, []);
  }, [reports]);

  // Generate PDF Report - FIXED
  const generatePDF = useCallback(() => {
    const doc = new jsPDF();
    const monthName = format(selectedMonth, 'MMMM yyyy');
    
    doc.setFontSize(22);
    doc.text(`Monthly Activity Report`, 20, 30);
    doc.setFontSize(16);
    doc.text(monthName, 20, 45);
    
    let startY = 60;
    
    if (noWeeklyData) {
      doc.setFontSize(12);
      doc.setTextColor(255, 193, 7);
      doc.text('⚠️ NO WEEKLY ACTIVITY DETECTED THIS MONTH', 20, startY);
      startY += 15;
    }
    
    // Summary table
    const tableData = reports.map(log => [
      log.date,
      log.client_company || 'Admin',
      log.action.replace('_', ' ').toUpperCase(),
      log.count.toString(),
      `${Math.round((log.total_time || 0) / 3600)}h`
    ]);
    
    doc.autoTable({
      head: [['Date', 'Company', 'Action', 'Count', 'Time Spent']],
      body: tableData,
      startY,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    doc.save(`monthly-report-${format(selectedMonth, 'yyyy-MM')}.pdf`);
  }, [reports, selectedMonth, noWeeklyData]);

  return (
    <div className="monthly-reports p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="report-header mb-8 flex flex-wrap items-center gap-4 bg-white p-6 rounded-xl shadow-sm">
        <h1 className="text-3xl font-bold text-gray-800">Monthly Activity Reports</h1>
        
        <input
          type="month"
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
          onChange={(e) => setSelectedMonth(new Date(e.target.value + '-01'))}
        />
        
        <button 
          onClick={generatePDF} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          disabled={loading || reports.length === 0}
        >
          📄 Export PDF
        </button>
      </div>

      {/* Error & Warning States */}
      {error && (
        <div className="alert alert-error bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
          ❌ {error}
        </div>
      )}

      {noWeeklyData && !error && (
        <div className="alert alert-warning bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6">
          ⚠️ No weekly activity (invoices/proofs) detected this month
        </div>
      )}

      {/* Charts */}
      {reports.length > 0 && (
        <div className="charts-grid grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="chart-card bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Activity Summary</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="action"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={30}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`hsl(${index * 60}, 70%, 50%)`} 
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Daily Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reports}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Table */}
      <div className="report-table bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Date</th>
                <th className="px-6 py-4 text-left font-semibold">Company</th>
                <th className="px-6 py-4 text-left font-semibold">Action</th>
                <th className="px-6 py-4 text-left font-semibold">Count</th>
                <th className="px-6 py-4 text-left font-semibold">Time Spent</th>
                <th className="px-6 py-4 text-left font-semibold">View Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((log, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium">{log.date}</td>
                  <td className="px-6 py-4">{log.client_company || 'Admin'}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                      {log.action.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-blue-600">{log.count}</td>
                  <td className="px-6 py-4">
                    {Math.round((log.total_time || 0) / 3600)}h {Math.round(((log.total_time || 0) / 60) % 60)}m
                  </td>
                  <td className="px-6 py-4">
                    {log.invoice_id ? (
                      <button 
                        onClick={() => window.open(`${API_BASE_URL}/api/invoices/${log.invoice_id}`, '_blank')}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        📄 View
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-700">Generating report...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && reports.length === 0 && !error && (
        <div className="text-center py-20 bg-gray-50 rounded-xl">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-2xl font-bold text-gray-600 mb-2">No data available</h3>
          <p className="text-gray-500">Select a month with activity or wait for data to populate</p>
        </div>
      )}
    </div>
  );
};

export default MonthlyReports;
