const express = require('express');
const router = express.Router();
const controller = require('../controllers/brew_and_leaf.controller');
const multer = require('multer');
const path = require('path');

// Multer storage for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Categories
router.get('/categories', controller.getCategories);
router.post('/categories', controller.addCategory);
router.put('/categories/:id', controller.updateCategory);
router.delete('/categories/:id', controller.deleteCategory);

// Sub-Categories
router.get('/sub-categories', controller.getSubCategories);
router.post('/sub-categories', controller.addSubCategory);
router.put('/sub-categories/:id', controller.updateSubCategory);
router.delete('/sub-categories/:id', controller.deleteSubCategory);

// Products
router.get('/products', controller.getProducts);
router.get('/products/:id', controller.getProductById);
router.post('/products', upload.single('image'), controller.addProduct);
router.put('/products/:id', upload.single('image'), controller.updateProduct);
router.delete('/products/:id', controller.deleteProduct);

// Product Sizes
router.post('/products/:id/sizes', controller.addProductSize);
router.put('/products/:id/sizes/:sizeId', controller.updateProductSize);
router.delete('/products/:id/sizes/:sizeId', controller.deleteProductSize);

// Upload multiple images for a product (gallery)
router.post('/products/:id/images', upload.array('images', 8), controller.uploadProductImages);

// Orders & Billing
router.post('/orders', controller.createOrder);
router.post('/upload-invoice', upload.single('file'), controller.uploadInvoice);
router.get('/orders', controller.getOrders);
router.get('/orders/:id', controller.getOrderById);

// Dashboard & Stats
router.get('/stats/daily', controller.getDailyStats);
router.get('/stats/summary', controller.getSummaryStats);

// Auth (Admin Login)
router.post('/login', controller.login);

module.exports = router;
