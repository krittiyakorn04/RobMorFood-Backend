const express = require("express");
const {
  register,
  login,
  currentUser,
} = require("../controllers/User/UserAuth");
const {
  listAddress,
  addAddress,
  updateAddress,
  removeAddress,
} = require("../controllers/User/UserAddress");
const {
  getUserCart,
  userCart,
  updateUserCart,
  removeUserCart,
  readCart,
  getAllUserCarts,
} = require("../controllers/User/UserCart");
const {
  createOrder,
  getOrder,

  uploadSlip,
  changePaymentMethod,
  getOrderDetail,
  removeSlip,
  confirmReceived,
  cancelOrder,
} = require("../controllers/User/UserOrder");
const {
  profileUser,
  updateProfileUser,
  userImages,
  userRemoveImages,
  readMenu,
} = require("../controllers/User/UserProfile");
const {
  getDelivery,
  readDelivery,
  readUserDelivery,
} = require("../controllers/User/UserDelivery");
const {
  getReview,
  removeReview,
  updateReview,
  createReview,
  getStoreReviews,
} = require("../controllers/User/UserReview");
const { getallStores, getProfile } = require("../controllers/Store/StoreCreate");
const { authUser, userCheck } = require("../middlewares/auth");
const { getNotifications, readNotification, readAllNotifications } = require("../controllers/notificationController");


const router = express.Router();



//Authen
router.post("/user/register", register); //fb
router.post("/user/login", login); //fb
router.post("/user/current-user", authUser, userCheck, currentUser);  //fb



//ลูกค้าเข้าดูร้าน
// router.get("/store/listprofile", getallStores); //
router.get("/store/profile/:id", authUser, userCheck, getProfile); //หน่าร้าน //fb
router.get("/store/profile-public/:id", getProfile);

router.get("/user/Menu/:id", authUser, userCheck, readMenu); //fb


//Address
router.get("/user/address", authUser, userCheck, listAddress); //fb
router.post("/user/address", authUser, userCheck, addAddress); //fb
router.put("/user/address/:id", authUser, userCheck, updateAddress);  //fb
router.delete("/user/address/:id", authUser, userCheck, removeAddress);//fb

//Profile
router.get("/user/profile", authUser, userCheck, profileUser); //fb
router.put("/user/profile", authUser, userCheck, updateProfileUser); 

router.post("/user/image", authUser, userCheck, userImages);
router.post("/user/removeImage", authUser, userCheck, userRemoveImages);

//Cart
router.get("/user/carts",authUser,userCheck,getAllUserCarts);
router.get("/user/cart",authUser,userCheck, getUserCart);
router.get("/user/cart/:id", authUser, userCheck, readCart); //fb
router.post("/user/cart", authUser, userCheck, userCart); //fb
router.patch("/user/cart/:id", authUser, userCheck, updateUserCart); //fb
router.delete("/user/cart/:id", authUser, userCheck, removeUserCart);//fb

//Order
router.get("/user/order", authUser, userCheck, getOrder); //fb
router.get("/user/order/:id",authUser,userCheck,getOrderDetail); //fb
router.post("/user/order", authUser, userCheck, createOrder); //fb
router.post("/user/order/:id/cancel", authUser, userCheck, cancelOrder);
router.post("/user/order/:orderId/slip", authUser, userCheck, uploadSlip);
router.delete("/userorder/:orderId/slip", authUser, userCheck, removeSlip);



//Delivery
router.get("/user/delivery", getDelivery);
router.get("/user/delivery/:id", readUserDelivery);

router.get("/user/notification",authUser,userCheck,getNotifications);
router.patch("/user/notification/:id/read",authUser,userCheck,readNotification);
router.patch("/user/notification/read-all",authUser,userCheck,readAllNotifications);

//Review
router.get("/user/store/:id/reviews",authUser,getStoreReviews,);
router.get("/user/review/:id",authUser,userCheck, getReview);
router.post("/user/review/:orderId", authUser, createReview);
router.post("/user/review/:id",authUser,userCheck, updateReview);
router.delete("/user/review/:id",authUser,userCheck, removeReview);

module.exports = router;
