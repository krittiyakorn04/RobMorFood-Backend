const express = require("express");
const {
  register,
  login,
  currentRestau,
  createStoreStaff,
  getStoreStaff,
  changeStoreStaffStatus,
  updateStoreStaff,
} = require("../controllers/Store/StoreAuth");
const {
  updateStore,
  getStore,
  removeStore,
  changeStoreStatus,
  changeOrderMode,
  updateEmail,
  updatePassword,
  updateUsername,
  storeImagesMenu,
  storeRemoveImagesMenu,
  storeBanner,
  storeImages,
  storeRemoveImages,
  getCategories,
  getAllStore,
  storeRemoveBanner,
  storeQR,
  storeRemoveQR,
  storeVerify,
  storeRemoveVerify,

} = require("../controllers/Store/StoreCreate");
const {
  listMenuCategory,
  addMenuCategory,
  updateMenuCategory,
  removeMenuCategory,
} = require("../controllers/Store/StoreMenuCategory");
const {
  addMenu,
  updateMenu,
  removeMenu,
  changeAvailabilityStatus,
  getMenuBy,
  getSearchFilters,
  getMenu,
  readMenu,
  getOptionFormats,
  createOptionFormat,
  updateOptionFormat,
  deleteOptionFormat,
} = require("../controllers/Store/StoreMunu");
const {
  addOrderRound,
  changePattern,
  changeRoundStatus,
  updateOrderRound,
  removeOrderRound,
  listOrderRound,
  removeAllOrderRound,
} = require("../controllers/Store/StoreOrderRound");
const {
  readOrder,
  changeStatusOrder,
  listOrder,
  cancelStoreOrder,
  getMyStoreReviews,
} = require("../controllers/Store/StoreOrder");
const {
  listDelivery,
  readDelivery,
  changeStatusDelivery,
  getDeliveryJobs,
  markDelivered,
  startDelivery,
  readDeliveryStaff,
  assignDeliveryStaff,
  uploadDeliveryProof,
  removeDeliveryProof,
  uploadDeliveryProofStaff,
  deleteDeliveryProofStaff,
  getDeliveryNotifications
} = require("../controllers/Store/StoreDelivery");
const { rejectedPayment, changeStatusPayment } = require("../controllers/Store/StorePayment");
const { authStore, storeCheck, authStaff } = require("../middlewares/auth");
const { getNotifications, readNotification, readAllNotifications } = require("../controllers/notificationController");
const { getStoreReport } = require("../controllers/Store/report");


const router = express.Router();

router.get("/store", getAllStore);

router.get("/store/report", authStore, getStoreReport);

//Authen
router.post("/store/register", register); //+post บช.ร้าน รอ //fb
router.post("/store/login", login); //fb
router.post("/store/current-restau", authStore, storeCheck, currentRestau); //fb

//createStore //สร้างร้าน
router.get("/store/profile", authStore, storeCheck, getStore); //fb
router.get("/store/categories", getCategories); //fb
router.put("/store/profile", authStore, storeCheck, updateStore); //fb
router.patch("/store/profile/change-email", authStore, updateEmail); //ติด
router.patch("/store/profile/change-password", authStore, updatePassword); //ติด
router.patch("/store/profile/change-username", authStore, updateUsername); //ติด
router.patch("/store/profile/stutus", removeStore); //ลบ ปุ่มลบร้านแต่จริงๆเก็บไว้แต่เปลี่ยนสถานะ //ติด

router.patch("/store/storeStatus", authStore, storeCheck, changeStoreStatus); //ต้องทำ daliveryZoneก่อน //fb
router.patch("/store/storeOrderMode", authStore, storeCheck, changeOrderMode); //fb

router.post("/store/image", authStore, storeCheck, storeImages);
router.post("/store/Banner", authStore, storeCheck, storeBanner);
router.post("/store/storesQR", authStore, storeCheck, storeQR);
router.post("/store/storesVerify", authStore, storeCheck, storeVerify);
router.delete("/store/removeImage", authStore, storeCheck, storeRemoveImages)
router.delete("/store/removeBanner", authStore, storeCheck, storeRemoveBanner)
router.delete("/store/removeQR", authStore, storeCheck, storeRemoveQR)
router.delete("/store/removeVerify", authStore, storeCheck, storeRemoveVerify)

//MenuCategory 
router.get("/store/category", authStore, storeCheck, listMenuCategory); //fb
router.post("/store/category", authStore, storeCheck, addMenuCategory); //fb
router.put("/store/category/:id", authStore, storeCheck, updateMenuCategory); //fb
router.delete("/store/category/:id", authStore, storeCheck, removeMenuCategory); //fb

