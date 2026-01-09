import { Router, Request, Response, NextFunction } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { ATSController } from '../controllers/ATSController';
import { asyncHandler } from '../utils/asyncHandler';
import multer from 'multer';
import { ATS_ROUTES } from '../constants/routes';

const router = Router();
const atsController = container.get<ATSController>(TYPES.ATSController);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/x-pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (allowedMimes.includes(file.mimetype) || 
        file.originalname.endsWith('.pdf') || 
        file.originalname.endsWith('.docx') ||
        file.originalname.endsWith('.doc')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  },
});

const handleMulterError = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  console.error('[ATS Route] Multer error:', err.message);
  
  if (err.message === 'Only PDF and DOCX files are allowed') {
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }
  
  if (err.message.includes('File too large') || err.message.includes('LIMIT_FILE_SIZE')) {
    res.status(400).json({
      success: false,
      message: 'File size exceeds 10MB limit',
    });
    return;
  }
  
  res.status(400).json({
    success: false,
    message: `File upload error: ${err.message}`,
  });
};

router.post(
  ATS_ROUTES.ANALYZE_RESUME,
  (req: Request, res: Response, next: NextFunction) => {
    console.log('[ATS Route] Request received:', {
      method: req.method,
      url: req.url,
      contentType: req.headers['content-type'],
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
    });
    next();
  },
  upload.single('resume'),
  handleMulterError,
  (req: Request, res: Response, next: NextFunction) => {
    console.log('[ATS Route] After multer:', {
      hasFile: !!req.file,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      fileMimeType: req.file?.mimetype,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      jobDescription: req.body?.jobDescription ? 'present' : 'missing',
    });
    if (req.file) {
      console.log('[ATS Route] File details:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bufferLength: req.file.buffer?.length,
      });
    } else {
      console.error('[ATS Route] No file received! Request details:', {
        headers: req.headers,
        body: req.body,
        files: (req as Request & { files?: Express.Multer.File[] }).files,
      });
    }
    next();
  },
  asyncHandler((req: Request, res: Response) => atsController.analyzeResume(req, res)),
);

export default router;

