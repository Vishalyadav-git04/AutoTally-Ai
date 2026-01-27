const express = require('express');
const cors = require('cors');
const multer = require('multer');
const invoiceController = require('./src/controllers/invoice.controller');
const { PORT } = require('./src/config/env');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Routes
app.post('/api/process', upload.single('invoice'), invoiceController.processInvoice);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));