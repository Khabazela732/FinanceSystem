import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function Clients() {
  const [clients, setClients] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3001/api/clients")
      .then((res) => res.json())
      .then((data) => setClients(data));
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: { xs: 2, md: 6 },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "1200px",
          bgcolor: "rgba(255,255,255,0.96)",
          borderRadius: 3,
          boxShadow: "0 6px 18px rgba(25,118,210,0.13)",
          px: { xs: 2, md: 4 },
          py: { xs: 2, md: 5 },
          mb: 4,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#1976d2",
              letterSpacing: ".01em",
              lineHeight: 1.2,
            }}
          >
            Clients
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              textTransform: "none",
              px: 3,
              boxShadow: "0 2px 8px rgba(25,118,210,0.13)",
            }}
            onClick={() => navigate("/clients/new")}
          >
            Add Client
          </Button>
        </Box>

        {clients.length === 0 ? (
          <Typography
            color="text.secondary"
            sx={{ mt: 4, fontStyle: "italic" }}
          >
            No clients found. Click "Add Client" to get started.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {clients.map((client) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={client.id}>
                <Card
                  elevation={5}
                  sx={{
                    borderRadius: 3,
                    boxShadow: "0px 6px 18px rgba(25, 118, 210, 0.16)",
                    transition: "transform 0.19s, box-shadow 0.19s",
                    bgcolor: "#fdfdff",
                    "&:hover": {
                      transform: "translateY(-5px) scale(1.03)",
                      boxShadow:
                        "0px 14px 32px rgba(25,118,210,0.15), 0 4px 18px #b6cfff22",
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => navigate(`/clients/${client.id}`)}
                    sx={{ borderRadius: 3 }}
                  >
                    <CardContent>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: "#0d47a1",
                          fontSize: "1.16rem",
                          mb: 0.5,
                        }}
                        gutterBottom
                      >
                        {client.name}
                      </Typography>
                      <Typography
                        sx={{
                          color: "#5f6368",
                          fontStyle: "italic",
                          fontWeight: 500,
                          fontSize: ".98rem",
                        }}
                      >
                        {client.company}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}

export default Clients;
