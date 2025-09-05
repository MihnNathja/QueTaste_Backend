const sendResponse = require("../utils/response");
const ProductService = require("../services/productService");

// GET /products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await ProductService.getAllProducts(req.query);
    return sendResponse(res, 200, true, "Products fetched", products);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

// GET /products/:id
exports.getProductById = async (req, res) => {
  try {
    const product = await ProductService.getProductById(req.params.id);
    if (!product) {
      return sendResponse(res, 404, false, "Product not found");
    }
    return sendResponse(res, 200, true, "Product fetched", product);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};
