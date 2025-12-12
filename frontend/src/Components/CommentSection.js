import React, { useState, useEffect } from "react";
import { Box, TextField, Button, List, ListItem, Typography } from "@mui/material";
import dayjs from "dayjs";

const CommentSection = ({ invoiceId, fetchComments, postComment }) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    async function loadComments() {
      const data = await fetchComments(invoiceId);
      setComments(data);
    }
    loadComments();
  }, [invoiceId, fetchComments]);

  const addComment = async () => {
    if (!text) return;
    await postComment(invoiceId, { text, date: dayjs().format("YYYY-MM-DD") });
    setText("");
    const updatedComments = await fetchComments(invoiceId);
    setComments(updatedComments);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Add comment"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <Button variant="contained" onClick={addComment} disabled={!text}>
          Add
        </Button>
      </Box>
      <List dense>
        {comments.map((c, idx) => (
          <ListItem key={idx}>
            <Typography variant="body2" color="textSecondary">
              {c.date}: {c.text}
            </Typography>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default CommentSection;
