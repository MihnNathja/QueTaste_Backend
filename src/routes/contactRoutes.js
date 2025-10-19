const express = require("express");
const contactController = require("../controllers/contactController");

const router = express.Router();

router.post("/send", contactController.sendContact);

module.exports = router;
