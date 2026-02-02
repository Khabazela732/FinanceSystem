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
  <title>Invoice #${invoice.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #3166AE; }
    .logo { font-size: 28px; font-weight: 700; color: #3166AE; }
    .invoice-meta { text-align: right; }
    .invoice-number { font-size: 24px; font-weight: 700; color: #3166AE; margin-bottom: 5px; }
    
    .client-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .company-info, .client-info { width: 48%; background: #f8f9fa; padding: 20px; border-radius: 8px; }
    
    .table-container { margin-bottom: 30px; overflow: hidden; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    table { width: 100%; border-collapse: collapse; background: white; }
    th { background: #3166AE; color: white; padding: 18px 12px; text-align: left; font-weight: 600; }
    td { padding: 16px 12px; border-bottom: 1px solid #eee; }
    .amount { text-align: right; font-weight: 600; }
    
    .totals { background: #f8f9fa; padding: 20px; border-radius: 8px; }
    .total-row { display: flex; justify-content: flex-end; margin-bottom: 8px; font-size: 16px; }
    .total-amount { font-size: 28px; font-weight: 700; color: #3166AE; }
    
    .payment-info { background: #e8f4f8; padding: 20px; border-radius: 8px; margin-top: 30px; }
    .status { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: 600; 
      ${invoice.status === 'paid' ? 'background: #28a745;' : 'background: #ffc107; color: #212529;'}
    }
    
    .footer { margin-top: 40px; text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Internship Success</div>
    <div class="invoice-meta">
      <div class="invoice-number">#${invoice.invoice_number}</div>
      <div>Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-ZA')}</div>
      <div>Due: ${new Date(invoice.due_date).toLocaleDateString('en-ZA')}</div>
      <span class="status">${invoice.status.toUpperCase()}</span>
    </div>
  </div>

  <div class="client-section">
    <div class="company-info">
      <h3>FROM:</h3>
      <strong>Internship Success</strong><br>
      1st Floor,Shell House,<br>
      Ferreira Street, Mbombela<br>
      South Africa, 1200<br>
      Email: mkhizesenzo732@gmail.com<br>
      Tel: +27 11 123 4567
    </div>
    <div class="client-info">
      <h3>BILL TO:</h3>
      <strong>${invoice.company_name}</strong><br>
      ${invoice.customer_reference || 'N/A'}<br>
      Client ID: ${invoice.client_id}
    </div>
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Professional Services - ${invoice.customer_reference || 'General'}</strong></td>
          <td class="amount">R ${invoice.amount?.toLocaleString()}</td>
        </tr>
        <tr style="background: #f8f9fa;">
          <td>Balance Due</td>
          <td class="amount">R ${invoice.amount_due?.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="totals">
    <div class="total-row">
      <span>Total Amount Due:</span>
      <span class="total-amount">R ${invoice.amount_due?.toLocaleString()}</span>
    </div>
  </div>

  <div class="payment-info">
    <h4>Payment Instructions:</h4>
    <p><strong>Bank:</strong> FNB | <strong>Acc:</strong> 123456789012<br>
    <strong>Ref:</strong> ${invoice.invoice_number}<br>
    <strong>Due:</strong> ${new Date(invoice.due_date).toLocaleDateString('en-ZA')}</p>
    <p>Please email proof of payment to: <strong>mkhizesenzo732@gmail.com</strong></p>
  </div>

  <footer class="footer">
    <p>Regards | Internship Success © 2026</p>
  </footer>
</body>
</html>
  `, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
  });

  await browser.close();
  return pdf;
}


//On this backend api, this is not exposed to frontend
// This is for production stages, not yet working currently
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

    console.log("Admin register payload:", req.body);

    if (!username || !full_name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check existing admin
    db.query(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [email, username],
      async (err, results) => {
        if (err) {
          console.error("SELECT error:", err);
          return res.status(500).json({ message: "Database error (select)" });
        }

        if (results.length > 0) {
          return res
            .status(409)
            .json({ message: "Admin already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
          `INSERT INTO users
           (username, full_name, last_name, company_name, email, password)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            username,
            full_name,
            last_name || null,
            company_name || null,
            email,
            hashedPassword,
          ],
          (err, result) => {
            if (err) {
              console.error("INSERT error:", err);
              return res
                .status(500)
                .json({ message: "Database error (insert)" });
            }

            res.status(201).json({
              message: "Admin registered successfully",
              adminId: result.insertId,
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("REGISTER CRASH:", error);
    res.status(500).json({ message: "Server crashed" });
  }
});

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
      from: process.env.EMAIL_USER || "mkhizesenzo732@gmail.com",
      to: clientEmail,
      subject: "Welcome to Internship Success Financial-System ClientPortal - Your Account Details",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1976d2;">Welcome to Internship Success Financial Management System!</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
           <h4>Your Company Has Been Successfully registered, check below,</h4> 
          <h3>📋 Your Account Details</h3>
            <p><strong>👤 Username:</strong> ${clientUsername}</p>
            <p><strong>📧 Email:</strong> ${clientEmail}</p>
            <p><strong>🔑 Temporary Password:</strong> 
               <span style="color: #d15555; font-size: 1.1em; font-weight: bold;">${tempPassword}</span>
            </p>
            <p style="color: #d65b5b; font-weight: bold;">
              Please log in and change this password immediately!
            </p>
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p><strong>📱 Client Portal:</strong> <a href="${CLIENT_PORTAL_URL}">${CLIENT_PORTAL_URL}</a></p>
            <p><strong>🏢 Company:</strong> ${companyName}</p>
          </div>

          <hr style="margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            Regards,<br>
            Internship Success
          </p>
        </div>`});
    console.log(`Welcome email sent to ${clientEmail}`);
  } catch (error) {
    console.error("Welcome email FAILED:", error.message);
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
      subject: '🔐 Password Reset OTP (Valid 1 hour )',
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0e57a0;">Reset Your Password</h2>
          <p>Hi <strong>${clientName}</strong>,</p>
          <p>Use this <strong>6-digit verification code</strong> to reset your password:</p>
          
          <div style="background: linear-gradient(135deg, #0e57a0, #115293); 
                      color: white; font-size: 36px; font-weight: bold; 
                      text-align: center; padding: 25px; border-radius: 16px; 
                      letter-spacing: 12px; margin: 30px 0; box-shadow: 0 12px 32px rgba(14,87,160,0.4);">
            ${otp}
          </div>
          
          <p><strong>This code expires in 1 hour.</strong></p>
          <p>Enter it at: <a href="http://localhost:3000/clients/reset-password?email=${encodeURIComponent(email)}" 
            style="background: #0e57a0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Reset Password →
          </a></p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;">
          <p style="color: #666; font-size: 14px;">Internship Success Team</p>
        </div>
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
    console.error("🚨 Upload error:", error.message);
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ success: false, message: "Upload failed", error: error.message });
  }
});

//DRAFT vs SENT SENDS EMAILS CORRECTLY!
// ENTERPRISE INVOICE CREATION & ISSUING ENDPOINT
app.post("/api/invoices", authenticateAdmin, async (req, res) => {
  try {
    console.log(" Invoice request received:", req.body);

    const {
      company_name,
      invoice_number,
      customer_reference,
      client_id,
      invoice_date,
      due_date,
      amount,
      amount_due,
      status // waiting_for_payment | partially_paid | paid
    } = req.body;

    //VALIDATE STATUS - Match StatusChip exactly
    const allowedStatuses = ["waiting_for_payment", "partially_paid", "paid"];
    const finalStatus = allowedStatuses.includes(status) ? status : "waiting_for_payment";

    // -----------------------------
    // VALIDATION (unchanged)
    // -----------------------------
    if (!company_name?.trim()) return res.status(400).json({ message: "Company name required" });
    if (!invoice_number?.trim()) return res.status(400).json({ message: "Invoice number required" });
    if (!client_id || isNaN(client_id)) return res.status(400).json({ message: "Valid client ID required" });
    if (!invoice_date) return res.status(400).json({ message: "Invoice date required" });
    if (!due_date) return res.status(400).json({ message: "Due date required" });
    if (!amount || Number(amount) <= 0) return res.status(400).json({ message: "Valid invoice amount required" });

    // Check duplicate
    const duplicate = await safeQuery("SELECT id FROM invoices WHERE invoice_number = ?", [invoice_number.trim()]);
    if (duplicate.length > 0) return res.status(409).json({ message: "Invoice number already exists" });

    // Verify client
    const client = await safeQuery("SELECT id, company, email, fullname FROM host_employers WHERE id = ?", [client_id]);
    if (!client.length) return res.status(404).json({ message: "Client not found" });

    const clientEmail = client[0].email;
    const clientCompany = client[0].company;
    const clientName = client[0].fullname;

    // Set issued_at for non-waiting
    const issuedAt = finalStatus !== "waiting_for_payment" ? new Date() : null;

    // -----------------------------
    // INSERT INVOICE
    // -----------------------------
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

    // Activity log
    await safeQuery(
      'INSERT INTO activity_logs (user_type, user_id, client_company, action, invoice_id) VALUES (?, ?, ?, ?, ?)',
      ['admin', req.session.userId, clientCompany, 'invoice_created', invoiceId]
    );

    // Admin notification
    await safeQuery(
      `INSERT INTO notifications (message, user_mail, viewed, created_at) VALUES (?, ?, 0, NOW())`,
      [`📄 NEW INVOICE ${finalStatus.toUpperCase()}: #${invoice_number} (R${Number(amount).toLocaleString()})`, ADMIN_EMAIL]
    );

    res.json({
      success: true,
      invoiceId,
      status: finalStatus,
      message: `Invoice created as ${finalStatus.replace('_', ' ')}`
    });

  } catch (err) {
    console.error("🚨 Invoice creation error:", err);
    res.status(500).json({ message: "Server error while creating invoice" });
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
    // INLINE CLIENT-ONLY AUTH (independent from admin)
    if (!req.session?.clientId || req.session.userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Client login required (admin access blocked)" 
      });
    }

    const clientId = req.session.clientId;  // Direct from session (not req.user.id)
    
    console.log(`Client ${clientId} fetching THEIR invoices only`);
    
    const invoices = await safeQuery(`
      SELECT 
        id, invoice_number, company_name, invoice_date, due_date,
        amount, amount_due, status, created_at, issued_at, client_id
      FROM invoices 
      WHERE client_id = ?
        AND status IN ('sent', 'SENT', 'ISSUED', 'PAID', 'OVERDUE', 'draft')
      ORDER BY created_at DESC
    `, [clientId]);
    
    console.log(`Client ${clientId} has ${invoices.length} invoices`);
    res.json(invoices);

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
      from: process.env.EMAIL_USER || "mkhizesenzo732@gmail.com",
      to: inv.email,
      subject: `${isOverdue ? 'URGENT' : 'Friendly'} Payment Reminder: Invoice Number:${inv.invoice_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
         <h2 style="color: ${isOverdue ? '#df4949' : '#1976d2'};">${isOverdue ? 'URGENT PAYMENT REMINDER' : 'Payment Reminder'}</h2> 
         <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
           <h3>📄 Invoice Details</h3>
           <p><strong>Invoice:</strong> ${inv.invoice_number}</p>
           <p><strong>Client:</strong> ${inv.company}</p>
           <p><strong>Date:</strong> ${new Date(inv.invoice_date).toLocaleDateString()}</p>
           <p><strong>Due Date:</strong> ${new Date(inv.due_date).toLocaleDateString()}${isOverdue ? ` (OVERDUE ${daysOverdue} days)` : ''}</p>
           <p><strong>Amount Due:</strong> <span style="color: #d32f2f; font-size: 1.3em; font-weight: bold;">R ${parseFloat(inv.amount_due).toLocaleString()}</span></p>
         </div>
         <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
           <p>Upload Payment:</p>
           <p>Login to your <a href="${CLIENT_PORTAL_URL}">Client Portal</a> to upload payment proof.</p>
         </div>
         <hr style="margin: 30px 0;">
         <p>Thank you for your prompt attention.<br>${inv.company_name} Team</p>
        </div>
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

//CLIENT PROOFS - ADMIN OR OWNER ONLY
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
    // INLINE AUTH - Set the flags your code expects
    if (!req.session) {
      return res.status(401).json({ success: false, message: "No session" });
    }

    req.isClient = !!req.session.clientId && !req.session.userId;
    req.isAdmin = !!req.session.userId && !req.session.clientId;
    req.clientId = req.session.clientId;

    // Block unauthorized access
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
    
    //Your exact logic preserved: Allow admins OR client's own proofs
    if (req.isClient && req.clientId !== clientId) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied - cannot view other client's proofs" 
      });
    }
    // Admins bypass the check completely 

    const proofs = await safeQuery(`
      SELECT pp.id, pp.client_id, pp.file_path, pp.public_url, pp.comment, 
             pp.uploaded_at, pp.file_type
      FROM payment_proofs pp 
      WHERE pp.client_id = ? 
      ORDER BY pp.uploaded_at DESC
    `, [clientId]);
    
    console.log(`Proofs fetched for client ${clientId}: ${proofs.length} found`);
    res.json(proofs || []);

  } catch (error) {
    console.error('Client proofs fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch proofs' });
  }
});


// Backend - Add these 2 endpoints

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