const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin matches allowed origin (ignoring trailing slash)
    if (allowedOrigin.replace(/\/$/, '') === origin.replace(/\/$/, '')) {
      return callback(null, true);
    } else {
      console.log('CORS Blocked:', origin); // Log blocked origins for debugging
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/calendars', require('./routes/calendarRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/shares', require('./routes/shareRoutes')); // New mount for general share/invite routes
app.use('/api/users', require('./routes/userRoutes')); // User preferences routes
app.use('/api/availability', require('./routes/availabilityRoutes')); // Availability checking for meetings

// Start jobs
require('./jobs/reminderJob')();

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { error: err.message, stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

