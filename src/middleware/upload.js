const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { errorResponse } = require('../utils/response');

// 确保上传目录存在
const ensureUploadDir = (dir) => {
  const uploadPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  return uploadPath;
};

/**
 * 文件存储配置
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = req.uploadDir || config.UPLOAD_PATH;
    const fullPath = ensureUploadDir(uploadDir);
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

/**
 * 文件过滤器
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = config.ALLOWED_FILE_TYPES.split(',');
  const ext = path.extname(file.originalname).toLowerCase().substring(1);

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${ext}`), false);
  }
};

/**
 * Multer配置
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE,
    files: 10 // 最多10个文件
  }
});

/**
 * 单文件上传中间件
 * @param {string} fieldName - 文件字段名
 */
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const uploader = upload.single(fieldName);
    uploader(req, res, (err) => {
      if (err) {
        return errorResponse(res, err.message, 400);
      }
      next();
    });
  };
};

/**
 * 多文件上传中间件
 * @param {string} fieldName - 文件字段名
 * @param {number} maxCount - 最大文件数量
 */
const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const uploader = upload.array(fieldName, maxCount);
    uploader(req, res, (err) => {
      if (err) {
        return errorResponse(res, err.message, 400);
      }
      next();
    });
  };
};

/**
 * 多字段文件上传中间件
 * @param {Array} fields - 字段配置数组
 */
const uploadFields = (fields) => {
  return (req, res, next) => {
    const uploader = upload.fields(fields);
    uploader(req, res, (err) => {
      if (err) {
        return errorResponse(res, err.message, 400);
      }
      next();
    });
  };
};

/**
 * 文件类型验证中间件
 * @param {Array} allowedTypes - 允许的文件类型
 */
const validateFileType = (allowedTypes) => {
  return (req, res, next) => {
    if (!req.file) {
      return next();
    }

    const ext = path.extname(req.file.originalname).toLowerCase().substring(1);
    if (!allowedTypes.includes(ext)) {
      return errorResponse(res, `不支持的文件类型: ${ext}`, 400);
    }

    next();
  };
};

/**
 * 文件大小验证中间件
 * @param {number} maxSize - 最大文件大小（字节）
 */
const validateFileSize = (maxSize) => {
  return (req, res, next) => {
    if (!req.file) {
      return next();
    }

    if (req.file.size > maxSize) {
      return errorResponse(res, `文件大小超出限制: ${maxSize} bytes`, 400);
    }

    next();
  };
};

/**
 * 图片文件处理中间件
 */
const imageOnly = validateFileType(['jpg', 'jpeg', 'png', 'gif', 'webp']);

/**
 * 文档文件处理中间件
 */
const documentOnly = validateFileType(['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx']);

/**
 * 视频文件处理中间件
 */
const videoOnly = validateFileType(['mp4', 'avi', 'mov', 'wmv', 'flv']);

/**
 * 音频文件处理中间件
 */
const audioOnly = validateFileType(['mp3', 'wav', 'ogg', 'flac']);

/**
 * 设置上传目录中间件
 * @param {string} dir - 上传目录
 */
const setUploadDir = (dir) => {
  return (req, res, next) => {
    req.uploadDir = dir;
    next();
  };
};

/**
 * 清理上传文件中间件
 * 用于在请求处理完成后清理临时文件
 */
const cleanupUpload = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);

  res.on('finish', () => {
    files.forEach(file => {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Error cleaning up uploaded file:', err);
      }
    });
  });

  next();
};

module.exports = {
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