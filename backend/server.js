require('dotenv').config();
const express = require("express"); //
const mysql = require("mysql2/promise"); //
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer"); // We use nodemailer for sending emails
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2; //THis is the cloudinary storage of 250GB for files
const app = express();
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000"; // frontend url For System Admin
const CLIENT_PORTAL_URL = process.env.CLIENT_PORTAL_URL || "http://localhost:3000/clients/login";
const PORT = process.env.PORT || 3001;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "mkhizesenzo732@gmail.com";

// Middleware
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.set("trust proxy", 1);
app.use(session({secret: process.env.SESSION_SECRET || "a_super_secret_key_change_in_production",resave: false,
  saveUninitialized: false,cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: "lax", secure: process.env.NODE_ENV === 'production' 
  },
}));
//AUTH MIDDLEWARE - SAFE
function authenticateAdmin(req, res, next) {
  try {
    if (req.session?.userId) {
      req.userId = req.session.userId;
      req.isAdmin = true;  // Add explicit admin flag
      return next();
    }
    return res.status(401).json({ success: false, message: "Admin authentication required" });
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ success: false, message: "Auth error" });
  }
}

//TRACK ACTIVITY ENDPOINT - Add this after your authenticateAdmin middleware
app.post('/api/track-activity', authenticateAdmin, async (req, res) => {
  try {
    const { action, invoiceId, proofId, duration } = req.body;
    
    // ✅ FIXED: Use session.userId (your existing auth pattern)
    const userId = req.session.userId || req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log(`📋 Tracking activity: ${action} by user ${userId}`);

    await safeQuery(`
      INSERT INTO activity_logs (
        user_id, action, invoice_id, proof_id, duration_seconds, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `, [userId, action, invoiceId || null, proofId || null, duration || 0]);

    console.log(`✅ Activity logged: ${action}`);
    res.json({ success: true });
    
  } catch (error) {
    console.error('🚨 Track activity error:', error);
    res.status(500).json({ error: 'Failed to track activity' });
  }
});

//Express app (after authenticateAdmin middleware definition)
app.get('/api/reports/monthly/:year/:month', authenticateAdmin, async (req, res) => {
  try {
    const { year, month } = req.params;
    console.log(`📊 Generating monthly report: ${year}-${month}`);

    // ✅ Date range using created_at column
    const startDate = `${year}-${String(month).padStart(2, '0')}-01 00:00:00`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()} 23:59:59`;
    
    console.log(`📅 Date range: ${startDate} to ${endDate}`);

    // ✅ FIXED: Uses created_at + your table structure (host_employers)
    const activities = await safeQuery(`
      SELECT 
        DATE(al.created_at) as activity_date,
        COALESCE(a.company, 'Admin') as client_company,
        al.action,
        COUNT(*) as count,
        SUM(COALESCE(al.duration_seconds, 0)) as total_time_seconds,
        MAX(al.invoice_id) as invoice_id
      FROM activity_logs al
      LEFT JOIN invoices i ON al.invoice_id = i.id
      LEFT JOIN host_employers a ON i.client_id = a.id
      WHERE al.created_at BETWEEN ? AND ?
      GROUP BY DATE(al.created_at), al.action, a.company
      ORDER BY DATE(al.created_at) DESC, count DESC
    `, [startDate, endDate]);

    // ✅ Transform to exact frontend format
    const reportData = activities.map(row => ({
      date: row.activity_date,
      client_company: row.client_company || 'Admin',
      action: row.action,
      count: parseInt(row.count),
      total_time_seconds: parseInt(row.total_time_seconds || 0),
      invoice_id: row.invoice_id || null
    }));

    console.log(`📤 Sending ${reportData.length} activity records`);
    res.json(reportData);
    
  } catch (error) {
    console.error('🚨 Monthly reports error:', error);
    res.status(500).json({ 
      error: 'Failed to generate monthly report',
      details: error.message 
    });
  }
});



function authenticateClient(req, res, next) {
  try {
    console.log('Auth Debug:', {
      sessionExists: !!req.session,
      clientId: req.session?.clientId,
      userId: req.session?.userId,
      sessionId: req.sessionID?.slice(0, 8) + '...'
    });

    // STRICT: Only accept clientId (never userId/admin sessions)
    if (req.session?.clientId && !req.session.userId) {  
      req.clientId = req.session.clientId;
      console.log('Client authenticated:', req.clientId);
      return next();
    }

    console.log('No valid CLIENT session - 401');
    return res.status(401).json({ 
      success: false, 
      message: "Client authentication required - please login",
      debug: { clientId: req.session?.clientId }
    });
  } catch (error) {
    console.error("Client auth error:", error);
    res.status(500).json({ success: false, message: "Authentication server error" });
  }
}


// ADMIN ONLY - Independent from client
function requireAdmin(req, res, next) {
  try {
    if (req.session?.userId && !req.session.clientId) {  // Admin ONLY
      req.userId = req.session.userId;
      req.isAdmin = true;
      return next();
    }
    return res.status(401).json({ 
      success: false, 
      message: "Admin access required" 
    });
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({ success: false, message: "Auth error" });
  }
}

// CLIENT ONLY - Independent from admin  
function requireClient(req, res, next) {
  try {
    if (req.session?.clientId && !req.session.userId) {  // Client ONLY
      req.clientId = req.session.clientId;
      req.isClient = true;
      return next();
    }
    return res.status(401).json({ 
      success: false, 
      message: "Client login required" 
    });
  } catch (error) {
    console.error("Client auth error:", error);
    res.status(500).json({ success: false, message: "Auth error" });
  }
}

//FIXED: PROMISE-BASED MYSQL - GLOBAL ACCESS
let dbPool;
async function initDb() {
  try {dbPool = await mysql.createPool({host: process.env.DB_HOST || "localhost",user: process.env.DB_USER || "root",password: process.env.DB_PASS || "Senzo@2001",database: process.env.DB_NAME || "Financial_db",waitForConnections: true,connectionLimit: 10,queueLimit: 0,connectTimeout: 10000,});
    console.log("Connected to MySQL database.");
    const uploadsDir = path.join(__dirname, 'temp-uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log("Temp uploads folder created");
    }
  } catch (error) {
    console.error(" MySQL connection error:", error);
    process.exit(1);
  }
}
//UTILITY: BULLETPROOF DB QUERY
async function safeQuery(query, params = []) {
  try {
    if (!dbPool) {
      throw new Error("Database pool not initialized");
    }
    const [rows] = await dbPool.execute(query, params);
    return rows || [];
  } catch (error) {
    console.error("DB Query FAILED:", error.message);
    console.error("Query:", query);
    console.error("Params:", params);
    throw error;
  }
}

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// PDF Generation - Enterprise Grade
const puppeteer = require('puppeteer');

async function generateInvoicePDF(invoice) {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
await page.setContent(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reference Number:${invoice.invoice_number}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.5;
      color: #333;
      margin: 0;
      padding: 20px;
    }
    .section {
      margin-bottom: 20px;
    }
    h2, h3, p, table, strong, span {
      margin: 0 0 8px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #ddd;
    }
    th, td {
      text-align: left;
      padding: 8px 10px;
      vertical-align: top;
      border: 1px solid #ddd;
    }
    th {
      background: #f0f0f0;
      font-weight: bold;
    }
    .total-row {
      font-weight: bold;
      font-size: 18px;
    }
  </style>
</head>
<body>

  <h2>Reference Number:${invoice.invoice_number}</h2>
  <p><strong>Issued Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('en-ZA')}</p>
  <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString('en-ZA')}</p>
  <p>Status: <span class="status">${invoice.status.toUpperCase()}</span></p>

  <div class="section">
    <h3>From – Internship Success</h3>
    <p>
      Internship Success<br>
      1st Floor, Shell House,<br>
      Ferreira Street, Mbombela<br>
      South Africa, 1200<br>
      Email: mkhizesenzo732@gmail.com<br>
      Tel: +27 11 123 4567
    </p>
  </div>

  <div class="section">
    <h3>To – ${invoice.company_name}</h3>
    <p>
      ${invoice.company_name}<br>
      ${invoice.customer_reference || 'N/A'}<br>
      Client ID: ${invoice.client_id}
    </p>
  </div>

  <div class="section">
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Professional Services – ${invoice.customer_reference || 'General'}</strong>
          </td>
          <td>R ${invoice.amount?.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Balance Due</td>
          <td>R ${invoice.amount_due?.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <p class="total-row">Total Amount Due: R ${invoice.amount_due?.toLocaleString()}</p>
  </div>

  <div class="section">
    <h3>Payment Instructions</h3>
    <p>
      <strong>Bank:</strong> FNB<br>
      <strong>Account:</strong> 123456789012<br>
      <strong>Reference:</strong> ${invoice.invoice_number}<br>
      <strong>Due date:</strong> ${new Date(invoice.due_date).toLocaleDateString('en-ZA')}
    </p>
    <p>Please email proof of payment to: <strong>mkhizesenzo732@gmail.com</strong></p>
  </div>

  <div class="section" style="margin-top: 30px; font-size: 14px; color: #555;">
    <p>Regards,<br>
       Internship Success © 2026</p>
  </div>

</body>
</html>
`, {
  waitUntil: 'networkidle0',
  timeout: 240000
});


  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
  });
  await browser.close();
  return pdf;
}

