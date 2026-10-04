const prisma = require("../../config/prisma");



//เสร็จ
exports.listMenuCategory = async (req, res) => {
  try { 

    const storeId  = req.store.id

    const category = await prisma.menuCategory.findMany({
      where:{
        storeId
      },
      orderBy: {
        id: "asc" 
      },
      include:{
        menus: {
          select:{
            menuItem: true,
            price: true,
            isAvailable: true
          }
        }
      }
    })

    res.send(category);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.addMenuCategory = async (req, res) => {
  try {

    const { nameCate } = req.body
    const storeId = req.store.id

    if (!nameCate) {
      return res.status(400).json({ messege: "name Category is require!!!"});
    }

    const existCategory = await prisma.menuCategory.findFirst({
      where:{
        nameCate,
        storeId
      }
    })

    if(existCategory){
      return res.status(400).json({ message: "This Category already exits!!" });
    }

    const category = await prisma.menuCategory.create({
      data:{
        nameCate,
        storeId
      }
    })

    res.send(category);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.updateMenuCategory = async (req, res) => {
  try {

    const { nameCate } = req.body
    const storeId  = req.store.id

    if(!nameCate) {
      return res.status(400).json({ message: "name Category is required" })
    }

    const existCategory = await prisma.menuCategory.findFirst({
      where:{
        nameCate,
        storeId,
        NOT: {
          id: Number(storeId)
        }
      }
    })
    
    if(existCategory){
      return res.status(400).json({ message: "This Category already exits!!" });
    }

    const category = await prisma.menuCategory.update({
      where:{
        id: Number(req.params.id),
        storeId
      },
      data:{
        nameCate
      }
    })

    res.send(category);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.removeMenuCategory = async (req, res) => {
  try {

    const storeId  = req.store.id

    //เช็คว่ามีเมนูมั้ย ถ้ามีให้ลบ id ออก ให้เมนูว่าง (ติดไว้ก่อน)
    const existCategory = await prisma.menuCategory.findFirst({
      where:{
        storeId,
        id: Number(req.params.id)
      },
      include:{
        menus:true
      }
    })

    if (!existCategory) {
      return res.status(404).json({ message: "Category not found" })
    }

    if (existCategory.menus.length > 0){
      await prisma.menu.updateMany({
        where:{
          categoryId: Number(req.params.id),
        },
        data:{
          categoryId: null
        }
      })
    }

    await prisma.menuCategory.delete({
      where:{
        id: Number(req.params.id)
      }
    })

    res.send("Category deleted");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
}; 


