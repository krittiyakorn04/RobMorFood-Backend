const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      username,
      phone,

      storeCategoryIds,

      Notice,
      storeName,
      address,

      dayOpen,
      timeOpen,
      timeClose,
      openAuto,

      promptpayNumber,
      bankName,
      bankAccount,
      bankAccountName,

      lat,
      lng,
    } = req.body;

    // =========================
    // ตรวจข้อมูลพื้นฐาน
    // =========================

    if (!username) {
      return res.status(400).json({
        message: "กรุณากรอก Username",
      });
    }

    if (!email) {
      return res.status(400).json({
        message: "กรุณากรอก Email",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "กรุณากรอก Password",
      });
    }

    if (!phone) {
      return res.status(400).json({
        message: "กรุณากรอกเบอร์โทรศัพท์",
      });
    }

    if (!storeName) {
      return res.status(400).json({
        message: "กรุณากรอกชื่อร้าน",
      });
    }

    if (!address) {
      return res.status(400).json({
        message: "กรุณากรอกที่อยู่ร้าน",
      });
    }

    // =========================
    // ตรวจพิกัด
    // =========================

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

    if (
      storeLat === null ||
      storeLng === null ||
      Number.isNaN(storeLat) ||
      Number.isNaN(storeLng)
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

    const categoryIds = storeCategoryIds
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id));

    if (categoryIds.length === 0) {
      return res.status(400).json({
        message: "ประเภทของร้านไม่ถูกต้อง",
      });
    }

    const uniqueCategoryIds = [...new Set(categoryIds)];

    // =========================
    // ตรวจ Category ว่ามีจริง
    // =========================

    const categories = await prisma.storeCategory.findMany({
      where: {
        id: {
          in: uniqueCategoryIds,
        },
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
          { email },
          { username },
          { phone },
        ],
      },
    });

    if (user) {
      return res.status(400).json({
        message: "ข้อมูลผู้ใช้นี้มีอยู่ในระบบแล้ว",
      });
    }

    // =========================
    // เช็ค Store ซ้ำ
    // =========================

    const store = await prisma.store.findFirst({
      where: {
        OR: [
          { email },
          { username },
          { phone },
          { storeName },
        ],
      },
    });

    if (store) {
      return res.status(400).json({
        message: "ข้อมูลร้านนี้มีอยู่ในระบบแล้ว",
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
        email,
        password: hashPassword,
        username,
        phone,

        Notice,
        storeName,
        address,

        dayOpen: JSON.stringify(dayOpen || ""),

        timeOpen: timeOpen || "",
        timeClose: timeClose || "",
        openAuto: Boolean(openAuto),

        // =========================
        // พิกัดร้าน
        // =========================

        lat: storeLat,
        lng: storeLng,

        // =========================
        // Category
        // ใช้ relation แบบ explicit
        // =========================

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

        return res.json({
          payload,
          token,
          store: newStore,
        });
      }
    );
  } catch (error) {
    console.log(
      "REGISTER STORE ERROR ================="
    );

    console.log(error);

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
        email: true,
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

