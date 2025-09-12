const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const axios = require("axios");
const crypto = require("crypto");

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
            status: "completed",
        });

        await order.save();

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

        // clear cart ngay để user thấy giỏ hàng rỗng
        cart.items = [];
        await cart.save();

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

    // Xử lý notify từ MoMo (IPN server → server)
    static async handleMomoNotify(orderId, resultCode) {
        const order = await Order.findById(orderId);
        if (!order) throw new Error("Order not found");

        if (Number(resultCode) === 0) {
        order.paymentStatus = "paid";
        order.status = "completed";
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
        } else {
        order.paymentStatus = "failed";
        order.status = "cancelled";
        }

        await order.save();
        return order;
    }
}

module.exports = OrderService;