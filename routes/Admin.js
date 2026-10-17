<<<<<<< HEAD
const express = require("express");
const {
  register,
=======

const express = require("express");
const {
>>>>>>> origin/main
  login,
  currentAdmin,
} = require("../controllers/Admin/AdminAuthen");
const {
  changeCustomerStatus,
<<<<<<< HEAD
  changemerchantStatus,
} = require("../controllers/Admin/AdminManagement");
=======
  createStoreCategory,
  changeStoreStatus,
  getAllStores,
  deleteStoreCategory,
  getStoreCategories,
  updateStoreCategory,
  getAllCustomer,
} = require("../controllers/Admin/AdminManagement");
const { authAdmin } = require("../middlewares/auth");
>>>>>>> origin/main

const router = express.Router();

//Authen
<<<<<<< HEAD
router.post("/admin/register", register);
=======
>>>>>>> origin/main
router.post("/admin/login", login);
router.get("/admin/current-restau", currentAdmin);

//Admin
<<<<<<< HEAD
router.patch("/admin/:id/customerStatus", changeCustomerStatus);
router.patch("/admin/:id/merchantStatu", changemerchantStatus);
=======
router.get("/admin/stores",authAdmin, getAllStores);
router.patch("/admin/:id/customerStatus",authAdmin, changeCustomerStatus);

router.patch("/admin/:id/storeStatus",authAdmin, changeStoreStatus);
router.get("/admin/customer",authAdmin,getAllCustomer);
router.post("/admin/store-category",authAdmin, createStoreCategory);
router.get("/admin/store-category",authAdmin,getStoreCategories);
router.delete("/admin/store-category/:id",authAdmin,deleteStoreCategory);
router.put("/admin/store-category/:id",authAdmin,updateStoreCategory);
// DeliveryZone

>>>>>>> origin/main

module.exports = router;
