const express = require("express");
const { obterDashboard } = require("../controllers/adminController");
const { autenticarAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/dashboard", autenticarAdmin, obterDashboard);

module.exports = router;
