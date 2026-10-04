const prisma = require("../../config/prisma");

exports.getAllUserCarts = async (req, res) => {
  try {
    const userId = req.user.id;

    const carts = await prisma.cart.findMany({
      where: {
        orderById: userId,

        // เอาเฉพาะตะกร้าที่มีสินค้า
        menu: {
          some: {},
        },
      },

      orderBy: {
        id: "desc",
      },

      include: {
        store: {
          select: {
            id: true,
            storeName: true,
            phone: true,
            status: true,
            accountStatus: true,
            images: true,
            deliveryFee: true,
          },
        },

        menu: {
          include: {
            menu: {
              include: {
                images: true,
                category: true,

                options: {
                  include: {
                    choices: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const result = carts.map((cart) => ({
      cartId: cart.id,

      storeId: cart.storeId,

      store: cart.store,

      cartTotal: Number(cart.cartTotal || 0),

      totalItems: cart.menu.reduce(
        (total, item) => total + Number(item.count || 0),
        0,
      ),

      menus: cart.menu.map((item) => {
        let options = [];

        try {
          options =
            typeof item.options === "string"
              ? JSON.parse(item.options)
              : item.options || [];

          if (!Array.isArray(options)) {
            options = [];
          }
        } catch {
          options = [];
        }

        return {
          id: item.id,
          menuId: item.menuId,
          count: Number(item.count || 0),
          price: Number(item.price || 0),
          subTotal:
            Number(item.price || 0) *
            Number(item.count || 0),

          options,

          menu: item.menu,

          menuName: item.menu?.menuItem || "",

          image:
            item.menu?.images?.find((image) =>
              String(image.public_id || "").startsWith("Menu"),
            )?.url ||
            item.menu?.images?.[0]?.url ||
            "",
        };
      }),
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error("GET ALL USER CARTS ERROR =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.getUserCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const storeId = Number(req.params.storeId);

    if (!storeId || Number.isNaN(storeId)) {
      return res.status(400).json({
        message: "รหัสร้านไม่ถูกต้อง",
      });
    }

    const cart = await prisma.cart.findFirst({
      where: {
        orderById: userId,
        storeId: storeId,
      },

      include: {
        store: {
          select: {
            id: true,
            storeName: true,
            phone: true,
            status: true,
            accountStatus: true,
            orderMode: true,
            deliveryFee: true,
            images: true,
          },
        },

        menu: {
          include: {
            menu: {
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

        orderRound: true,
      },
    });

    if (!cart) {
      return res.status(404).json({
        message: "ไม่พบตะกร้าของร้านนี้",
      });
    }

    return res.status(200).json({
      cartId: cart.id,

      store: cart.store,

      orderRound: cart.orderRound,

      menus: cart.menu.map((item) => ({
        id: item.id,

        count: item.count,

        price: item.price,

        options: item.options,

        menuId: item.menuId,

        menuName: item.menu?.menuItem || "",

        image:
          item.menu?.images?.find((image) =>
            String(image.public_id || "").startsWith("Menu")
          )?.url ||
          item.menu?.images?.[0]?.url ||
          "",

        menu: item.menu,
      })),

      cartTotal: cart.cartTotal,
    });
  } catch (error) {
    console.log("GET USER CART ERROR =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};


exports.readCart = async (req, res) => {
  try {
    const { id: storeId } = req.params;
    const userId = req.user.id;

    const storeIdNumber = Number(storeId);

    if (
      !storeIdNumber ||
      Number.isNaN(storeIdNumber)
    ) {
      return res.status(400).json({
        message: "รหัสร้านไม่ถูกต้อง",
      });
    }

    // ===================================================== 
    // ค้นหา Cart ของลูกค้ากับร้านนี้ 
    // ===================================================== 
    const cart = await prisma.cart.findFirst({
      where: {
        orderById: userId,
        storeId: storeIdNumber,
      },

      include: {
        store: {
          select: {
            id: true,
            storeName: true,
            phone: true,
            orderMode: true,
            images: true,
            status: true,
            accountStatus: true,
            deliveryFee: true,
          },
        },

        menu: {
          include: {
            menu: {
              include: {
                category: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    // ===================================================== 
    // เวลาปัจจุบัน 
    // ===================================================== 
    const now = new Date();

    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    // ===================================================== 
    // แปลง HH:mm -> นาที 
    // ===================================================== 
    const timeToMinutes = (time) => {
      if (!time) return null;

      const [hour, minute] = String(time)
        .slice(0, 5)
        .split(":")
        .map(Number);

      if (
        Number.isNaN(hour) ||
        Number.isNaN(minute)
      ) {
        return null;
      }

      return hour * 60 + minute;
    };

    // ===================================================== 
    // ดึงรอบของร้าน 
    // ===================================================== 
    const rounds =
      await prisma.orderRound.findMany({
        where: {
          storeId: storeIdNumber,
        },

        orderBy: {
          roundNumber: "asc",
        },
      });

    // ===================================================== 
    // หารอบปัจจุบัน 
    // ===================================================== 
    let currentRound = rounds.find(
      (round) => {
        const start = timeToMinutes(
          round.startTime,
        );

        const end = timeToMinutes(
          round.endTime,
        );

        if (
          start === null ||
          end === null
        ) {
          return false;
        }

        return (
          currentMinutes >= start &&
          currentMinutes < end
        );
      },
    );

    // ===================================================== 
    // หารอบถัดไป 
    // ===================================================== 
    let nextRound = null;

    if (!currentRound) {
      nextRound = rounds.find(
        (round) => {
          const start = timeToMinutes(
            round.startTime,
          );

          return (
            start !== null &&
            start > currentMinutes
          );
        },
      );
    }

    // ===================================================== 
    // คำนวณ Cart 
    // ===================================================== 
    let cartTotal = 0;
    let totalItems = 0;

    const menus = cart.menu.map(
      (item) => {
        let options = [];

        if (
          item.options &&
          item.options !== ""
        ) {
          try {
            options = JSON.parse(
              item.options,
            );

            if (
              !Array.isArray(options)
            ) {
              options = [];
            }
          } catch (error) {
            options = [];
          }
        }

        /* 
         * สำคัญ: 
         * 
         * userCart บันทึก item.price เป็น 
         * ราคาเมนู + ราคา option แล้ว 
         * 
         * ดังนั้นตรงนี้ห้ามเอา optionExtraPrice 
         * มาบวกกับ item.price ซ้ำอีก 
         */

        const subTotal =
          Number(item.price) *
          Number(item.count);

        cartTotal += subTotal;

        totalItems += Number(
          item.count,
        );

        return {
          id: item.id,

          menuId: item.menuId,

          price: Number(item.price),

          count: Number(item.count),

          options,

          subTotal,

          menu: item.menu,
        };
      },
    );

    // ===================================================== 
    // ส่งข้อมูลกลับ 
    // ===================================================== 
    return res.send({
      cartId: cart.id,

      store: cart.store,

      totalItems,

      cartTotal,

      menus,

      orderRound:
        currentRound || null,

      nextRound:
        nextRound || null,
    });
  } catch (error) {
    console.error(
      "readCart error =",
      error,
    );

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.userCart = async (req, res) => {
  try {
    const {
      menuId,
      count = 1,
      options = [],
    } = req.body;

    const userId = req.user.id;

    const menu = await prisma.menu.findUnique({
      where: {
        id: Number(menuId),
      },
    });

    // ไม่พบเมนู 
    if (!menu) {
      return res.status(400).json({
        message: "ไม่พบเมนู",
      });
    }

    // เมนูปิดขาย 
    if (!menu.isAvailable) {
      return res.status(400).json({
        message: "เมนูนี้หมดชั่วคราว",
      });
    }

    // หา Cart ของร้านนี้ 
    let cart = await prisma.cart.findFirst({
      where: {
        orderById: userId,
        storeId: menu.storeId,
      },
    });

    // ถ้ายังไม่มี Cart 
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          orderById: userId,
          storeId: menu.storeId,
          cartTotal: 0,
        },
      });
    }

    // คำนวณราคา Option 
    let optionExtraPrice = 0;

    for (const option of options) {
      const choice = await prisma.optionChoice.findUnique({
        where: {
          id: Number(option.choiceId),
        },
      });

      if (choice) {
        optionExtraPrice += Number(choice.extraPrice);
      }
    }

    // ราคาต่อชิ้น 
    const finalPrice =
      Number(menu.price) + optionExtraPrice;

    const optionString = JSON.stringify(options);

    // เช็คเมนู + option เดิม 
    const existMenu = await prisma.menuOnCart.findFirst({
      where: {
        cartId: cart.id,
        menuId: Number(menuId),
        options: optionString,
      },
    });

    if (existMenu) {
      await prisma.menuOnCart.update({
        where: {
          id: existMenu.id,
        },
        data: {
          count: {
            increment: Number(count),
          },
        },
      });
    } else {
      await prisma.menuOnCart.create({
        data: {
          cartId: cart.id,
          menuId: Number(menuId),
          count: Number(count),
          price: finalPrice,
          options: optionString,
        },
      });
    }

    // คำนวณ Cart Total ใหม่ 
    const cartMenus = await prisma.menuOnCart.findMany({
      where: {
        cartId: cart.id,
      },
    });

    const cartTotal = cartMenus.reduce(
      (total, item) => {
        return (
          total +
          Number(item.price) * Number(item.count)
        );
      },
      0
    );

    // Update Cart Total 
    const updatedCart = await prisma.cart.update({
      where: {
        id: cart.id,
      },
      data: {
        cartTotal,
      },
      include: {
        menu: {
          include: {
            menu: {
              include: {
                images: true,
              },
            },
          },
        },
        store: true,
      },
    });

    res.send(updatedCart);
  } catch (error) {
    console.log("userCart error =", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.updateUserCart = async (req, res) => {
  try {
    const { id } = req.params;
    const { count, options } = req.body;
    const userId = req.user.id;

    const itemId = Number(id);

    if (!itemId || Number.isNaN(itemId)) {
      return res.status(400).json({
        message: "รหัสสินค้าในตะกร้าไม่ถูกต้อง",
      });
    }

    // ==========================================
    // หา item เดิม
    // ==========================================

    const item = await prisma.menuOnCart.findFirst({
      where: {
        id: itemId,
        cart: {
          orderById: userId,
        },
      },
      include: {
        menu: {
          include: {
            options: {
              include: {
                choices: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      return res.status(404).json({
        message: "ไม่พบสินค้าในตะกร้า",
      });
    }

    // ==========================================
    // ลบสินค้า
    // ==========================================

    if (count !== undefined && Number(count) <= 0) {
      await prisma.menuOnCart.delete({
        where: {
          id: itemId,
        },
      });

      if (item.cartId) {
        const cartItems = await prisma.menuOnCart.findMany({
          where: {
            cartId: item.cartId,
          },
        });

        const cartTotal = cartItems.reduce(
          (total, cartItem) =>
            total +
            Number(cartItem.price) * Number(cartItem.count),
          0,
        );

        await prisma.cart.update({
          where: {
            id: item.cartId,
          },
          data: {
            cartTotal,
          },
        });
      }

      return res.status(200).json({
        message: "ลบสินค้าแล้ว",
      });
    }

    // ==========================================
    // OPTIONS เดิม
    // ==========================================

    let oldOptions = [];

    try {
      oldOptions =
        typeof item.options === "string"
          ? JSON.parse(item.options)
          : item.options || [];

      if (!Array.isArray(oldOptions)) {
        oldOptions = [];
      }
    } catch {
      oldOptions = [];
    }

    // ==========================================
    // ตรวจว่า "มีการแก้ Options จริงหรือไม่"
    // ==========================================

    const hasNewOptions =
      options !== undefined &&
      Array.isArray(options);

    // ==========================================
    // ถ้ามี options ใหม่
    // ใช้ options ใหม่
    // ==========================================

    let selectedOptions;
    let finalPrice;

    if (hasNewOptions) {
      selectedOptions = [];
      finalPrice = Number(item.menu.price);

      for (const selected of options) {
        const optionId = Number(selected.optionId);
        const choiceId = Number(selected.choiceId);

        const option = item.menu.options.find(
          (option) => option.id === optionId,
        );

        if (!option) {
          return res.status(400).json({
            message: "ไม่พบตัวเลือกของเมนูนี้",
          });
        }

        const choice = option.choices.find(
          (choice) => choice.id === choiceId,
        );

        if (!choice) {
          return res.status(400).json({
            message: "ไม่พบรายการตัวเลือก",
          });
        }

        finalPrice += Number(choice.extraPrice || 0);

        selectedOptions.push({
          optionId: option.id,
          optionLabel: option.label,
          choiceId: choice.id,
          choiceName: choice.name,
          extraPrice: Number(choice.extraPrice || 0),
        });
      }
    }

    // ==========================================
    // ถ้าไม่ได้แก้ Options
    // ใช้ของเดิม
    // ==========================================

    else {
      selectedOptions = oldOptions;
      finalPrice = Number(item.price);
    }

    // ==========================================
    // UPDATE
    // ==========================================

    const updated = await prisma.menuOnCart.update({
      where: {
        id: itemId,
      },

      data: {
        // ถ้าส่ง count มา ใช้จำนวนใหม่
        // ถ้าไม่ส่ง ใช้จำนวนเดิม
        count:
          count !== undefined
            ? Number(count)
            : Number(item.count),

        // ถ้าแก้ options -> ราคาใหม่
        // ถ้าไม่แก้ options -> ราคาเดิม
        price: finalPrice,

        // สำคัญ:
        // ถ้าแก้ options -> บันทึก options ใหม่
        // ถ้าไม่แก้ -> ไม่แตะ options เดิม
        ...(hasNewOptions && {
          options: JSON.stringify(selectedOptions),
        }),
      },
    });

    // ==========================================
    // UPDATE CART TOTAL
    // ==========================================

    if (item.cartId) {
      const cartItems = await prisma.menuOnCart.findMany({
        where: {
          cartId: item.cartId,
        },
      });

      const cartTotal = cartItems.reduce(
        (total, cartItem) =>
          total +
          Number(cartItem.price) * Number(cartItem.count),
        0,
      );

      await prisma.cart.update({
        where: {
          id: item.cartId,
        },
        data: {
          cartTotal,
        },
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      message: "แก้ไขสินค้าเรียบร้อย",

      item: {
        ...updated,
        options: selectedOptions,
      },
    });
  } catch (error) {
    console.log("UPDATE USER CART ERROR =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};


exports.removeUserCart = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;


    const item = await prisma.menuOnCart.findFirst({
      where: {
        id: Number(id),
        cart: {
          orderById: userId
        }
      }
    });


    if (!item) {
      return res.status(404).json({
        message: "not found"
      });
    }


    await prisma.menuOnCart.delete({
      where: {
        id: Number(id)
      }
    });


    res.send({
      message: "delete success"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

