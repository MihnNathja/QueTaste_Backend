const OrderService = require("../services/orderService");
const sendResponse = require("../utils/response");
const { notifyUser, notifyAdmins } = require("../services/notificationService");

// POST /api/order/checkout
exports.checkout = async (req, res) => {
  try {
    const order = await OrderService.checkout(req.user.id, req.body);

    await notifyUser(req.user.id, {
      type: "order",
      message: `Đơn hàng #${order._id} của bạn đã được tạo thành công`,
      link: `/orders/${order._id}`,
      sendEmail: true, // gửi email
      priority: "high",
    });

    await notifyAdmins({
      type: "order",
      message: `Có đơn hàng mới #${order._id} từ ${req.user.id}`,
      link: `/admin/orders/${order._id}`,
      priority: "high",
    });

    return sendResponse(res, 201, true, "Order created successfully", order);
  } catch (err) {
    console.error("Error in checkout controller:", err.message);
    return sendResponse(res, 400, false, err.message);
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, search, page, limit } = req.query;
    const params = req.query;
    //console.log(params);

    const orders = await OrderService.getMyOrders(userId, {
      status: status || "all",
      search: search || "",
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });
    console.log(orders);
    return sendResponse(res, 201, true, "Get Order successfully", orders);
  } catch (err) {
    console.error("Error in getMyOrders controller:", err.message);
    return sendResponse(res, 400, false, err.message);
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const order = await OrderService.cancelOrder(userId, orderId);

    await notifyUser(req.user.id, {
      type: "order",
      message: `Đơn hàng #${order._id} đã được hủy`,
      link: `/orders/${order._id}`,
      priority: "high",
    });

    await notifyAdmins({
      type: "order",
      message: `Khách ${req.user.id} vừa hủy đơn hàng #${order._id}`,
      link: `/admin/orders/${order._id}`,
      priority: "high",
    });

    return sendResponse(res, 200, true, "Order cancelled successfully", order);
  } catch (err) {
    console.error("Error in cancelOrder controller:", err.message);
    return sendResponse(res, 400, false, err.message);
  }
};

exports.requestCancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { reason } = req.body;
    console.log(
      "Requesting cancellation for order:",
      orderId,
      "by user:",
      userId,
      "with reason:",
      reason
    );
    const order = await OrderService.requestCancelOrder(
      userId,
      orderId,
      reason
    );
    return sendResponse(
      res,
      200,
      true,
      "Order cancellation requested successfully",
      order
    );
  } catch (err) {
    console.error("Error in requestCancelOrder controller:", err.message);
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

exports.getAllOrders = async (req, res) => {
  try {
    const { status = "all", search = "", page = 1, limit = 10 } = req.query;

    const orders = await OrderService.getAllOrders({
      status,
      search,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
    //console.log(orders);

    return sendResponse(res, 200, true, "Get all orders successfully", orders);
  } catch (err) {
    console.error("Error in getAllOrders controller:", err.message);
    return sendResponse(res, 500, false, err.message);
  }
};

exports.confirmOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await OrderService.updateOrderStatus(orderId, "confirmed");
    return sendResponse(res, 200, true, "Order status updated", order);
  } catch (err) {
    return sendResponse(res, 400, false, err.message);
  }
};
