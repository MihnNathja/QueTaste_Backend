const sendResponse = require("../utils/response");
const ProductService = require("../services/productService");

exports.getAllProducts = async (req, res) => {
    try {
        const products = await ProductService.getAllProducts(req.query);
        return sendResponse(res, 200, true, "All products fetched", products);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

exports.getNewestProducts = async (req, res) => {
    try {
        const products = await ProductService.getNewestProducts();
        return sendResponse(res, 200, true, "Newest products fetched", products);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

exports.getBestSellingProducts = async (req, res) => {
    try {
        const products = await ProductService.getBestSellingProducts();
        return sendResponse(res, 200, true, "Best selling products fetched", products);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

exports.getMostViewedProducts = async (req, res) => {
    try {
        const products = await ProductService.getMostViewedProducts();
        return sendResponse(res, 200, true, "Most viewed products fetched", products);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

exports.getTopDiscountedProducts = async (req, res) => {
    try {
        const products = await ProductService.getTopDiscountedProducts();
        return sendResponse(res, 200, true, "Top discounted products fetched", products);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};
