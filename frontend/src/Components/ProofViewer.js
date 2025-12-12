// src/pages/ProofViewer.jsx
import React, { useEffect, useState } from "react";
import { Box, Paper, Typography, Button } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";

export default function ProofViewer() {
  const { id } = useParams(); // invoice id or upload id
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:3001/api/invoices/${id}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  }, [id]);

  if (!data) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Button onClick={() => navigate(-1)}>Back</Button>
      <Typography variant="h5" sx={{ mb: 2 }}>{data.company} — Proof</Typography>

      {data.proof_file ? (
        data.proof_file.endsWith(".pdf") ? (
          <iframe src={`http://localhost:3001${data.proof_file}`} style={{ width: "100%", height: 600 }} title="PDF Preview" />
        ) : (
          <img src={`http://localhost:3001${data.proof_file}`} alt="proof" style={{ maxWidth: "100%", height: "auto" }} />
        )
      ) : (
        <Typography>No proof uploaded yet.</Typography>
      )}

      <Paper sx={{ p:2, mt:2 }}>
        <Typography variant="subtitle2">Comment</Typography>
        <Typography>{data.proof_comment || "—"}</Typography>
      </Paper>
    </Box>
  );
}
