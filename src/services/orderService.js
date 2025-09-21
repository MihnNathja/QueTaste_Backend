const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const axios = require("axios");
const crypto = require("crypto");
const dayjs = require("dayjs");

class OrderService {
    // Checkout chung (COD hoặc MoMo)
    static async checkout(userId, { paymentMethod, shippingAddress, notes }) {
        // 1. Lấy giỏ hàng
        const cart = await Cart.findOne({ user: userId }).populate("items.product");
        if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
        }

        // 2. Tính toán đơn hàng
        let totalAmount = 0;
        const orderItems = [];

        for (const item of cart.items) {
        const product = item.product;

        if (!product.isActive) {
            throw new Error(`Product ${product.name} is not available`);
        }

        if (product.stock < item.quantity) {
            throw new Error(`Not enough stock for product ${product.name}`);
        }

        const price =
            product.salePrice && product.salePrice > 0
            ? product.salePrice
            : product.price;

        totalAmount += price * item.quantity;

        orderItems.push({
            product: product._id,
            quantity: item.quantity,
            price,
        });

        product.stock -= item.quantity;
        product.totalSold += item.quantity;
        await product.save();
        }

        const shippingFee = 36000;
        const discount = 0;
        const finalAmount = totalAmount - discount + shippingFee;

        // 3. Nếu COD → lưu order trực tiếp
        if (paymentMethod === "COD") {
        const order = new Order({
            user: userId,
            items: orderItems,
            totalAmount,
            discount,
            shippingFee,
            finalAmount,
            paymentMethod,
            paymentStatus: "pending",
        shippingAddress,
        notes,
        status: "new",
        });

        await order.save();

        // COD thì clear cart ngay
        cart.items = [];
        await cart.save();

        return order;
        }

        // 4. Nếu MoMo → tạo order pending + gọi API sandbox
        if (paymentMethod === "momo") {
        const order = new Order({
            user: userId,
            items: orderItems,
            totalAmount,
            discount,
            shippingFee,
            finalAmount,
            paymentMethod,
            paymentStatus: "pending", // chờ MoMo confirm
            shippingAddress,
            notes,
            status: "pending",        // chưa hoàn tất
        });

        await order.save();

        // dùng _id của MongoDB làm orderId
        const orderId = order._id.toString();

        // 🚨 KHÔNG clear cart ở đây nữa

        // gọi API MoMo
        const partnerCode = "MOMO";
        const accessKey = "F8BBA842ECF85";
        const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
        const requestId = orderId;
        const orderInfo = `Thanh toan don hang ${orderId}`;
        const redirectUrl = "http://localhost:5173/checkout/result";
        const ipnUrl = "http://localhost:8088/api/order/momo/notify";
        const requestType = "captureWallet";
        const extraData = "";

        const rawSignature =
            `accessKey=${accessKey}&amount=${finalAmount}&extraData=${extraData}&ipnUrl=${ipnUrl}` +
            `&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}` +
            `&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

        const signature = crypto
            .createHmac("sha256", secretKey)
            .update(rawSignature)
            .digest("hex");

        const requestBody = {
            partnerCode,
            partnerName: "Test",
            storeId: "MomoTestStore",
            requestId,
            amount: finalAmount,
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

        const response = await axios.post(
            "https://test-payment.momo.vn/v2/gateway/api/create",
            requestBody,
            { headers: { "Content-Type": "application/json" } }
        );

        return {
            order,
            payUrl: response.data.payUrl,
        };
        }

        throw new Error("Unsupported payment method");
    }

    static async getMyOrders(userId, { status, search, page = 1, limit = 10 } = {}) {
        try {

            const query = { user: userId }

            if (status && status !== "all") {
                if (status === "pending")
                {
                    query.$or = [
                        { status: "new" },
                        { status: "confirmed" }
                    ];
                }
                else if (status === "shipping")
                {
                    query.$or = [
                        { status: "shipping" },
                        { status: "delivering" }
                    ];
                }
                else if (status === "cancelled")
                {
                    query.$or = [
                        { status: "cancel_requested" },
                        { status: "cancelled" }
                    ];
                }
                else
                {
                    query.status = status;
                }
            }

            if (search) {
            const productIds = await Product.find(
                { name: { $regex: search, $options: "i" } },
                { _id: 1 }
            ).lean();

            const ids = productIds.map(p => p._id);

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
                select: "name price salePrice category images averageRating totalReviews",
            });

            return orders || [];
        } catch (err) {
            console.error("Error in getMyOrders:", err.message);
            throw new Error("Không thể lấy danh sách đơn hàng");
        }
    }

    static async cancelOrder(userId, orderId) {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) throw new Error("Không tìm thấy đơn hàng");

    const diffMinutes = (Date.now() - order.createdAt.getTime()) / 1000 / 60;

    // Nếu đã vào giai đoạn xử lý hoặc xa hơn
    if (order.status === "processing") {
        throw new Error("Đơn hàng đã sang giai đoạn xử lý, vui lòng gửi Yêu cầu hủy");
    }

    if (["shipping", "delivering", "completed"].includes(order.status)) {
        throw new Error("Đơn hàng đã qua giai đoạn xử lý, vui lòng gửi Yêu cầu hoàn/trả hàng");
    }

    // Nếu vẫn còn new/confirmed
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
        throw new Error("Chỉ có thể gửi yêu cầu hủy cho đơn hàng đang vận chuyển hoặc đã giao");
    }

    // Xử lý notify từ MoMo (IPN server → server)
    static async handleMomoNotify(orderId, resultCode) {
        const order = await Order.findById(orderId);
        if (!order) throw new Error("Order not found");

        if (Number(resultCode) === 0) {
            order.paymentStatus = "paid";
            order.status = "completed";

            // ✅ clear cart khi thanh toán thành công
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

    // Cập nhật trạng thái (frontend redirect gọi)
    static async updateStatus(orderId, resultCode) {
        const order = await Order.findById(orderId);
        if (!order) throw new Error("Order not found");

        if (Number(resultCode) === 0) {
            order.paymentStatus = "paid";
            order.status = "completed";

            // ✅ clear cart khi thanh toán thành công
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

            const ids = productIds.map(p => p._id);

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
                select: "name price salePrice category images averageRating totalReviews",
            })
            .populate({
                path: "user",          
                model: "User",
                select: "email personalInfo.fullName personalInfo.phone personalInfo.address"
            });

            // 🔹 Chuẩn hóa dữ liệu
            const formatted = orders.map((o) => ({
                id: o._id.toString(),
                code: `DH${o._id.toString().slice(-6)}`, // mã đơn
                user: o.user,
                shippingAddress: o.shippingAddress,
                createdAt: dayjs(o.createdAt).format("YYYY-MM-DD HH:mm:ss"), // chuẩn hóa thời gian
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


        order.status = status
        await order.save();
        return order;
    }
}

module.exports = OrderService;