//Cloudinary config
console.log("  Cloudinary config check:");
console.log("  Cloud name:", process.env.CLOUDINARY_CLOUD_NAME ? "OK" : "MISSING");
console.log("  API Key:", process.env.CLOUDINARY_API_KEY ? "OK" : " MISSING");
console.log("  API Secret:", process.env.CLOUDINARY_API_SECRET ? " OK" : " MISSING");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
//FIXED: SAFE Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "mkhizesenzo732@gmail.com",
    pass: process.env.EMAIL_PASS || "fyjdwxtsfmoqrnvk",
  },
});
//Auto cleanup temp files - SAFE
setInterval(() => {
  try {
    const dir = path.join(__dirname, 'temp-uploads');
    if (fs.existsSync(dir)) {
      fs.readdir(dir, (err, files) => {
        if (err) return;
        files.forEach(file => {
          const filePath = path.join(dir, file);
          fs.stat(filePath, (err, stats) => {
            if (err || !stats) return;
            if (Date.now() - stats.mtime.getTime() > 30 * 60 * 1000) {
              fs.unlink(filePath, () => {});
            }
          });
        });
      });
    }
  } catch (error) {
    console.warn("Cleanup error:", error.message);
  }
}, 10 * 60 * 1000);
//FIXED: SAFE Multer
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'temp-uploads');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname);
  }
});
const upload = multer({ 
  storage: tempStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, PNG allowed'), false);
    }
  }
});
//NEW! CLIENT WELCOME EMAIL WITH TEMP PASSWORD
async function sendClientWelcomeEmail(clientEmail, clientUsername, tempPassword, clientId, companyName) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || '"Internship Success" <mkhizesenzo732@gmail.com>',
      to: clientEmail,
      subject: "Welcome to Internship Success Client Portal - Account Details",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 40px 20px; font-family: Arial, Helvetica, sans-serif; background-color: #ffffff; color: #000000; line-height: 1.6; font-size: 16px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px; border: 1px solid #dddddd;">
    
    <h1 style="color: #000000; font-size: 28px; margin-bottom: 10px;">Welcome to Internship Success</h1>
    <p style="color: #333333; font-size: 18px; margin-bottom: 30px;">Your company has been successfully registered with our Client Portal.</p>

    <h2 style="color: #000000; font-size: 20px; margin: 30px 0 20px 0;">Account Details</h2>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <tr>
        <td style="padding: 12px 0; color: #333333; font-weight: bold; width: 150px;">Username:</td>
        <td style="padding: 12px 0; color: #000000; font-family: 'Courier New', monospace;">${clientUsername}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; color: #333333; font-weight: bold; width: 150px;">Email:</td>
        <td style="padding: 12px 0; color: #000000;">${clientEmail}</td>
      </tr>
      <tr style="background-color: #fff5f5;">
        <td style="padding: 12px 0; color: #333333; font-weight: bold; width: 150px;">Temporary Password:</td>
        <td style="padding: 12px 0; color: #d63333; font-weight: bold; font-family: 'Courier New', monospace; font-size: 16px;">${tempPassword}</td>
      </tr>
    </table>

    <p style="color: #d63333; font-weight: bold; margin-bottom: 30px; font-size: 15px;">
      Please login immediately and change your temporary password for security.
    </p>

    <h2 style="color: #000000; font-size: 20px; margin: 30px 0 20px 0;">Quick Access</h2>
    
    <p style="margin-bottom: 20px;">
      <strong>Company:</strong> ${companyName}<br>
      <strong>Client ID:</strong> #${clientId}
    </p>

    <p style="margin-bottom: 30px;">
      <a href="${CLIENT_PORTAL_URL}" 
         style="background-color: #0066cc; color: #ffffff; padding: 15px 30px; text-decoration: none; 
                font-weight: bold; border-radius: 5px; display: inline-block; font-size: 16px;">
        Login to Client Portal
      </a>
    </p>

    <hr style="border: none; border-top: 1px solid #dddddd; margin: 40px 0;">

    <h3 style="color: #000000; font-size: 18px; margin-bottom: 15px;">Next Steps:</h3>
    <ul style="color: #333333; margin-bottom: 40px;">
      <li>Login using the credentials above</li>
      <li>Change your temporary password immediately</li>
      <li>Verify your company information</li>
      <li>Access and manage your invoices</li>
    </ul>

    <hr style="border: none; border-top: 1px solid #dddddd; margin: 40px 0;">

    <!-- Footer -->
    <table style="width: 100%; font-size: 14px;">
      <tr>
        <td style="color: #666666; padding-bottom: 20px;">
          <strong>Internship Success</strong><br>
          1st Floor, Shell House<br>
          Ferreira Street, Mbombela<br>
          South Africa, 1200
        </td>
        <td style="text-align: right; color: #666666; padding-bottom: 20px;">
          Email: <a href="mailto:mkhizesenzo732@gmail.com" style="color: #0066cc;">mkhizesenzo732@gmail.com</a><br>
          Tel: +27 11 123 4567
        </td>
      </tr>
      <tr>
        <td colspan="2" style="text-align: center; color: #999999; font-size: 12px; padding-top: 20px; border-top: 1px solid #eeeeee;">
          © 2026 Internship Success. All rights reserved.
        </td>
      </tr>
    </table>

  </div>
</body>
</html>
      `
    });

    console.log(`✅ Welcome email sent to ${clientEmail}`);
  } catch (error) {
    console.error("❌ Welcome email FAILED:", error.message);
    throw error;
  }
}

//PERFECTLY ALIGNED WITH ClientForm.js - SENDS WELCOME EMAIL!
app.post('/api/clients', authenticateAdmin, async (req, res) => {
  try {console.log('Creating client - RAW BODY:', JSON.stringify(req.body, null, 2));
    //ULTRA-SAFE FIELD EXTRACTION - Matches ClientForm.js EXACTLY
    const fields = {username: (req.body.username || '').trim(),fullname: (req.body.fullname || '').trim(),lastname: (req.body.lastname || '').trim(),company: (req.body.company || '').trim(),
      email: ((req.body.email || '').trim()).toLowerCase(),password: req.body.password || '',street: req.body.street ? String(req.body.street).trim() : null,
      town: req.body.town ? String(req.body.town).trim() : null,province: req.body.province ? String(req.body.province).trim() : null,postalcode: req.body.postalcode ? String(req.body.postalcode).trim() : null,reg: req.body.reg ? String(req.body.reg).trim() : null,vat: req.body.vat ? String(req.body.vat).trim() : null,noi: parseInt(req.body.noi) || 1,
      tel: req.body.tel ? String(req.body.tel).trim() : null,cell: req.body.cell ? String(req.body.cell).trim() : null,};
    console.log('CLEANED FIELDS:', fields);
    console.log('lastname check:', fields.lastname ? `"${fields.lastname}" (${fields.lastname.length} chars)` : 'MISSING');
//STRICT VALIDATION - Matches ClientForm.js exactly
    if (!fields.username) return res.status(400).json({ success: false, message: "Username required" });
    if (!fields.fullname) return res.status(400).json({ success: false, message: "First name required" });
    if (!fields.lastname) return res.status(400).json({ success: false, message: "Last name required" });
    if (!fields.company) return res.status(400).json({ success: false, message: "Company name required" });
    if (!fields.email) return res.status(400).json({ success: false, message: "Email required" });
    if (!fields.password || fields.password.length < 6) return res.status(400).json({ success: false, message: "Password must be 6+ characters" });
//DUPLICATE CHECK - Separate queries for clear errors
    const dupEmail = await safeQuery("SELECT id FROM host_employers WHERE email = ?", [fields.email]);
    const dupUser = await safeQuery("SELECT id FROM host_employers WHERE username = ?", [fields.username]);
    if (dupEmail.length > 0) return res.status(400).json({ success: false, message: "Email already exists" });
    if (dupUser.length > 0) return res.status(400).json({ success: false, message: "Username already exists" });
//HASH PASSWORD + CREATE CLIENT
    const hashedPassword = await bcrypt.hash(fields.password, 12);
    const result = await safeQuery(`INSERT INTO host_employers (username, fullname, lastname, company, email, password,street, town, province, postalcode, reg, vat, noi, tel, cell, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [fields.username, fields.fullname, fields.lastname, fields.company,fields.email, hashedPassword, fields.street, fields.town, fields.province,fields.postalcode, fields.reg, fields.vat, fields.noi, fields.tel, fields.cell]);
const clientId = result.insertId;
//SEND WELCOME EMAIL WITH TEMP PASSWORD + RESET LINK
    await sendClientWelcomeEmail(fields.email, fields.username, fields.password, clientId, fields.company);
