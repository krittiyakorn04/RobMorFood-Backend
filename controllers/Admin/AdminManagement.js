const prisma = require("../../config/prisma")

// ดึงร้านอาหารทั้งหมด
exports.getAllStores = async (req, res) => {
  try {
    const stores = await prisma.store.findMany({
      include: {
        storeCategories: true,

        menuCategories: true,

        menus: {
          include: {
            category: true,
            images: true,
            options: {
              include: {
                choices: true,
              },
            },
          },
        },

        images: true,

        orderRound: true,

        deliveryRounds: true,

        reviews: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    res.send(stores);
  } catch (error) {
    console.log(
      "getAllStores Error =",
      error
    );

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// เปลี่ยนสถานะร้านอาหาร
exports.changeStoreStatus = async (req, res) => {
  try {
    const storeId = Number(req.params.id);
    const { status } = req.body;

    if (!storeId || isNaN(storeId)) {
      return res.status(400).json({
        message: "รหัสร้านไม่ถูกต้อง",
      });
    }

    const allowedStatus = [
      "PENDING",
      "ACTIVE",
      "SUSPENDED",
      "BANNED",
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        message: "สถานะร้านไม่ถูกต้อง",
      });
    }

    const store = await prisma.store.update({
      where: {
        id: storeId,
      },
      data: {
        accountStatus: status,

        // ถ้าไม่ได้ ACTIVE ให้บังคับปิดร้าน
        ...(status !== "ACTIVE" && {
          status: "CLOSED",
        }),
      },
    });

    return res.status(200).json({
      message: "เปลี่ยนสถานะร้านสำเร็จ",
      store,
    });
  } catch (error) {
    console.log("changeStoreStatus Error =", error);

    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.getAllCustomer = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      customers,
    });

  } catch (error) {
    console.log("Get All Customer Error =", error);

    return res.status(500).json({
      message: "Server Error",
    });

  }
};

exports.changeCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const customerId = Number(id);

    if (!customerId || Number.isNaN(customerId)) {
      return res.status(400).json({
        message: "รหัสสมาชิกไม่ถูกต้อง",
      });
    }

    if (!status) {
      return res.status(400).json({
        message: "กรุณาระบุสถานะ",
      });
    }

    if (!["ACTIVE", "BANNED"].includes(status)) {
      return res.status(400).json({
        message: "สถานะไม่ถูกต้อง",
      });
    }

    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        message: "ไม่พบสมาชิก",
      });
    }

    const updatedCustomer = await prisma.customer.update({
      where: {
        id: customerId,
      },
      data: {
        status,
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      message:
        status === "BANNED"
          ? "ระงับสมาชิกสำเร็จ"
          : "เปิดใช้งานสมาชิกสำเร็จ",
      customer: updatedCustomer,
    });
  } catch (error) {
    console.log("Change Customer Status Error =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};


exports.createStoreCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "กรุณาระบุชื่อหมวดหมู่",
      });
    }

    // ตรวจสอบว่าเป็น Admin ที่ Login อยู่
    if (!req.admin?.id) {
      return res.status(401).json({
        message: "ไม่พบข้อมูล Admin",
      });
    }

    const categoryName = name.trim();

    const existCategory = await prisma.storeCategory.findFirst({
      where: {
        name: categoryName,
      },
    });

    if (existCategory) {
      return res.status(400).json({
        message: "หมวดหมู่นี้มีอยู่แล้ว",
      });
    }

    const category = await prisma.storeCategory.create({
      data: {
        name: categoryName,
        adminId: req.admin.id,
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "เพิ่มหมวดหมู่สำเร็จ",
      category,
    });
  } catch (error) {
    console.log("Create Store Category Error =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.getStoreCategories = async (req, res) => {
  try {
    const categories = await prisma.storeCategory.findMany({
      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json({
      categories,
    });
  } catch (error) {
    console.log("Get Store Categories Error =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.updateStoreCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const categoryId = Number(id);

    if (!categoryId || Number.isNaN(categoryId)) {
      return res.status(400).json({
        message: "รหัสหมวดหมู่ไม่ถูกต้อง",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "กรุณาระบุชื่อหมวดหมู่",
      });
    }

    const categoryName = name.trim();

    const category = await prisma.storeCategory.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return res.status(404).json({
        message: "ไม่พบหมวดหมู่นี้",
      });
    }

    // เช็กว่าชื่อใหม่ซ้ำกับหมวดหมู่อื่นหรือไม่
    const existCategory = await prisma.storeCategory.findFirst({
      where: {
        name: categoryName,
        NOT: {
          id: categoryId,
        },
      },
    });

    if (existCategory) {
      return res.status(400).json({
        message: "มีหมวดหมู่นี้อยู่แล้ว",
      });
    }

    const updatedCategory = await prisma.storeCategory.update({
      where: {
        id: categoryId,
      },
      data: {
        name: categoryName,
      },
    });

    return res.status(200).json({
      message: "แก้ไขหมวดหมู่สำเร็จ",
      category: updatedCategory,
    });
  } catch (error) {
    console.log("Update Store Category Error =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};


exports.deleteStoreCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const categoryId = Number(id);

    if (!categoryId || Number.isNaN(categoryId)) {
      return res.status(400).json({
        message: "รหัสหมวดหมู่ไม่ถูกต้อง",
      });
    }

    const category = await prisma.storeCategory.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return res.status(404).json({
        message: "ไม่พบหมวดหมู่นี้",
      });
    }

    await prisma.storeCategory.delete({
      where: {
        id: categoryId,
      },
    });

    return res.status(200).json({
      message: "ลบหมวดหมู่สำเร็จ",
    });
  } catch (error) {
    console.log("Delete Store Category Error =", error);

    return res.status(500).json({
      message: "ไม่สามารถลบหมวดหมู่ได้",
    });
  }
};

exports.createDeliveryZone = async (req, res) => {
  try {

    const { name } = req.body

    if (!name) {
      return res.status(400).json({ messege: "name DeliveryZone is require!!!" });
    }

    const existDeliveryZone = await prisma.storeCategory.findFirst({
      where: {
        name
      }
    })

    if (existCategory) {
      return res.status(400).json({ message: "This Category already exits!!" });
    }

    const category = await prisma.storeCategory.create({
      data: {
        name
      }
    })

    res.send(category);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};