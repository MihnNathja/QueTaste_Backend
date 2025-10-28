const UserView = require("../models/UserView");

class UserViewService {
  static async addView(userId, productId) {
    return UserView.findOneAndUpdate(
    { userId, productId }, 
    { viewedAt: new Date() }, 
    { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  static async getRecentViews(userId, limit = 10) {
    return UserView.find({ userId })
      .sort({ viewedAt: -1 })
      .limit(limit)
      .populate({
        path: "productId",
        match: { isActive: true, stock: { $gt: 0 } },
      })
      .then((views) =>
        views.filter((v) => v.productId) 
      );
  }

}

module.exports = UserViewService;
