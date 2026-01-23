// src/pages/ProofViewer.jsx - ✅ FULLY FIXED
import React, { useEffect, useState } from "react";
import { Box, Paper, Typography, Button, CircularProgress } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";

export default function ProofViewer() {
  const { id } = useParams(); // proof ID or invoice ID
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ FIXED: Fetch from payment_proofs table, NOT invoices
    fetch(`http://localhost:3001/api/payment-proofs/${id}`, {
      credentials: 'include'
    })
      .then(r => {
        if (!r.ok) throw new Error('Proof not found');
        return r.json();
      })
      .then(data => {
        console.log('✅ Proof data:', data); // DEBUG
        setData(data);
        setError(null);
      })
      .catch(err => {
        console.error('Proof fetch error:', err);
        setError('Proof not found');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading proof...</Typography>
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error || 'Proof not found'}</Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          <ArrowBackIcon sx={{ mr: 1 }} /> Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          onClick={() => navigate(-1)} 
          variant="outlined" 
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon sx={{ mr: 1 }} /> Back
        </Button>
        <Typography variant="h4">
          Proof #{data.id} — {data.company || 'Client'}
        </Typography>
      </Box>

      {/* Proof Display */}
      <Paper sx={{ p: 4, mb: 3, minHeight: 600 }}>
        {data.public_url ? (
          data.public_url.includes('.pdf') || data.public_url.includes('/pdf/') ? (
            /* ✅ PDF - Direct Cloudinary link */
            <Box sx={{ height: 600, width: '100%' }}>
              <iframe
                src={data.public_url}
                style={{ 
                  width: "100%", 
                  height: "100%", 
                  border: 'none',
                  borderRadius: '8px'
                }}
                title={`Proof ${data.id}`}
              />
            </Box>
          ) : (
            /* ✅ Image - Direct Cloudinary link */
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={data.public_url}
                alt={`Proof ${data.id}`}
                style={{ 
                  maxWidth: "100%", 
                  maxHeight: 600, 
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <Typography sx={{ mt: 2, display: 'none' }}>
                Image failed to load - <a href={data.public_url} target="_blank" rel="noopener noreferrer">Download</a>
              </Typography>
            </Box>
          )
        ) : (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <Typography variant="h6">No proof uploaded yet</Typography>
          </Box>
        )}
      </Paper>

      {/* Details */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Proof Details</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Client</Typography>
            <Typography variant="body1" fontWeight={500}>
              {data.company || data.fullname || 'Unknown'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Client ID</Typography>
            <Typography variant="body1">{data.client_id}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Uploaded</Typography>
            <Typography variant="body2">
              {new Date(data.uploaded_at).toLocaleDateString()}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">Comment</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {data.comment || '—'}
            </Typography>
          </Box>
        </Box>

        {/* Direct Download Link */}
        {data.public_url && (
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Download:</Typography>
            <Button
              variant="contained"
              href={data.public_url}
              target="_blank"
              rel="noopener noreferrer"
              download
              sx={{ mr: 2 }}
            >
              💾 Download Proof
            </Button>
            <Button
              variant="outlined"
              href={data.public_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              🔗 Open in New Tab
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
