const multer = require('multer');
const path = require('path');
const logger = require('../utils/logger');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const filename = `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`;
    logger.debug('Generating filename for upload:', { originalName: file.originalname, generatedName: filename });
    cb(null, filename);
  },
});

// File filter to accept only CSV and Excel files
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    logger.debug('File type accepted:', { mimetype: file.mimetype });
    cb(null, true);
  } else {
    logger.warn('Invalid file type rejected:', { mimetype: file.mimetype });
    cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'), false);
  }
};

// Create multer instance with configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  }
});

// Export configured multer instance
module.exports = upload;
