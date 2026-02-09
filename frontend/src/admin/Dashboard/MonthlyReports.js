import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

export const trackActivity = async (action, invoiceId = null, proofId = null, duration = 0) => {
  try {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const response = await fetch(`${API_BASE_URL}/api/track-activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action, invoiceId, proofId, duration })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    console.log(`✅ TRACKED: ${action}`);
  } catch (error) {
    console.error(`🚨 TrackActivity [${action}] failed:`, error.message);
  }
};

const MonthlyReports = () => {
  const [reports, setReports] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [noWeeklyData, setNoWeeklyData] = useState(false);
  const [error, setError] = useState(null);
  const [showRawData, setShowRawData] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const fetchMonthlyReport = useCallback(async (year, month) => {
    setLoading(true); setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/monthly/${year}/${month}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      const mappedData = Array.isArray(data) ? data.map(log => ({
        date: log.activity_date || log.date || 'N/A',
        client_company: log.client_company || 'Admin',
        action: log.action || 'unknown',
        count: parseInt(log.count) || 1,
        total_time: parseInt(log.total_time_seconds) || 0,
        invoice_id: log.invoice_id || null,
        raw: log // Keep original for raw view
      })).filter(log => log.date && log.action) : [];
      
      const hasWeeklyData = mappedData.some(log => 
        ['invoice_issued', 'proof_uploaded', 'invoice_created'].includes(log.action)
      );
      
      setReports(mappedData);
      setNoWeeklyData(!hasWeeklyData);
      await trackActivity('view_monthly_report');
    } catch (err) {
      setError(`Failed to load reports: ${err.message}`);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth() + 1;
    fetchMonthlyReport(year, month);
  }, [selectedMonth, fetchMonthlyReport]);

  const chartData = useMemo(() => {
    return reports.reduce((acc, log) => {
      const actionName = log.action.replace(/_/g, ' ').toUpperCase();
      const existing = acc.find(item => item.action === actionName);
      if (existing) {
        existing.count += log.count;
      } else {
        acc.push({ action: actionName, count: log.count });
      }
      return acc;
    }, []).slice(0, 8);
  }, [reports]);

  const summaryStats = useMemo(() => ({
    totalActivities: reports.reduce((sum, log) => sum + log.count, 0),
    totalTime: reports.reduce((sum, log) => sum + log.total_time, 0),
    uniqueCompanies: new Set(reports.map(log => log.client_company)).size,
    topAction: [...chartData].sort((a, b) => b.count - a.count)[0]?.action || 'None'
  }), [reports, chartData]);

  const generatePDF = useCallback(() => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const monthName = format(selectedMonth, 'MMMM yyyy');
      
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.text('FINANCE SYSTEM', 20, 25);
      doc.setFontSize(16);
      doc.text('Monthly Activity Report', 20, 35);
      doc.setFontSize(12);
      doc.text(monthName, 20, 45);
      
      let yPosition = 55;
      
      // Summary stats
      doc.text(`Total Activities: ${summaryStats.totalActivities}`, 20, yPosition);
      doc.text(`Total Time: ${Math.floor(summaryStats.totalTime/3600)}h ${Math.floor((summaryStats.totalTime%3600)/60)}m`, 20, yPosition + 7);
      doc.text(`Companies: ${summaryStats.uniqueCompanies}`, 20, yPosition + 14);
      
      yPosition += 35;
      
      const tableData = reports.slice(0, 18).map(log => [
        log.date.slice(0, 10),
        log.client_company.slice(0, 18),
        log.action.replace(/_/g, ' ').toUpperCase().slice(0, 12),
        log.count.toString(),
        `${Math.floor(log.total_time/3600)}h`
      ]);
      
      autoTable(doc, {
        head: [['Date', 'Company', 'Action', 'Count', 'Time']],
        body: tableData,
        startY: yPosition,
        styles: { fontSize: 9, cellPadding: 4, halign: 'left' },
        headStyles: { 
          fillColor: [27, 46, 125], 
          textColor: 255, 
          fontStyle: 'bold',
          fontSize: 11
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 45 } }
      });
      
      doc.save(`monthly-report-${format(selectedMonth, 'yyyy-MM')}.pdf`);
      trackActivity('export_pdf_report');
    } catch (err) {
      alert('Failed to generate PDF');
    }
  }, [reports, selectedMonth, summaryStats]);

  const changeMonth = (delta) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(selectedMonth.getMonth() + delta);
    setSelectedMonth(newDate);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-l from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-slate-700 bg-clip-text text-transparent">
                Monthly Reports
              </h1>
              <p className="text-slate-600 mt-2 text-lg">Comprehensive activity analytics for {format(selectedMonth, 'MMMM yyyy')}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-2xl shadow-black/5">
            <div className="flex flex-col xl:flex-row xl:items-center gap-6">
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-3 bg-white/60 hover:bg-white border border-slate-200 rounded-2xl hover:shadow-lg transition-all duration-300 text-slate-700 hover:text-blue-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="bg-gradient-to-r from-slate-100 to-slate-200 px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-sm text-slate-500">Showing:</span>
                  <span className="text-xl font-bold text-slate-900 ml-2">
                    {format(selectedMonth, 'MMMM yyyy')}
                  </span>
                </div>
                
                <button
                  onClick={() => changeMonth(1)}
                  className="p-3 bg-white/60 hover:bg-white border border-slate-200 rounded-2xl hover:shadow-lg transition-all duration-300 text-slate-700 hover:text-blue-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowRawData(!showRawData)}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 shadow-md"
                >
                  {showRawData ? '📊 Charts' : '🔍 Raw Data'}
                </button>
                <button 
                  onClick={generatePDF} 
                  disabled={loading || reports.length === 0}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export PDF ({reports.length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {reports.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-600 font-medium">Total Activities</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent">
                    {summaryStats.totalActivities.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-600 font-medium">Total Time</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-900 bg-clip-text text-transparent">
                    {Math.floor(summaryStats.totalTime/3600)}h {Math.floor((summaryStats.totalTime%3600)/60)}m
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-600 font-medium">Companies</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-purple-900 bg-clip-text text-transparent">
                    {summaryStats.uniqueCompanies}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-600 font-medium">Top Action</p>
                  <p className="text-xl font-bold text-slate-900 truncate max-w-[140px]">
                    {summaryStats.topAction}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error & Warning States */}
        {error && (
          <div className="bg-gradient-to-r from-rose-500/10 to-red-500/10 border border-rose-200/50 backdrop-blur-xl rounded-3xl p-8 mb-8 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-rose-900 mb-2">Failed to load reports</h3>
                <p className="text-rose-800">{error}</p>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="ml-auto px-6 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 text-white font-semibold rounded-2xl hover:shadow-lg hover:scale-105 transition-all ml-4"
              >
                🔄 Retry
              </button>
            </div>
          </div>
        )}

        {/* Charts or Raw Data */}
        {reports.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {showRawData ? (
              <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent">
                    Raw Activity Data
                  </h3>
                  <span className="px-4 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                    {reports.length} records
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                        <th className="px-6 py-5 text-left font-bold text-slate-800 border-r border-slate-200">Date</th>
                        <th className="px-6 py-5 text-left font-bold text-slate-800 border-r border-slate-200">Company</th>
                        <th className="px-6 py-5 text-left font-bold text-slate-800 border-r border-slate-200">Action</th>
                        <th className="px-6 py-5 text-left font-bold text-slate-800 border-r border-slate-200">Count</th>
                        <th className="px-6 py-5 text-left font-bold text-slate-800">Time Spent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reports.map((log, idx) => (
                        <tr key={`${log.date}-${log.action}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-5 font-mono text-slate-800 font-semibold border-r border-slate-100">{log.date}</td>
                          <td className="px-6 py-5 text-slate-700 max-w-[200px] truncate" title={log.client_company}>{log.client_company}</td>
                          <td className="px-6 py-5">
                            <span className="inline-flex px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs font-bold rounded-full border border-blue-200">
                              {log.action.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-5 font-bold text-2xl text-emerald-600">{log.count}</td>
                          <td className="px-6 py-5 text-slate-700 font-medium">
                            {Math.floor(log.total_time/3600)}h {Math.floor((log.total_time%3600)/60)}m
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-2xl lg:col-span-1">
                  <h3 className="text-2xl font-bold mb-8 bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent flex items-center gap-3">
                    📈 Activity Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={420}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="count"
                        nameKey="action"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        innerRadius={60}
                        paddingAngle={5}
                        cornerRadius={8}
                      >
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`hsl(${index * 45 + 200}, 70%, 55%)`}
                            strokeWidth={3}
                            stroke="rgba(255,255,255,0.8)"
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          background: 'rgba(255,255,255,0.95)',
                          border: '1px solid rgba(255,255,255,0.8)',
                          borderRadius: '12px',
                          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-2xl lg:col-span-1">
                  <h3 className="text-2xl font-bold mb-8 bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent flex items-center gap-3">
                    📊
                    Activity Timeline
                  </h3>
                  <ResponsiveContainer width="100%" height={420}>
                    <BarChart data={reports} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                      <XAxis 
                        dataKey="date" 
                        angle={-45} 
                        height={80}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{
                          background: 'rgba(255,255,255,0.95)',
                          border: '1px solid rgba(255,255,255,0.8)',
                          borderRadius: '12px',
                          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="url(#activityGradient)"
                        radius={[8, 8, 0, 0]}
                        stroke="rgba(255,255,255,0.8)"
                        strokeWidth={1}
                      />
                      <defs>
                        <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#1d4ed8" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}

        {/* Loading & Empty States */}
        {loading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/90 backdrop-blur-2xl p-12 rounded-3xl shadow-2xl text-center max-w-lg mx-6 border border-white/50 animate-pulse">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <svg className="w-14 h-14 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Loading Reports</h2>
              <p className="text-slate-600 text-lg">Fetching your monthly activity data...</p>
            </div>
          </div>
        )}

        {!loading && reports.length === 0 && !error && (
          <div className="text-center py-32 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl">
            <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
              <svg className="w-20 h-20 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-4">No Activity Data</h3>
            <p className="text-xl text-slate-600 mb-8 max-w-md mx-auto">
              Select a month with logged activities or perform actions to generate your first report
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyReports;
