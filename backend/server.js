//COMPLETE FIXED server.js - CLIENT CREATION + AUTO EMAILS + PASSWORD RESET + SINGLE NOTIFICATION MARKING!
require('dotenv').config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;
const app = express();
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const CLIENT_PORTAL_URL = process.env.CLIENT_PORTAL_URL || "http://localhost:3000/client-portal";
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
      return next();
    }
    return res.status(401).json({ success: false, message: "Admin authentication required" });
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ success: false, message: "Auth error" });
}}
function authenticateClient(req, res, next) {
  try {
    if (req.session?.clientId) {
      req.clientId = req.session.clientId;
      return next();
    }
    return res.status(401).json({ success: false, message: "Client authentication required" });
  } catch (error) {
    console.error("Client auth error:", error);
    res.status(500).json({ success: false, message: "Auth error" });
  }}
function isAuthenticated(req, res, next) {
  try {
    if (req.session && (req.session.userId || req.session.clientId)) {req.userId = req.session.userId || req.session.clientId;req.isAdmin = !!req.session.userId;req.isClient = !!req.session.clientId;req.clientId = req.session.clientId;
      return next();
    }
    return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
  } catch (error) {console.error("Auth error:", error);
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
    console.error("❌ MySQL connection error:", error);
    process.exit(1);
  }
}
// ✅ UTILITY: BULLETPROOF DB QUERY
async function safeQuery(query, params = []) {
  try {
    if (!dbPool) {
      throw new Error("Database pool not initialized");
    }
    const [rows] = await dbPool.execute(query, params);
    return rows || [];
  } catch (error) {
    console.error("🚨 DB Query FAILED:", error.message);
    console.error("Query:", query);
    console.error("Params:", params);
    throw error;
  }
}

