const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const UserCoupon = require("../models/UserCoupon");
const axios = require("axios");
const crypto = require("crypto");
const dayjs = require("dayjs");
const { default: mongoose } = require("mongoose");

const SHIPPING_FEE = 36000;

const THIRTY_MIN = 30 * 60 * 1000;

async function buildOrderItemsAndUpdateStock(cart) {
  let subtotal = 0;
  const orderItems = [];
  for (const { product, quantity } of cart.items) {
    if (!product.isActive)
      throw new Error(`Product ${product.name} not available`);
    if (product.stock < quantity)
      throw new Error(`Not enough stock for ${product.name}`);
    const price = product.salePrice > 0 ? product.salePrice : product.price;
    subtotal += price * quantity;
    orderItems.push({ product: product._id, quantity, price });
    product.stock -= quantity;
    product.totalSold += quantity;
    await product.save();
  }
  return { subtotal, orderItems };
}

async function markCouponUsed(userId, couponDoc) {
  if (!couponDoc) return;
  await Promise.all([
    UserCoupon.create({
      userId,
      couponId: couponDoc._id,
      status: "used",
      usedAt: new Date(),
      startDate: couponDoc.startDate || new Date(),
      endDate: couponDoc.endDate || null,
    }),
    Coupon.updateOne({ _id: couponDoc._id }, { $inc: { usedCount: 1 } }),
  ]);
}

