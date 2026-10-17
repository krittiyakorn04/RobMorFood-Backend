const express = require("express");
const { authUser, authAdmin, userCheck, authStore, storeCheck } = require("../middlewares/auth");
const { createOrderReport, getMyOrderReports, getAllOrderReports, updateOrderReport, getStoreOrderReports } = require("../controllers/orderReportController");


const router = express.Router();

// Customer
router.post("/order-report", authUser, userCheck, createOrderReport);

router.get("/order-report/my", authUser, userCheck, getMyOrderReports);

// Admin
router.get("/admin/order-reports", authAdmin, getAllOrderReports);


// Store
router.get(
    "/store/order-reports",
    authStore, storeCheck,
    getStoreOrderReports,
);

router.patch(
    "/store/order-reports/:id",
    authStore,
    storeCheck,
    updateOrderReport,
);

module.exports = router;