// ================= ADMIN REGISTER =================
// ================= ADMIN REGISTER (FIXED) =================
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

    console.log("📥 Admin register payload:", req.body);

    if (!username || !full_name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check existing admin
    db.query(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [email, username],
      async (err, results) => {
        if (err) {
          console.error("❌ SELECT error:", err);
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
              console.error("❌ INSERT error:", err);
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
    console.error("🔥 REGISTER CRASH:", error);
    res.status(500).json({ message: "Server crashed" });
  }
});

//Cloudinary config
console.log("🔍 Cloudinary config check:");
console.log("  Cloud name:", process.env.CLOUDINARY_CLOUD_NAME ? "✅ OK" : "❌ MISSING");
console.log("  API Key:", process.env.CLOUDINARY_API_KEY ? "✅ OK" : "❌ MISSING");
console.log("  API Secret:", process.env.CLOUDINARY_API_SECRET ? "✅ OK" : "❌ MISSING");
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
//NEW! CLIENT WELCOME EMAIL WITH TEMP PASSWORD + RESET LINK
async function sendClientWelcomeEmail(clientEmail, clientUsername, tempPassword, clientId, companyName) {
  try {
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Store reset token (expires in 24h) - CREATE TABLE IF NEEDED
    await safeQuery(
      `INSERT INTO password_resets (email, token, client_id, expires_at) 
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR)) 
       ON DUPLICATE KEY UPDATE token = ?, expires_at = DATE_ADD(NOW(), INTERVAL 24 HOUR)`,
      [clientEmail, resetToken, clientId, resetToken]
    );
    const resetUrl = `${CLIENT_PORTAL_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(clientEmail)}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER || "mkhizesenzo732@gmail.com",
      to: clientEmail,
      subject: "Welcome to Internship Success Financial-System ClientPortal - Your Account Details",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1976d2;">🎉 Welcome to Internship Success Financial-System ClientPortal!</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📋 Your Account Details</h3>
            <p><strong>👤 Username:</strong> ${clientUsername}</p>
            <p><strong>📧 Email:</strong> ${clientEmail}</p>
            <p><strong>🔑 Temporary Password:</strong> 
               <span style="color: #d32f2f; font-size: 1.1em; font-weight: bold;">${tempPassword}</span>
            </p>
            <p style="color: #d32f2f; font-weight: bold;">
              ⚠️ Please change this password immediately after first login!
            </p>
          </div>

          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>🔐 Quick Password Reset</h3>
            <p>Click the button below to reset your password and access your client portal:</p>
            <a href="${resetUrl}" style="background: #1976d2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; margin: 10px 0;">
              Reset Password Now
            </a>
            <p style="font-size: 12px; color: #666;">
              <em>This link expires in 24 hours</em>
            </p>
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p><strong>📱 Client Portal:</strong> <a href="${CLIENT_PORTAL_URL}">${CLIENT_PORTAL_URL}</a></p>
            <p><strong>🏢 Company:</strong> ${companyName}</p>
          </div>

          <hr style="margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            Regards,<br>
            Finance Portal Team
          </p>
        </div>`});
    console.log(`Welcome email sent to ${clientEmail}`);
  } catch (error) {
    console.error("Welcome email FAILED:", error.message);
    throw error;
  }
}
//NEW! PASSWORD RESET ENDPOINT
app.post('/api/clients/reset-password', async (req, res) => {
  try {const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Email, token, and password (6+ chars) required" });
    }
//Verify token + not expired
    const resetRecord = await safeQuery("SELECT client_id FROM password_resets WHERE email = ? AND token = ? AND expires_at > NOW()",[email.toLowerCase(), token]
    );
    if (resetRecord.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }
    const clientId = resetRecord[0].client_id;
    const hashedPassword = await bcrypt.hash(newPassword, 12);
// Update password
    await safeQuery(
      "UPDATE host_employers SET password = ? WHERE id = ? AND email = ?",[hashedPassword, clientId, email.toLowerCase()]);
// Delete used token
    await safeQuery("DELETE FROM password_resets WHERE email = ? AND token = ?", [email.toLowerCase(), token]);
    console.log(`Password reset for ${email} (Client ID: ${clientId})`);
    res.json({success: true,message: "Password updated! You can now login to client portal." 
    });
  } catch (error) {console.error("Password reset error:", error);res.status(500).json({ success: false, message: "Password reset failed" });}
});
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
// ✅ VALIDATION
    if (!email || !password) {return res.status(400).json({success: false,message: "Email and password required"});
    }
    if (!email.includes('@')) {return res.status(400).json({success: false,message: "Please enter a valid email address"});
    }
    //DATABASE QUERY - EMAIL AUTH
    const rows = await safeQuery("SELECT id, company, fullname, lastname, email, password FROM host_employers WHERE email = ? LIMIT 1",
      [email]);
    console.log(`📊 Found ${rows.length} matching users`);
    if (!rows.length) {console.log(`No user found for email: ${email}`);
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
      if (err) {console.error("🚨 Session regenerate FAILED:", err);
        return res.status(500).json({ success: false, message: "Session creation failed"});
      }
      // ✅ SET SECURE SESSION DATA
      req.session.clientId = user.id;
      req.session.clientType = "client";
      req.session.clientEmail = user.email;
      req.session.clientCompany = user.company;
      //SAVE SESSION (CRITICAL - prevents session loss)
      req.session.save(async (saveErr) => {
        if (saveErr) {
          console.error("🚨 Session save FAILED:", saveErr);
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
//FIXED GET CLIENTS - Perfect for Clients.js display
app.get("/api/clients", authenticateAdmin, async (req, res) => {
  try {const clients = await safeQuery(`SELECT id, username, fullname, lastname, company, email, cell, tel, created_at FROM host_employers ORDER BY created_at DESC`);
    console.log(`Sending ${clients.length} clients to frontend`);
    res.json(clients);
  } catch (error) {
    console.error("Clients fetch error:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }});
//NEW! FULL CLIENT DETAILS for modals - ADD THIS!
app.get("/api/clients/:id/details", authenticateAdmin, async (req, res) => {
  try {const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ success: false, message: "Invalid client ID" });}
    const client = await safeQuery(`
      SELECT id, username, fullname, lastname, company, email,cell, tel, street, town, province, postalcode, reg, vat, noi, created_at FROM host_employers WHERE id = ?`, [clientId]);
    if (!client || client.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }
    console.log(`✅ Full details for client ${clientId}: ${client[0].company}`);
    res.json(client[0]);
  } catch (error) {
    console.error("🚨 Client details error:", error);
    res.status(500).json({ success: false, error: "Database error" });}});
//UPDATE CLIENT - ADD THIS ENDPOINT!
app.put("/api/clients/:id", authenticateAdmin, async (req, res) => {
  try {const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ success: false, message: "Invalid client ID" });}
    const updateData = req.body;
// ✅ Build dynamic UPDATE query for ALL fields
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
console.log(`✅ Updated client ${clientId}: ${updateData.company || 'Unnamed'}`);
    res.json({ 
      success: true, 
      message: "Client updated successfully",
      clientId 
    });
  } catch (error) {console.error("Update client error:", error);
    res.status(500).json({ success: false, error: "Database error" });
}
});
//FIXED UPLOAD - NO PROMISE REJECTIONS - PDF + IMAGES PERFECT!
app.post('/api/proofs/upload', upload.single('proofFile'), async (req, res) => {
  console.log('📁 Upload attempt...'); 
  try {const { clientId, comment } = req.body; 
    if (!req.file || !clientId) {
      if (req.file) {
        fs.unlink(req.file.path, () => {});
}
      return res.status(400).json({ success: false, message: "File and clientId required" });}
    // Verify client
    const clients = await safeQuery("SELECT id, company, fullname, email FROM host_employers WHERE id = ?", [clientId]);
    if (!clients || clients.length === 0) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ success: false, message: "Client not found" });}
    // Cloudinary upload - SAFE PROMISE
    const isPDF = req.file.mimetype === 'application/pdf';
    const uploadOptions = {
      folder: 'proofs',
      overwrite: true,
      resource_type: isPDF ? 'raw' : 'image'
    };

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(req.file.path, uploadOptions, (error, result) => {
        if (error) {
          console.error('☁️ Cloudinary error:', error);
          reject(new Error(`Cloudinary: ${error.message}`));
        } else {
          console.log('☁️ Success:', result.secure_url);
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
      [`🔥 NEW PROOF from ${clients[0].company} (${clientId}): ${uploadResult.secure_url}`, ADMIN_EMAIL]
    );

    // Safe email to admin
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: ADMIN_EMAIL,
        subject: `🔔 URGENT: New Proof from ${clients[0].company}`,
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

    console.log(`✅ UPLOAD COMPLETE: Proof ID ${result.insertId}`);
    res.json({ 
      success: true,
      message: "✅ Upload successful", 
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

//FIXED: DRAFT vs SENT - NOW SENDS EMAILS CORRECTLY!
app.post('/api/invoices', authenticateAdmin, async (req, res) => {
  try {
    console.log('📄 Creating invoice:', req.body);
    
    const {
      company_name,
      invoice_number,
      customer_reference,
      client_id,
      invoice_date,
      due_date,
      amount,
      amount_due,
      status // "draft" or "sent" from frontend buttons!
    } = req.body;

    // 🚀 VALIDATE STATUS FROM FRONTEND BUTTONS
    const validStatus = status === 'sent' ? 'sent' : 'draft';
    console.log(`📋 Button clicked: ${status} → Saving as: ${validStatus}`);

    // 🚀 FAIL-FAST VALIDATION
    if (!company_name?.trim()) return res.status(400).json({ success: false, message: "Company name required" });
    if (!invoice_number?.trim()) return res.status(400).json({ success: false, message: "Invoice number required" });
    if (!client_id || isNaN(Number(client_id))) return res.status(400).json({ success: false, message: "Valid client ID required" });
    if (!invoice_date) return res.status(400).json({ success: false, message: "Invoice date required" });
    if (!due_date) return res.status(400).json({ success: false, message: "Due date required" });
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return res.status(400).json({ success: false, message: "Valid amount required" });

    const clientIdNum = Number(client_id);
    const amountNum = Number(amount);
    const amountDueNum = Number(amount_due || amount);

    // 🚀 CHECK DUPLICATE
    const existing = await safeQuery("SELECT id FROM invoices WHERE invoice_number = ?", [invoice_number.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "Invoice number already exists" });}
//VERIFY CLIENT + GET EMAIL
    const client = await safeQuery("SELECT id, company, email, fullname FROM host_employers WHERE id = ?", [clientIdNum]);
    if (!client || client.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found" });}
    const clientEmail = client[0].email;const clientCompany = client[0].company;const clientName = client[0].fullname;
//MAIN INSERT - USES FRONTEND STATUS!
    const result = await safeQuery(
      `INSERT INTO invoices (company_name, invoice_number, customer_reference, client_id, invoice_date, due_date, amount, amount_due, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [company_name.trim(),invoice_number.trim(),customer_reference?.trim() || null,clientIdNum,invoice_date,due_date,amountNum,amountDueNum,validStatus]);const invoiceId = result.insertId;
    // 🚀 ADMIN NOTIFICATION (ALWAYS)
    await safeQuery(
      "INSERT INTO notifications (message, user_mail, viewed, created_at) VALUES (?, ?, 0, NOW())",
      [`💰 NEW ${validStatus.toUpperCase()} INVOICE #${invoice_number} for ${clientCompany}: R${amountNum.toLocaleString()}`, ADMIN_EMAIL]
    );
    // 🚀 ✅ CRITICAL FIX: SEND EMAIL ONLY FOR "sent" STATUS!
    if (validStatus === 'sent') {
      try {
        // Send invoice to CLIENT
        await transporter.sendMail({
          from: process.env.EMAIL_USER || "mkhizesenzo732@gmail.com",
          to: clientEmail,
          subject: `📄 New Invoice #${invoice_number} - ${company_name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1976d2;">📄 New Invoice Received</h2>
              <p>Dear ${clientName || clientCompany},</p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>📋 Invoice Details</h3>
                <p><strong>Invoice Number:</strong> ${invoice_number}</p>
                <p><strong>From:</strong> ${company_name}</p>
                <p><strong>Date:</strong> ${new Date(invoice_date).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> ${new Date(due_date).toLocaleDateString()}</p>
                <p><strong>Total Amount:</strong> <strong style="color: #1976d2; font-size: 1.2em;">R ${amountNum.toLocaleString()}</strong></p>
                <p><strong>Amount Due:</strong> <strong style="color: #d32f2f;">R ${amountDueNum.toLocaleString()}</strong></p>
              </div>
              <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>💳 Payment Instructions:</strong></p>
                <p>Login to your <a href="${CLIENT_PORTAL_URL}">Client Portal</a> to:</p>
                <ul>
                  <li>View full invoice details</li>
                  <li>Upload payment proof</li>
                  <li>Track payment status</li>
                </ul>
              </div>
              <hr style="margin: 30px 0;">
              <p>Best regards,<br>${company_name} Team</p>
            </div>`});
        console.log(`✅ EMAIL SENT to ${clientEmail} for invoice #${invoice_number}`);
// ADMIN CONFIRMATION NOTIFICATION
        await safeQuery(
          "INSERT INTO notifications (message, user_mail, viewed, created_at) VALUES (?, ?, 0, NOW())",
          [`📧 INVOICE SENT: #${invoice_number} → ${clientCompany} (${clientEmail}) - R${amountNum.toLocaleString()}`, ADMIN_EMAIL]
        );
      } catch (emailError) {
        console.error("🚨 EMAIL FAILED for invoice:", emailError.message);
        // Don't fail the invoice creation if email fails
      }
    }
    console.log(`✅ INVOICE CREATED: ID ${invoiceId} (${validStatus.toUpperCase()})`);
    res.json({ 
      success: true, 
      message: `Invoice ${validStatus}d successfully!${validStatus === 'sent' ? ' Client notified via email.' : ''}`,
      invoiceId: invoiceId,
      status: validStatus
    });
  } catch (error) {
    console.error("🚨 TOTAL INVOICE ERROR:", error);
    res.status(500).json({ success: false, message: "Server error - please try again" });
  }
});
// 🚀 ✅ FIXED! LIST INVOICES - BULLETPROOF
app.get('/api/invoices', authenticateAdmin, async (req, res) => {
  try {
    const invoices = await safeQuery(`SELECT i.*, he.company, he.fullname, he.email 
      FROM invoices i
      LEFT JOIN host_employers he ON i.client_id = he.id
      ORDER BY i.created_at DESC`);
    res.json(invoices || []);
  } catch (error) {
    console.error('Invoices error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
});
// 🚀 ✅ SINGLE INVOICE DETAILS - FIXES "Failed to load full invoice details"
app.get('/api/invoices/:id', authenticateAdmin, async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ success: false, message: "Invalid invoice ID" });
    }
    console.log(`📄 Fetching invoice details: ID ${invoiceId}`);
    const invoice = await safeQuery(`
  SELECT 
    i.*,
    he.company  AS client_company,
    he.fullname AS client_name,
    he.email    AS client_email,
    he.cell     AS client_cell
  FROM invoices i
  LEFT JOIN host_employers he ON i.client_id = he.id
  WHERE i.id = ?
  LIMIT 1
`, [invoiceId]);
;
    if (!invoice || invoice.length === 0) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    const invoiceData = invoice[0];
    console.log(`✅ Invoice found: ${invoiceData.invoice_number} (${invoiceData.status})`);
    res.json(invoiceData);
  } catch (error) {
    console.error('🚨 Invoice details error:', error);
    res.status(500).json({ success: false, message: "Failed to load invoice details" });
  }
});
// 🚀 ✅ NEW! SEND PAYMENT REMINDER - FIXES YOUR BUTTON!
app.post('/api/reminders/payment/:invoiceId', authenticateAdmin, async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.invoiceId);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ success: false, message: "Invalid invoice ID" });
    }