//ADMIN NOTIFICATION
    await safeQuery(
      "INSERT INTO notifications (message, user_mail, viewed, created_at) VALUES (?, ?, 0, NOW())",
      [`NEW CLIENT: ${fields.company} (${fields.fullname} ${fields.lastname}) ID: ${clientId} - Welcome email sent`, ADMIN_EMAIL]
    );
    console.log(`CLIENT CREATED + EMAIL SENT: ID ${clientId} (${fields.company})`);
    res.json({ success: true, message: `"${fields.company}" created successfully! Welcome email sent.`,clientId: clientId  });

  } catch (error) {console.error("CREATE CLIENT ERROR:", error);console.error("ERROR STACK:", error.stack);res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
});
//NEW! CLIENT LOGIN ENDPOINT
app.post("/api/clients/login", async (req, res) => {
  try {const email = (req.body.email || "").trim().toLowerCase();const password = req.body.password || "";
    console.log(`Login attempt for email: ${email}`);
// VALIDATION
    if (!email || !password) {return res.status(400).json({success: false,message: "Email and password required"});
    }
    if (!email.includes('@')) {return res.status(400).json({success: false,message: "Please enter a valid email address"});
    }
    //DATABASE QUERY - EMAIL AUTH
    const rows = await safeQuery("SELECT id, company, fullname, lastname, email, password FROM host_employers WHERE email = ? LIMIT 1",
      [email]);
    console.log(`Found ${rows.length} matching users`);
    if (!rows.length) {console.log(`No user found for email: ${email}`);

    //SECURITY: Don't reveal if email exists
   app.get("/api/client/me", authenticateClient, async (req, res) => {
  try {
    const clientId = req.clientId;

    const client = await safeQuery(
      `SELECT 
        company, fullname, lastname, email,
        street, town, province, postalcode,
        reg, vat, noi, tel, cell
       FROM host_employers
       WHERE id = ?`,
      [clientId]
    );

    if (!client.length) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(client[0]);
  } catch (error) {
    console.error("Client profile fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});
 

//SECURITY: Don't reveal if email exists
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password"});
    }
    const user = rows[0];
    //PASSWORD CHECK
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {console.log(`Password mismatch for ${email}`);
      return res.status(401).json({ success: false,message: "Invalid email or password" 
      });}
      //CRITICAL SECURITY FIX: Proper session regeneration
    req.session.regenerate(async (err) => {
      if (err) {console.error("Session regenerate FAILED:", err);
        return res.status(500).json({ success: false, message: "Session creation failed"});
      }
      // SECURE SESSION DATA
      req.session.clientId = user.id;
      req.session.clientType = "client";
      req.session.clientEmail = user.email;
      req.session.clientCompany = user.company;
      //SAVE SESSION (CRITICAL - prevents session loss)
      req.session.save(async (saveErr) => {
        if (saveErr) {
          console.error("Session save FAILED:", saveErr);
          return res.status(500).json({ 
            success: false, 
            message: "Session save failed" 
          });}
        console.log(`CLIENT LOGGED IN: ${user.company} (${user.id}) - Email: ${user.email}`);
        // PERFECT RESPONSE FOR FRONTEND
        res.json({success: true,message: "Login successful",clientId: user.id,company: user.company,fullname: `${user.fullname} ${user.lastname || ''}`.trim() || user.company,email: user.email
        });
      });
    });
  } catch (error) {console.error("Client login ERROR:", error);
    res.status(500).json({ 
      success: false, 
      message: "Login service temporarily unavailable" });}});

// FORGOT PASSWORD - OTP via EMAIL
app.post('/api/clients/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if client exists
    const clients = await safeQuery('SELECT fullname, lastname, company FROM host_employers WHERE email = ?', [email]);
    if (clients.length === 0) {
      return res.json({ success: false, message: 'Email not found' });
    }
    
    const client = clients[0];
    const clientName = `${client.fullname} ${client.lastname || ''}`.trim() || client.company;
    
    // Generate OTP + expiry (10 mins)
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    
    // Store OTP
    await safeQuery(
      `INSERT INTO otp_tokens (email, otp, expires_at) VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = VALUES(expires_at)`,
      [email, otp, expiresAt]
    );
    
    // Sendng OTP email to client for resetting their passwords 
await transporter.sendMail({
  from: `"Internship Success" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: 'Password Reset Verification Code',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 40px 20px; font-family: Arial, Helvetica, sans-serif; background-color: #ffffff; color: #000000; line-height: 1.6; font-size: 16px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px; border: 1px solid #dddddd;">
    
    <h1 style="color: #000000; font-size: 28px; margin-bottom: 10px;">Password Reset Request</h1>
    <p style="color: #333333; font-size: 18px; margin-bottom: 30px;">Dear <strong>${clientName}</strong>,</p>

    <h2 style="color: #000000; font-size: 20px; margin: 30px 0 20px 0;">Verification Code</h2>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <tr style="background-color: #fff5f5;">
        <td style="padding: 25px 20px; text-align: center; border: 2px solid #d63333;">
          <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #d63333; letter-spacing: 8px;">${otp}</span>
        </td>
      </tr>
    </table>

    <p style="color: #d63333; font-weight: bold; margin-bottom: 30px; font-size: 15px;">
      This code expires in 1 hour. Do not share it with anyone.
    </p>

    <p style="margin-bottom: 20px;">
      <a href="http://localhost:3000/clients/reset-password?email=${encodeURIComponent(email)}" 
         style="background-color: #0066cc; color: #ffffff; padding: 15px 30px; text-decoration: none; 
                font-weight: bold; border-radius: 5px; display: inline-block; font-size: 16px;">
        Complete Password Reset
      </a>
    </p>

    <hr style="border: none; border-top: 1px solid #dddddd; margin: 40px 0;">

    <h3 style="color: #000000; font-size: 18px; margin-bottom: 15px;">Did not request this reset?</h3>
    <p style="color: #333333; margin-bottom: 40px;">
      If you did not initiate this password reset, please ignore this email.
    </p>

    <hr style="border: none; border-top: 1px solid #dddddd; margin: 40px 0;">

    <!-- Footer -->
    <table style="width: 100%; font-size: 14px;">
      <tr>
        <td style="color: #666666; padding-bottom: 20px;">
          <strong>Internship Success</strong><br>
          1st Floor, Shell House<br>
          Ferreira Street, Mbombela<br>
          South Africa, 1200
        </td>
        <td style="text-align: right; color: #666666; padding-bottom: 20px;">
          Email: <a href="mailto:mkhizesenzo732@gmail.com" style="color: #0066cc;">mkhizesenzo732@gmail.com</a><br>
          Tel: +27 11 123 4567
        </td>
      </tr>
      <tr>
        <td colspan="2" style="text-align: center; color: #999999; font-size: 12px; padding-top: 20px; border-top: 1px solid #eeeeee;">
          © 2026 Internship Success. All rights reserved. | This is an automated message.
        </td>
      </tr>
    </table>

  </div>
</body>
</html>
  `
});    
    res.json({ success: true, message: 'OTP sent to your email!' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// OTP Verification & Password Reset api using http method - post
app.post('/api/clients/verify-otp-reset', async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    
    // Verify OTP
    const tokens = await safeQuery(
      'SELECT * FROM otp_tokens WHERE email = ? AND otp = ? AND expires_at > NOW()',
      [email, otp]
    );
    
    if (tokens.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Update client password
    await safeQuery('UPDATE host_employers SET password = ? WHERE email = ?', [hashedPassword, email]);
    
    // Delete used OTP
    await safeQuery('DELETE FROM otp_tokens WHERE email = ? AND otp = ?', [email, otp]);
    
    res.json({ success: true, message: 'Password reset successful!' });
  } catch (error) {
    console.error('OTP Reset Error:', error);
    res.status(500).json({ success: false, message: 'Reset failed' });
  }
});

//GET CLIENTS - Perfect for Clients.js display
app.get("/api/clients", authenticateAdmin, async (req, res) => {
  try {const clients = await safeQuery(`SELECT id, username, fullname, lastname, company, email, cell, tel, created_at FROM host_employers ORDER BY created_at DESC`);
    console.log(`Sending ${clients.length} clients to frontend`);
    res.json(clients);
  } catch (error) {
    console.error("Clients fetch error:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }});
//CLIENT DETAILS for modals 
app.get("/api/clients/:id/details", async (req, res) => {
  try {const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ success: false, message: "Invalid client ID" });}
    const client = await safeQuery(`
      SELECT id, username, fullname, lastname, company, email,cell, tel, street, town, province, postalcode, reg, vat, noi, created_at FROM host_employers WHERE id = ?`, [clientId]);
    if (!client || client.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }
    console.log(`Full details for client ${clientId}: ${client[0].company}`);
    res.json(client[0]);
  } catch (error) {
    console.error("Client details error:", error);
    res.status(500).json({ success: false, error: "Database error" });}});
//UPDATE CLIENT - ADD THIS ENDPOINT!
app.put("/api/clients/:id", authenticateAdmin, async (req, res) => {
  try {const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ success: false, message: "Invalid client ID" });}
    const updateData = req.body;
// Build dynamic UPDATE query for ALL fields
    const fields = [];
    const values = [];
    if (updateData.fullname !== undefined) { fields.push("fullname = ?"); values.push(updateData.fullname); }
    if (updateData.lastname !== undefined) { fields.push("lastname = ?"); values.push(updateData.lastname); }
    if (updateData.company !== undefined) { fields.push("company = ?"); values.push(updateData.company); }
    if (updateData.email !== undefined) { fields.push("email = ?"); values.push(updateData.email); }
    if (updateData.cell !== undefined) { fields.push("cell = ?"); values.push(updateData.cell); }
    if (updateData.tel !== undefined) { fields.push("tel = ?"); values.push(updateData.tel); }
    if (updateData.street !== undefined) { fields.push("street = ?"); values.push(updateData.street); }
    if (updateData.town !== undefined) { fields.push("town = ?"); values.push(updateData.town); }
    if (updateData.province !== undefined) { fields.push("province = ?"); values.push(updateData.province); }
    if (updateData.postalcode !== undefined) { fields.push("postalcode = ?"); values.push(updateData.postalcode); }
    if (updateData.reg !== undefined) { fields.push("reg = ?"); values.push(updateData.reg); }
    if (updateData.vat !== undefined) { fields.push("vat = ?"); values.push(updateData.vat); }
    if (updateData.noi !== undefined) { fields.push("noi = ?"); values.push(updateData.noi); }
    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }
    values.push(clientId);
    const result = await safeQuery(`UPDATE host_employers SET ${fields.join(", ")} WHERE id = ?`, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Client not found" });}
console.log(`Updated client ${clientId}: ${updateData.company || 'Unnamed'}`);
    res.json({ 
      success: true, 
      message: "Client updated successfully",
      clientId 
    });
  } catch (error) {console.error("Update client error:", error);
    res.status(500).json({ success: false, error: "Database error" });
}
});

// ==============================
// CLIENT SELF-SERVICE ROUTES
// ==============================

// 1. GET logged-in client profile - /api/client/me
app.get("/api/client/me", async (req, res) => {
  try {
    if (!req.session?.clientId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const clientId = req.session.clientId;
    const client = await safeQuery(
      "SELECT * FROM host_employers WHERE id = ?",
      [clientId]
    );

    if (!client.length) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(client[0]);
  } catch (err) {
    console.error("GET /api/client/me error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//A logged-in client /api/client/me = tracking clientID
app.put("/api/client/me", authenticateClient, async (req, res) => {
  try {
    const clientId = req.clientId;
    
    // Dynamic field updates (safe)
    const fields = [];
    const values = [];
    const allowedFields = [
      "company", "fullname", "lastname", "email", 
      "street", "town", "province", "postalcode", 
      "reg", "vat", "noi", "tel", "cell"
    ];
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    if (!fields.length) {
      return res.status(400).json({ message: "No fields to update" });
    }
    values.push(clientId);
    
    await safeQuery(
      `UPDATE host_employers SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
    // Notify admin
    const [updatedClient] = await safeQuery("SELECT company FROM host_employers WHERE id = ?", [clientId]);
    await sendEmail(
      ADMIN_EMAIL,
      "Client Updated Profile", 
      `${updatedClient.company} updated their profile`
    );
    await safeQuery(
      "INSERT INTO notifications (type, message) VALUES (?, ?)",
      ["CLIENT_UPDATE", `${updatedClient.company} updated profile`]
    );

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("PUT /api/client/me error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//FIXED UPLOAD - NO PROMISE REJECTIONS - PDF + IMAGES PERFECT!
app.post('/api/proofs/upload', upload.single('proofFile'), async (req, res) => {
  console.log('Upload attempt...'); 
  try {
    const { clientId, comment } = req.body; 
    if (!req.file || !clientId) {
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(400).json({ success: false, message: "File and clientId required" });
    }
    
    // Verify client
    const clients = await safeQuery("SELECT id, company, fullname, email FROM host_employers WHERE id = ?", [clientId]);
    if (!clients || clients.length === 0) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ success: false, message: "Client not found" });
    }
    
    // Cloudinary upload - Safe Promise
    const isPDF = req.file.mimetype === 'application/pdf';
    const uploadOptions = {
      folder: 'proofs',
      overwrite: true,
      resource_type: isPDF ? 'raw' : 'image'
    };

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(req.file.path, uploadOptions, (error, result) => {
        if (error) {
          console.error('Cloudinary error:', error);
          reject(new Error(`Cloudinary: ${error.message}`));
        } else {
          console.log('Success:', result.secure_url);
          resolve(result);
        }
      });
    });

    // Cleanup temp file
    try {
      fs.unlinkSync(req.file.path);
    } catch (e) {
      console.warn('Temp file cleanup warning:', e.message);
    }

    // Save to DB
    const result = await safeQuery(
      "INSERT INTO payment_proofs (client_id, file_path, public_url, comment, uploaded_at, file_type) VALUES (?, ?, ?, ?, NOW(), ?)",
      [clientId, uploadResult.public_id, uploadResult.secure_url, comment || null, req.file.mimetype]
    );

    // Admin notification
    await safeQuery(
      "INSERT INTO notifications (message, user_mail, viewed, created_at) VALUES (?, ?, 0, NOW())",
      [`NEW PROOF from ${clients[0].company} (${clientId}): ${uploadResult.secure_url}`, ADMIN_EMAIL]
    );

    // ADD THESE 3 LINES FOR PROOF UPLOAD TRACKING (RIGHT AFTER NOTIFICATION)
    await safeQuery(
      'INSERT INTO activity_logs (user_type, user_id, client_company, action, proof_id) VALUES (?, ?, ?, ?, ?)',
      ['client', clientId, clients[0].company, 'proof_uploaded', result.insertId]
    );
    console.log(`PROOF UPLOAD TRACKED: ${clients[0].company} (Proof ID: ${result.insertId})`);

    // Safe email to admin
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: ADMIN_EMAIL,
        subject: `URGENT: New Proof from ${clients[0].company}`,
        html: `
          <h2>New Payment Proof Uploaded!</h2>
          <p><strong>Client:</strong> ${clients[0].company} (${clientId})</p>
          <p><strong>File:</strong> ${req.file.originalname}</p>
          <p><a href="${uploadResult.secure_url}" target="_blank">📄 View Proof</a></p>
        `,
      });
    } catch (emailError) {
      console.warn("Email failed:", emailError.message);
    }

    console.log(`UPLOAD COMPLETE: Proof ID ${result.insertId}`);
    res.json({ 
      success: true,
      message: "Upload successful", 
      url: uploadResult.secure_url,
      proofId: result.insertId,
      file_type: req.file.mimetype
    });
    
  } catch (error) {
    console.error("Upload error:", error.message);
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ success: false, message: "Upload failed", error: error.message });
  }
});

//INVOICE CREATION & ISSUING ENDPOINT

app.post("/api/invoices", authenticateAdmin, async (req, res) => {
  try {
    console.log("📋 Invoice creation request:", req.body);

    const {
      company_name,
      invoice_number,
      customer_reference,
      client_id,
      invoice_date,
      due_date,
      amount,
      amount_due,
      status
    } = req.body;

    // ✅ VALIDATE INPUTS
    const allowedStatuses = ["waiting_for_payment", "partially_paid", "paid"];
    const finalStatus =
      allowedStatuses.includes(status) ? status : "waiting_for_payment";

    if (!company_name?.trim())
      return res.status(400).json({ message: "Company name required" });
    if (!invoice_number?.trim())
      return res.status(400).json({ message: "Invoice number required" });
    if (!client_id || isNaN(client_id))
      return res.status(400).json({ message: "Valid client ID required" });
    if (!invoice_date)
      return res.status(400).json({ message: "Invoice date required" });
    if (!due_date)
      return res.status(400).json({ message: "Due date required" });
    if (!amount || Number(amount) <= 0)
      return res.status(400).json({ message: "Valid invoice amount required" });

    // ✅ CHECK DUPLICATES
    const duplicate = await safeQuery(
      "SELECT id FROM invoices WHERE invoice_number = ?",
      [invoice_number.trim()]
    );
    if (duplicate.length > 0)
      return res.status(409).json({ message: "Invoice number already exists" });

    // ✅ VERIFY CLIENT EXISTS
    const client = await safeQuery(
      "SELECT id, company, email, fullname FROM host_employers WHERE id = ?",
      [client_id]
    );
    if (!client.length)
      return res.status(404).json({ message: "Client not found" });

    const clientEmail = client[0].email;
    const clientCompany = client[0].company;
    console.log("✅ Client verified:", { clientEmail, clientCompany });

    // ✅ CREATE INVOICE
    const issuedAt =
      finalStatus !== "waiting_for_payment"
        ? new Date().toISOString().slice(0, 19).replace("T", " ")
        : null;

    const result = await safeQuery(
      `INSERT INTO invoices (
        client_id, company_name, invoice_number, customer_reference,
        invoice_date, due_date, amount, amount_due, status, issued_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        client_id,
        company_name.trim(),
        invoice_number.trim(),
        customer_reference?.trim() || null,
        invoice_date,
        due_date,
        Number(amount),
        Number(amount_due || amount),
        finalStatus,
        issuedAt
      ]
    );

    const invoiceId = result.insertId;
    console.log("✅ Invoice created:", invoiceId, invoice_number);

    // ✅ FAST IMMEDIATE RESPONSE (frontend happy in <1s)
    res.json({
      success: true,
      message: `Invoice #${invoice_number.trim()} created successfully`,
      invoiceId,
      status: finalStatus,
      clientEmail,
      redirect: "/admin/invoices"
    });

    // 👇 FIRE-AND-FORGET BACKGROUND TASK (PDF + email)
    setImmediate(async () => {
      try {
        console.log("🔄 Background: Starting PDF + email for", invoice_number);

        // BUILD INVOICE DATA FOR PDF
        const invoiceData = {
          id: invoiceId,
          invoice_number: invoice_number.trim(),
          company_name: company_name.trim(),
          customer_reference: customer_reference?.trim() || "General Services",
          client_id: client_id,
          invoice_date: invoice_date,
          due_date: due_date,
          amount: Number(amount),
          amount_due: Number(amount_due || amount),
          status: finalStatus,
          company: clientCompany
        };

        // GENERATE PDF
        let pdfBuffer = null;
        let pdfGenerated = false;
        try {
          pdfBuffer = await generateInvoicePDF(invoiceData);
          pdfGenerated = true;
          console.log("✅ Background PDF generated:", pdfBuffer.length, "bytes");
        } catch (pdfError) {
          console.error("❌ Background PDF failed:", pdfError.message);
        }

        // SEND CLIENT EMAIL WITH PDF ATTACHMENT
        console.log("📧 Background: Sending email to:", clientEmail);
        await transporter.sendMail({
          from:
            process.env.EMAIL_USER || "Internship Success <mkhizesenzo732@gmail.com>",
          to: clientEmail,
          subject: `Invoice ${invoice_number.trim()} - Payment Required`,
          attachments: pdfBuffer
            ? [
                {
                  filename: `Invoice_${invoice_number.trim()}.pdf`,
                  content: pdfBuffer,
                  contentType: "application/pdf"
                }
              ]
            : [],
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice Number: ${invoice_number.trim()}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; margin: 0; padding: 20px;">
  <p>Dear ${clientCompany} Team,</p><br>

  <p>Please find attached invoice <strong>${invoice_number.trim()}</strong> for the services provided.</p>

  <p><strong>Invoice Date:</strong> ${new Date(invoice_date).toLocaleDateString("en-ZA")}</p>
  <p><strong>Due Date:</strong> ${new Date(due_date).toLocaleDateString("en-ZA")}</p>

  ${pdfGenerated
    ? `<p>The invoice PDF is attached for your reference and payment processing.</p>`
    : `<p>Please contact us if you cannot see the attached invoice and we will send it again.</p>`
  }

  <h3>Payment Instructions</h3>
  <p>
    <strong>Bank:</strong> FNB<br>
    <strong>Account:</strong> 123456789012<br>
    <strong>Reference:</strong> ${invoice_number.trim()}<br>
    <strong>Due date:</strong> ${new Date(due_date).toLocaleDateString("en-ZA")}
  </p>
  <p>Please email proof of payment to: <strong>mkhizesenzo732@gmail.com</strong>.</p>

  <p>If you have any questions or need clarification about this invoice, please do not hesitate to contact us.</p>

  <p>Thank you for your business.<br>
     Regards,<br>
     Internship Success</p>
</body>
</html>
          `
        });

        console.log("✅ Background email SENT SUCCESSFULLY to:", clientEmail);
      } catch (bgError) {
        console.error("❌ Background email FAILED:", bgError.message);

        // Notify admin of failure
        await safeQuery(
          `INSERT INTO notifications (message, user_mail, viewed, created_at) VALUES (?, ?, 0, NOW())`,
          [`❌ Email failed for invoice #${invoice_number.trim()} to ${clientEmail}`, ADMIN_EMAIL]
        );
      }
    });

    // 👇 THESE RUN AFTER res.json() - Frontend already redirected
    await safeQuery(
      "INSERT INTO activity_logs (user_type, user_id, client_company, action, invoice_id) VALUES (?, ?, ?, ?, ?)",
      ["admin", req.session.userId, clientCompany, "invoice_created", invoiceId]
    );

    await safeQuery(
      `INSERT INTO notifications (message, user_mail, viewed, created_at) VALUES (?, ?, 0, NOW())`,
      [
        `📄 NEW INVOICE ${finalStatus.toUpperCase()}: #${invoice_number.trim()} (R${Number(amount).toLocaleString()})`,
        ADMIN_EMAIL
      ]
    );
  } catch (error) {
    console.error("🚨 INVOICE CREATION ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create invoice",
      error: error.message
    });
  }
});



//Update invoice status (PATCH /api/invoices/:id/status)
app.patch("/api/invoices/:id/status", authenticateAdmin, async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const { status } = req.body; // expecting: "waiting_for_payment", "partially_paid", "paid"

    console.log(`Updating invoice ${invoiceId} status to: ${status}`);

    //Validate status
    const allowedStatuses = ["waiting_for_payment", "partially_paid", "paid"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}` 
      });
    }

    //Check if invoice exists
    const invoice = await safeQuery(
      "SELECT id, client_id, status FROM invoices WHERE id = ?",
      [invoiceId]
    );

    if (invoice.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    //Update status
    const result = await safeQuery(
      "UPDATE invoices SET status = ?, updated_at = NOW() WHERE id = ?",
      [status, invoiceId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Failed to update status" });
    }

    console.log(`Invoice ${invoiceId} status updated to: ${status}`);

    //Notify client if marked as PAID
    if (status === "paid") {
      const client = await safeQuery(
        "SELECT company, email FROM host_employers WHERE id = ?",
        [invoice[0].client_id]
      );
      
      if (client.length > 0) {
        // Send paid notification email
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: client[0].email,
          subject: `Invoice ${invoiceId} - PAID`,
          html: `<h2>Thank you! Invoice #${invoiceId} has been successfully PAID to Internship Success</h2>`
        });
      }
    }

    res.json({ 
      success: true, 
      message: "Status updated successfully",
      invoiceId,
      newStatus: status 
    });

  } catch (error) {
    console.error("Update invoice status error:", error);
    res.status(500).json({ message: "Server error updating status" });
  }
});

// SINGLE INVOICE BY ID
app.get('/api/invoices/:id', async (req, res) => {
  try {
    // INLINE AUTH - Admin OR matching Client
    if (!req.session) {
      return res.status(401).json({ success: false, message: "No session" });
    }

    const isAdmin = !!req.session.userId && !req.session.clientId;
    const isClient = !!req.session.clientId && !req.session.userId;
    const sessionClientId = req.session.clientId;

    if (!isAdmin && !isClient) {
      return res.status(401).json({ success: false, message: "Login required" });
    }

    const invoiceId = req.params.id;
    const clientId = isAdmin ? null : sessionClientId; // Admin bypasses client filter
    
    console.log('SINGLE INVOICE DEBUG:', {
      invoiceId,
      isAdmin,
      isClient,
      sessionClientId,
      usingClientId: clientId
    });

    // Build query based on role
    let query = `
      SELECT 
        i.*,
        he.company as client_company,
        he.fullname as client_name
      FROM invoices i
      LEFT JOIN host_employers he ON i.client_id = he.id
      WHERE i.id = ?
    `;
    let params = [invoiceId];

    if (isClient) {
      query += ' AND i.client_id = ?';
      params.push(clientId);
    }

    const [invoice] = await safeQuery(query, params);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    console.log('Invoice found:', invoice.invoice_number, 'for', isAdmin ? 'ADMIN' : `client ${clientId}`);
    res.json(invoice);

  } catch (error) {
    console.error('Invoice fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch invoice' });
  }
});


// Admin api for fetching all the invoices, with midlleware protection 
app.get("/api/invoices", async (req, res) => {
 //Authenticate outside the try/catch block
  console.log('RAW SESSION:', req.session);
  
  if (!req.session?.userId) {
    console.log('NO ADMIN SESSION');
    return res.status(401).json({ success: false, message: "Admin login required" });
  }

  console.log('ADMIN DETECTED:', req.session.userId);
  
  // DB LOGIC ONLY in try/catch
  try {
    const invoices = await safeQuery(`
      SELECT 
        i.*, he.company AS client_company,
        he.fullname AS client_name, he.email AS client_email
      FROM invoices i
      LEFT JOIN host_employers he ON i.client_id = he.id
      ORDER BY i.issued_at DESC
    `);
    
    console.log('ADMIN INVOICES:', invoices.length);
    console.log('SENDING:', invoices.length, 'invoices');
    res.json(invoices);
    
  } catch (error) {
    console.error("DB ERROR:", error);
    res.status(500).json({ message: "Failed to fetch invoices" });
  }
});

app.get('/api/client/invoices', async (req, res) => {
  try {
    // INLINE CLIENT-ONLY AUTH (unchanged)
    if (!req.session?.clientId || req.session.userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Client login required (admin access blocked)" 
      });
    }

    const clientId = req.session.clientId;
    
    console.log(`Client ${clientId} fetching THEIR invoices + proofs`);

    // ✅ ENHANCED QUERY with payment_proofs JOIN
    const invoices = await safeQuery(`
      SELECT 
        i.id, i.invoice_number, i.company_name, i.customer_reference,
        i.invoice_date, i.due_date, i.amount, i.amount_due, i.status,
        i.created_at, i.issued_at, i.client_id,
        p.filename as proof_filename, 
        p.uploaded_at as proof_date,
        p.status as proof_status
      FROM invoices i
      LEFT JOIN payment_proofs p ON i.id = p.invoice_id
      WHERE i.client_id = ?
      ORDER BY i.created_at DESC
    `, [clientId]);

    console.log(`Client ${clientId} has ${invoices.length} invoices`);
    
    res.json({
      success: true,
      invoices: invoices.map(inv => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        company_name: inv.company_name,
        customer_reference: inv.customer_reference || 'General Services',
        invoice_date: inv.invoice_date,
        due_date: inv.due_date,
        amount: parseFloat(inv.amount),
        amount_due: parseFloat(inv.amount_due),
        status: inv.status,
        created_at: inv.created_at,
        issued_at: inv.issued_at,
        proof_filename: inv.proof_filename,
        proof_date: inv.proof_date,
        proof_status: inv.proof_status || null
      }))
    });

  } catch (error) {
    console.error('Client invoices error:', error);
    res.status(500).json({ success: false, message: 'Failed to load invoices' });
  }
});



