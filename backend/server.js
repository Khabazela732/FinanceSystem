const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();

const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const PORT = process.env.PORT || 3001;
const UPLOADS_BASE = path.join(__dirname, "uploads");
const PROOFS_DIR = path.join(UPLOADS_BASE, "proofs");
const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || "mkhizesenzo732@gmail.com";

// Upload folders
try {
  if (!fs.existsSync(UPLOADS_BASE)) fs.mkdirSync(UPLOADS_BASE);
  if (!fs.existsSync(PROOFS_DIR))
    fs.mkdirSync(PROOFS_DIR, { recursive: true });
  console.log("Uploads directories ready:", PROOFS_DIR);
} catch (err) {
  console.error("Failed to create uploads directories:", err);
  process.exit(1);
}

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("trust proxy", 1);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "a_super_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
      secure: false,
    },
  })
);

// Middleware: Require authentication for admin routes
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ message: "Unauthorized. Please log in." });
}

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "Senzo@2001",
  database: process.env.DB_NAME || "Financial_db",
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection error:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL database.");
});

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "mkhizesenzo732@gmail.com",
    pass: process.env.EMAIL_PASS || "fyjdwxtsfmoqrnvk",
  },
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PROOFS_DIR),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "-" + safeName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["application/pdf", "image/jpeg", "image/png"];
  cb(null, allowed.includes(file.mimetype));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.use("/uploads", express.static(UPLOADS_BASE));

/* ---------- FILE UPLOADS ---------- */

app.post(
  "/api/proofs/upload",
  upload.single("proofFile"),
  async (req, res) => {
    try {
      const { clientId, comment } = req.body;
      if (!req.file || !clientId) {
        return res
          .status(400)
          .json({ message: "File and clientId required" });
      }

      await db
        .promise()
        .execute(
          "INSERT INTO payment_proofs (client_id, file_path, comment, uploaded_at) VALUES (?, ?, ?, NOW())",
          [clientId, req.file.filename, comment || null]
        );

      await db
        .promise()
        .execute(
          "INSERT INTO notifications (message, user_mail, viewed, created_at) VALUES (?, ?, 0, NOW())",
          [
            `New proof of payment uploaded by client ID ${clientId}`,
            ADMIN_EMAIL,
          ]
        );

      const mailOptions = {
        from: process.env.EMAIL_USER || "mkhizesenzo732@gmail.com",
        to: ADMIN_EMAIL,
        subject: "New Proof of Payment Received",
        text: `Client ID ${clientId} uploaded a new proof of payment.\n\nComment: ${
          comment || "None"
        }`,
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error("Email send error:", err);
        else console.log("Notification email sent:", info.response);
      });

      res.json({ message: "Upload successful" });
    } catch (error) {
      console.error("Proof upload error:", error);
      res
        .status(500)
        .json({ message: "Server error during proof upload" });
    }
  }
);

