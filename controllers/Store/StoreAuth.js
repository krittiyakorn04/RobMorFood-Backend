const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");



exports.register = async (req, res) => {
  try {
    const {
      password,
      username,
      phone,
      email,
      storeCategoryIds,
      Notice,
      storeName,
      address,
      dayOpen,
      timeOpen,
      timeClose,
      openAuto,
      lat,
      lng,
    } = req.body;

    // =========================
    // ตรวจข้อมูลพื้นฐาน
    // =========================

    const cleanUsername =
      typeof username === "string" ? username.trim() : "";

    const cleanEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    const cleanStoreName =
      typeof storeName === "string" ? storeName.trim() : "";

    const cleanAddress =
      typeof address === "string" ? address.trim() : "";

    if (!cleanUsername) {
      return res.status(400).json({
        message: "กรุณากรอก Username",
      });
    }

    if (typeof password !== "string" || !password) {
      return res.status(400).json({
        message: "กรุณากรอก Password",
      });
    }

    if (typeof phone !== "string" || !/^0\d{9}$/.test(phone)) {
      return res.status(400).json({
        message: "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก โดยขึ้นต้นด้วย 0",
      });
    }

    // ตรวจสอบอีเมล
    if (
      !cleanEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        message: "กรุณากรอกอีเมลให้ถูกต้อง",
      });
    }

    if (!cleanStoreName) {
      return res.status(400).json({
        message: "กรุณากรอกชื่อร้าน",
      });
    }

    if (!cleanAddress) {
      return res.status(400).json({
        message: "กรุณากรอกที่อยู่ร้าน",
      });
    }

    // =========================
    // ตรวจรหัสผ่าน
    // =========================

    if (
      password.length < 8 ||
      password.length > 64 ||
      /\s/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9\s]/.test(password)
    ) {
      return res.status(400).json({
        message:
          "รหัสผ่านต้องมี 8-64 ตัวอักษร มีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ โดยไม่มีช่องว่าง",
      });
    }

    // =========================
    // ตรวจพิกัดร้าน
    // =========================

    const storeLat =
      lat !== undefined && lat !== null && lat !== ""
        ? Number(lat)
        : null;

    const storeLng =
      lng !== undefined && lng !== null && lng !== ""
        ? Number(lng)
        : null;

    if (
      storeLat === null ||
      storeLng === null ||
      !Number.isFinite(storeLat) ||
      !Number.isFinite(storeLng)
    ) {
      return res.status(400).json({
        message: "กรุณาระบุพิกัดร้าน",
      });
    }

    if (storeLat < -90 || storeLat > 90) {
      return res.status(400).json({
        message: "Latitude ไม่ถูกต้อง",
      });
    }

    if (storeLng < -180 || storeLng > 180) {
      return res.status(400).json({
        message: "Longitude ไม่ถูกต้อง",
      });
    }

    // =========================
    // ตรวจ Category
    // =========================

    if (
      !Array.isArray(storeCategoryIds) ||
      storeCategoryIds.length === 0
    ) {
      return res.status(400).json({
        message: "กรุณาเลือกประเภทร้านอย่างน้อย 1 ประเภท",
      });
    }

    if (storeCategoryIds.length > 3) {
      return res.status(400).json({
        message: "เลือกประเภทร้านได้ไม่เกิน 3 ประเภท",
      });
    }

    const categoryIds = storeCategoryIds.map((id) => {
      const categoryId = Number(id);

      if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return null;
      }

      return categoryId;
    });

    if (categoryIds.some((id) => id === null)) {
      return res.status(400).json({
        message: "ประเภทของร้านไม่ถูกต้อง",
      });
    }

    const uniqueCategoryIds = [...new Set(categoryIds)];

    if (uniqueCategoryIds.length !== categoryIds.length) {
      return res.status(400).json({
        message: "มีประเภทร้านซ้ำกัน กรุณาเลือกใหม่",
      });
    }

    // =========================
    // ตรวจ Category ว่ามีจริง
    // =========================

    const categories = await prisma.storeCategory.findMany({
      where: {
        id: {
          in: uniqueCategoryIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (categories.length !== uniqueCategoryIds.length) {
      return res.status(400).json({
        message: "มีประเภทร้านบางรายการไม่พบในระบบ",
      });
    }

    // =========================
    // เช็ค Customer ซ้ำ
    // =========================

    const user = await prisma.customer.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { phone },
          { email: cleanEmail },
        ],
      },
    });

    if (user) {
      return res.status(400).json({
        message: "ชื่อผู้ใช้ เบอร์โทรศัพท์ หรืออีเมลนี้ถูกใช้งานแล้ว",
      });
    }

    // =========================
    // เช็ค Store ซ้ำ
    // =========================

    const store = await prisma.store.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { phone },
          { email: cleanEmail },
          { storeName: cleanStoreName },
        ],
      },
    });

    if (store) {
      return res.status(400).json({
        message:
          "ชื่อผู้ใช้ เบอร์โทรศัพท์ อีเมล หรือชื่อร้านนี้ถูกใช้งานแล้ว",
      });
    }

    // =========================
    // Hash Password
    // =========================

    const hashPassword = await bcrypt.hash(password, 10);

    // =========================
    // สร้าง Store
    // =========================

    const newStore = await prisma.store.create({
      data: {
        password: hashPassword,
        username: cleanUsername,
        phone,
        email: cleanEmail,
        Notice,
        storeName: cleanStoreName,
        address: cleanAddress,

        dayOpen: JSON.stringify(dayOpen || ""),
        timeOpen: timeOpen || "",
        timeClose: timeClose || "",
        openAuto: Boolean(openAuto),

        lat: storeLat,
        lng: storeLng,

        storeCategories: {
          create: uniqueCategoryIds.map((categoryId) => ({
            storeCategoryId: categoryId,
          })),
        },
      },

      include: {
        storeCategories: {
          include: {
            storeCategory: true,
          },
        },
      },
    });

    // =========================
    // JWT Payload
    // =========================

    const payload = {
      id: newStore.id,
      username: newStore.username,
      role: newStore.role,
    };

    // =========================
    // Generate Token
    // =========================

    jwt.sign(
      payload,
      process.env.SECRET,
      {
        expiresIn: "1d",
      },
      (err, token) => {
        if (err) {
          return res.status(500).json({
            message: "Server Error",
          });
        }

        return res.status(201).json({
          payload,
          token,
          store: newStore,
        });
      }
    );
  } catch (error) {
    console.error("REGISTER STORE ERROR =================");
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};


exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "กรุณากรอก username และ password",
      });
    }

    // =========================
    // 1. Login ร้านค้า
    // =========================
    const store = await prisma.store.findFirst({
      where: {
        username,
      },
    });

    if (store) {
      const checkPassword = await bcrypt.compare(
        password,
        store.password
      );

      if (!checkPassword) {
        return res.status(400).json({
          message: "Username หรือ Password ไม่ถูกต้อง",
        });
      }

      if (
        store.accountStatus === "SUSPENDED" ||
        store.accountStatus === "BANNED"
      ) {
        return res.status(403).json({
          message: "บัญชีร้านค้านี้ไม่สามารถเข้าใช้งานได้",
        });
      }

      const payload = {
        id: store.id,
        username: store.username,
        role: "MERCHANT",
        storeName: store.storeName,
      };

      const token = jwt.sign(
        payload,
        process.env.SECRET,
        {
          expiresIn: "7d",
        }
      );

      return res.status(200).json({
        message: "เข้าสู่ระบบสำเร็จ",
        token,
        payload,
      });
    }

    // =========================
    // 2. Login คนส่ง
    // =========================
    const staff = await prisma.storeStaff.findUnique({
      where: {
        username,
      },
    });

    if (!staff) {
      return res.status(400).json({
        message: "Username หรือ Password ไม่ถูกต้อง",
      });
    }

    const checkPassword = await bcrypt.compare(
      password,
      staff.password
    );

    if (!checkPassword) {
      return res.status(400).json({
        message: "Username หรือ Password ไม่ถูกต้อง",
      });
    }

    if (!staff.isActive) {
      return res.status(403).json({
        message: "บัญชีคนส่งถูกปิดใช้งาน",
      });
    }

    const payload = {
      id: staff.id,
      username: staff.username,
      role: "DELIVERY",
      storeId: staff.storeId,
      name: staff.name,
    };

    const token = jwt.sign(
      payload,
      process.env.SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      payload,
    });

  } catch (error) {
    console.error("loginStore Error =", error);
    return res.status(500).json({
      message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
    });

  }
};