//Delete and Invoice API from list  as well as in Database
app.delete('/api/invoices/:id', authenticateAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM invoices WHERE id = ?', [req.params.id]);
    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

// Only drafts will be deleted with this api 
app.delete('/api/drafts/:id', authenticateAdmin, async (req, res) => {
  try {
    const draftId = req.params.id;
    
    //Verify it's DRAFT and get details
    const [draft] = await safeQuery(
      `SELECT id, invoice_number, status 
       FROM invoices 
       WHERE id = ? AND status = 'DRAFT'`,
      [draftId]
    );
    
    if (!draft) {
      return res.status(404).json({ 
        error: 'Draft invoice not found or not in DRAFT status' 
      });
    }
    
    //Delete DRAFT only
    const [result] = await safeQuery(
      'DELETE FROM invoices WHERE id = ? AND status = "DRAFT"',
      [draftId]
    );
    
    //Verify deletion
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Draft not found for deletion' });
    }
    
    //Success response
    res.json({ 
      success: true,
      message: `Draft ${draft.invoice_number} deleted successfully!`,
      deletedId: draftId,
      affectedRows: result.affectedRows
    });
    
  } catch (error) {
    console.error('Draft delete error:', error);
    res.status(500).json({ error: 'Failed to delete draft' });
  }
});


