import multer, { Multer } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import config from '../config';

// 确保上传目录存在
const ensureUploadDir = (dir: string): string => {
  const uploadPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  return uploadPath;
};

// 扩展Request接口以包含文件信息
declare global {
  namespace Express {
    interface Request {
      uploadDir?: string;
    }
  }
}

/**
 * 文件存储配置
 */
const storage: multer.StorageEngine = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = req.uploadDir || config.uploadPath;
    const fullPath = ensureUploadDir(uploadDir);
    cb(null, fullPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

/**
 * 文件过滤器
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void => {
  const allowedTypes = config.allowedFileTypes.split(',');
  const ext = path.extname(file.originalname).toLowerCase().substring(1);

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${ext}`));
  }
};

/**
 * Multer配置
 */
const upload: multer.Multer = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.maxFileSize,
    files: 10 // 最多10个文件
  }
});

/**
 * 单文件上传中间件
 * @param fieldName - 文件字段名
 */
const uploadSingle = (fieldName: string) => {
  return (req: Request, res: Response, next: (err?: any) => void): void => {
    const uploader = upload.single(fieldName);
    uploader(req, res, (err: any) => {
      if (err) {
        const response: ApiResponse = {
          status: 'error',
          message: err.message,
          code: 'UPLOAD_ERROR',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      next();
    });
  };
};

/**
 * 多文件上传中间件
 * @param fieldName - 文件字段名
 * @param maxCount - 最大文件数量
 */
const uploadMultiple = (fieldName: string, maxCount: number = 5) => {
  return (req: Request, res: Response, next: (err?: any) => void): void => {
    const uploader = upload.array(fieldName, maxCount);
    uploader(req, res, (err: any) => {
      if (err) {
        const response: ApiResponse = {
          status: 'error',
          message: err.message,
          code: 'UPLOAD_ERROR',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      next();
    });
  };
};

/**
 * 多字段文件上传中间件
 * @param fields - 字段配置数组
 */
const uploadFields = (fields: multer.Field[]) => {
  return (req: Request, res: Response, next: (err?: any) => void): void => {
    const uploader = upload.fields(fields);
    uploader(req, res, (err: any) => {
      if (err) {
        const response: ApiResponse = {
          status: 'error',
          message: err.message,
          code: 'UPLOAD_ERROR',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      next();
    });
  };
};

/**
 * 文件类型验证中间件
 * @param allowedTypes - 允许的文件类型
 */
const validateFileType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: (err?: any) => void): void => {
    if (!req.file) {
      next();
      return;
    }

    const ext = path.extname(req.file.originalname).toLowerCase().substring(1);
    if (!allowedTypes.includes(ext)) {
      const response: ApiResponse = {
        status: 'error',
        message: `不支持的文件类型: ${ext}`,
        code: 'INVALID_FILE_TYPE',
        timestamp: new Date().toISOString()
      };
      res.status(400).json(response);
      return;
    }

    next();
  };
};

/**
 * 文件大小验证中间件
 * @param maxSize - 最大文件大小（字节）
 */
const validateFileSize = (maxSize: number) => {
  return (req: Request, res: Response, next: (err?: any) => void): void => {
    if (!req.file) {
      next();
      return;
    }

    if (req.file.size > maxSize) {
      const response: ApiResponse = {
        status: 'error',
        message: `文件大小超出限制: ${maxSize} bytes`,
        code: 'FILE_TOO_LARGE',
        timestamp: new Date().toISOString()
      };
      res.status(400).json(response);
      return;
    }

    next();
  };
};

// 预定义的文件类型验证器
const imageOnly = validateFileType(['jpg', 'jpeg', 'png', 'gif', 'webp']);
const documentOnly = validateFileType(['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx']);
const videoOnly = validateFileType(['mp4', 'avi', 'mov', 'wmv', 'flv']);
const audioOnly = validateFileType(['mp3', 'wav', 'ogg', 'flac']);

/**
 * 设置上传目录中间件
 * @param dir - 上传目录
 */
const setUploadDir = (dir: string) => {
  return (req: Request, res: Response, next: (err?: any) => void): void => {
    req.uploadDir = dir;
    next();
  };
};

/**
 * 清理上传文件中间件
 * 用于在请求处理完成后清理临时文件
 */
const cleanupUpload = (req: Request, res: Response, next: (err?: any) => void): void => {
  // 安全地获取文件列表
  let files: Express.Multer.File[] = [];

  if (req.files) {
    if (Array.isArray(req.files)) {
      files = req.files;
    } else if (typeof req.files === 'object') {
      // 如果是对象格式（如多字段上传），提取所有文件
      files = Object.values(req.files).flat();
    }
  } else if (req.file) {
    files = [req.file];
  }

  res.on('finish', () => {
    files.forEach((file: Express.Multer.File) => {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Error cleaning up uploaded file:', err);
      }
    });
  });

  next();
};

export {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  validateFileType,
  validateFileSize,
  imageOnly,
  documentOnly,
  videoOnly,
  audioOnly,
  setUploadDir,
  cleanupUpload
};