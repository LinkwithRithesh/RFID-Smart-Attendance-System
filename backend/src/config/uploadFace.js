const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const FACE_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'faces');
if (!fs.existsSync(FACE_UPLOAD_DIR)) {
  fs.mkdirSync(FACE_UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, FACE_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(8).toString('hex');
    cb(null, `face-${Date.now()}-${unique}${path.extname(file.originalname || '.jpg')}`);
  },
});

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp'
];

const uploadFace = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

module.exports = { uploadFace, FACE_UPLOAD_DIR };
