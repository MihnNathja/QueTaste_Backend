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

// POST /api/order/momo/notify
exports.momoNotify = async (req, res) => {
    try {
        const { orderId, resultCode } = req.body;
        await OrderService.handleMomoNotify(orderId, resultCode);
        return sendResponse(res, 200, true, "MoMo notification processed");
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

// POST /api/order/update-status
exports.updateStatus = async (req, res) => {
    try {
        const { orderId, resultCode } = req.body;
        const order = await OrderService.updateStatus(orderId, resultCode);
        return sendResponse(res, 200, true, "Order status updated", order);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};