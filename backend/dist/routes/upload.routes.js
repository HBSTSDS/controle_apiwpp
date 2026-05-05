"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRoutes = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploadRoutes = (0, express_1.Router)();
exports.uploadRoutes = uploadRoutes;
// Certifique-se de que a pasta existe
const uploadDir = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Configuração do Multer para salvar no disco local
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage: storage });
uploadRoutes.use(authMiddleware_1.authMiddleware);
uploadRoutes.post('/', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    // A URL que o frontend vai usar para acessar a foto
    const fileUrl = `http://localhost:3001/uploads/${req.file.filename}`;
    return res.status(200).json({ url: fileUrl });
});
