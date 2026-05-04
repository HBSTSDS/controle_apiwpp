import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middlewares/authMiddleware';

const uploadRoutes = Router();

// Certifique-se de que a pasta existe
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do Multer para salvar no disco local
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

uploadRoutes.use(authMiddleware);

uploadRoutes.post('/', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  // A URL que o frontend vai usar para acessar a foto
  const fileUrl = `http://localhost:3001/uploads/${req.file.filename}`;
  
  return res.status(200).json({ url: fileUrl });
});

export { uploadRoutes };
