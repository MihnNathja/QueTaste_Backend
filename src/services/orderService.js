// services/orderService.js
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");

class OrderService {
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

        // lấy giá: ưu tiên salePrice nếu > 0
        const price =
            product.salePrice && product.salePrice > 0
            ? product.salePrice
            : product.price;

        totalAmount += price * item.quantity;

        // Thêm vào items của order
        orderItems.push({
            product: product._id,
            quantity: item.quantity,
            price,
        });

        // Cập nhật stock + totalSold
        product.stock -= item.quantity;
        product.totalSold += item.quantity;
        await product.save();
        }

        // 3. Tính phí + giảm giá
        const shippingFee = 36000;
        const discount = 0;
        const finalAmount = totalAmount - discount + shippingFee;

        // 4. Tạo Order
        const order = new Order({
        user: userId,
        items: orderItems,
        totalAmount,
        discount,
        shippingFee,
        finalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === "COD" ? "pending" : "paid",
        shippingAddress,
        notes,
        status: "completed",
        });

        await order.save();

        // 5. Clear cart
        cart.items = [];
        await cart.save();

        return order;
    }

    static async getMyOrders(userId, { status, search, page = 1, limit = 10 } = {}) {
        try {
            const query = { user: userId };

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
            });

            return orders || [];
        } catch (err) {
            console.error("Error in getMyOrders:", err.message);
            throw new Error("Không thể lấy danh sách đơn hàng");
        }
    }
}

module.exports = OrderService;