//This api is for sending payment reminders into the clients(using post method)
app.post('/api/reminders/payment/:invoiceId', authenticateAdmin, async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.invoiceId);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ success: false, message: "Invalid invoice ID" });
    }
    
    // Get invoice + client details SQL query for selecting a comany by InvoiceId.
    const invoice = await safeQuery(`
      SELECT i.*, he.email, he.company, he.fullname 
      FROM invoices i 
      LEFT JOIN host_employers he ON i.client_id = he.id 
      WHERE i.id = ?
    `, [invoiceId]);
    
    if (!invoice.length) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    
    const inv = invoice[0];
    if (parseFloat(inv.amount_due) <= 0) {
      return res.status(400).json({ success: false, message: "Invoice already paid" });
    }
    
    // Calculate days overdue
    const dueDate = new Date(inv.due_date);
    const daysOverdue = Math.floor((Date.now() - dueDate) / (1000 * 60 * 60 * 24));
    const isOverdue = daysOverdue > 0;
    
    // Send professional reminder email
await transporter.sendMail({
  from: process.env.EMAIL_USER || '"Internship Success" <mkhizesenzo732@gmail.com>',
  to: inv.email,
  subject: `Payment Reminder: Invoice ${inv.invoice_number} - ${isOverdue ? 'OVERDUE' : 'Due Soon'}`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 40px 20px; font-family: Arial, Helvetica, sans-serif; background-color: #ffffff; color: #000000; line-height: 1.6; font-size: 16px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px; border: 1px solid #dddddd;">
    
    <h1 style="color: ${isOverdue ? '#d63333' : '#000000'}; font-size: 28px; margin-bottom: 10px;">
      ${isOverdue ? 'Payment Overdue Notice' : 'Payment Reminder'}
    </h1>
    
    <p style="color: #333333; font-size: 18px; margin-bottom: 30px;">
      Dear ${inv.company} Team,
    </p>

    <p style="margin-bottom: 30px; color: #333333;">
      This is a friendly reminder regarding your outstanding invoice.
    </p>

    <h2 style="color: #000000; font-size: 20px; margin: 30px 0 20px 0;">Invoice Summary</h2>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <tr>
        <td style="padding: 12px 0; color: #333333; font-weight: bold; width: 150px;">Invoice Number:</td>
        <td style="padding: 12px 0; color: #000000; font-family: 'Courier New', monospace;">${inv.invoice_number}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; color: #333333; font-weight: bold; width: 150px;">Issue Date:</td>
        <td style="padding: 12px 0; color: #000000;">${new Date(inv.invoice_date).toLocaleDateString('en-ZA')}</td>
      </tr>
      <tr style="${isOverdue ? 'background-color: #fff5f5; border-left: 4px solid #d63333;' : ''}">
        <td style="padding: 12px 0; color: #333333; font-weight: bold; width: 150px;">Due Date:</td>
        <td style="padding: 12px 0; color: ${isOverdue ? '#d63333' : '#000000'}; font-weight: bold;">
          ${new Date(inv.due_date).toLocaleDateString('en-ZA')}
          ${isOverdue ? ` (Overdue ${daysOverdue} days)` : ''}
        </td>
      </tr>
    </table>

    <div style="background-color: ${isOverdue ? '#fff5f5' : '#f8f9fa'}; border: 1px solid ${isOverdue ? '#d63333' : '#dddddd'}; padding: 20px; margin-bottom: 30px; border-radius: 5px;">
      <p style="color: ${isOverdue ? '#d63333' : '#333333'}; font-weight: bold; margin: 0 0 15px 0; font-size: 15px;">
        ${isOverdue ? 'Immediate Action Required' : 'Payment Request'}
      </p>
      <p style="margin: 0; color: #333333;">
        Please settle the outstanding amount at your earliest convenience. 
        Payment details and instructions are available in your Client Portal.
      </p>
    </div>

    <p style="margin-bottom: 30px; text-align: center;">
      <a href="${CLIENT_PORTAL_URL}" 
         style="background-color: #0066cc; color: #ffffff; padding: 15px 30px; text-decoration: none; 
                font-weight: bold; border-radius: 5px; display: inline-block; font-size: 16px;">
        Login to Client Portal
      </a>
    </p>

    <p style="margin-bottom: 20px; color: #333333;">
      Use the portal to view invoice details, make payments, and upload payment confirmation.
    </p>

    <hr style="border: none; border-top: 1px solid #dddddd; margin: 40px 0;">

    <h3 style="color: #000000; font-size: 18px; margin-bottom: 15px;">Next Steps:</h3>
    <ul style="color: #333333; margin-bottom: 40px; padding-left: 20px;">
      <li>Login to Client Portal to view full invoice details</li>
      <li>Make payment using the provided banking instructions</li>
      <li>Upload payment proof through the portal</li>
      <li>Contact us if you require invoice copy or have questions</li>
    </ul>

    <hr style="border: none; border-top: 1px solid #dddddd; margin: 40px 0;">

    <!-- Footer -->
    <table style="width: 100%; font-size: 14px;">
      <tr>
        <td style="color: #666666; padding-bottom: 20px;">
          <strong>Internship Success</strong><br>
          1st Floor, Shell House<br>
          Ferreira Street, Mbombela<br>
          South Africa, 1200
        </td>
        <td style="text-align: right; color: #666666; padding-bottom: 20px;">
          Email: <a href="mailto:mkhizesenzo732@gmail.com" style="color: #0066cc;">mkhizesenzo732@gmail.com</a><br>
          Tel: +27 11 123 4567
        </td>
      </tr>
      <tr>
        <td colspan="2" style="text-align: center; color: #999999; font-size: 12px; padding-top: 20px; border-top: 1px solid #eeeeee;">
          © 2026 Internship Success. All rights reserved.<br>
          This is an automated payment reminder.
        </td>
      </tr>
    </table>

  </div>
</body>
</html>
  `
});

    // Admin notification
    await safeQuery(
      "INSERT INTO notifications (message, user_mail, viewed, created_at) VALUES (?, ?, 0, NOW())",
      [`REMINDER SENT: Invoice Number:${inv.invoice_number} → ${inv.company} (R${inv.amount_due})`, ADMIN_EMAIL]
    );

    //ADD THESE 3 LINES FOR REMINDER TRACKING (RIGHT AFTER NOTIFICATION)
    await safeQuery(
      'INSERT INTO activity_logs (user_type, user_id, client_company, action, invoice_id) VALUES (?, ?, ?, ?, ?)',
      ['admin', req.session.userId, inv.company, 'reminder_sent', invoiceId]
    );
    console.log(`REMINDER TRACKED: ${inv.company} (Invoice #${inv.invoice_number}, ID: ${invoiceId})`);

    console.log(`Reminder sent for invoice #${inv.invoice_number} → ${inv.email}`);
    res.json({ 
      success: true, 
      message: `Payment reminder sent to ${inv.company}!` 
    });
  } catch (error) {
    console.error("Reminder error:", error);
    res.status(500).json({ success: false, message: "Failed to send reminder" });
  }
});

