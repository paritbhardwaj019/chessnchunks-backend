const multer = require('multer');
const path = require('path');

const multerStorage = multer.diskStorage({
  destination: function (_, _, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (_, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  },
});

const uploadFile = multer({
  storage: multerStorage,
});

module.exports = uploadFile;
