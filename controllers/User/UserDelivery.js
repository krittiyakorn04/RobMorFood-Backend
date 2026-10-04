const prisma = require("../../config/prisma");


//อย้่าลืมเสร็ต
exports.getDelivery = async (req, res) => {
    try {
        const userId = req.user.id;

        const deliveries = await prisma.order.findMany({
            where: {
                customerId: userId,
                delivery: {
                    status: {
                        in: ["PENDING","DELIVERING,COMPLETED" ],
                    },
                },
            },
            include: {
                store: true,
                delivery: true,
                menu: {
                    include: {
                        menu: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.send(deliveries);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.readUserDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await prisma.order.findFirst({
      where: {
        id: Number(id),
        customerId: userId,
      },
      include: {
        store: true,
        delivery: true,
        payment: true,
        customer: {
          include: {
            address: true,
          },
        },
        menu: {
          include: {
            menu: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.send(order);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};