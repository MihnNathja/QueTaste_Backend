const Favorite = require("../models/Favorite");

class FavoriteService {
  static async addFavorite(userId, productId) {
    return Favorite.create({ userId, productId });
  }

  static async removeFavorite(userId, productId) {
    return Favorite.findOneAndDelete({ userId, productId });
  }

  static async getFavorites(userId) {
    return Favorite.find({ userId }).populate("productId");
  }
}

module.exports = FavoriteService;
