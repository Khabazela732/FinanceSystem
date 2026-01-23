import React, { useState } from "react";
import { Box, Typography, TextField, Button, Modal } from "@mui/material";

const modalStyle = {
  position: 'absolute', top: '50%', left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400, bgcolor: 'background.paper',
  borderRadius: 2, boxShadow: 24, p: 4,
};

const InvoiceModal = ({ open, client, onClose, onSend }) => {
  const [comment, setComment] = useState("");

  const handleSend = () => {
    onSend(client, comment);
    setComment("");
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" mb={2}>Send Invoice to {client?.name}</Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Add Comment"
          variant="outlined"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSend} disabled={!comment}>Send</Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default InvoiceModal;