exports.currentRestau = async (req, res) => {
  try {
    const store = await prisma.store.findFirst({
      where: { id: req.store.id },
      select: {
        id: true,

        username: true,
        storeName: true,
        role: true,
        status: true
      }
    })
    res.json({ store })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

exports.createStoreStaff = async (req, res) => {
  try {
    const storeId = req.store.id;


    const { username, password, name, phone } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({
        message: "กรุณากรอก Username, Password และชื่อคนส่ง",
      });
    }

    if (username.length < 4) {
      return res.status(400).json({
        message: "Username ต้องมีอย่างน้อย 4 ตัวอักษร",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password ต้องมีอย่างน้อย 6 ตัวอักษร",
      });
    }

    // ตรวจ Username ซ้ำ
    const existingStaff = await prisma.storeStaff.findUnique({
      where: {
        username,
      },
    });

    if (existingStaff) {
      return res.status(400).json({
        message: "Username นี้ถูกใช้งานแล้ว",
      });
    }

    // เข้ารหัส Password
    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await prisma.storeStaff.create({
      data: {
        storeId,
        username,
        password: hashedPassword,
        name,
        phone: phone || null,
        role: "DELIVERY",
        isActive: true,
      },
      select: {
        id: true,
        storeId: true,
        username: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "สร้างบัญชีคนส่งสำเร็จ",
      staff,
    });


  } catch (error) {
    console.error("createStoreStaff Error =", error);


    return res.status(500).json({
      message: "เกิดข้อผิดพลาดในการสร้างบัญชีคนส่ง",
    });


  }
};

exports.getStoreStaff = async (req, res) => {
  try {
    const storeId = req.store.id;


    const staff = await prisma.storeStaff.findMany({
      where: {
        storeId,
      },
      select: {
        id: true,
        storeId: true,
        username: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      staff,
    });


  } catch (error) {
    console.error("getStoreStaff Error =", error);


    return res.status(500).json({
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลคนส่ง",
    });


  }
};

exports.changeStoreStaffStatus = async (req, res) => {
  try {
    const storeId = req.store.id;
    const staffId = Number(req.params.id);


    if (!staffId || Number.isNaN(staffId)) {
      return res.status(400).json({
        message: "รหัสคนส่งไม่ถูกต้อง",
      });
    }

    const staff = await prisma.storeStaff.findFirst({
      where: {
        id: staffId,
        storeId,
      },
    });

    if (!staff) {
      return res.status(404).json({
        message: "ไม่พบบัญชีคนส่ง",
      });
    }

    const updatedStaff = await prisma.storeStaff.update({
      where: {
        id: staff.id,
      },
      data: {
        isActive: !staff.isActive,
      },
      select: {
        id: true,
        username: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    return res.status(200).json({
      message: updatedStaff.isActive
        ? "เปิดใช้งานบัญชีคนส่งแล้ว"
        : "ปิดใช้งานบัญชีคนส่งแล้ว",
      staff: updatedStaff,
    });


  } catch (error) {
    console.error("changeStoreStaffStatus Error =", error);


    return res.status(500).json({
      message: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะบัญชีคนส่ง",
    });


  }
};

exports.updateStoreStaff = async (req, res) => {
  try {
    const storeId = req.store.id;
    const staffId = Number(req.params.id);


    const { name, phone, password } = req.body;

    if (!staffId || Number.isNaN(staffId)) {
      return res.status(400).json({
        message: "รหัสคนส่งไม่ถูกต้อง",
      });
    }

    const staff = await prisma.storeStaff.findFirst({
      where: {
        id: staffId,
        storeId,
      },
    });

    if (!staff) {
      return res.status(404).json({
        message: "ไม่พบบัญชีคนส่ง",
      });
    }

    const data = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          message: "กรุณาระบุชื่อคนส่ง",
        });
      }

      data.name = name.trim();
    }

    if (phone !== undefined) {
      data.phone = phone || null;
    }

    if (password !== undefined && password !== "") {
      if (password.length < 6) {
        return res.status(400).json({
          message: "Password ต้องมีอย่างน้อย 6 ตัวอักษร",
        });
      }

      data.password = await bcrypt.hash(password, 10);
    }

    const updatedStaff = await prisma.storeStaff.update({
      where: {
        id: staff.id,
      },
      data,
      select: {
        id: true,
        storeId: true,
        username: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      message: "แก้ไขข้อมูลคนส่งสำเร็จ",
      staff: updatedStaff,
    });


  } catch (error) {
    console.error("updateStoreStaff Error =", error);


    return res.status(500).json({
      message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลคนส่ง",
    });

  }
};