// Get invoice + client details
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
      subject: `⏰ ${isOverdue ? 'URGENT' : 'Friendly'} Payment Reminder: Invoice #${inv.invoice_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${isOverdue ? '#d32f2f' : '#1976d2'};">${isOverdue ? '⏰ URGENT PAYMENT REMINDER' : '💳 Payment Reminder'}</h2> 
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📄 Invoice Details</h3>
            <p><strong>Invoice #:</strong> ${inv.invoice_number}</p>
            <p><strong>Client:</strong> ${inv.company}</p>
            <p><strong>Date:</strong> ${new Date(inv.invoice_date).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(inv.due_date).toLocaleDateString()}${isOverdue ? ` (OVERDUE ${daysOverdue} days)` : ''}</p>
            <p><strong>Amount Due:</strong> <span style="color: #d32f2f; font-size: 1.3em; font-weight: bold;">R ${parseFloat(inv.amount_due).toLocaleString()}</span></p>
          </div>
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>📱 Upload Payment:</strong></p>
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
      [`📧 REMINDER SENT: Invoice #${inv.invoice_number} → ${inv.company} (R${inv.amount_due})`, ADMIN_EMAIL]
    );
    console.log(`✅ Reminder sent for invoice #${inv.invoice_number} → ${inv.email}`);
    res.json({ 
      success: true, 
      message: `Payment reminder sent to ${inv.company}!` 
    });
  } catch (error) {
    console.error("🚨 Reminder error:", error);
    res.status(500).json({ success: false, message: "Failed to send reminder" });
  }
});
// 🚀 ✅ CLIENT PROOFS - ADMIN OR OWNER ONLY
app.get('/api/clients/:id/proofs', isAuthenticated, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id); 
    if (req.isClient && req.clientId !== clientId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    const proofs = await safeQuery(`
      SELECT pp.*, he.company, he.fullname 
      FROM payment_proofs pp 
      LEFT JOIN host_employers he ON pp.client_id = he.id 
      WHERE pp.client_id = ? 
      ORDER BY pp.uploaded_at DESC
    `, [clientId]);
    res.json(proofs);
  } catch (error) {
    console.error('Proofs error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch proofs' });
  }
});
// 🚀 ✅ ADMIN PROOFS LIST
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
// 🚀 ✅ ADMIN LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const rows = await safeQuery("SELECT * FROM users WHERE email = ?", [email]);
    
    if (rows.length === 0 || !(await bcrypt.compare(password, rows[0].password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    req.session.userId = rows[0].id;
    req.session.userType = 'admin';
    res.json({ success: true, message: "✅ Login successful", userId: rows[0].id });
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
// 🚀 ✅ MARK SINGLE NOTIFICATION AS READ - PERFECT FOR YOUR FRONTEND!
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
    console.log(`✅ Notification ${notificationId} marked as read`);
    res.json({ success: true, message: "Notification marked as read" }); 
  } catch (error) {
    console.error("🚨 Mark notification error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }});
//MARK ALL NOTIFICATIONS AS READ - OPTIONAL BACKUP
app.post("/api/notifications/mark-all-read", authenticateAdmin, async (req, res) => {
  try {const result = await safeQuery("UPDATE notifications SET viewed = 1 WHERE user_mail = ? AND viewed = 0",[ADMIN_EMAIL]);
    console.log(`✅ Marked ${result.affectedRows} notifications as read`);res.json({ success: true, message: `Marked ${result.affectedRows} notifications as read`,affectedRows: result.affectedRows });} catch (error) {console.error("🚨 Mark all notifications error:", error);res.status(500).json({ success: false, message: "Server error" });}});
//HEALTH CHECK
app.get("/health", async (req, res) => {
  try {await dbPool.execute("SELECT 1");
    res.json({ status: 'OK',timestamp: new Date().toISOString(),port: PORT,cloudinary: !!cloudinary.config().cloud_name,clients: true,invoices: true,emails: true,notifications: true
    });} catch (error){res.status(503).json({ status: 'ERROR', database: 'unavailable' });}});

    // Error handler - CATCHES ALL PROMISE REJECTIONS
app.use((err, req, res, next) => {
  console.error("🚨 Global error:", err.message);
  if (err.code === 'LIMIT_FILE_SIZE'){return res.status(400).json({ success: false, message: "File too large (max 10MB)" });}
  if (req.file){
    fs.unlink(req.file.path,() => {});}
  res.status(500).json({ success: false, message: "Internal server error" });});

  //Graceful shutdown
process.on('SIGTERM', async () => {console.log('🛑 Shutting down gracefully...');
  if (dbPool) {
    await dbPool.end();}
  process.exit(0);});

  //START SERVER
async function startServer() {
  await initDb();
  app.listen(PORT, () => {console.log(`📧 Admin: ${ADMIN_EMAIL}`);console.log(`🔗 CLIENT_PORTAL_URL: ${CLIENT_PORTAL_URL}`);console.log(`✅ COMPLETE FILE - SINGLE NOTIFICATION MARKING PERFECT!\n`);
  });}
startServer().catch(console.error); 