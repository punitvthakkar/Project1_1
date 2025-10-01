const express = require('express');
const cors = require('cors');
const sessionsRoute = require('./routes/sessions');
const submissionsRoute = require('./routes/submissions');
const kausRoute = require('./routes/kaus');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/sessions', sessionsRoute);
app.use('/api/submissions', submissionsRoute);
app.use('/api/kaus', kausRoute);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CloseTheLoop API is running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// For local development
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

// For Vercel
module.exports = app;
