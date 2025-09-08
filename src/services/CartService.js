const Cart = require("../models/Cart")
const Product = require("../models/Product")
const mongoose = require("mongoose");

class CartService {
    static async getCart(userId){
        return await Cart.findOne({ user: userId }).populate("items.product");
    }

    static async addToCart(userId, productId, quantity){
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error("Product not found");
        }

        let cart = await Cart.findOne({ user: userId });
        if(!cart){
            cart = new Cart({user: userId, items: []});
        }
        const itemIndex = cart.items.findIndex(
            (item) => item.product && item.product.toString() === productId
        );
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                throw new Error("❌ Invalid productId: " + productId);
            }
            cart.items.push({
                product: new mongoose.Types.ObjectId(productId),
                quantity
            });
        }
        try {
            await cart.save();
        } catch (err) {
            console.error("❌ Cart save error:", err.message);
            throw err;
        }
        return cart;
    }

    static async updateQuantity(userId, productId, quantity){
        const cart = await Cart.findOne({ user: userId });
        if (!cart) return null;

        const itemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId
        );

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = quantity;
        } 
        
        await cart.save();
        return cart;    
    }

    static async removeFromCart(userId, productId){
        const cart = await Cart.findOne({ user: userId });
        if (!cart) return null;

        cart.items = cart.items.filter(
            (item) => item.product.toString() !== productId
        );

        await cart.save();
        return cart;      
    }

}

module.exports = CartService;