//CLIENT PROOFS - ADMIN
app.get('/api/clients/:id/proofs', async (req, res) => {
  try {
    // INLINE AUTH - Admin OR matching Client only
    if (!req.session) {
      return res.status(401).json({ success: false, message: "No session" });
    }

    const clientId = parseInt(req.params.id);
    const sessionClientId = req.session.clientId;
    const isAdmin = !!req.session.userId && !req.session.clientId;
    const isClient = !!req.session.clientId && !req.session.userId;

    // Client can ONLY access their own proofs
    if (isClient && sessionClientId !== clientId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // No session = unauthorized
    if (!isAdmin && !isClient) {
      return res.status(401).json({ success: false, message: "Login required" });
    }

    console.log(`Fetching proofs for client ${clientId} by ${isAdmin ? 'ADMIN' : 'CLIENT'}`);
    
    const proofs = await safeQuery(`
      SELECT pp.*, he.company, he.fullname 
      FROM payment_proofs pp 
      LEFT JOIN host_employers he ON pp.client_id = he.id 
      WHERE pp.client_id = ? 
      ORDER BY pp.uploaded_at DESC
    `, [clientId]);
    
    console.log(`Found ${proofs.length} proofs`);
    res.json(proofs);

  } catch (error) {
    console.error('Proofs error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch proofs' });
  }
});