app.get("/api/payment-proofs", isAuthenticated, (req, res) => {
  db.query(
    "SELECT id, client_id, file_path, comment, uploaded_at FROM payment_proofs ORDER BY uploaded_at DESC",
    (err, results) => {
      if (err) {
        console.error("Payment proofs fetch error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(results);
    }
  );
});

app.get("/api/payment-proofs/:id", isAuthenticated, (req, res) => {
  const { id } = req.params;
  db.query(
    "SELECT id, client_id, file_path, comment, uploaded_at FROM payment_proofs WHERE id = ?",
    [id],
    (err, results) => {
      if (err) {
        console.error("Payment proof fetch error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      if (!results.length) {
        return res.status(404).json({ message: "Proof not found" });
      }
      res.json(results[0]);
    }
  );
});

/* ---------- HEALTH ---------- */

app.get("/api/health", (req, res) =>
  res.json({ ok: true, ts: Date.now() })
);

/* ---------- SYSTEM USERS (ADMIN) ---------- */

app.post("/signup", async (req, res) => {
  const { username, fullname, lastname, company, email, password } =
    req.body;
  if (!email || !password)
    return res
      .status(400)
      .json({ message: "Email and password required" });

  try {
    const [existing] = await db
      .promise()
      .query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const sql =
      "INSERT INTO users (username, full_name, last_name, company_name, email, password) VALUES (?, ?, ?, ?, ?, ?)";
    const [result] = await db
      .promise()
      .execute(sql, [
        username,
        fullname,
        lastname,
        company,
        email,
        hashedPassword,
      ]);
    res
      .status(201)
      .json({ message: "User registered successfully", id: result.insertId });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Error registering user" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0)
      return res
        .status(401)
        .json({ message: "Invalid email or password" });

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res
        .status(401)
        .json({ message: "Invalid email or password" });

    req.session.userId = user.id;
    res.json({ message: "Login successful", userId: user.id });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

/* ---------- CLIENTS (HOST EMPLOYERS) ---------- */

app.post("/api/clients/new", async (req, res) => {
  const {
    username,
    fullname,
    lastname,
    email,
    company,
    password,
    street,
    town,
    province,
    postalcode,
    reg,
    vat,
    noi,
    tel,
    cell,
  } = req.body;

  if (
    !username ||
    !fullname ||
    !lastname ||
    !email ||
    !company ||
    !password
  ) {
    return res.status(400).json({
      message: "All fields including password are required",
    });
  }

  try {
    const [existing] = await db
      .promise()
      .query("SELECT id FROM host_employers WHERE email = ?", [email]);
    if (existing.length > 0)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    const sql = `
      INSERT INTO host_employers
      (username, fullname, lastname, email, company,
       password, reset_token, reset_token_expiry,
       street, town, province, postalcode, reg, vat, noi, tel, cell)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db
      .promise()
      .execute(sql, [
        username,
        fullname,
        lastname,
        email,
        company,
        hashedPassword,
        resetToken,
        resetTokenExpiry,
        street,
        town,
        province,
        postalcode,
        reg,
        vat,
        noi,
        tel,
        cell,
      ]);

    const resetUrl = `${FRONTEND_ORIGIN}/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER || "mkhizesenzo732@gmail.com",
      to: email,
      subject: "Set Your Password (Optional)",
      text:
        `Hello ${fullname},\n\n` +
        `Your company account (${company}) has been registered. To set or reset your password, click the following link (valid for 1 hour):\n\n${resetUrl}\n\n` +
        "If you did not request this, you can ignore this email.\n\n" +
        "Kind regards,\nInternship Success Team",
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Registration/reset email sent: " + info.response);
      res.status(201).json({
        message: "Client registered successfully",
        id: result.insertId,
        emailStatus: "sent",
      });
    } catch (mailErr) {
      console.error("Error sending email:", mailErr);
      res.status(201).json({
        message: "Client registered successfully, but email not sent",
        id: result.insertId,
        emailStatus: "failed",
        error: mailErr.message,
      });
    }
  } catch (err) {
    console.error("Error creating client:", err);
    res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

app.post("/api/clients/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required" });
  }

  try {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM host_employers WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res
        .status(401)
        .json({ message: "Invalid email or password" });
    }

    const client = rows[0];
    const validPassword = await bcrypt.compare(
      password,
      client.password
    );
    if (!validPassword) {
      return res
        .status(401)
        .json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Client login successful",
      userId: client.id,
      company: client.company,
      email: client.email,
    });
  } catch (err) {
    console.error("Client login error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/api/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const [rows] = await db
      .promise()
      .query(
        "SELECT id FROM host_employers WHERE reset_token = ? AND reset_token_expiry > NOW()",
        [token]
      );
    if (!rows.length)
      return res
        .status(400)
        .json({ message: "Invalid or expired link." });

    const hashedPassword = await bcrypt.hash(password, 10);
    await db
      .promise()
      .execute(
        "UPDATE host_employers SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = ?",
        [hashedPassword, token]
      );
    res
      .status(200)
      .json({ message: "Password has been reset successfully." });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/clients", (req, res) => {
  db.query("SELECT * FROM host_employers", (err, results) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// update client company/details
app.put("/api/clients/:id", async (req, res) => {
  const { id } = req.params;
  const {
    company,
    fullname,
    lastname,
    email,
    street,
    town,
    province,
    postalcode,
    reg,
    vat,
    noi,
    tel,
    cell,
  } = req.body;

  try {
    const [existing] = await db
      .promise()
      .query("SELECT id FROM host_employers WHERE id = ?", [id]);
    if (!existing.length) {
      return res.status(404).json({ message: "Client not found" });
    }

    const sql = `
      UPDATE host_employers
      SET company = ?, fullname = ?, lastname = ?, email = ?,
          street = ?, town = ?, province = ?, postalcode = ?,
          reg = ?, vat = ?, noi = ?, tel = ?, cell = ?
      WHERE id = ?
    `;
    await db
      .promise()
      .execute(sql, [
        company,
        fullname,
        lastname,
        email,
        street,
        town,
        province,
        postalcode,
        reg,
        vat,
        noi,
        tel,
        cell,
        id,
      ]);

    res.json({ message: "Client details updated" });
  } catch (err) {
    console.error("Update client error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

/* ---------- INVOICES ---------- */

app.post("/api/invoices", async (req, res) => {
  const {
    company_name,
    invoice_number,
    customer_reference,
    client_id,
    invoice_date,
    due_date,
    amount,
    amount_due,
    status,
  } = req.body;

  const normalizedStatus = status === "draft" ? "draft" : "sent";

  const amountIncl = parseFloat(amount);
  const vatRate = 15;
  const total_excl = amountIncl / (1 + vatRate / 100);
  const total_vat = amountIncl - total_excl;
  const total_incl = amountIncl;

  const sql = `
    INSERT INTO invoices (
      company_name, invoice_number, customer_reference, client_id,
      invoice_date, due_date, amount, amount_due, status,
      vat_rate, total_excl, total_vat, total_incl,
      created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;

  const params = [
    company_name,
    invoice_number,
    customer_reference || null,
    client_id,
    invoice_date,
    due_date,
    amountIncl,
    amount_due,
    normalizedStatus,
    vatRate,
    total_excl,
    total_vat,
    total_incl,
  ];

  try {
    const [result] = await db.promise().execute(sql, params);
    const newInvoiceId = result.insertId;

    if (normalizedStatus === "sent") {
      const [clientRows] = await db
        .promise()
        .query(
          "SELECT email, company FROM host_employers WHERE id = ?",
          [client_id]
        );

      if (clientRows.length) {
        const client = clientRows[0];

        const invoiceLoginUrl = `${FRONTEND_ORIGIN}/client-login`;

        const mailOptions = {
          from: process.env.EMAIL_USER || "mkhizesenzo732@gmail.com",
          to: client.email,
          subject: `Invoice ${invoice_number} from ${company_name}`,
          text:
            `Dear ${client.company},\n\n` +
            `You have received a new invoice from ${company_name}.\n\n` +
            `For your security, invoice details are available only inside the Internship Success system.\n` +
            `Please log in to your account using the link below to view the full invoice and its status:\n\n` +
            `${invoiceLoginUrl}\n\n` +
            `If you have any questions, feel free to contact us.\n\n` +
            `Kind regards,\n` +
            `Internship Success Team`,
        };

        transporter.sendMail(mailOptions, (err, info) => {
          if (err) console.error("Send invoice email error:", err);
          else console.log("Invoice email sent:", info.response);
        });
      }

      await db
        .promise()
        .execute(
          "INSERT INTO notifications (message, user_mail, viewed, created_at) VALUES (?, ?, 0, NOW())",
          [
            `Invoice ${invoice_number} for ${company_name} (client ID ${client_id}) was sent.`,
            ADMIN_EMAIL,
          ]
        );
    }

    return res.status(201).json({
      message: "Invoice created",
      id: newInvoiceId,
      status: normalizedStatus,
    });
  } catch (err) {
    console.error("Create invoice error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// List invoices for a specific client (for client dashboard)
app.get("/api/clients/:id/invoices", (req, res) => {
  const clientId = req.params.id;

  db.query(
    "SELECT * FROM invoices WHERE client_id = ? ORDER BY created_at DESC",
    [clientId],
    (err, results) => {
      if (err) {
        console.error("Client invoices fetch error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      return res.json(results);
    }
  );
});

app.get("/api/invoices", (req, res) => {
  db.query(
    "SELECT * FROM invoices ORDER BY created_at DESC",
    (err, results) => {
      if (err) {
        console.error("Invoice list fetch error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(results);
    }
  );
});

app.get("/api/invoices/:id", (req, res) => {
  db.query(
    "SELECT * FROM invoices WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err) {
        console.error("Invoice fetch error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      if (!results.length) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(results[0]);
    }
  );
});

// Admin: invoice + client
app.get("/api/invoices/:id/full", (req, res) => {
  const invoiceId = req.params.id;

  const sql = `
    SELECT 
      i.*,
      c.company,
      c.fullname,
      c.lastname,
      c.street,
      c.town,
      c.province,
      c.postalcode,
      c.reg,
      c.vat,
      c.tel,
      c.cell,
      c.email
    FROM invoices i
    JOIN host_employers c ON c.id = i.client_id
    WHERE i.id = ?
  `;

  db.query(sql, [invoiceId], (err, results) => {
    if (err) {
      console.error("Invoice+client fetch error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (!results.length) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.json(results[0]);
  });
});

// Client: invoice + client (restricted by clientId param)
app.get("/api/clients/me/invoices/:id", (req, res) => {
  const invoiceId = req.params.id;
  const clientId = req.query.clientId;

  if (!clientId) {
    return res.status(400).json({ message: "clientId is required" });
  }

  const sql = `
    SELECT 
      i.*,
      c.company,
      c.fullname,
      c.lastname,
      c.street,
      c.town,
      c.province,
      c.postalcode,
      c.reg,
      c.vat,
      c.tel,
      c.cell,
      c.email
    FROM invoices i
    JOIN host_employers c ON c.id = i.client_id
    WHERE i.id = ? AND c.id = ?
  `;

  db.query(sql, [invoiceId, clientId], (err, results) => {
    if (err) {
      console.error("Client invoice+client fetch error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (!results.length) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.json(results[0]);
  });
});

app.delete("/api/invoices/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM invoices WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Delete invoice error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.json({ message: "Invoice deleted" });
  });
});

/* ---------- PAYMENT REMINDERS ---------- */
/*
  Sends a payment reminder email for a specific invoice.
  Email tells client to pay and upload proof via your existing proof upload UI.
*/

app.post(
  "/api/reminders/payment/:invoiceId",
  isAuthenticated,
  async (req, res) => {
    const { invoiceId } = req.params;

    try {
      const [rows] = await db
        .promise()
        .query(
          `SELECT i.id, i.invoice_number, i.amount_due, i.due_date,
                  c.id AS client_id, c.company, c.email
           FROM invoices i
           JOIN host_employers c ON c.id = i.client_id
           WHERE i.id = ?`,
          [invoiceId]
        );

      if (!rows.length) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const inv = rows[0];

      if (!inv.email) {
        return res.status(400).json({
          message: "Client does not have an email address",
        });
      }

      const amountDue = Number(inv.amount_due || 0);
      const dueDateStr = inv.due_date
        ? new Date(inv.due_date).toLocaleDateString("en-ZA")
        : "N/A";

      // Frontend URL where the client can upload proof of payment
      const proofUploadUrl = `${FRONTEND_ORIGIN}/upload-proof?clientId=${inv.client_id}&invoice=${inv.id}`;

      const mailOptions = {
        from: process.env.EMAIL_USER || "mkhizesenzo732@gmail.com",
        to: inv.email,
        subject: `Payment reminder – Invoice ${inv.invoice_number}`,
        text:
          `Dear ${inv.company},\n\n` +
          `This is a friendly reminder that payment for invoice ${inv.invoice_number} ` +
          `with an outstanding amount of R ${amountDue.toFixed(
            2
          )} is due on ${dueDateStr}.\n\n` +
          `Please make payment and then upload your proof of payment using the following link:\n` +
          `${proofUploadUrl}\n\n` +
          `If you have already paid, please upload your proof so that we can update your records.\n\n` +
          `Kind regards,\n` +
          `Internship Success Team`,
      };

      transporter.sendMail(mailOptions, async (err, info) => {
        if (err) {
          console.error("Payment reminder email error:", err);
          return res
            .status(500)
            .json({ message: "Failed to send reminder email" });
        }

        console.log("Payment reminder email sent:", info.response);

        await db
          .promise()
          .execute(
            "INSERT INTO notifications (message, user_mail, viewed, created_at) VALUES (?, ?, 0, NOW())",
            [
              `Payment reminder sent for invoice ${inv.invoice_number} (client ID ${inv.client_id}).`,
              ADMIN_EMAIL,
            ]
          );

        res.json({ message: "Payment reminder email sent" });
      });
    } catch (err) {
      console.error("Payment reminder route error:", err);
      res
        .status(500)
        .json({ message: "Server error sending reminder" });
    }
  }
);

/* ---------- NOTIFICATIONS ---------- */

app.get("/api/notifications", isAuthenticated, (req, res) => {
  db.query(
    "SELECT * FROM notifications ORDER BY created_at DESC",
    (err, results) => {
      if (err) {
        console.error("Notifications fetch error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(results);
    }
  );
});

app.post("/api/notifications/:id/read", isAuthenticated, (req, res) => {
  const id = req.params.id;
  db.query(
    "UPDATE notifications SET viewed = 1 WHERE id = ?",
    [id],
    (err) => {
      if (err) {
        console.error("Notifications mark read error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "Notification marked as read" });
    }
  );
});

/* ---------- FALLBACK & ERROR HANDLERS ---------- */

app.use("/api", (req, res) =>
  res.status(404).json({ error: "API route not found" })
);

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
});

/* ---------- START ---------- */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
