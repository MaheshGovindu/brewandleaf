const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const db = require('./config/db');

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const brewAndLeafRoutes = require('./routes/brew_and_leaf.routes');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

app.use('/api/brewandleaf', brewAndLeafRoutes);
app.use('/uploads', express.static(uploadDir));

const PORT = process.env.PORT || 5000;
db.ready
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error('Unable to start server:', error.message);
    process.exit(1);
  });
