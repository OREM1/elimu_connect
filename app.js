const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// 1. PROJECT INITIALIZATION
// Create 'uploads' folder if it doesn't exist to prevent errors during file saving
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// 2. DATABASE CONNECTION
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin123', // Leave empty for XAMPP default, or enter your MySQL password
    database: 'elimu_connect'
});

db.connect((err) => {
    if (err) {
        console.error('MySQL Connection Error: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL Database as id ' + db.threadId);
});

// 3. MULTER STORAGE CONFIGURATION
// Defines where and how uploaded teacher materials are stored on your local disk
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Rename file to: timestamp-originalfilename to prevent overwriting
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// 4. MIDDLEWARE SETUP
app.set('view engine', 'ejs');
app.use(express.static('public')); // For your CSS and client-side JS
app.use('/uploads', express.static('uploads')); // Makes uploaded PDFs/Videos accessible to students
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'ksef_2026_innovation_secret',
    resave: false,
    saveUninitialized: true
}));

// 5. ROUTES

// --- LANDING PAGE (Student View) ---
app.get('/', (req, res) => {
    const sql = 'SELECT * FROM materials ORDER BY grade ASC, subject_name ASC';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.render('index', { materials: results });
    });
});

// --- DELETE MATERIAL ---
app.get('/delete-material/:id', (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const materialId = req.params.id;
    const teacherId = req.session.user.id;

    // 1. Find the file name before deleting the database record
    db.query('SELECT file_path FROM materials WHERE id = ? AND teacher_id = ?', 
    [materialId, teacherId], (err, results) => {
        if (err) {
            console.error("DB Error:", err);
            return res.redirect('/portal');
        }

        if (results.length > 0) {
            const fileName = results[0].file_path;
            
            // 2. Delete from Database first
            db.query('DELETE FROM materials WHERE id = ?', [materialId], (err) => {
                if (err) {
                    console.error("Delete Error:", err);
                    return res.redirect('/portal');
                }

                // 3. Delete physical file only if it exists
                if (fileName) {
                    const filePath = path.join(__dirname, 'uploads', fileName);
                    try {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                            console.log("File deleted from disk:", fileName);
                        }
                    } catch (fileErr) {
                        console.error("File System Error (Server kept running):", fileErr);
                    }
                }
                
                res.redirect('/portal');
            });
        } else {
            res.redirect('/portal');
        }
    });
});

// --- EDIT MATERIAL (Fetch Data) ---
app.get('/edit-material/:id', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    
    db.query('SELECT * FROM materials WHERE id = ? AND teacher_id = ?', 
    [req.params.id, req.session.user.id], (err, results) => {
        if (results.length > 0) {
            res.render('edit', { material: results[0] });
        } else {
            res.redirect('/portal');
        }
    });
});

// --- UPDATE MATERIAL (Submit Edit) ---
// --- UPDATE MATERIAL (Submit Edit) ---
app.post('/update-material/:id', upload.single('materialFile'), (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const { subject, grade, type } = req.body;
    const materialId = req.params.id;
    
    // Determine level automatically
    let level = grade <= 3 ? "Lower Primary" : (grade <= 6 ? "Upper Primary" : "Junior School");

    // Check if a new file was uploaded
    if (req.file) {
        const newFileName = req.file.filename;
        
        // Find and delete old file first to save space
        db.query('SELECT file_path FROM materials WHERE id = ?', [materialId], (err, results) => {
            if (results.length > 0 && results[0].file_path) {
                const oldPath = path.join(__dirname, 'uploads', results[0].file_path);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            
            // Update database with NEW file
            const sql = 'UPDATE materials SET subject_name = ?, grade = ?, level = ?, material_type = ?, file_path = ? WHERE id = ?';
            db.query(sql, [subject, grade, level, type, newFileName, materialId], (err) => {
                res.redirect('/portal');
            });
        });
    } else {
        // Update database WITHOUT changing the file
        const sql = 'UPDATE materials SET subject_name = ?, grade = ?, level = ?, material_type = ? WHERE id = ?';
        db.query(sql, [subject, grade, level, type, materialId], (err) => {
            res.redirect('/portal');
        });
    }
});

app.get('/portal', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    
    // Fetch materials only for the logged-in teacher
    db.query('SELECT * FROM materials WHERE teacher_id = ?', [req.session.user.id], (err, results) => {
        res.render('portal', { user: req.session.user, msg: null, teacherMaterials: results });
    });
});


app.post('/contact-submit', (req, res) => {
    const { name, email, phone, role, subjects, message } = req.body;
    
    // In a real app, you would save this to a 'collaborators' table or send an email
    console.log("New Collaboration Request Received:");
    console.log(`From: ${name} (${role}) | Email: ${email} | Phone: ${phone}`);
    console.log(`Interest: ${subjects} | Message: ${message}`);

    // Redirect back with a success message (you can update index.ejs to show this)
    res.send('<script>alert("Thank you for your interest! Our team will contact you shortly."); window.location.href="/";</script>');
});
// --- LOGIN SYSTEM ---
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/auth', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.query(sql, [email, password], (err, results) => {
        if (results.length > 0) {
            req.session.user = results[0]; // Store user data in session
            res.redirect('/portal');
        } else {
            res.render('login', { error: 'Invalid email or password!' });
        }
    });
});

// --- PORTAL DASHBOARD (Admin & Teacher) ---
app.get('/portal', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.render('portal', { user: req.session.user, msg: null });
});

// --- ADMIN ACTION: Register New Teacher ---
app.post('/register-teacher', (req, res) => {
    if (req.session.user.role !== 'admin') return res.status(403).send('Unauthorized');
    
    const { fullname, email, password } = req.body;
    const sql = 'INSERT INTO users (fullname, email, password, role) VALUES (?, ?, ?, "teacher")';
    
    db.query(sql, [fullname, email, password], (err) => {
        if (err) throw err;
        res.render('portal', { user: req.session.user, msg: 'Teacher Registered Successfully!' });
    });
});

// --- TEACHER ACTION: Submit Material with File Upload ---
app.post('/submit-material', upload.single('materialFile'), (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const { subject, grade, type } = req.body;
    const teacher_id = req.session.user.id;
    const fileName = req.file ? req.file.filename : null;
    
    let level = grade <= 3 ? "Lower Primary" : (grade <= 6 ? "Upper Primary" : "Junior School");

    const sql = 'INSERT INTO materials (subject_name, grade, level, material_type, teacher_id, file_path) VALUES (?, ?, ?, ?, ?, ?)';
    
    db.query(sql, [subject, grade, level, type, teacher_id, fileName], (err) => {
        if (err) throw err;

        // --- THE FIX IS HERE ---
        // After inserting, we MUST fetch the materials again to show them in the table
        db.query('SELECT * FROM materials WHERE teacher_id = ?', [teacher_id], (err, results) => {
            res.render('portal', { 
                user: req.session.user, 
                msg: 'Success: Material Uploaded!', 
                teacherMaterials: results // Passing the variable to the view
            });
        });
    });
});
// --- LOGOUT ---
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// 6. START SERVER
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Elimu-Connect Server running at http://localhost:${PORT}`);
    console.log(`Login here: http://localhost:${PORT}/login`);
});