async function createMomo(orderId, amount) {
  const partnerCode = "MOMO";
  const accessKey = "F8BBA842ECF85";
  const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
  const requestType = "captureWallet";
  const requestId = orderId;
  const orderInfo = `Thanh toan don hang ${orderId}`;
  const redirectUrl = "http://localhost:5173/checkout/result";
  const ipnUrl = "http://localhost:8088/api/order/momo/notify";
  const extraData = "";

  const rawSignature =
    `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}` +
    `&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}` +
    `&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const body = {
    partnerCode,
    partnerName: "Test",
    storeId: "MomoTestStore",
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    lang: "vi",
    requestType,
    autoCapture: true,
    extraData,
    signature,
  };

  const { data } = await axios.post(
    "https://test-payment.momo.vn/v2/gateway/api/create",
    body,
    { headers: { "Content-Type": "application/json" } }
  );
  return data.payUrl;
}

class OrderService {
  /* === checkout: dùng bản của bạn === */
  static async checkout(
    userId,
    { paymentMethod, shippingAddress, notes, coupon }
  ) {
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart?.items?.length) {
      throw new Error("Cart is empty");
    }

    const supported = new Set(["COD", "momo"]);
    if (!supported.has(paymentMethod)) {
      throw new Error("Unsupported payment method");
    }

    const { subtotal, orderItems } = await buildOrderItemsAndUpdateStock(cart);
    let discount = 0;
    let couponDoc = null;

    if (coupon) {
      couponDoc = await Coupon.findById(coupon);
      if (!couponDoc) {
        throw new Error("Coupon not found");
      }

      const hasMinOrder = Boolean(couponDoc.minOrderValue);
      if (hasMinOrder) {
        const belowMin = subtotal < couponDoc.minOrderValue;
        if (belowMin) {
          throw new Error("Đơn hàng chưa đạt giá trị tối thiểu");
        }
      }

      if (couponDoc.type === "percentage") {
        discount = Math.min(
          (subtotal * couponDoc.value) / 100,
          couponDoc.maxDiscount || Infinity
        );
      } else if (couponDoc.type === "fixed") {
        discount = Math.min(couponDoc.value, subtotal);
      } else if (couponDoc.type === "free_shipping") {
        discount = Math.min(
          SHIPPING_FEE,
          couponDoc.maxDiscount || SHIPPING_FEE
        );
      } else {
        throw new Error("Unsupported coupon type");
      }
    }

    const finalAmount = subtotal - discount + SHIPPING_FEE;
    let orderStatus = "pending";
    if (paymentMethod === "COD") {
      orderStatus = "new";
    }

    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount: subtotal,
      discount,
      shippingFee: SHIPPING_FEE,
      finalAmount,
      coupon: couponDoc?._id || null,
      paymentMethod,
      paymentStatus: "pending",
      shippingAddress,
      notes,
      status: orderStatus,
    });

    await markCouponUsed(userId, couponDoc);

    if (paymentMethod === "COD") {
      cart.items = [];
      await cart.save();
      return order;
    } else {
      const payUrl = await createMomo(order._id.toString(), finalAmount);
      return { order, payUrl };
    }
  }

  static async getMyOrders(
    userId,
    { status, search, page = 1, limit = 10 } = {}
  ) {
    try {
      const query = { user: userId };
      if (status && status !== "all") {
        if (status === "pending") {
          query.$or = [{ status: "new" }, { status: "confirmed" }];
        } else if (status === "shipping") {
          query.$or = [{ status: "shipping" }, { status: "delivering" }];
        } else if (status === "cancelled") {
          query.$or = [{ status: "cancel_requested" }, { status: "cancelled" }];
        } else {
          query.status = status;
        }
      }

      if (search) {
        const productIds = await Product.find(
          { name: { $regex: search, $options: "i" } },
          { _id: 1 }
        ).lean();
        const ids = productIds.map((p) => p._id);
        query.$or = [
          { "items.product": { $in: ids } },
          { "shippingAddress.fullName": { $regex: search, $options: "i" } },
        ];
      }

      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
          path: "items.product",
          model: "Product",
          select:
            "name price salePrice category images averageRating totalReviews",
        });
      return {
        data: orders,
        pagination: {
          page,
          limit,
          total: await Order.countDocuments(query),
        },
      };
    } catch (err) {
      console.error("Error in getMyOrders:", err.message);
      throw new Error("Không thể lấy danh sách đơn hàng");
    }
  }

  static async cancelOrder(userId, orderId) {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) throw new Error("Không tìm thấy đơn hàng");

    const diffMinutes = (Date.now() - order.createdAt.getTime()) / 1000 / 60;

    if (order.status === "processing") {
      throw new Error(
        "Đơn hàng đã sang giai đoạn xử lý, vui lòng gửi Yêu cầu hủy"
      );
    }

    if (["shipping", "delivering", "completed"].includes(order.status)) {
      throw new Error(
        "Đơn hàng đã qua giai đoạn xử lý, vui lòng gửi Yêu cầu hoàn/trả hàng"
      );
    }

    if (["new", "confirmed"].includes(order.status)) {
      if (diffMinutes > 30) {
        throw new Error("Chỉ có thể hủy trong vòng 30 phút sau khi đặt");
      }
      order.status = "cancelled";
      order.cancelledAt = new Date();
      await order.save();
      return order;
    }

    throw new Error("Không thể hủy đơn này");
  }

  static async requestCancelOrder(userId, orderId, reason) {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) throw new Error("Không tìm thấy đơn hàng");

    if (["processing"].includes(order.status)) {
      order.status = "cancel_requested";
      order.cancelRequest = {
        reason,
        requestedAt: new Date(),
      };
      await order.save();
      return order;
    }
    throw new Error(
      "Chỉ có thể gửi yêu cầu hủy cho đơn hàng đang vận chuyển hoặc đã giao"
    );
  }

  static async handleMomoNotify(orderId, resultCode) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error("Order not found");

    if (Number(resultCode) === 0) {
      order.paymentStatus = "paid";
      order.status = "new";

      const cart = await Cart.findOne({ user: order.user });
      if (cart) {
        cart.items = [];
        await cart.save();
      }
    } else {
      order.paymentStatus = "failed";
      order.status = "cancelled";
    }

    await order.save();
    return order;
  }

  static async updateStatus(orderId, resultCode) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (Number(resultCode) === 0) {
      order.paymentStatus = "paid";
      order.status = "new";

      const cart = await Cart.findOne({ user: order.user });
      if (cart) {
        cart.items = [];
        await cart.save();
      }
      await order.save();
      return order;
    } else {
      await Order.deleteOne({ _id: orderId });
      return null;
    }
  }

  static async getAllOrders({ status, search, page = 1, limit = 10 } = {}) {
    try {
      const query = {};

      if (status && status !== "all") {
        query.status = status;
      }

      if (search) {
        const productIds = await Product.find(
          { name: { $regex: search, $options: "i" } },
          { _id: 1 }
        ).lean();

        const ids = productIds.map((p) => p._id);

        query.$or = [
          { "items.product": { $in: ids } },
          { "shippingAddress.fullName": { $regex: search, $options: "i" } },
        ];
      }

      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
          path: "items.product",
          model: "Product",
          select:
            "name price salePrice category images averageRating totalReviews",
        })
        .populate({
          path: "user",
          model: "User",
          select:
            "email personalInfo.fullName personalInfo.phone personalInfo.address",
        });

      const formatted = orders.map((o) => ({
        id: o._id.toString(),
        code: `DH${o._id.toString().slice(-6)}`,
        user: o.user,
        shippingAddress: o.shippingAddress,
        createdAt: dayjs(o.createdAt).format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: dayjs(o.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        totalAmount: o.totalAmount,
        shippingFee: o.shippingFee,
        discount: o.discount,
        finalAmount: o.finalAmount,
        items: o.items,
      }));

      return {
        data: formatted,
        pagination: {
          page,
          limit,
          total: await Order.countDocuments(query),
        },
      };
    } catch (err) {
      console.error("Error in getMyOrders:", err.message);
      throw new Error("Không thể lấy danh sách đơn hàng");
    }
  }

  static async updateOrderStatus(orderId, status) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error("Order not found");
    order.status = status;
    await order.save();
    return order;
  }

  static async confirmOrders(listOrderIds) {
    // Chuẩn hóa & loại trùng ID
    const ids = [...new Set(listOrderIds)].map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    // Lấy toàn bộ đơn tồn tại trong danh sách
    const found = await Order.find(
      { _id: { $in: ids } },
      { _id: 1, status: 1 }
    );

    const foundIds = new Set(found.map((o) => String(o._id)));

    // 1) Các đơn không tìm thấy
    const notFound = listOrderIds.filter((id) => !foundIds.has(String(id)));

    // 2) Các đơn sai trạng thái (khác "new" hoặc quá 30 phút)
    const skippedInvalid = found
      .filter((o) => {
        const createdMs = Date.parse(o.createdAt);
        if (!Number.isFinite(createdMs)) return true; // coi như invalid
        const ageMs = Math.max(0, Date.now() - createdMs);
        const isNew = o.status === "new";
        return !isNew || ageMs > THIRTY_MIN;
      })
      .map((o) => ({ id: String(o._id), status: o.status }));

    // 3) Các đơn hợp lệ để cập nhật
    const validIds = found
      .filter((o) => {
        const createdMs = Date.parse(o.createdAt);
        if (!Number.isFinite(createdMs)) return false;
        const ageMs = Math.max(0, Date.now() - createdMs);
        const isNew = o.status === "new";
        return isNew && ageMs <= THIRTY_MIN;
      })
      .map((o) => o._id);

    // Cập nhật hàng loạt chỉ các đơn đang "new"
    let updatedCount = 0;
    if (validIds.length) {
      const upd = await Order.updateMany(
        { _id: { $in: validIds }, status: "new" },
        { $set: { status: "confirmed", updatedAt: new Date() } }
      );
      updatedCount = upd.modifiedCount || 0;
    }

    // Lấy lại các đơn đã cập nhật để trả về
    const updated =
      validIds.length > 0 ? await Order.find({ _id: { $in: validIds } }) : [];

    return {
      updatedCount,
      updated,
      skippedInvalid,
      notFound,
    };
  }
}

module.exports = OrderService;
