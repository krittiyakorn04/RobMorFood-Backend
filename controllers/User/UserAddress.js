const prisma = require("../../config/prisma");

exports.listAddress = async (req, res) => {
  try {
    const userId = req.user.id;

    const addresses = await prisma.address.findMany({
      where: {
        customerId: userId,
      },
      orderBy: [
        {
          isDefault: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    res.send(addresses);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

//เพิ่มdefaul ชื่อ เบอร์
exports.addAddress = async (req, res) => {
  try {
    const { label, address, lat, lng, isDefault, } = req.body;
    const userId = req.user.id;

    if (!label || !address) {
      return res.status(400).json({
        message: "กรุณากรอกชื่อที่อยู่และรายละเอียดที่อยู่",
      });
    }

    // ถ้าเลือกเป็นที่อยู่เริ่มต้น
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          customerId: userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        label,
        address,
        lat,
        lng,
        isDefault: Boolean(isDefault),
        customerId: userId,
      },
    });

    res.send(newAddress);

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { label, address, lat, lng, isDefault } = req.body;
    const userId = req.user.id;
    const addressId = Number(req.params.id);

    // ตรวจสอบว่าที่อยู่นี้เป็นของ user คนนี้จริง
    const findAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        customerId: userId,
      },
    });

    if (!findAddress) {
      return res.status(404).json({
        message: "address not found!",
      });
    }

    // ถ้าตั้งเป็นที่อยู่เริ่มต้น
    if (isDefault === true) {
      await prisma.address.updateMany({
        where: {
          customerId: userId,
          id: {
            not: addressId,
          },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: {
        id: addressId,
      },
      data: {
        label,
        address,
        lat: lat === "" || lat == null ? null : Number(lat),
        lng: lng === "" || lng == null ? null : Number(lng),
        isDefault: Boolean(isDefault),
      },
    });

    res.send(updatedAddress);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.removeAddress = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id;

    const findaddress = await prisma.address.findFirst({
      where: {
        customerId: userId,
        id: Number(id),
      },
    });

    if (!findaddress) {
      return res.status(404).json({ message: "address not found!" });
    }

    const user = await prisma.address.delete({
      where: {
        id: Number(id),
      },
    });
    res.send(" remove Address");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};
