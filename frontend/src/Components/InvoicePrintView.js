import React from "react";
import {
  Box,
  Typography,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";

const InvoicePrintView = ({ invoice }) => {
  if (!invoice) return null;

  // Helpers
  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-ZA") : "";

  const money = (v) =>
    v != null ? Number(v).toFixed(2) : "0.00";

  // Fallbacks for VAT calculations
  const vatRate = invoice.vat_rate ?? 15;
  const totalExcl =
    invoice.total_excl ?? invoice.amount / (1 + vatRate / 100);
  const totalVat =
    invoice.total_vat ?? invoice.amount - totalExcl;
  const totalIncl = invoice.total_incl ?? invoice.amount;

  return (
    <Box
      sx={{
        width: "210mm",
        minHeight: "297mm",
        mx: "auto",
        bgcolor: "white",
        color: "#000",
        p: 4,
        fontSize: "0.9rem",
        boxSizing: "border-box",
      }}
    >
      {/* Top title */}
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        Tax Invoice
      </Typography>

      {/* Header: your company + logo placeholder */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        {/* Your business info – static */}
        <Box>
          <Typography fontWeight={700}>
            Internship Success (Pty) Ltd
          </Typography>
          <Typography>P O Box 12678</Typography>
          <Typography>Steiltes, 1213</Typography>
          <Typography>Nelspruit</Typography>
          <Typography>Tel: 013 753 3533 / 082 920 1561</Typography>
          <Typography>Company reg no: 2001/016804/07</Typography>
          <Typography>VAT No: 4220175766</Typography>
        </Box>

        {/* Right side meta */}
        <Box sx={{ textAlign: "right", minWidth: 220 }}>
          <Typography>Number: {invoice.invoice_number}</Typography>
          <Typography>
            Date: {formatDate(invoice.invoice_date)}
          </Typography>
          <Typography>Page: 1/1</Typography>
          <Typography>
            Reference: {invoice.customer_reference || "-"}
          </Typography>
          <Typography>Sales Rep: -</Typography>
          <Typography>
            Due Date: {formatDate(invoice.due_date)}
          </Typography>
          <Typography>Discount: 0.00%</Typography>
          <Box
            sx={{
              mt: 1.5,
              bgcolor: "#e0e0e0",
              p: 1,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Typography fontWeight={600}>Total Due:</Typography>
            <Typography fontWeight={700}>
              R {money(invoice.amount_due ?? totalIncl)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Bill-to block */}
      <Box sx={{ mb: 3 }}>
        <Typography fontWeight={700}>Tiles and Decor World</Typography>
        <Typography>{invoice.company}</Typography>
        <Typography>{invoice.street}</Typography>
        <Typography>
          {invoice.town} {invoice.postalcode}
        </Typography>
        <Typography>reg: {invoice.reg || "-"}</Typography>
        <Typography>
          Customer VAT No: {invoice.vat || "-"}
        </Typography>
      </Box>

      {/* Items table */}
      <Table size="small" sx={{ mb: 3 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: "#f5f5f5" }}>
            <TableCell>Description</TableCell>
            <TableCell align="right">Quantity</TableCell>
            <TableCell align="right">Excl. Price</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>
              RET001 - Retainer Fee
              <br />
              new Intern started {formatDate(invoice.invoice_date)}
            </TableCell>
            <TableCell align="right">1</TableCell>
            <TableCell align="right">
              R {money(totalExcl)}
            </TableCell>
            <TableCell align="right">
              R {money(totalExcl)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {/* ✅ TOTALS + BANKING SIDE-BY-SIDE (SQUARE BANK BOX) */}
      <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
        {/* LEFT: Banking Details - SQUARE BOX */}
        <Box
          sx={{
            flex: "0 0 140px", // Fixed width = square
            height: "fit-content",
            p: 1.5,
            border: "2px solid #333",
            borderRadius: 1,
            bgcolor: "#f9f9f9",
            fontSize: "0.8rem",
          }}
        >
          <Typography fontWeight={700} sx={{ mb: 0.5, fontSize: "0.85rem" }}>
            🏦 Bank Details
          </Typography>
          <Box sx={{ lineHeight: 1.1 }}>
            <Typography sx={{ fontSize: "0.75rem" }}>
              <strong>Beneficiary:</strong><br />
              Internship Success
            </Typography>
            <Typography sx={{ fontSize: "0.75rem" }}>
              <strong>Bank:</strong><br />
              Nedbank Crossings
            </Typography>
            <Typography sx={{ fontSize: "0.75rem" }}>
              <strong>Acc:</strong> 1241597879
            </Typography>
            <Typography sx={{ fontSize: "0.75rem" }}>
              <strong>Branch:</strong> 167 965
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", mt: 0.5 }}>
              <em>Ref: #{invoice.invoice_number}</em>
            </Typography>
          </Box>
        </Box>

        {/* RIGHT: Totals - Same height */}
        <Box sx={{ flex: 1, minWidth: 260 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography>Total Discount:</Typography>
            <Typography>R 0.00</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography>Total Exclusive:</Typography>
            <Typography>R {money(totalExcl)}</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography>Total VAT:</Typography>
            <Typography>R {money(totalVat)}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 700,
            }}
          >
            <Typography>Sub Total:</Typography>
            <Typography>R {money(totalIncl)}</Typography>
          </Box>
          <Box
            sx={{
              mt: 1,
              bgcolor: "#e0e0e0",
              p: 1,
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 700,
            }}
          >
            <Typography>Total Due:</Typography>
            <Typography>
              R {money(invoice.amount_due ?? totalIncl)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default InvoicePrintView;
