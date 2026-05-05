"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running!' });
});
const auth_routes_1 = require("./routes/auth.routes");
const customer_routes_1 = require("./routes/customer.routes");
const product_routes_1 = require("./routes/product.routes");
const inventory_routes_1 = require("./routes/inventory.routes");
const sale_routes_1 = require("./routes/sale.routes");
const receivable_routes_1 = require("./routes/receivable.routes");
const dashboard_routes_1 = require("./routes/dashboard.routes");
const upload_routes_1 = require("./routes/upload.routes");
const path_1 = __importDefault(require("path"));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use('/api/auth', auth_routes_1.authRoutes);
app.use('/api/customers', customer_routes_1.customerRoutes);
app.use('/api/products', product_routes_1.productRoutes);
app.use('/api/inventory', inventory_routes_1.inventoryRoutes);
app.use('/api/sales', sale_routes_1.saleRoutes);
app.use('/api/receivables', receivable_routes_1.receivableRoutes);
app.use('/api/dashboard', dashboard_routes_1.dashboardRoutes);
app.use('/api/upload', upload_routes_1.uploadRoutes);
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