//Menu
router.get("/store/menu", authStore, storeCheck, getMenu); //fb
router.post("/store/addMenu", authStore, storeCheck, addMenu); //fb
router.get("/store/Menu/:id", authStore, storeCheck, readMenu); //fb
router.put("/store/Menu/:id", authStore, storeCheck, updateMenu); //fb
router.delete("/store/deleteMenu/:id", authStore, storeCheck, removeMenu);
router.get("/store/option-formats", authStore, storeCheck, getOptionFormats);
router.post("/store/option-formats", authStore, storeCheck, createOptionFormat);
router.put("/store/option-formats/:id", authStore, storeCheck, updateOptionFormat,);
router.delete("/store/option-formats/:id", authStore, storeCheck, deleteOptionFormat,);
router.patch("/store/availability/:id/status", authStore, storeCheck, changeAvailabilityStatus); //f

router.post("/store/imageMenu", authStore, storeCheck, storeImagesMenu); //fb
router.delete("/store/removeImageMenu", authStore, storeCheck, storeRemoveImagesMenu); //fb

router.get("/store/menuby", getMenuBy);
router.get("/store/search/filters", getSearchFilters);

//orderRound
router.get("/store/order-round", authStore, storeCheck, storeCheck, listOrderRound); //fb
router.post("/store/order-round", authStore, storeCheck, storeCheck, addOrderRound); //fb
router.put("/store/order-round/:roundId", authStore, storeCheck, updateOrderRound);
router.delete("/store/order-round/:id", authStore, storeCheck, removeOrderRound);
router.delete("/store/order-round", authStore, storeCheck, removeAllOrderRound);

router.patch("/store/pattern", changePattern);
router.patch("/store/round/:id/status", changeRoundStatus);

//Order
router.get("/store/order", authStore, storeCheck, listOrder); //fb
router.get("/store/order/:id", authStore, storeCheck, readOrder);
router.patch("/store/order/:id", authStore, storeCheck, changeStatusOrder); //fb
router.post("/store/order/:id/cancel", authStore, storeCheck, cancelStoreOrder);
router.get("/store/reviews", authStore, storeCheck, getMyStoreReviews);


//Delivery&&DeliveryZone
router.get("/store/delivery", authStore, storeCheck, listDelivery); //fb
router.get("/store/delivery/:id", authStore, storeCheck, readDelivery);
router.patch("/store/delivery/:id", authStore, storeCheck, changeStatusDelivery); //fb

router.post("/store/delivery/:id/proof", authStore, storeCheck, uploadDeliveryProof);
router.delete("/store/delivery/:id/proof", authStore, removeDeliveryProof);


router.post("/store/deliverystaff/:id/proof", authStaff, uploadDeliveryProofStaff);


//Payment
router.post("/store/payment/:id", rejectedPayment);
router.patch("/store/payment/:id/status", authStore, storeCheck, changeStatusPayment);

router.get("/store/notification", authStore, storeCheck, getNotifications);
router.patch("/store/notification/:id/read", authStore, storeCheck, readNotification);
router.patch("/store/notification/read-all", authStore, storeCheck, readAllNotifications);

router.post("/store/staff", authStore, storeCheck, createStoreStaff);
router.get("/store/staff", authStore, storeCheck, getStoreStaff);
router.patch("/store/staff/:id/status", authStore, storeCheck, changeStoreStaffStatus);
router.patch("/store/staff/:id", authStore, storeCheck, updateStoreStaff);
router.patch("/store/delivery/:id/assign", authStore, storeCheck, assignDeliveryStaff);
router.get("/store/staff/notifications", authStaff, getDeliveryNotifications);

router.get("/store/deliveryStaff-list", authStaff, getDeliveryJobs);
router.patch("/store/deliveryStaff/start", authStaff, startDelivery);
router.patch("/store/deliveryStaff/delivered", authStaff, markDelivered);
router.get("/staff/delivery/:id", authStaff, readDeliveryStaff);
router.delete("/store/staff/delivery/:id/proof/:imageId", authStaff, deleteDeliveryProofStaff);
router.get(
  "/store/staff/notifications",
  authStaff,
  getNotifications
);

router.patch(
  "/store/staff/notification/:id/read",
  authStaff,
  readNotification
);

router.patch(
  "/store/staff/notification/read-all",
  authStaff,
  readAllNotifications
);
module.exports = router;
