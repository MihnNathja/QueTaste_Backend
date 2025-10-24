const OrderService = require("../services/orderService");
const sendResponse = require("../utils/response");
const { notifyUser, notifyAdmins } = require("../services/notificationService");
const Order = require("../models/Order");

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
    //console.log(orders);
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

exports.confirmOrders = async (req, res) => {
  try {
    const { listOrderId } = req.body;
    console.log(listOrderId);

    if (!Array.isArray(listOrderId) || listOrderId.length === 0) {
      return sendResponse(
        res,
        400,
        false,
        "listOrderIds must be a non-empty array"
      );
    }

    const orders = await OrderService.confirmOrders(listOrderId);
    return sendResponse(
      res,
      200,
      true,
      "Orders confirmed successfully",
      orders
    );
  } catch (err) {
    console.error("Confirm orders error:", err);
    return sendResponse(
      res,
      500,
      false,
      err.message || "Internal server error"
    );
  }
};

exports.cancelOrders = async (req, res) => {
  try {
    const { listOrderId } = req.body;
    console.log(listOrderId);

    if (!Array.isArray(listOrderId) || listOrderId.length === 0) {
      return sendResponse(
        res,
        400,
        false,
        "listOrderIds must be a non-empty array"
      );
    }

    const orders = await OrderService.cancelOrders(listOrderId);
    return sendResponse(
      res,
      200,
      true,
      "Orders cancelled successfully",
      orders
    );
  } catch (err) {
    console.error("Cancel orders error:", err);
    return sendResponse(
      res,
      500,
      false,
      err.message || "Internal server error"
    );
  }
};

// Controller: quyết định message, code, status
exports.reOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id || req.user?._id;

    const {
      cart,
      added = [],
      skipped = [],
    } = await OrderService.reOrder({ userId, orderId });

    // Phân loại kết quả
    const addedCnt = added.length;
    const skippedCnt = skipped.length;

    // 1) Không thêm được gì → 409 (Conflict)
    if (addedCnt === 0) {
      return sendResponse(
        res,
        409,
        false,
        "Không thể mua lại: tất cả sản phẩm đều đã hết hàng.",
        { cart: null, added, skipped, code: "REORDER_NO_ITEMS" }
      );
    }

    // 2) Thành công một phần → 200
    if (skippedCnt > 0) {
      return sendResponse(
        res,
        200,
        true,
        "Mua lại một phần: một số sản phẩm đã được thêm vào giỏ.",
        { cart, added, skipped, code: "REORDER_OK_PARTIAL" }
      );
    }

    // 3) Thành công toàn bộ → 200
    return sendResponse(
      res,
      200,
      true,
      "Mua lại thành công: tất cả sản phẩm đã được thêm vào giỏ.",
      { cart, added, skipped, code: "REORDER_OK_ALL" }
    );
  } catch (err) {
    const status =
      err.httpCode ||
      (/không tìm thấy|không thuộc/.test(err.message)
        ? 404
        : /không có sản phẩm/.test(err.message)
        ? 422
        : 400);

    const code =
      status === 404
        ? "REORDER_NOT_FOUND"
        : status === 422
        ? "REORDER_EMPTY_ORDER"
        : "REORDER_BAD_REQUEST";

    return sendResponse(res, status, false, err.message, {
      cart: null,
      added: [],
      skipped: err.details?.skipped || [],
      code,
    });
  }
};

// Lấy danh sách đơn hàng cho shipper
exports.getOrdersForShipper = async (req, res) => {
  try {
    const orders = await Order.find({ status: "shipping" }).populate(
      "customer"
    );
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Cập nhật sang done_shipping
exports.markAsDoneShipping = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng" });
    if (order.status !== "shipping")
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể chuyển từ shipping sang done_shipping",
      });

    order.status = "done_shipping";
    await order.save();
    res.json({ success: true, message: "Cập nhật đơn hàng thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Shipper báo không giao được
exports.requestCancel = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng" });

    if (order.status !== "shipping")
      return res
        .status(400)
        .json({ success: false, message: "Chỉ hủy đơn đang giao" });

    order.status = "shipper_cancel_requested";
    await order.save();
    res.json({ success: true, message: "Đã gửi yêu cầu hủy đơn" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// order.controller.js
exports.confirmReceived = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng" });

    if (order.status !== "done_shipping")
      return res
        .status(400)
        .json({ success: false, message: "Đơn chưa được giao xong" });

    order.status = "completed";
    await order.save();
    res.json({ success: true, message: "Cảm ơn bạn đã xác nhận nhận hàng!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
