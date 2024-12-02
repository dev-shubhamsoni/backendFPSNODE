const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadImage = (imagePath) => {
  return multer({
    storage: storages(imagePath),
    
    fileFilter: (req, file, cb) => {
      const allowedFileTypes = /jpeg|jpg|png/;
      const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedFileTypes.test(file.mimetype);
      if (mimetype && extname) {
        cb(null, true);
      } else {
        cb(new Error("Only .jpeg, .jpg, and .png formats are allowed!"), false);
      }
    }
  });
}

const storages = (destination) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      const now = new Date();
      const uniqueSuffix = `${file.originalname}`;
      const filePath = path.join(destination, `${file.fieldname}-${uniqueSuffix}`);
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
          cb(null, `${file.fieldname}_${uniqueSuffix}`);
        } else {
          const newUniqueSuffix = `${file.originalname}`;
          cb(null, `${file.fieldname}_${newUniqueSuffix}`);
        }
      });
    }
  });
}

const uploadDocument = (filePath) => {
  return multer({
    storage: storages(filePath),
    
    fileFilter: (req, file, cb) => {
      const allowedFileTypes = /jpeg|jpg|png|pdf|doc|docx/;
      const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedFileTypes.test(file.mimetype);
      if (mimetype && extname) {
        cb(null, true);
      } else {
        cb(new Error("Only images (JPEG, JPG, PNG), PDF, or DOC/DOCX files are allowed!"), false);
      }
    }
  });
}

module.exports = { uploadImage, uploadDocument }