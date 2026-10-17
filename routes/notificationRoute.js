const express = require("express");

const router = express.Router();

const { authPush } = require("../middlewares/auth");
const { subscribePush } = require("../controllers/pushController");

// =====================================================
// Push Notification
// =====================================================

router.post(
  "/notification/push/subscribe",
  authPush,
  subscribePush
);

module.exports = router;