const prisma = require("../../config/prisma");

//เสร็จ เหลือFilters
exports.getMenu = async (req, res) => {
  try {
    const storeId = req.store.id;

    const menus = await prisma.menu.findMany({
      where: {
        storeId,
      },
      include: {
        images: true,
        options: {
          include: {
            choices: true,
          },
        },
        menuItems: {
          where: {
            orderId: {
              not: null,
            },
            order: {
              status: "COMPLETED",
            },
          },
          select: {
            count: true,
          },
        },
        menuOptionFormats: {
          include: {
            format: {
              include: {
                choices: {
                  orderBy: {
                    sortOrder: "asc",
                  },
                },
              },
            },
          },
        },
      },
    });

    const result = [];

    for (const menu of menus) {
      const sold = menu.menuItems.reduce(
        (total, item) => total + Number(item.count || 0),
        0,
      );

      // อัปเดตยอดขายลงฐานข้อมูล
      if (menu.sold !== sold) {
        await prisma.menu.update({
          where: {
            id: menu.id,
          },
          data: {
            sold,
          },
        });
      }

      const { menuItems, ...menuData } = menu;

      result.push({
        ...menuData,
        sold,
      });
    }

    res.json(result);
  } catch (error) {
    console.log("GET MENU ERROR =", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.readMenu = async (req, res) => {
  try {

    const menu = await prisma.menu.findFirst({
      where: {
        id: Number(req.params.id),
        storeId: req.store.id
      },
      include: {
        images: true,

        options: {
          include: {
            choices: true,
          },
        },

        menuOptionFormats: {
          include: {
            format: {
              include: {
                choices: {
                  orderBy: {
                    sortOrder: "asc",
                  },
                },
              },
            },
          },
        },
      },
    })


    res.json(menu)

  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: "Server Error"
    })
  }
}

exports.addMenu = async (req, res) => {
  try {
    const {
      menuItem,
      categoryId,
      description,
      price,
      images,
      options,
      formatIds,
    } = req.body;

    const storeId = req.store.id;

    const category = await prisma.menuCategory.findFirst({
      where: {
        id: Number(categoryId),
        storeId,
      },
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    if (!menuItem) {
      return res.status(400).json({
        message: "name Menu is require!!!",
      });
    }

    const existMenu = await prisma.menu.findFirst({
      where: {
        storeId,
        menuItem,
      },
    });

    if (existMenu) {
      return res.status(400).json({
        message: "This Menu already exits!!",
      });
    }

    // =========================
    // ตรวจสอบ Format
    // =========================
    const validFormatIds = Array.isArray(formatIds)
      ? formatIds.map(Number).filter(Boolean)
      : [];

    if (validFormatIds.length > 0) {
      const formats = await prisma.optionFormat.findMany({
        where: {
          id: {
            in: validFormatIds,
          },
          storeId,
        },
        select: {
          id: true,
        },
      });

      if (formats.length !== validFormatIds.length) {
        return res.status(400).json({
          message: "พบรูปแบบตัวเลือกที่ไม่ใช่ของร้านนี้",
        });
      }
    }

    // =========================
    // สร้าง Menu
    // =========================
    const menu = await prisma.menu.create({
      data: {
        storeId,
        categoryId: parseInt(categoryId),
        menuItem,
        price: parseFloat(price),
        description,

        // รูปภาพ
        images: {
          create: (images || []).map((item) => ({
            asset_id: item.asset_id,
            public_id: item.public_id,
            url: item.url,
            secure_url: item.secure_url,
          })),
        },

        // =========================
        // ระบบ Option เก่า
        // =========================
        options: {
          create:
            options?.map((opt) => ({
              label: opt.label,
              required: opt.required ?? false,
              maxRequire: Number(opt.maxRequire || 1),

              choices: {
                create:
                  opt.choices?.map((c) => ({
                    name: c.name,
                    extraPrice: parseFloat(c.extraPrice || 0),
                  })) || [],
              },
            })) || [],
        },

        // =========================
        // ระบบ Option Format ใหม่
        // =========================
        menuOptionFormats: {
          create: validFormatIds.map((formatId) => ({
            formatId,
          })),
        },
      },

      include: {
        options: {
          include: {
            choices: true,
          },
        },

        menuOptionFormats: {
          include: {
            format: {
              include: {
                choices: {
                  orderBy: {
                    sortOrder: "asc",
                  },
                },
              },
            },
          },
        },
      },
    });

    return res.status(201).json({
      message: "เพิ่มเมนูเรียบร้อยแล้ว",
      menu,
    });
  } catch (error) {
    console.log("ADD MENU ERROR =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.updateMenu = async (req, res) => {
  try {
    const {
      menuItem,
      categoryId,
      description,
      price,
      images,
      options,
      formatIds,
    } = req.body;

    const storeId = req.store.id;
    const menuId = Number(req.params.id);

    // =========================
    // ตรวจสอบ Category
    // =========================
    const category = await prisma.menuCategory.findFirst({
      where: {
        id: Number(categoryId),
        storeId,
      },
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    // =========================
    // ตรวจสอบชื่อเมนู
    // =========================
    if (!menuItem) {
      return res.status(400).json({
        message: "name Menu is require!!!",
      });
    }

    // =========================
    // ตรวจสอบเมนูซ้ำ
    // =========================
    const existMenu = await prisma.menu.findFirst({
      where: {
        storeId,
        menuItem,
        NOT: {
          id: menuId,
        },
      },
    });

    if (existMenu) {
      return res.status(400).json({
        message: "This Menu already exits!!",
      });
    }

    // =========================
    // ตรวจสอบว่าเมนูนี้เป็นของร้าน
    // =========================
    const currentMenu = await prisma.menu.findFirst({
      where: {
        id: menuId,
        storeId,
      },
    });

    if (!currentMenu) {
      return res.status(404).json({
        message: "Menu not found.",
      });
    }

    // =========================
    // ตรวจสอบ Format
    // =========================
    const validFormatIds = Array.isArray(formatIds)
      ? formatIds.map(Number).filter(Boolean)
      : [];

    if (validFormatIds.length > 0) {
      const formats = await prisma.optionFormat.findMany({
        where: {
          id: {
            in: validFormatIds,
          },
          storeId,
        },
        select: {
          id: true,
        },
      });

      if (formats.length !== validFormatIds.length) {
        return res.status(400).json({
          message: "พบรูปแบบตัวเลือกที่ไม่ใช่ของร้านนี้",
        });
      }
    }

    // =========================
    // ลบ Option เก่า
    // =========================
    const oldOptions = await prisma.menuOption.findMany({
      where: {
        menuId,
      },
      select: {
        id: true,
      },
    });

    const oldOptionIds = oldOptions.map((option) => option.id);

    if (oldOptionIds.length > 0) {
      await prisma.optionChoice.deleteMany({
        where: {
          optionId: {
            in: oldOptionIds,
          },
        },
      });

      await prisma.menuOption.deleteMany({
        where: {
          menuId,
        },
      });
    }

    // =========================
    // ลบ Format ที่ผูกกับเมนูเก่า
    // =========================
    await prisma.menuOptionFormat.deleteMany({
      where: {
        menuId,
      },
    });

    // =========================
    // จัดการรูปภาพ
    // =========================
    if (Array.isArray(images) && images.length > 0) {
      // ลบรูปเดิมของเมนู
      await prisma.image.deleteMany({
        where: {
          menuId,
        },
      });
    }

    // =========================
    // Update Menu
    // =========================
    const menu = await prisma.menu.update({
      where: {
        id: menuId,
      },

      data: {
        categoryId: parseInt(categoryId),
        menuItem,
        price: parseFloat(price),
        description,
        images:
          Array.isArray(images) && images.length > 0
            ? {
              create: images.map((item) => ({
                asset_id: item.asset_id,
                public_id: item.public_id,
                url: item.url,
                secure_url: item.secure_url,
              })),
            }
            : undefined,
        // ระบบ Option เก่า
        options: {
          create:
            options?.map((opt) => ({
              label: opt.label,
              required: opt.required ?? false,
              maxRequire: Number(opt.maxRequire || 1),

              choices: {
                create:
                  opt.choices?.map((c) => ({
                    name: c.name,
                    extraPrice: parseFloat(c.extraPrice || 0),
                  })) || [],
              },
            })) || [],
        },

        // ระบบ Format ใหม่
        menuOptionFormats: {
          create: validFormatIds.map((formatId) => ({
            formatId,
          })),
        },
      },

      include: {
        images: true,

        options: {
          include: {
            choices: true,
          },
        },

        menuOptionFormats: {
          include: {
            format: {
              include: {
                choices: {
                  orderBy: {
                    sortOrder: "asc",
                  },
                },
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      message: "แก้ไขเมนูเรียบร้อยแล้ว",
      menu,
    });
  } catch (error) {
    console.log("UPDATE MENU ERROR =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.removeMenu = async (req, res) => {
  try {
    const storeId = req.store.id;
    const menu = await prisma.menu.findFirst({
      where: {
        storeId,
        id: Number(req.params.id),
      },
    });

    if (!menu) {
      return res.status(404).json({ message: "Menu not found!" });
    }

    await prisma.menu.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    res.send("Menu deleted successfully");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.changeAvailabilityStatus = async (req, res) => {
  try {
    const storeId = req.store.id;
    const menuId = Number(req.params.id);

    if (!menuId) {
      return res.status(400).json({
        message: "ไม่พบเมนู",
      });
    }

    const menu = await prisma.menu.findFirst({
      where: {
        id: menuId,
        storeId,
      },
    });

    if (!menu) {
      return res.status(404).json({
        message: "ไม่พบเมนูนี้",
      });
    }

    const updatedMenu = await prisma.menu.update({
      where: {
        id: menuId,
      },
      data: {
        isAvailable: !menu.isAvailable,
      },
    });

    return res.status(200).json({
      message: updatedMenu.isAvailable
        ? "เปิดเมนูเรียบร้อยแล้ว"
        : "ปิดเมนูเรียบร้อยแล้ว",
      menu: updatedMenu,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.getMenuBy = async (req, res) => {
  try {
    res.send("Hello Menu By");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getSearchFilters = async (req, res) => {
  try {
    res.send("Hello Search Filters");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};


// =========================
// GET FORMAT ของร้าน
// =========================
exports.getOptionFormats = async (req, res) => {
  try {
    const storeId = req.store.id;

    const formats = await prisma.optionFormat.findMany({
      where: {
        storeId,
      },
      include: {
        choices: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(formats);
  } catch (error) {
    console.log("GET OPTION FORMATS ERROR =", error);

    return res.status(500).json({
      message: "ไม่สามารถโหลดรูปแบบตัวเลือกได้",
    });
  }
};

// =========================
// CREATE FORMAT
// =========================
exports.createOptionFormat = async (req, res) => {
  try {
    const storeId = req.store.id;

    const {
      name,
      required = false,
      maxRequire = 1,
      choices = [],
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "กรุณาระบุชื่อรูปแบบตัวเลือก",
      });
    }

    if (!Array.isArray(choices) || choices.length === 0) {
      return res.status(400).json({
        message: "กรุณาเพิ่มตัวเลือกอย่างน้อย 1 รายการ",
      });
    }

    const format = await prisma.optionFormat.create({
      data: {
        storeId,
        name: name.trim(),
        required: Boolean(required),
        maxRequire: Number(maxRequire) || 1,

        choices: {
          create: choices
            .filter((choice) => choice.name?.trim())
            .map((choice, index) => ({
              name: choice.name.trim(),
              extraPrice: Number(choice.extraPrice) || 0,
              sortOrder: Number(choice.sortOrder ?? index),
            })),
        },
      },

      include: {
        choices: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    return res.status(201).json({
      message: "สร้างรูปแบบตัวเลือกเรียบร้อยแล้ว",
      format,
    });
  } catch (error) {
    console.log("CREATE OPTION FORMAT ERROR =", error);

    return res.status(500).json({
      message: "ไม่สามารถสร้างรูปแบบตัวเลือกได้",
    });
  }
};

exports.updateOptionFormat = async (req, res) => {
  try {
    const storeId = req.store.id;
    const formatId = Number(req.params.id);

    const {
      name,
      required = false,
      maxRequire = 1,
      choices = [],
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "กรุณาระบุชื่อรูปแบบตัวเลือก",
      });
    }

    if (!Array.isArray(choices) || choices.length === 0) {
      return res.status(400).json({
        message: "กรุณาเพิ่มตัวเลือกอย่างน้อย 1 รายการ",
      });
    }

    const oldFormat = await prisma.optionFormat.findFirst({
      where: {
        id: formatId,
        storeId,
      },
    });

    if (!oldFormat) {
      return res.status(404).json({
        message: "ไม่พบรูปแบบตัวเลือก",
      });
    }

    const validChoices = choices.filter(
      (choice) => choice.name?.trim(),
    );

    if (validChoices.length === 0) {
      return res.status(400).json({
        message: "กรุณาเพิ่มตัวเลือกอย่างน้อย 1 รายการ",
      });
    }

    const format = await prisma.$transaction(async (tx) => {
      await tx.optionFormatChoice.deleteMany({
        where: {
          formatId,
        },
      });

      return tx.optionFormat.update({
        where: {
          id: formatId,
        },
        data: {
          name: name.trim(),
          required: Boolean(required),
          maxRequire: Number(maxRequire) || 1,

          choices: {
            create: validChoices.map((choice, index) => ({
              name: choice.name.trim(),
              extraPrice: Number(choice.extraPrice) || 0,
              sortOrder: Number(choice.sortOrder ?? index),
            })),
          },
        },
        include: {
          choices: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      });
    });

    return res.json({
      message: "แก้ไขรูปแบบตัวเลือกเรียบร้อยแล้ว",
      format,
    });
  } catch (error) {
    console.log("UPDATE OPTION FORMAT ERROR =", error);

    return res.status(500).json({
      message: "ไม่สามารถแก้ไขรูปแบบตัวเลือกได้",
    });
  }
};

exports.deleteOptionFormat = async (req, res) => {
  try {
    const storeId = req.store.id;
    const formatId = Number(req.params.id);

    const format = await prisma.optionFormat.findFirst({
      where: {
        id: formatId,
        storeId,
      },
    });

    if (!format) {
      return res.status(404).json({
        message: "ไม่พบรูปแบบตัวเลือก",
      });
    }

    await prisma.optionFormat.delete({
      where: {
        id: formatId,
      },
    });

    return res.json({
      message: "ลบรูปแบบตัวเลือกเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.log("DELETE OPTION FORMAT ERROR =", error);

    return res.status(500).json({
      message: "ไม่สามารถลบรูปแบบตัวเลือกได้",
    });
  }
};