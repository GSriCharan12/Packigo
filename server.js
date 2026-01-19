const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const http = require('http');
const { Server } = require('socket.io');
const admin = require('firebase-admin');

// Service account key (Users should place their serviceAccountKey.json in the root)
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log('Loaded Firebase credentials from environment variable');
    } catch (e) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env var', e);
    }
} else if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = require(serviceAccountPath);
    console.log('Loaded Firebase credentials from file');
}

if (serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://packigo-app-default-rtdb.firebaseio.com"
    });
    console.log('Firebase initialized with Realtime Database');
} else {
    console.warn('No valid credentials found. Realtime Database will not work.');
}

const db = serviceAccount ? admin.database() : null;

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'public/uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Simple JSON file based database mock
const DATA_FILE = path.join(__dirname, 'bookings.json');

// Initialize data file if not exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Helpers
const getBookings = () => {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE));
    } catch (e) {
        return [];
    }
};

const saveBookings = (bookings) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(bookings, null, 2));
};

// API: Get all bookings
app.get('/api/bookings', async (req, res) => {
    if (db) {
        try {
            const snapshot = await db.ref('bookings').once('value');
            const data = snapshot.val();
            const bookings = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            return res.json(bookings);
        } catch (e) {
            console.error('Realtime DB Error:', e);
        }
    }
    const bookings = getBookings();
    res.json(bookings);
});

// API: Create a booking with file upload support
app.post('/api/bookings', upload.array('photos', 5), async (req, res) => {
    const photos = req.files ? req.files.map(f => f.filename) : [];

    const newBooking = {
        ...req.body,
        photos: photos,
        status: 'Pending Confirmation',
        createdAt: new Date().toISOString()
    };

    if (db) {
        try {
            const newRef = db.ref('bookings').push();
            await newRef.set(newBooking);
            const savedBooking = { id: newRef.key, ...newBooking };
            io.emit('booking_update', { type: 'new', data: savedBooking });
            return res.status(201).json(savedBooking);
        } catch (e) {
            console.error('Realtime DB Error:', e);
        }
    }

    const bookings = getBookings();
    const localBooking = { id: Date.now().toString(), ...newBooking };
    bookings.push(localBooking);
    saveBookings(bookings);

    // Real-time update
    io.emit('booking_update', { type: 'new', data: localBooking });

    res.status(201).json(localBooking);
});

// API: Get all users
app.get('/api/users', async (req, res) => {
    if (db) {
        try {
            const snapshot = await db.ref('users').once('value');
            const data = snapshot.val();
            const users = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            return res.json(users);
        } catch (e) {
            console.error('Realtime DB Error:', e);
        }
    }
    res.json([]);
});

// API: Update booking status
app.patch('/api/bookings/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (db) {
        try {
            await db.ref(`bookings/${id}`).update({ status });
            const snapshot = await db.ref(`bookings/${id}`).once('value');
            const updatedBooking = { id, ...snapshot.val() };
            io.emit('booking_update', { type: 'update', data: updatedBooking });
            return res.json(updatedBooking);
        } catch (e) {
            console.error('Realtime DB Error:', e);
        }
    }

    let bookings = getBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
        bookings[index].status = status;
        saveBookings(bookings);

        // Real-time update
        io.emit('booking_update', { type: 'update', data: bookings[index] });

        res.json(bookings[index]);
    } else {
        res.status(404).json({ error: 'Booking not found' });
    }
});

// API: Fleet Management
app.get('/api/fleet', async (req, res) => {
    if (db) {
        try {
            const snapshot = await db.ref('fleet').once('value');
            const data = snapshot.val();
            const fleet = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            return res.json(fleet);
        } catch (e) {
            console.error('Realtime DB Error:', e);
            res.status(500).json({ error: 'Failed to fetch fleet' });
        }
    } else {
        console.warn('DB not initialized, returning empty fleet list');
        res.json([]);
    }
});

app.post('/api/fleet', async (req, res) => {
    const vehicle = {
        ...req.body,
        createdAt: new Date().toISOString()
    };
    if (db) {
        try {
            const newRef = db.ref('fleet').push();
            await newRef.set(vehicle);
            const saved = { id: newRef.key, ...vehicle };
            io.emit('fleet_update', saved);
            return res.status(201).json(saved);
        } catch (e) {
            res.status(500).json({ error: 'Failed' });
        }
    } else {
        res.status(503).json({ error: 'Database not initialized' });
    }
});

app.patch('/api/fleet/:id', async (req, res) => {
    const { id } = req.params;
    if (db) {
        try {
            await db.ref(`fleet/${id}`).update(req.body);
            const snapshot = await db.ref(`fleet/${id}`).once('value');
            const updated = { id, ...snapshot.val() };
            io.emit('fleet_update', updated);
            return res.json(updated);
        } catch (e) {
            res.status(500).json({ error: 'Failed' });
        }
    } else {
        res.status(503).json({ error: 'Database not initialized' });
    }
});

app.delete('/api/fleet/:id', async (req, res) => {
    const { id } = req.params;
    if (db) {
        try {
            await db.ref(`fleet/${id}`).remove();
            io.emit('fleet_update', { id, deleted: true });
            return res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: 'Failed' });
        }
    }
});

// API: System Settings
app.get('/api/settings', async (req, res) => {
    if (db) {
        try {
            const snapshot = await db.ref('settings').once('value');
            const settings = snapshot.val() || {
                registration: true,
                maintenance: false,
                invoicing: true
            };
            return res.json(settings);
        } catch (e) {
            res.status(500).json({ error: 'Failed to fetch settings' });
        }
    } else {
        res.json({ registration: true, maintenance: false, invoicing: true });
    }
});

app.patch('/api/settings', async (req, res) => {
    if (db) {
        try {
            await db.ref('settings').update(req.body);
            const snapshot = await db.ref('settings').once('value');
            io.emit('settings_update', snapshot.val());
            return res.json(snapshot.val());
        } catch (e) {
            res.status(500).json({ error: 'Failed to update settings' });
        }
    } else {
        res.status(503).json({ error: 'Database not initialized' });
    }
});

server.listen(PORT, () => {
    console.log(`
    🚀 PACKIGO SERVER STARTED 🚀
    ==================================================
    Running on: http://localhost:${PORT}
    Environment: ${process.env.FIREBASE_SERVICE_ACCOUNT ? 'Cloud/Production' : 'Local Development'}
    
      ____  _    ___ _  __  _____ _____ 
     |  _ \\| |  | | | |/ / |_   _|_   _|
     | |_) | |  | | | ' /    | |   | |  
     |  __/| |__| | | . \\   _| |_  | |  
     |_|   |____|_|_|_|\\_\\ |_____| |_|  
     
    (c) 2026 Sri Charan | Logic Loaded & Ready
    ==================================================
    `);
});
