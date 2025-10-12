const StatisticsService = require("../services/statisticsService");
const sendResponse = require("../utils/response");

// GET /api/statistics/revenue
exports.getRevenue = async (req, res) => {
    try {
        const { filterType = "month", range } = req.query;
        const data = await StatisticsService.getRevenue(filterType, range);
        return sendResponse(res, 200, true, "Get revenue statistics successfully", data);
    } catch (err) {
        console.error("Error in getRevenue:", err.message);
        return sendResponse(res, 400, false, err.message);
    }
};

// GET /api/statistics/cashflow
exports.getCashFlow = async (req, res) => {
    try {
        const data = await StatisticsService.getCashFlow();
        return sendResponse(res, 200, true, "Get cashflow statistics successfully", data);
    } catch (err) {
        console.error("Error in getCashFlow:", err.message);
        return sendResponse(res, 400, false, err.message);
    }
};