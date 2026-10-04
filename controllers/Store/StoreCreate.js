const prisma = require("../../config/prisma");
const cloudinary = require('cloudinary').v2;

const bcrypt = require("bcryptjs");

//ยังไม่สมบูรณ์ รอแก้
//หน้าร้าน เอาไปไว้user
exports.getAllStore = async (req, res) => {
  try {
    const stores = await prisma.store.findMany({
      where: {
        accountStatus: "ACTIVE",
      },

      select: {
        id: true,
        storeName: true,
        status: true,
        accountStatus: true,
        timeOpen: true,
        timeClose: true,

        images: {
          select: {
            url: true,
            public_id: true,
          },
        },

        storeCategories: {
          select: {
            storeCategory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },

        orderRound: {
          select: {
            id: true,
            roundNumber: true,
            startTime: true,
            endTime: true,
            durationMinutes: true,
            hasOrderLimit: true,
            maxOrders: true,
            currentOrders: true,
            status: true,
          },

          orderBy: {
            startTime: "asc",
          },
        },

        menus: {
          select: {
            id: true,
            menuItem: true,
            images: true,
            price: true,
            isAvailable: true,
          },
        },
      },
    });

    res.json(stores);
  } catch (err) {
    console.log("Get All Store Error =", err);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const storeId = Number(req.params.id);

    if (!storeId || Number.isNaN(storeId)) {
      return res.status(400).json({
        message: "Invalid store id",
      });
    }

    const store = await prisma.store.findUnique({
      where: {
        id: storeId,
      },

      include: {
        images: true,
        // ประเภทร้าน เช่น Bakery / Somtum
        storeCategories: {
          include: {
            storeCategory: true,
          },
        },

        // รอบรับออเดอร์
        orderRound: {
          orderBy: {
            roundNumber: "asc",
          },
        },

        // หมวดหมู่เมนู
        menuCategories: {
          include: {
            menus: {
              include: {
                images: true,

                options: {
                  include: {
                    choices: true,
                  },
                },
              },
            },
          },
        },

        // เมนูทั้งหมด
        menus: {
          include: {
            images: true,

            options: {
              include: {
                choices: true,
              },
            },

            category: true,
          },
        },
      },
    });

    if (!store) {
      return res.status(404).json({
        message: "Store not found",
      });
    }

    res.status(200).json(store);
  } catch (error) {
    console.log("getProfile error =", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};



exports.getStore = async (req, res) => {
  try {
    const storeId = req.store.id;

    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
      },
      include: {
        orderRound: true,
        storeCategories: {
          include: {
            storeCategory: true,
          },
        },
        images: true,
      },
    });

    if (!store) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลร้าน",
      });
    }

    // =====================================================
    // นับจำนวนออเดอร์แต่ละรอบ
    // =====================================================

    const orderRoundsWithCount = await Promise.all(
      store.orderRound.map(async (round) => {
        const orderCount = await prisma.order.count({
          where: {
            storeId: storeId,
            orderRoundId: round.id,
            status: {
              not: "CANCELLED",
            },
          },
        });

        return {
          ...round,
          orderCount,
        };
      }),
    );

    // =====================================================
    // นับจำนวนออเดอร์ที่สำเร็จของร้าน
    // =====================================================

    const completedOrderCount = await prisma.order.count({
      where: {
        storeId: storeId,
        status: "COMPLETED",
      },
    });

    res.send({
      ...store,
      orderRound: orderRoundsWithCount,
      completedOrderCount,
    });
  } catch (error) {
    console.log("GET STORE ERROR =", error);

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.updateEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const storeId = req.store.id;

    const currentStore = await prisma.store.findFirst({
      where: {
        id: storeId,
      },
    });
    if (currentStore.email === email) {
      return res.status(400).json({ message: "เป็น email เดิมอยู่แล้ว" });
    }

    const chackemail = await prisma.store.findFirst({
      where: {
        email,
      },
    });

    if (chackemail) {
      return res.status(400).json({ message: "This email already exits!!" });
    }

    const updateEmail = await prisma.store.update({
      where: {
        id: storeId,
      },
      data: {
        email,
      },
    });
    res.send(updateEmail);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const storeId = req.store.id;

    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
      },
    });

    // ต้องเช็ค password เก่าก่อน
    const valid = await bcrypt.compare(oldPassword, store.password);
    if (!valid) {
      return res.status(400).json({ message: "รหัสผ่านเก่าไม่ถูกต้อง" });
    }

    // ค่อยเปลี่ยนใหม่
    const hashPassword = await bcrypt.hash(newPassword, 10);

    await prisma.store.update({
      where: {
        id: storeId,
      },
      data: { password: hashPassword },
    });

    res.send({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.updateUsername = async (req, res) => {
  // จำกัดการเปลี่ยน username ทุก 30 วัน
  try {
    const { username } = req.body;
    const storeId = req.store.id;

    const currentStore = await prisma.store.findFirst({
      where: {
        id: storeId,
      },
    });

    if (!currentStore) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลร้าน",
      });
    }

    if (currentStore.username === username) {
      return res.status(400).json({
        message: "เป็น Username เดิมอยู่แล้ว",
      });
    }

    const chackeUsername = await prisma.store.findFirst({
      where: {
        username,
        NOT: {
          id: storeId,
        },
      },
    });

    if (chackeUsername) {
      return res.status(400).json({
        message: "This username already exits!!",
      });
    }

    // เช็คว่าเปลี่ยนได้แล้วหรือยัง
    const DAYS = 30;

    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
      },
    });

    if (store.usernameChangedAt) {
      const daysSinceChange =
        (Date.now() - new Date(store.usernameChangedAt)) /
        (1000 * 60 * 60 * 24);

      if (daysSinceChange < DAYS) {
        return res.status(400).json({
          message: `เปลี่ยน username ได้อีกครั้งใน ${Math.ceil(
            DAYS - daysSinceChange
          )} วัน`,
        });
      }
    }

    // อัปเดต username + บันทึกเวลา
    const updateUsername = await prisma.store.update({
      where: {
        id: storeId,
      },
      data: {
        username,
        usernameChangedAt: new Date(),
      },
    });

    res.send(updateUsername);
  } catch (error) {
    console.log("UPDATE USERNAME ERROR =", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

//ลืม storeName
exports.updateStore = async (req, res) => {
  try {
    const {
      username,
      Notice,
      phone,
      storeName,
      storeCategoryIds,
      address,
      dayOpen,
      timeOpen,
      timeClose,
      openAuto,
      lat,
      lng,
      deliveryFee,

      facebookUrl,
      instagramUrl,
      tiktokUrl,
      lineUrl,
    } = req.body;

    const storeId = req.store.id;

    // =========================================================
    // ดึงข้อมูลเดิมของร้าน
    // =========================================================

    const currentStore = await prisma.store.findUnique({
      where: {
        id: storeId,
      },
      select: {
        username: true,
        email: true,
        phone: true,
        storeName: true,
        usernameChangedAt: true,
      },
    });

    if (!currentStore) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลร้านค้า",
      });
    }

    // =========================================================
    // ตรวจ Username
    // เปลี่ยนได้ทุก 30 วัน
    // =========================================================

    const isUsernameChanged =
      username !== undefined &&
      username !== null &&
      username !== "" &&
      username !== currentStore.username;

    if (isUsernameChanged) {
      // ---------------------------------------------------------
      // ตรวจ Username ซ้ำ
      // ---------------------------------------------------------

      const duplicateUsername =
        await prisma.store.findFirst({
          where: {
            username,
            NOT: {
              id: storeId,
            },
          },
        });

      if (duplicateUsername) {
        return res.status(400).json({
          message: "Username นี้มีผู้ใช้งานแล้ว",
          field: "username",
        });
      }

      // ---------------------------------------------------------
      // ตรวจ 30 วัน
      // ---------------------------------------------------------

      if (currentStore.usernameChangedAt) {
        const now = new Date();

        const lastChanged =
          new Date(
            currentStore.usernameChangedAt
          );

        const diffTime =
          now.getTime() -
          lastChanged.getTime();

        const diffDays =
          diffTime /
          (1000 * 60 * 60 * 24);

        if (diffDays < 30) {
          const remainingDays =
            Math.ceil(30 - diffDays);

          return res.status(400).json({
            message: `สามารถเปลี่ยน Username ได้อีกครั้งใน ${remainingDays} วัน`,
            remainingDays,
            field: "username",
          });
        }
      }
    }

    // =========================================================
    // ตรวจ Phone ซ้ำ
    // =========================================================

    const isPhoneChanged =
      phone !== undefined &&
      phone !== null &&
      phone !== "" &&
      phone !== currentStore.phone;

    if (isPhoneChanged) {
      const duplicatePhone =
        await prisma.store.findFirst({
          where: {
            phone,
            NOT: {
              id: storeId,
            },
          },
        });

      if (duplicatePhone) {
        return res.status(400).json({
          message: "เบอร์โทรศัพท์นี้มีผู้ใช้งานแล้ว",
          field: "phone",
        });
      }
    }

    // =========================================================
    // เตรียมข้อมูลที่จะอัปเดต
    // =========================================================

    const updateData = {
      Notice,
      storeName,
      address,
      dayOpen,
      timeOpen,
      timeClose,
      openAuto,
      phone,
      facebookUrl,
      instagramUrl,
      tiktokUrl,
      lineUrl,

    };

    // =========================================================
    // Username
    // =========================================================

    if (isUsernameChanged) {
      updateData.username = username;
      updateData.usernameChangedAt = new Date();
    }

    // =========================================================
    // Phone
    // =========================================================

    if (isPhoneChanged) {
      updateData.phone = phone;
    }

    // =========================================================
    // พิกัด
    // =========================================================

    if (
      lat !== undefined ||
      lng !== undefined
    ) {
      const storeLat =
        lat !== undefined &&
          lat !== null &&
          lat !== ""
          ? Number(lat)
          : null;

      const storeLng =
        lng !== undefined &&
          lng !== null &&
          lng !== ""
          ? Number(lng)
          : null;

      // Latitude
      if (
        storeLat === null ||
        Number.isNaN(storeLat) ||
        storeLat < -90 ||
        storeLat > 90
      ) {
        return res.status(400).json({
          message: "Latitude ไม่ถูกต้อง",
        });
      }

      // Longitude
      if (
        storeLng === null ||
        Number.isNaN(storeLng) ||
        storeLng < -180 ||
        storeLng > 180
      ) {
        return res.status(400).json({
          message: "Longitude ไม่ถูกต้อง",
        });
      }

      updateData.lat = storeLat;
      updateData.lng = storeLng;
    }

    // =========================================================
    // Category
    // =========================================================

    if (Array.isArray(storeCategoryIds)) {
      const categoryIds = [
        ...new Set(
          storeCategoryIds
            .map(Number)
            .filter((id) => !Number.isNaN(id))
        ),
      ];

      updateData.storeCategories = {
        deleteMany: {},
        create: categoryIds.map((categoryId) => ({
          storeCategoryId: categoryId,
        })),
      };
    }

    if (
      deliveryFee !== undefined &&
      deliveryFee !== null &&
      deliveryFee !== ""
    ) {
      const storeDeliveryFee = Number(deliveryFee);

      if (
        Number.isNaN(storeDeliveryFee) ||
        storeDeliveryFee < 0
      ) {
        return res.status(400).json({
          message: "ค่าจัดส่งไม่ถูกต้อง",
        });
      }

      updateData.deliveryFee = storeDeliveryFee;
    }

    // =========================================================
    // Update Store
    // =========================================================

    const store =
      await prisma.store.update({
        where: {
          id: storeId,
        },

        data: updateData,

        include: {
          storeCategories: {
            include: {
              storeCategory: true,
            },
          },
          images: true,
        },
      });

    // =========================================================
    // ค่าจัดส่ง
    // =========================================================


    return res.send(store);
  } catch (error) {
    console.log(
      "UPDATE STORE ERROR ================="
    );

    console.log(error);

    // =========================================================
    // Prisma Unique Constraint
    // =========================================================

    if (error.code === "P2002") {
      const target =
        error.meta?.target;

      if (
        Array.isArray(target) &&
        target.includes("username")
      ) {
        return res.status(400).json({
          message: "Username นี้มีผู้ใช้งานแล้ว",
          field: "username",
        });
      }

      if (
        Array.isArray(target) &&
        target.includes("phone")
      ) {
        return res.status(400).json({
          message:
            "เบอร์โทรศัพท์นี้มีผู้ใช้งานแล้ว",
          field: "phone",
        });
      }

      if (
        Array.isArray(target) &&
        target.includes("email")
      ) {
        return res.status(400).json({
          message: "Email นี้มีผู้ใช้งานแล้ว",
          field: "email",
        });
      }

      if (
        Array.isArray(target) &&
        target.includes("storeName")
      ) {
        return res.status(400).json({
          message: "ชื่อร้านนี้มีผู้ใช้งานแล้ว",
          field: "storeName",
        });
      }

      return res.status(400).json({
        message:
          "ข้อมูลบางอย่างมีอยู่ในระบบแล้ว",
      });
    }

    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.removeStore = async (req, res) => {
  //ไม่ลบแต่เปลี่ยนสถานะ ติดไว้
  try {
    const storeId = req.store.id;

    await prisma.store.update({
      where: {
        id: Number(storeId),
      },
      data: {
        accountStatus: "SUSPENDED", // login ไม่ได้แล้ว
        status: "DELETED", // ไม่แสดงหน้าบ้าน
      },
    });
    res.send({ message: "ปิดบัญชีสำเร็จ" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.changeStoreStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const storeId = req.store.id;

    const allowedStatus = ["OPEN", "CLOSED", "BUSY", "DELETED"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        message: "สถานะร้านไม่ถูกต้อง",
      });
    }

    const store = await prisma.store.findUnique({
      where: {
        id: storeId,
      },
      include: {
        images: true,
      },
    });

    if (!store) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลร้าน",
      });
    }

    // ==========================================
    // เปิดร้าน
    // ==========================================

    if (status === "OPEN") {
      // ร้านต้องได้รับการอนุมัติก่อน
      if (store.accountStatus !== "ACTIVE") {
        return res.status(403).json({
          message: "ร้านยังไม่ได้รับการอนุมัติจากผู้ดูแลระบบ",
          accountStatus: store.accountStatus,
        });
      }

      const missingFields = [];

      if (!store.storeName?.trim()) {
        missingFields.push("ชื่อร้าน");
      }

      if (!store.phone?.trim()) {
        missingFields.push("เบอร์โทรศัพท์");
      }

      if (!store.address?.trim()) {
        missingFields.push("ที่อยู่ร้าน");
      }

      if (!store.dayOpen?.trim()) {
        missingFields.push("วันเปิดร้าน");
      }

      if (!store.timeOpen?.trim()) {
        missingFields.push("เวลาเปิดร้าน");
      }

      if (!store.timeClose?.trim()) {
        missingFields.push("เวลาปิดร้าน");
      }

      const qrImage = store.images?.find((image) =>
        image.public_id?.startsWith("StoreQR")
      );

      if (!qrImage) {
        missingFields.push("QR ร้าน");
      }

      if (missingFields.length > 0) {
        return res.status(400).json({
          message: "กรุณากรอกข้อมูลร้านให้ครบก่อนเปิดร้าน",
          missingFields,
        });
      }
    }

    // ==========================================
    // เปลี่ยนสถานะร้าน
    // ==========================================

    const updatedStore = await prisma.store.update({
      where: {
        id: storeId,
      },
      data: {
        status: status,
      },
      include: {
        images: true,
      },
    });

    return res.status(200).json({
      message:
        status === "OPEN"
          ? "เปิดร้านสำเร็จ"
          : status === "CLOSED"
            ? "ปิดร้านสำเร็จ"
            : "เปลี่ยนสถานะร้านสำเร็จ",
      store: updatedStore,
    });
  } catch (error) {
    console.error("changeStoreStatus Error =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};


exports.changeOrderMode = async (req, res) => {
  try {
    const { orderMode } = req.body;
    const storeId = req.store.id;

    // เช็กว่ามีรอบที่กำลังเปิดอยู่หรือไม่
    const activeRound = await prisma.orderRound.findFirst({
      where: {
        storeId,
        status: "OPEN",
      },
    });

    if (activeRound) {
      return res.status(400).json({
        message:
          "ยังมีรอบรับออเดอร์ที่เปิดอยู่ กรุณาปิดรอบหรือรอให้รอบสิ้นสุดก่อนเปลี่ยนโหมด",
      });
    }

    // เปลี่ยนโหมด
    const result = await prisma.store.update({
      where: {
        id: storeId,
      },
      data: {
        orderMode,
      },
    });

    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.storeImagesMenu = async (req, res) => {
  try {
    const storeId = Number(req.store?.id);
    const menuId = Number(req.body.menuId);
    const { image } = req.body;

    // =========================
    // CHECK STORE
    // =========================
    if (!storeId) {
      return res.status(401).json({
        message: "ไม่พบข้อมูลร้านค้า",
      });
    }

    // =========================
    // CHECK MENU
    // =========================
    if (!menuId || Number.isNaN(menuId)) {
      return res.status(400).json({
        message: "ไม่พบรหัสเมนู",
      });
    }

    // =========================
    // CHECK IMAGE
    // =========================
    if (!image) {
      return res.status(400).json({
        message: "ไม่พบรูปเมนู",
      });
    }

    // =========================
    // CHECK MENU OWN STORE
    // =========================
    const menu = await prisma.menu.findFirst({
      where: {
        id: menuId,
        storeId,
      },
    });

    if (!menu) {
      return res.status(404).json({
        message: "ไม่พบเมนูของร้านนี้",
      });
    }

    // =========================
    // UPLOAD CLOUDINARY
    // =========================
    const result = await cloudinary.uploader.upload(image, {
      public_id: `menu-${menuId}-${Date.now()}`,
      resource_type: "image",
      folder: "FoodDelivery2026",
    });

    // =========================
    // ลบรูปเดิมของเมนู
    // =========================
    const oldImages = await prisma.image.findMany({
      where: {
        menuId,
        storeId,
      },
    });

    // ลบข้อมูลรูปเก่าออกจาก Database
    await prisma.image.deleteMany({
      where: {
        menuId,
        storeId,
      },
    });

    // =========================
    // CREATE IMAGE ใหม่
    // =========================
    const imageData = await prisma.image.create({
      data: {
        asset_id: result.asset_id,
        public_id: result.public_id,
        url: result.url,
        secure_url: result.secure_url,
        menuId: menu.id,
        storeId,
      },
    });

    // =========================
    // ลบรูปเก่าจาก Cloudinary
    // =========================
    for (const oldImage of oldImages) {
      if (oldImage.public_id) {
        try {
          await cloudinary.uploader.destroy(oldImage.public_id);
        } catch (cloudinaryError) {
          console.log(
            "ลบรูปเก่าจาก Cloudinary ไม่สำเร็จ =",
            cloudinaryError.message
          );
        }
      }
    }

    return res.status(200).json({
      message: "อัปโหลดรูปเมนูสำเร็จ",
      image: imageData,
    });
  } catch (error) {
    console.error("storeImagesMenu Error =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.storeImages = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(
      req.body.image,
      {
        public_id: `Krittiyakorn-${Date.now()}`,
        resource_type: "auto",
        folder: "StoreProfile2026",
      }
    );

    const image = await prisma.image.create({
      data: {
        asset_id: result.asset_id,
        public_id: result.public_id,
        url: result.url,
        secure_url: result.secure_url,
        storeId: req.store.id,
      },
    });

    return res.status(200).json(image);
  } catch (error) {
    console.error("storeImages Error =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.storeBanner = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(
      req.body.image,
      {
        public_id: `Krittiyakorn-${Date.now()}`,
        resource_type: "auto",
        folder: "StoreBanner2026",
      }
    );

    const image = await prisma.image.create({
      data: {
        asset_id: result.asset_id,
        public_id: result.public_id,
        url: result.url,
        secure_url: result.secure_url,
        storeId: req.store.id,
      },
    });

    return res.status(200).json(image);
  } catch (error) {
    console.error("storeBanner Error =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};


exports.storeQR = async (req, res) => {
  try {
    const storeId = Number(req.store?.id);

    if (!storeId) {
      return res.status(401).json({
        message: "ไม่พบข้อมูลร้านค้า",
      });
    }

    if (!req.body.image) {
      return res.status(400).json({
        message: "กรุณาเลือกรูป QR Code",
      });
    }

    // =====================================================
    // 1. อัปโหลด QR ใหม่ก่อน
    // =====================================================
    const result = await cloudinary.uploader.upload(req.body.image, {
      public_id: `krittiyakorn-${Date.now()}`,
      resource_type: "image",
      folder: "StoreQR2026",
    });

    // =====================================================
    // 2. บันทึก QR ใหม่ลง Prisma
    // =====================================================
    const newImage = await prisma.image.create({
      data: {
        asset_id: result.asset_id,
        public_id: result.public_id,
        url: result.url,
        secure_url: result.secure_url,
        storeId,
      },
    });

    // =====================================================
    // 3. ค้นหา QR เก่าของร้าน
    // =====================================================
    const oldImages = await prisma.image.findMany({
      where: {
        storeId,
        public_id: {
          startsWith: "StoreQR2026/",
        },
        id: {
          not: newImage.id,
        },
      },
    });

    // =====================================================
    // 4. ลบ QR เก่าออกจาก Cloudinary + Prisma
    // =====================================================
    for (const oldImage of oldImages) {
      try {
        await cloudinary.uploader.destroy(oldImage.public_id);
      } catch (cloudinaryError) {
        console.error(
          "ลบ QR เก่าจาก Cloudinary ไม่สำเร็จ =",
          cloudinaryError
        );
      }

      try {
        await prisma.image.delete({
          where: {
            id: oldImage.id,
          },
        });
      } catch (prismaError) {
        console.error(
          "ลบ QR เก่าจาก Prisma ไม่สำเร็จ =",
          prismaError
        );
      }
    }

    // =====================================================
    // 5. ส่งข้อมูล QR ใหม่กลับ
    // =====================================================
    return res.status(200).json({
      message: "อัปโหลด QR Code สำเร็จ",
      image: newImage,
    });
  } catch (error) {
    console.error("storeQR Error =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.storeVerify = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(
      req.body.image,
      {
        public_id: `Krittiyakorn-${Date.now()}`,
        resource_type: "auto",
        folder: "Verify2026",
      }
    );

    const image = await prisma.image.create({
      data: {
        asset_id: result.asset_id,
        public_id: result.public_id,
        url: result.url,
        secure_url: result.secure_url,
        storeId: req.store.id,
      },
    });

    return res.status(200).json(image);
  } catch (error) {
    console.error("storeVerify Error =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.storeRemoveImagesMenu = async (req, res) => {
  try {
    const { public_id } = req.body;
    const storeId = Number(req.store.id);

    if (!public_id) {
      return res.status(400).json({
        message: "ไม่พบ public_id",
      });
    }

    const image = await prisma.image.findFirst({
      where: {
        public_id,

        menu: {
          storeId,
        },
      },
    });

    if (!image) {
      return res.status(404).json({
        message: "ไม่พบรูปเมนูของร้านนี้",
      });
    }

    await cloudinary.uploader.destroy(
      public_id
    );

    await prisma.image.delete({
      where: {
        id: image.id,
      },
    });

    return res.status(200).json({
      message: "ลบรูปเมนูสำเร็จ",
    });
  } catch (error) {
    console.error(
      "storeRemoveImagesMenu Error =",
      error
    );

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.storeRemoveImages = async (req, res) => {
  try {
    const { public_id } = req.body;
    const storeId = Number(req.store.id);

    if (!public_id) {
      return res.status(400).json({
        message: "ไม่พบ public_id",
      });
    }

    // ตรวจว่ารูปเป็นของร้านนี้จริง
    const image = await prisma.image.findFirst({
      where: {
        public_id,
        storeId,
      },
    });

    if (!image) {
      return res.status(404).json({
        message: "ไม่พบรูปภาพของร้านนี้",
      });
    }

    // ลบจาก Cloudinary
    await cloudinary.uploader.destroy(public_id);

    // ลบจาก Database
    await prisma.image.delete({
      where: {
        id: image.id,
      },
    });

    return res.status(200).json({
      message: "ลบรูปโปรไฟล์สำเร็จ",
    });
  } catch (error) {
    console.error(
      "storeRemoveImages Error =",
      error
    );

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.storeRemoveBanner = async (req, res) => {
  try {
    const { public_id } = req.body;
    const storeId = Number(req.store.id);

    if (!public_id) {
      return res.status(400).json({
        message: "ไม่พบ public_id",
      });
    }

    // ตรวจว่ารูปเป็นของร้านนี้จริง
    const image = await prisma.image.findFirst({
      where: {
        public_id,
        storeId,
      },
    });

    if (!image) {
      return res.status(404).json({
        message: "ไม่พบ Banner ของร้านนี้",
      });
    }

    // ลบจาก Cloudinary
    await cloudinary.uploader.destroy(public_id);

    // ลบจาก Database
    await prisma.image.delete({
      where: {
        id: image.id,
      },
    });

    return res.status(200).json({
      message: "ลบ Banner สำเร็จ",
    });
  } catch (error) {
    console.error(
      "storeRemoveBanner Error =",
      error
    );

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.storeRemoveQR = async (req, res) => {
  try {
    const { public_id } = req.body;
    const storeId = Number(req.store?.id);

    if (!storeId) {
      return res.status(401).json({
        message: "ไม่พบข้อมูลร้านค้า",
      });
    }

    if (!public_id) {
      return res.status(400).json({
        message: "ไม่พบ public_id",
      });
    }

    // =====================================================
    // 1. ตรวจสอบว่ารูปนี้เป็นของร้านจริง
    // =====================================================
    const image = await prisma.image.findFirst({
      where: {
        public_id,
        storeId,
      },
    });

    if (!image) {
      return res.status(404).json({
        message: "ไม่พบ QR Code ของร้านนี้",
      });
    }

    // =====================================================
    // 2. ลบจาก Cloudinary
    // =====================================================
    await cloudinary.uploader.destroy(public_id);

    // =====================================================
    // 3. ลบจาก Prisma
    // =====================================================
    await prisma.image.delete({
      where: {
        id: image.id,
      },
    });

    return res.status(200).json({
      message: "ลบ QR Code สำเร็จ",
    });
  } catch (error) {
    console.error("storeRemoveQR Error =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.storeRemoveVerify = async (req, res) => {
  try {
    const { public_id } = req.body;
    const storeId = Number(req.store.id);

    if (!public_id) {
      return res.status(400).json({
        message: "ไม่พบ public_id",
      });
    }

    // ==========================================
    // ตรวจว่ารูปเป็นของร้านนี้
    // ==========================================

    const image = await prisma.image.findFirst({
      where: {
        public_id,
        storeId,

        // ต้องเป็นรูป Verify เท่านั้น
        public_id: {
          startsWith: "Verify2026",
        },
      },
    });

    if (!image) {
      return res.status(404).json({
        message: "ไม่พบรูปยืนยันตัวตนของร้านนี้",
      });
    }

    // ==========================================
    // ลบจาก Cloudinary
    // ==========================================

    await cloudinary.uploader.destroy(public_id);

    // ==========================================
    // ลบจาก Database
    // ==========================================

    await prisma.image.delete({
      where: {
        id: image.id,
      },
    });

    return res.status(200).json({
      message: "ลบรูปยืนยันตัวตนสำเร็จ",
    });
  } catch (error) {
    console.error(
      "storeRemoveVerify Error =",
      error
    );

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// GET /api/categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.storeCategory.findMany()
    res.send(categories)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}