const OrderService = require("../services/orderService");
const sendResponse = require("../utils/response");

// POST /api/order/checkout
exports.checkout = async (req, res) => {
    try {
        const order = await OrderService.checkout(req.user.id, req.body);
        return sendResponse(res, 201, true, "Order created successfully", order);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};
