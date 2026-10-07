const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');
const { BadRequestError } = require('../utils/apiError');

// Ensure uploads folder exists
const uploadDirectory = path.resolve(__dirname, '../../', env.UPLOAD.DIR);
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `file-${uniqueSuffix}${ext}`);
  }
});

// Allowed file types: Images and PDFs/Word documents for HR
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|gif|pdf|doc|docx/;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedExtensions.test(file.mimetype) || file.mimetype.includes('document') || file.mimetype.includes('pdf');

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new BadRequestError('Only image files (jpeg, jpg, png, webp) and documents (pdf, doc, docx) are allowed!'));
};

const upload = multer({
  storage,
  limits: {
    fileSize: env.UPLOAD.MAX_FILE_SIZE_MB * 1024 * 1024 // e.g. 10MB
  },
  fileFilter
});

module.exports = upload;
