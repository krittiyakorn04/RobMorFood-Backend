const prisma = require("../../config/prisma");

// GET รีวิวทั้งหมดของร้าน
exports.getStoreReviews = async (req, res) => {
  try {
    const storeId = Number(req.params.id);

    if (!storeId || Number.isNaN(storeId)) {
      return res.status(400).json({
        message: "รหัสร้านไม่ถูกต้อง",
      });
    }

    const reviews = await prisma.review.findMany({
      where: {
        storeId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,

        customer: {
          select: {
            id: true,
            username: true,
            images: {
              select: {
                url: true,
                public_id: true,
              },
            },
          },
        },
      },
    });

    const totalReviews = reviews.length;

    const ratingTotal = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0,
    );

    const averageRating =
      totalReviews > 0
        ? Number((ratingTotal / totalReviews).toFixed(1))
        : 0;

    const ratingCounts = {
      5: reviews.filter((review) => Number(review.rating) === 5).length,
      4: reviews.filter((review) => Number(review.rating) === 4).length,
      3: reviews.filter((review) => Number(review.rating) === 3).length,
      2: reviews.filter((review) => Number(review.rating) === 2).length,
      1: reviews.filter((review) => Number(review.rating) === 1).length,
    };

    return res.status(200).json({
      totalReviews,
      averageRating,
      ratingCounts,
      reviews,
    });
  } catch (error) {
    console.log("GET STORE REVIEWS ERROR =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};


// GET REVIEW BY ORDER
exports.getReview = async (req, res) => {
    try {
        const orderId = Number(req.params.id);
        const customerId = req.user.id;

        if (!orderId || Number.isNaN(orderId)) {
            return res.status(400).json({
                message: "รหัสออเดอร์ไม่ถูกต้อง",
            });
        }

        const review = await prisma.review.findFirst({
            where: {
                orderId,
                customerId,
            },
            include: {
                store: {
                    select: {
                        id: true,
                        storeName: true,
                    },
                },
            },
        });

        return res.status(200).json(review);
    } catch (error) {
        console.log("GET REVIEW ERROR =", error);

        return res.status(500).json({
            message: "Server Error",
        });
    }
};

// CREATE REVIEW
exports.createReview = async (req, res) => {
    try {
        const orderId = Number(req.params.orderId);
        const customerId = req.user.id;

        const { rating, comment } = req.body || {};

        console.log("CREATE REVIEW");
        console.log("orderId =", orderId);
        console.log("customerId =", customerId);
        console.log("body =", req.body);

        // =========================
        // CHECK ORDER ID
        // =========================

        if (!orderId || Number.isNaN(orderId)) {
            return res.status(400).json({
                message: "รหัสออเดอร์ไม่ถูกต้อง",
            });
        }

        // =========================
        // CHECK RATING
        // =========================

        const ratingNumber = Number(rating);

        if (
            Number.isNaN(ratingNumber) ||
            ratingNumber < 1 ||
            ratingNumber > 5
        ) {
            return res.status(400).json({
                message: "กรุณาให้คะแนน 1-5 ดาว",
            });
        }

        // =========================
        // FIND ORDER
        // =========================

        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                customerId,
            },
            include: {
                review: true,
            },
        });

        if (!order) {
            return res.status(404).json({
                message: "ไม่พบออเดอร์",
            });
        }

        // =========================
        // CHECK ORDER STATUS
        // =========================
        // รีวิวได้เฉพาะเมื่อ Order COMPLETED เท่านั้น

        if (order.status !== "COMPLETED") {
            return res.status(400).json({
                message: "สามารถรีวิวได้เมื่อออเดอร์เสร็จสิ้นแล้วเท่านั้น",
            });
        }

        // =========================
        // CHECK DUPLICATE
        // =========================

        if (order.review) {
            return res.status(400).json({
                message: "ออเดอร์นี้รีวิวแล้ว",
            });
        }

        // =========================
        // CREATE REVIEW
        // =========================

        const review = await prisma.review.create({
            data: {
                orderId: order.id,
                customerId: order.customerId,
                storeId: order.storeId,
                rating: ratingNumber,
                comment:
                    typeof comment === "string" && comment.trim() !== ""
                        ? comment.trim()
                        : null,
            },
            include: {
                store: {
                    select: {
                        id: true,
                        storeName: true,
                    },
                },
            },
        });

        return res.status(201).json({
            message: "รีวิวสำเร็จ",
            review,
        });

    } catch (error) {
        console.log("CREATE REVIEW ERROR =", error);

        return res.status(500).json({
            message: "Server Error",
            error: error.message,
        });

    }
};


// UPDATE REVIEW
exports.updateReview = async (req, res) => {
    try {
        const reviewId = Number(req.params.id);
        const customerId = req.user.id;

        const { rating, comment } = req.body;

        if (!reviewId || Number.isNaN(reviewId)) {
            return res.status(400).json({
                message: "รหัสรีวิวไม่ถูกต้อง",
            });
        }

        const ratingNumber = Number(rating);

        if (
            !ratingNumber ||
            ratingNumber < 1 ||
            ratingNumber > 5
        ) {
            return res.status(400).json({
                message: "กรุณาให้คะแนน 1-5 ดาว",
            });
        }

        const review = await prisma.review.findFirst({
            where: {
                id: reviewId,
                customerId,
            },
        });

        if (!review) {
            return res.status(404).json({
                message: "ไม่พบรีวิว",
            });
        }

        const updatedReview = await prisma.review.update({
            where: {
                id: reviewId,
            },
            data: {
                rating: ratingNumber,
                comment: comment?.trim() || null,
            },
        });

        return res.status(200).json({
            message: "แก้ไขรีวิวสำเร็จ",
            review: updatedReview,
        });
    } catch (error) {
        console.log("UPDATE REVIEW ERROR =", error);

        return res.status(500).json({
            message: "Server Error",
        });
    }
};

// DELETE REVIEW
exports.removeReview = async (req, res) => {
    try {
        const reviewId = Number(req.params.id);
        const customerId = req.user.id;

        if (!reviewId || Number.isNaN(reviewId)) {
            return res.status(400).json({
                message: "รหัสรีวิวไม่ถูกต้อง",
            });
        }

        const review = await prisma.review.findFirst({
            where: {
                id: reviewId,
                customerId,
            },
        });

        if (!review) {
            return res.status(404).json({
                message: "ไม่พบรีวิว",
            });
        }

        await prisma.review.delete({
            where: {
                id: reviewId,
            },
        });

        return res.status(200).json({
            message: "ลบรีวิวสำเร็จ",
        });
    } catch (error) {
        console.log("REMOVE REVIEW ERROR =", error);

        return res.status(500).json({
            message: "Server Error",
        });
    }
};