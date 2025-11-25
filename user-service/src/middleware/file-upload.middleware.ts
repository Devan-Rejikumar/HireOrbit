import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { HttpStatusCode } from '../enums/StatusCodes';
import { AppConfig } from '../config/app.config';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: AppConfig.MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') ||
        file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

/**
 * Middleware to handle profile picture upload
 * Converts uploaded file to base64 data URI and attaches to req.body
 */
export const handleProfilePictureUpload = (req: Request, res: Response, next: NextFunction): void => {
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    upload.single('profilePicture')(req, res, (err) => {
      if (err) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: err.message });
        return;
      }
      
      if (req.file) {
        const base64 = req.file.buffer.toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${base64}`;
        req.body.profilePicture = dataURI;
      }
      
      next();
    });
  } else {
    next();
  }
};

