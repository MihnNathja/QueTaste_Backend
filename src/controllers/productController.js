const sendResponse = require("../utils/response");
const ProductService = require("../services/productService");

// GET /product
exports.getAllProducts = async (req, res) => {
    try {
        const products = await ProductService.getAllProducts(req.query);
        return sendResponse(res, 200, true, "All products fetched", products);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

// GET /product/:id
exports.getProductById = async (req, res) => {
    try {
        const product = await ProductService.getProductById(req.params.id);
        if (!product){
            return sendResponse(res, 404, false, "Product not found");
        }
        return sendResponse(res, 200, true, "Product fetched", product);
    } catch(err){
        return sendResponse(res, 500, false, err.message);
    }
}

// GET /product/newest
exports.getNewestProducts = async (req, res) => {
    try {
        const products = await ProductService.getNewestProducts();
        return sendResponse(res, 200, true, "Newest products fetched", products);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

// GET /product/bestselling
exports.getBestSellingProducts = async (req, res) => {
    try {
        const products = await ProductService.getBestSellingProducts();
        return sendResponse(res, 200, true, "Best selling products fetched", products);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

// GET /product/mostviewed
exports.getMostViewedProducts = async (req, res) => {
    try {
        const products = await ProductService.getMostViewedProducts();
        return sendResponse(res, 200, true, "Most viewed products fetched", products);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

// GET /product/topdiscounted
exports.getTopDiscountedProducts = async (req, res) => {
    try {
        const products = await ProductService.getTopDiscountedProducts();
        return sendResponse(res, 200, true, "Top discounted products fetched", products);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};
