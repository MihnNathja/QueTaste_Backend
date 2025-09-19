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
      .populate("productId");
  }

}

module.exports = UserViewService;
