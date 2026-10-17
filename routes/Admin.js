
const express = require("express");
const {
  login,
  currentAdmin,
} = require("../controllers/Admin/AdminAuthen");
const {
  changeCustomerStatus,
  createStoreCategory,
  changeStoreStatus,
  getAllStores,
  deleteStoreCategory,
  getStoreCategories,
  updateStoreCategory,
  getAllCustomer,
} = require("../controllers/Admin/AdminManagement");
const { authAdmin } = require("../middlewares/auth");

const router = express.Router();

//Authen
router.post("/admin/login", login);
router.get("/admin/current-restau", currentAdmin);

//Admin
router.get("/admin/stores",authAdmin, getAllStores);
router.patch("/admin/:id/customerStatus",authAdmin, changeCustomerStatus);

router.patch("/admin/:id/storeStatus",authAdmin, changeStoreStatus);
router.get("/admin/customer",authAdmin,getAllCustomer);
router.post("/admin/store-category",authAdmin, createStoreCategory);
router.get("/admin/store-category",authAdmin,getStoreCategories);
router.delete("/admin/store-category/:id",authAdmin,deleteStoreCategory);
router.put("/admin/store-category/:id",authAdmin,updateStoreCategory);
// DeliveryZone


module.exports = router;
