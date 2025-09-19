const FavoriteService = require("../services/favoriteService");
const sendResponse = require("../utils/response");

exports.addFavorite = async (req, res) => {
  try {
    const fav = await FavoriteService.addFavorite(req.user.id, req.body.productId);
    return sendResponse(res, 201, true, "Added to favorites", fav);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    await FavoriteService.removeFavorite(req.user.id, req.params.productId);
    return sendResponse(res, 200, true, "Removed from favorites");
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const favs = await FavoriteService.getFavorites(req.user.id);
    return sendResponse(res, 200, true, "Favorites fetched", favs);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};
