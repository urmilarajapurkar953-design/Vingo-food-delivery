import multer from 'multer';
import os from 'os';
import path from 'path';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 🌐 FIX: Uses the OS temp directory ('/tmp' on Render), which has write permissions
        cb(null, os.tmpdir());
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

export default upload;