// Admin fetching using get method list of POPs
app.get("/api/payment-proofs", authenticateAdmin, async (req, res) => {
  try {
    const proofs = await safeQuery(`
      SELECT pp.*, he.company, he.fullname, he.email 
      FROM payment_proofs pp 
      LEFT JOIN host_employers he ON pp.client_id = he.id 
      ORDER BY pp.uploaded_at DESC
    `);
    res.json(proofs);
  } catch (error) {
    console.error('Admin proofs error:', error);
    res.status(500).json({ success: false, error: "Database error" });
  }
});
// GET PROOFS FOR CLIENT - ALTERNATIVE ENDPOINT (used by ClientDashboard)
app.get('/api/proofs/client/:clientId', async (req, res) => {
  try {
    // INLINE AUTH - Set the flags your code expects (UNCHANGED)
    if (!req.session) {
      return res.status(401).json({ success: false, message: "No session" });
    }

    req.isClient = !!req.session.clientId && !req.session.userId;
    req.isAdmin = !!req.session.userId && !req.session.clientId;
    req.clientId = req.session.clientId;

    // Block unauthorized access (UNCHANGED)
    if (!req.isClient && !req.isAdmin) {
      return res.status(401).json({ success: false, message: "Login required" });
    }

    const clientId = parseInt(req.params.clientId);
    
    console.log('Proofs endpoint debug:', {
      clientId: req.clientId,
      isClient: req.isClient,
      isAdmin: req.isAdmin,
      requestedClientId: clientId
    });
    
    //Your exact logic preserved: Allow admins OR client's own proofs (UNCHANGED)
    if (req.isClient && req.clientId !== clientId) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied - cannot view other client's proofs" 
      });
    }

    // ✅ ENHANCED QUERY: INVOICES + PROOFS JOIN
    const results = await safeQuery(`
      SELECT 
        i.id as invoice_id, i.invoice_number, i.company_name, i.customer_reference,
        i.invoice_date, i.due_date, i.amount, i.amount_due, i.status as invoice_status,
        i.created_at, i.issued_at,
        pp.id as proof_id, pp.file_path, pp.public_url, pp.comment as proof_comment, 
        pp.uploaded_at as proof_date, pp.file_type, pp.status as proof_status
      FROM invoices i
      LEFT JOIN payment_proofs pp ON i.id = pp.invoice_id
      WHERE i.client_id = ?
      ORDER BY i.created_at DESC, pp.uploaded_at DESC
    `, [clientId]);
    
    // ✅ GROUP BY INVOICE (handle multiple proofs per invoice)
    const invoicesMap = {};
    results.forEach(row => {
      if (!invoicesMap[row.invoice_id]) {
        invoicesMap[row.invoice_id] = {
          id: row.invoice_id,
          invoice_number: row.invoice_number,
          company_name: row.company_name,
          customer_reference: row.customer_reference || 'General Services',
          invoice_date: row.invoice_date,
          due_date: row.due_date,
          amount: parseFloat(row.amount),
          amount_due: parseFloat(row.amount_due),
          status: row.invoice_status,
          created_at: row.created_at,
          issued_at: row.issued_at,
          proofs: []
        };
      }
      
      if (row.proof_id) {
        invoicesMap[row.invoice_id].proofs.push({
          id: row.proof_id,
          file_path: row.file_path,
          public_url: row.public_url,
          comment: row.proof_comment,
          uploaded_at: row.proof_date,
          file_type: row.file_type,
          status: row.proof_status
        });
      }
    });

    const invoices = Object.values(invoicesMap);
    
    console.log(`✅ Client ${clientId} invoices + proofs: ${invoices.length} invoices found`);
    res.json({
      success: true,
      invoices: invoices
    });

  } catch (error) {
    console.error('Client proofs fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices and proofs' });
  }
});
// API 1: Get client notifications (NEW)
app.get('/api/notifications/client/:clientId', async (req, res) => {
  try {
    // INLINE AUTH - Set flags your code expects
    if (!req.session) {
      return res.status(401).json({ success: false, message: "No session" });
    }

    req.isClient = !!req.session.clientId && !req.session.userId;
    req.isAdmin = !!req.session.userId && !req.session.clientId;
    req.clientId = req.session.clientId;

    if (!req.isClient && !req.isAdmin) {
      return res.status(401).json({ success: false, message: "Login required" });
    }

    const clientId = req.isClient ? req.clientId : parseInt(req.params.clientId);
    
    console.log('🔍 Notifications debug:', {
      sessionClientId: req.clientId,
      isClient: req.isClient,
      isAdmin: req.isAdmin,
      requestedClientId: clientId
    });
    
    if (req.isClient && req.clientId !== clientId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    
    const notifications = await safeQuery(`
      SELECT pn.*, pp.public_url, i.invoice_number 
      FROM proof_notifications pn
      JOIN payment_proofs pp ON pn.proof_id = pp.id
      JOIN invoices i ON pn.invoice_id = i.id
      WHERE pn.client_id = ?
      ORDER BY pn.created_at DESC
      LIMIT 50
    `, [clientId]);
    
    const unreadCount = await safeQuery(
      `SELECT COUNT(*) as count FROM proof_notifications WHERE client_id = ? AND is_read = FALSE`, 
      [clientId]
    );
    
    res.json({ 
      notifications, 
      unreadCount: unreadCount[0].count 
    });

  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});


// API 2: Mark notification as read
app.patch('/api/notifications/:notificationId/read', async (req, res) => {
  try {
    // INLINE CLIENT-ONLY AUTH
    if (!req.session?.clientId || req.session.userId) {
      return res.status(403).json({ success: false, message: "Client access only" });
    }

    req.isClient = true;
    req.clientId = req.session.clientId;

    if (!req.isClient) {
      return res.status(403).json({ success: false, message: "Admins cannot mark client notifications" });
    }
    
    const result = await safeQuery(
      `UPDATE proof_notifications SET is_read = TRUE WHERE id = ? AND client_id = ?`,
      [req.params.notificationId, req.clientId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});


app.get('/api/notifications/client/:clientId', async (req, res) => {
  try {
    // INLINE AUTH - Set flags
    if (!req.session) {
      return res.status(401).json({ success: false, message: "No session" });
    }

    req.isClient = !!req.session.clientId && !req.session.userId;
    req.isAdmin = !!req.session.userId && !req.session.clientId;
    req.clientId = req.session.clientId;

    if (!req.isClient && !req.isAdmin) {
      return res.status(401).json({ success: false, message: "Login required" });
    }

    const clientId = req.isClient ? req.clientId : parseInt(req.params.clientId);
    
    if (req.isClient && req.clientId !== clientId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    
    const notifications = await safeQuery(`
      SELECT pn.*, pp.public_url, i.invoice_number 
      FROM proof_notifications pn
      LEFT JOIN payment_proofs pp ON pn.proof_id = pp.id
      LEFT JOIN invoices i ON pn.invoice_id = i.id
      WHERE pn.client_id = ?
      ORDER BY pn.created_at DESC
      LIMIT 50
    `, [clientId]);
    
    const unreadCount = await safeQuery(
      `SELECT COUNT(*) as count FROM proof_notifications WHERE client_id = ? AND is_read = FALSE`, 
      [clientId]
    );
    
    res.json({ 
      notifications: notifications || [], 
      unreadCount: unreadCount[0]?.count || 0 
    });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});


app.patch('/api/notifications/:notificationId/read', async (req, res) => {
  try {
    // INLINE CLIENT-ONLY AUTH
    if (!req.session?.clientId || req.session.userId) {
      return res.status(403).json({ 
        success: false, 
        message: "Admins cannot mark client notifications - client login required" 
      });
    }

    // Set flags your code expects
    req.isClient = true;
    req.clientId = req.session.clientId;

    if (!req.isClient) {
      return res.status(403).json({ success: false, message: "Admins cannot mark client notifications" });
    }
    
    const result = await safeQuery(
      `UPDATE proof_notifications SET is_read = TRUE WHERE id = ? AND client_id = ?`,
      [req.params.notificationId, req.clientId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});


// ✅ FIXED - Uses safeQuery() to match your server architecture!
app.post("/api/signup", async (req, res) => {
  try {
    const {
      username,
      full_name,
      last_name,
      company_name,
      email,
      password,
    } = req.body;

    console.log("Signup payload received:", req.body);

    // ✅ Validate required fields
    if (!username || !full_name || !email || !password) {
      return res.status(400).json({ 
        message: "Username, full name, email, and password are required" 
      });
    }

    // ✅ Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    // ✅ Check if user already exists (uses safeQuery!)
    const existingUsers = await safeQuery(
      "SELECT id, username, email FROM users WHERE email = ? OR username = ?",
      [email.toLowerCase().trim(), username.trim()]
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.email === email.toLowerCase().trim()) {
        return res.status(409).json({ message: "Email already registered" });
      }
      return res.status(409).json({ message: "Username already taken" });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // ✅ Insert new user (uses safeQuery!)
    const result = await safeQuery(
      `INSERT INTO users (username, full_name, last_name, company_name, email, password) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        username.trim(),
        full_name.trim(),
        last_name?.trim() || null,
        company_name?.trim() || null,
        email.toLowerCase().trim(),
        hashedPassword,
      ]
    );

    console.log(`✅ User created successfully: ID ${result.insertId}`);
    
    res.status(201).json({
      message: "Account created successfully",
      userId: result.insertId,
      redirect: "/login"
    });

  } catch (error) {
    console.error("Signup API error:", error);
    
    // Handle MySQL errors specifically
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: "User already exists" });
    }
    
    res.status(500).json({ message: "Failed to create account" });
  }
});


// ADMIN LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const rows = await safeQuery("SELECT * FROM users WHERE email = ?", [email]);
    
    if (rows.length === 0 || !(await bcrypt.compare(password, rows[0].password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    
    req.session.userId = rows[0].id;
    req.session.userType = 'admin';
    
    // FOR TRACKING (after session is set)
    await safeQuery(
      'INSERT INTO activity_logs (user_type, user_id, action) VALUES (?, ?, ?)',
      ['admin', req.session.userId, 'login']
    );
    console.log(`ADMIN LOGIN TRACKED: User ${req.session.userId}`);
    
    res.json({ success: true, message: "Login successful", userId: rows[0].id });
  } catch (error) {
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

//ADMIN NOTIFICATIONS - GET
app.get("/api/notifications", authenticateAdmin, async (req, res) => {
  try {
    const notifications = await safeQuery("SELECT * FROM notifications WHERE user_mail = ? ORDER BY created_at DESC LIMIT 50", [ADMIN_EMAIL]);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ success: false, error: "Database error" });
  }
});
//MARK SINGLE NOTIFICATION AS READ - PERFECT FOR YOUR FRONTEND!
app.post("/api/notifications/:id/read", authenticateAdmin, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id); 
    if (isNaN(notificationId)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID" });}
//DATABASE - ONLY SINGLE NOTIFICATION
    const result = await safeQuery("UPDATE notifications SET viewed = 1 WHERE id = ? AND user_mail = ?",[notificationId, ADMIN_EMAIL]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    } 
  } catch (error) {
    console.error("Mark notification error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }});
//MARK ALL NOTIFICATIONS AS READ - OPTIONAL BACKUP
app.post("/api/notifications/mark-all-read", authenticateAdmin, async (req, res) => {
  try {const result = await safeQuery("UPDATE notifications SET viewed = 1 WHERE user_mail = ? AND viewed = 0",[ADMIN_EMAIL]);
    console.log(`Marked ${result.affectedRows} notifications as read`);res.json({ success: true, message: `Marked ${result.affectedRows} notifications as read`,affectedRows: result.affectedRows });} catch (error) {console.error("Mark all notifications error:", error);res.status(500).json({ success: false, message: "Server error" });}});
//HEALTH CHECK
app.get("/health", async (req, res) => {
  try {await dbPool.execute("SELECT 1");
    res.json({ status: 'OK',timestamp: new Date().toISOString(),port: PORT,cloudinary: !!cloudinary.config().cloud_name,clients: true,invoices: true,emails: true,notifications: true
    });} catch (error){res.status(503).json({ status: 'ERROR', database: 'unavailable' });}});


// Deletes client + ALL related data (invoices, proofs, notifications)
app.delete('/api/clients/:id', authenticateAdmin, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    console.log('DELETE REQUEST:', { clientId });

    // 1. Get client info FIRST (before deletion)
    const client = await safeQuery(
      'SELECT id, company, fullname, lastname, email FROM host_employers WHERE id = ?',
      [clientId]
    );

    if (client.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client not found' 
      });
    }

    // 2. COUNT WHAT WE'RE DELETING (for logs)
    const invoices = await safeQuery('SELECT COUNT(*) as count FROM invoices WHERE client_id = ?', [clientId]);
    const proofs = await safeQuery('SELECT COUNT(*) as count FROM payment_proofs WHERE client_id = ?', [clientId]);
    const notifications = await safeQuery('SELECT COUNT(*) as count FROM notifications WHERE message LIKE ?', [`%${clientId}%`]);

    console.log('DELETE SUMMARY:', {
      client: client[0].company,
      invoices: invoices[0].count,
      proofs: proofs[0].count,
      notifications: notifications[0].count
    });

    // 3. DELETE IN CORRECT ORDER (child tables FIRST)
    await safeQuery('DELETE FROM payment_proofs WHERE client_id = ?', [clientId]);
    await safeQuery('DELETE FROM invoices WHERE client_id = ?', [clientId]);
    await safeQuery('DELETE FROM notifications WHERE message LIKE ?', [`%${clientId}%`]);
    
    // 4. FINALLY DELETE CLIENT
    const clientResult = await safeQuery('DELETE FROM host_employers WHERE id = ?', [clientId]);

    // 5. Admin notification (SUCCESS)
    await safeQuery(
      "INSERT INTO notifications (message, user_mail, viewed, created_at) VALUES (?, ?, 0, NOW())",
      [`Delete Complete: "${client[0].company}" + ${invoices[0].count} invoices, ${proofs[0].count} proofs DELETED`, ADMIN_EMAIL]
    );

    console.log(`Delete Complete: "${client[0].company}" (ID: ${clientId}) + ALL DATA DELETED`);

    res.json({ 
      success: true, 
      message: `Client "${client[0].company}" + all data (${invoices[0].count} invoices, ${proofs[0].count} proofs) DELETED`,
      deletedSummary: {
        client: client[0].company,
        invoices: invoices[0].count,
        proofs: proofs[0].count,
        notifications: notifications[0].count
      }
    });

  } catch (error) {
    console.error('DELETE ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Delete failed: ' + error.message 
    });
  }
});

app.get('/api/admin/analytics', async (req, res) => {
  try {
    const analytics = await safeQuery(`
      SELECT 
        DATE(created_at) as date,
        COUNT(CASE WHEN action = 'proof_uploaded' THEN 1 END) as uploads,
        COUNT(CASE WHEN action = 'client_registered' THEN 1 END) as clients
      FROM activity_logs 
      WHERE DATE(created_at) >= DATE_SUB(NOW(), INTERVAL 2 YEAR)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    res.json({ timeline: analytics });
  } catch (error) {
    res.status(500).json({ error: 'Analytics fetch failed' });
  }
});


    // Error handler - CATCHES ALL PROMISE REJECTIONS
app.use((err, req, res, next) => {
  console.error("Global error:", err.message);
  if (err.code === 'LIMIT_FILE_SIZE'){return res.status(400).json({ success: false, message: "File too large (max 10MB)" });}
  if (req.file){
    fs.unlink(req.file.path,() => {});}
  res.status(500).json({ success: false, message: "Internal server error" });});

  //Graceful shutdown
process.on('SIGTERM', async () => {console.log('Shutting down gracefully...');
  if (dbPool) {
    await dbPool.end();}
  process.exit(0);});

  //START SERVER
async function startServer() {
  await initDb();
  app.listen(PORT, () => {console.log(`Admin: ${ADMIN_EMAIL}`);console.log(`🔗 CLIENT_PORTAL_URL: ${CLIENT_PORTAL_URL}`);console.log(`✅ COMPLETE FILE - SINGLE NOTIFICATION MARKING PERFECT!\n`);
  });}
startServer().catch(console.error); 