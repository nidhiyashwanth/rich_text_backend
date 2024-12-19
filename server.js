// server.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors({
    origin: 'http://localhost:3002', // Allow requests from your Next.js frontend
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }));

const storage = new Storage({
  projectId: process.env.STORAGE_PROJECT_ID,
  credentials: {
    client_email: process.env.STORAGE_CLIENT_MAIL,
    private_key: process.env.STORAGE_PRIVATE_KEY,
  },
});

const bucketName = process.env.STORAGE_MEDIA_BUCKET;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});


app.post('/api/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const blob = storage.bucket(bucketName).file(file.originalname);
  const blobStream = blob.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  });

  blobStream.on('error', (err) => {
    console.error('BlobStream Error:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  });

  blobStream.on('finish', () => {
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${file.originalname}`;
    res.status(200).json({ url: publicUrl });
  });

  blobStream.end(file.buffer);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
