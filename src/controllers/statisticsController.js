const sendResponse = require("../utils/response");
const StatisticsService = require("../services/statisticsService");

// GET /api/admin/statistics/summary
exports.getSummary = async (req, res) => {
    try {
        const data = await StatisticsService.getSummary();
        return sendResponse(res, 200, true, "Summary fetched", data);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

// GET /api/admin/statistics/compare
exports.getCompare = async (req, res) => {
    try {
        const data = await StatisticsService.getCompare(req.query);
        return sendResponse(res, 200, true, "Compare series fetched", data);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

// GET /api/admin/statistics/weekly-profit
exports.getWeeklyProfit = async (req, res) => {
    try {
        const data = await StatisticsService.getWeeklyProfit();
        return sendResponse(res, 200, true, "Weekly profit fetched", data);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

// GET /api/admin/statistics/order-status
exports.getOrderStatus = async (req, res) => {
    try {
        const data = await StatisticsService.getOrderStatus();
        return sendResponse(res, 200, true, "Order status fetched", data);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

// GET /api/admin/statistics/top-products
exports.getTopProducts = async (req, res) => {
    try {
        const data = await StatisticsService.getTopProducts(req.query);
        return sendResponse(res, 200, true, "Top products fetched", data);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

// GET /api/admin/statistics/new-customers
exports.getNewCustomers = async (req, res) => {
    try {
        const data = await StatisticsService.getNewCustomers(req.query);
        return sendResponse(res, 200, true, "New customers fetched", data);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

exports.getUserRegistrationsByDay = async (req, res) => {
    try {
        const data = await StatisticsService.getUserRegistrationsByDay(req.query);
        return sendResponse(res, 200, true, "Registrations by day fetched", data);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

exports.getTopSpenders = async (req, res) => {
    try {
        const data = await StatisticsService.getTopSpenders(req.query);
        return sendResponse(res, 200, true, "Top spenders fetched", data);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

exports.getBuyerRatio = async (req, res) => {
    try {
        const data = await StatisticsService.getBuyerRatio(req.query);
        return sendResponse(res, 200, true, "Buyer ratio fetched", data);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const data = await StatisticsService.getAllUsers(req.query);
        return sendResponse(res, 200, true, "Users fetched", data);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

exports.getUserById = async (req, res) => {
    try {
        const data = await StatisticsService.getUserById(req.params.id);
        if (!data) return sendResponse(res, 404, false, "User not found");
        return sendResponse(res, 200, true, "User detail fetched", data);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

exports.getPostsViewsTotal = async (req, res) => {
    try {
        const data = await StatisticsService.getPostsViewsTotal();
        return sendResponse(res, 200, true, "Total post views fetched", data);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

exports.getTopPosts = async (req, res) => {
    try {
        const data = await StatisticsService.getTopPosts(req.query);
        return sendResponse(res, 200, true, "Top posts fetched", data);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

exports.updatePostBySlug = async (req, res) => {
    try {
        const data = await StatisticsService.updatePostBySlug(req.params.slug, req.body);
        if (!data) return sendResponse(res, 404, false, "Post not found");
        return sendResponse(res, 200, true, "Post updated", data);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

exports.lockPostBySlug = async (req, res) => {
    try {
        const { locked } = req.body;
        const data = await StatisticsService.lockPostBySlug(req.params.slug, locked);
        if (!data) return sendResponse(res, 404, false, "Post not found");
        return sendResponse(res, 200, true, locked ? "Post locked" : "Post unlocked", data);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};