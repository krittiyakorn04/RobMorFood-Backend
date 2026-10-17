

// =====================================================
// บันทึก Push Subscription
// ใช้ได้กับ Customer / Store / DeliveryStaff
// =====================================================

const prisma = require("../config/prisma");

exports.subscribePush = async (req, res) => {
  try {
    const { subscription } = req.body;

    if (
      !subscription ||
      !subscription.endpoint ||
      !subscription.keys?.p256dh ||
      !subscription.keys?.auth
    ) {
      return res.status(400).json({
        message: "ข้อมูล Push Subscription ไม่ครบ",
      });
    }

    const endpoint = subscription.endpoint;
    const p256dh = subscription.keys.p256dh;
    const auth = subscription.keys.auth;

    // =====================================================
    // CUSTOMER
    // =====================================================

    if (req.user?.id) {
      const customerId = Number(req.user.id);

      const existingSubscription =
        await prisma.pushSubscription.findFirst({
          where: {
            endpoint,
          },
        });

      let result;

      if (existingSubscription) {
        result = await prisma.pushSubscription.update({
          where: {
            id: existingSubscription.id,
          },
          data: {
            p256dh,
            auth,
            customerId,
            storeId: null,
            deliveryStaffId: null,
          },
        });
      } else {
        result = await prisma.pushSubscription.create({
          data: {
            endpoint,
            p256dh,
            auth,
            customerId,
          },
        });
      }

      return res.status(200).json({
        message: "บันทึก Push Subscription สำเร็จ",
        subscription: result,
      });
    }

    // =====================================================
    // STORE
    // =====================================================

    if (req.store?.id) {
      const storeId = Number(req.store.id);

      const existingSubscription =
        await prisma.pushSubscription.findFirst({
          where: {
            endpoint,
          },
        });

      let result;

      if (existingSubscription) {
        result = await prisma.pushSubscription.update({
          where: {
            id: existingSubscription.id,
          },
          data: {
            p256dh,
            auth,
            customerId: null,
            storeId,
            deliveryStaffId: null,
          },
        });
      } else {
        result = await prisma.pushSubscription.create({
          data: {
            endpoint,
            p256dh,
            auth,
            storeId,
          },
        });
      }

      return res.status(200).json({
        message: "บันทึก Push Subscription สำเร็จ",
        subscription: result,
      });
    }

    // =====================================================
    // DELIVERY STAFF
    // =====================================================

    if (req.deliveryStaff?.id) {
      const deliveryStaffId = Number(req.deliveryStaff.id);

      const existingSubscription =
        await prisma.pushSubscription.findFirst({
          where: {
            endpoint,
          },
        });

      let result;

      if (existingSubscription) {
        result = await prisma.pushSubscription.update({
          where: {
            id: existingSubscription.id,
          },
          data: {
            p256dh,
            auth,
            customerId: null,
            storeId: null,
            deliveryStaffId,
          },
        });
      } else {
        result = await prisma.pushSubscription.create({
          data: {
            endpoint,
            p256dh,
            auth,
            deliveryStaffId,
          },
        });
      }

      return res.status(200).json({
        message: "บันทึก Push Subscription สำเร็จ",
        subscription: result,
      });
    }

    return res.status(401).json({
      message: "ไม่พบผู้ใช้งาน",
    });
  } catch (error) {
    console.log("subscribePush error =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};