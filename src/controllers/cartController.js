const CartService = require("../services/CartService");
const sendResponse = require("../utils/response");

// GET /cart
exports.getCart = async (req, res) => {
    try {
        const cart = await CartService.getCart(req.user.id);
        if(!cart) {
            return sendResponse(res, 200, true, "Cart is empty", {items: []});
        }
        return sendResponse(res, 200, true, "Cart fetched", cart);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

// POST /cart/add
exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity} = req.body;
        const cart = await CartService.addToCart(
            req.user.id,
            productId,
            quantity || 1
        );
        //console.log(cart);
        return sendResponse(res, 200, true, "Product added to cart", cart);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

// PUT /cart/update
exports.updateQuantity = async (req, res) => {
    try {
        const { productId, quantity} = req.body;
        const cart = await CartService.updateQuantity(
            req.user.id,
            productId,
            quantity
        );
        if(!cart) {
            return sendResponse(res, 404, true, "Cart not found");
        }
        return sendResponse(res, 200, true, "Product updated", cart);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

// DELETE /cart/remove
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const cart = await CartService.removeFromCart(req.user.id, productId);
    if (!cart) {
      return sendResponse(res, 404, false, "Cart not found");
    }
    return sendResponse(res, 200, true, "Product removed from cart", cart);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};