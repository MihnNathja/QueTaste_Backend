const sendResponse = require("../utils/response");
const ProductService = require("../services/productService");

// GET /products
exports.getAllProducts = async (req, res) => {
  try {
    const visibility = req.visibility === 'admin' ? 'admin' : 'public';
    const data = await ProductService.getAllProducts(req.query, { visibility });
    return sendResponse(res, 200, true, "Products fetched", data);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

// GET /product/suggest?q=Bánh&limit=8
exports.suggestProducts = async (req, res) => {
  try {
    const visibility = req.visibility === "admin" ? "admin" : "public";
    const q = (req.query.q || "").trim();
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 8;

    if (!q) return sendResponse(res, 200, true, "OK", []);

    const data = await ProductService.getSuggestions(q, { limit, visibility });
    return sendResponse(res, 200, true, "Suggestions fetched", data);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

// GET /products/:id
exports.getProductById = async (req, res) => {
  try {
    const product = await ProductService.getProductById(req.params.id, { visibility: 'admin' });
    if (!product) {
      return sendResponse(res, 404, false, "Product not found");
    }
    return sendResponse(res, 200, true, "Product fetched", product);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

// GET /products/:id/related
exports.getRelatedProducts = async (req, res) => {
  try {
    const related = await ProductService.getRelatedProducts(req.params.id);
    return sendResponse(res, 200, true, "Related products fetched", related);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

// GET /products/:id/stats
exports.getProductStats = async (req, res) => {
  try {
    const stats = await ProductService.getProductStats(req.params.id);
    return sendResponse(res, 200, true, "Product stats fetched", stats);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

// POST /admin/products
exports.createProduct = async (req, res) => {
  try {
    const product = await ProductService.createProduct(req.body, req.files);
    return sendResponse(res, 201, true, "Product created successfully", product);
  } catch (err) {
    console.error("❌ Error in createProduct:", err);
    return sendResponse(res, 500, false, err.message);
  }
};

// PUT /admin/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const product = await ProductService.updateProduct(req.params.id, req.body, req.files);
    console.log("🧠 req.body:", req.body);
console.log("📸 req.files:", req.files?.map(f => f.originalname));

    return sendResponse(res, 200, true, "Product updated successfully", product);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

// PATCH /admin/products/:id/toggle
exports.toggleActive = async (req, res) => {
  try {
    const product = await ProductService.toggleActive(req.params.id);
    return sendResponse(res, 200, true, "Product status toggled", product);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

// DELETE /admin/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    await ProductService.deleteProduct(req.params.id);
    return sendResponse(res, 200, true, "Product deleted successfully");
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};