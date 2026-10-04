const express = require("express");

const router = express.Router();


const { getOrCreateStoreChat, getChatMessages, sendCustomerMessage, getStoreChatRooms, getStoreChatMessages, sendStoreMessage, getOrCreateCustomerDeliveryChat, sendCustomerDeliveryMessage, getOrCreateStoreDeliveryChat, sendStoreDeliveryMessage, getOrCreateStaffDeliveryChat, sendStaffDeliveryMessage, getDeliveryChatMessages } = require("../controllers/Chat/chatController");
const { authUser, userCheck, authStore, storeCheck, authStaff } = require("../middlewares/auth");

router.get(
    "/chat/store/:storeId",
    authUser, userCheck,
    getOrCreateStoreChat
);

router.get(
    "/chat/:roomId/messages",
    authUser, userCheck,
    getChatMessages
);

router.post(
    "/chat/:roomId/message",
    authUser, userCheck,
    sendCustomerMessage
);


// ==========================================
// STORE CHAT
// ==========================================

router.get(
    "/store/chat",
    authStore,
    storeCheck,
    getStoreChatRooms
);

router.get(
    "/store/chat/:roomId/messages",
    authStore,
    storeCheck,
    getStoreChatMessages
);

router.post(
    "/store/chat/:roomId/message",
    authStore,
    storeCheck,
    sendStoreMessage
);

// ==========================================
// DELIVERY CHAT - CUSTOMER
// ==========================================

router.get(
    "/chat/delivery/:deliveryId",
    authUser,
    userCheck,
    getOrCreateCustomerDeliveryChat
);

router.post(
    "/chat/delivery/:roomId/message",
    authUser,
    userCheck,
    sendCustomerDeliveryMessage
);


// ==========================================
// DELIVERY CHAT - STORE
// ==========================================

router.get(
    "/store/chat/delivery/:deliveryId",
    authStore,
    storeCheck,
    getOrCreateStoreDeliveryChat
);

router.post(
    "/store/chat/delivery/:roomId/message",
    authStore,
    storeCheck,
    sendStoreDeliveryMessage
);


// ==========================================
// DELIVERY CHAT - STAFF
// ==========================================

router.get(
    "/store/staff/chat/delivery/:deliveryId",
    authStaff,
    getOrCreateStaffDeliveryChat
);

router.post(
    "/store/staff/chat/delivery/:roomId/message",
    authStaff,
    sendStaffDeliveryMessage
);


// ==========================================
// DELIVERY CHAT - CUSTOMER
// ==========================================

router.get(
    "/chat/delivery/:roomId/messages",
    authUser,
    userCheck,
    getDeliveryChatMessages
);


// ==========================================
// DELIVERY CHAT - STORE
// ==========================================

router.get(
    "/store/chat/delivery/:roomId/messages",
    authStore,
    storeCheck,
    getDeliveryChatMessages
);


// ==========================================
// DELIVERY CHAT - STAFF
// ==========================================

router.get(
    "/store/staff/chat/delivery/:roomId/messages",
    authStaff,
    getDeliveryChatMessages
);

module.exports = router;