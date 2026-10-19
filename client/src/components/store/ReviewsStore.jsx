import { useEffect, useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import Swal from "sweetalert2";

import usefoodDelivery from "../../globalState/fooddeliveryStore";
import { getMyStoreReviews } from "../../api/StoreOrder";

const ReviewStore = () => {
  const token = usefoodDelivery((state) => state.token);

  const [data, setData] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingCounts: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    },
    reviews: [],
  });

  const [loading, setLoading] = useState(true);

  // =========================================================
  // โหลดรีวิว
  // =========================================================

  useEffect(() => {
    const fetchReviews = async () => {
      if (!token) return;

      try {
        setLoading(true);

        const res = await getMyStoreReviews(token);


        setData({
          totalReviews: Number(res.data?.totalReviews || 0),
          averageRating: Number(res.data?.averageRating || 0),

          ratingCounts: {
            5: Number(res.data?.ratingCounts?.[5] || 0),
            4: Number(res.data?.ratingCounts?.[4] || 0),
            3: Number(res.data?.ratingCounts?.[3] || 0),
            2: Number(res.data?.ratingCounts?.[2] || 0),
            1: Number(res.data?.ratingCounts?.[1] || 0),
          },

          reviews: Array.isArray(res.data?.reviews) ? res.data.reviews : [],
        });
      } catch (error) {
        console.log("โหลดรีวิวไม่สำเร็จ =", error);

        Swal.fire({
          icon: "error",
          title: "โหลดรีวิวไม่สำเร็จ",
          text:
            error.response?.data?.message ||
            "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#f97316",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [token]);


  // =========================================================
  // Render
  // =========================================================

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <div className="max-w-6xl mx-auto px-4 py-6 pb-36">
        {/* ================================================= */}
        {/* Header */}
        {/* ================================================= */}

        <div className="mb-7">
          <h1 className="text-3xl font-bold text-[#2A1B12]">รีวิวจากลูกค้า</h1>

          <p className="text-gray-500 mt-1">
            ดูคะแนนและความคิดเห็นจากลูกค้าที่สั่งอาหารจากร้าน
          </p>
        </div>

        {/* ================================================= */}
        {/* Summary */}
        {/* ================================================= */}

        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
            {/* คะแนนเฉลี่ย */}

            <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-orange-100 pb-6 md:pb-0">
              <p className="text-6xl font-bold text-[#2A1B12]">
                {data.totalReviews > 0 ? data.averageRating.toFixed(1) : "0.0"}
              </p>

              <div className="flex gap-1 mt-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={22}
                    className={
                      star <= Math.round(data.averageRating)
                        ? "fill-[#FFC145] text-[#FFC145]"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>

              <p className="text-sm text-gray-500 mt-2">
                จาก {data.totalReviews} รีวิว
              </p>
            </div>

            {/* สัดส่วนดาว */}

            <div className="flex flex-col justify-center space-y-3">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = data.ratingCounts[star] || 0;

                const percentage =
                  data.totalReviews > 0 ? (count / data.totalReviews) * 100 : 0;

                return (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-12 flex-shrink-0">
                      <span className="text-sm font-medium">{star}</span>

                      <Star
                        size={14}
                        className="fill-[#FFC145] text-[#FFC145]"
                      />
                    </div>

                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#FFC145] rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <span className="text-sm text-gray-500 w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* Review List */}
        {/* ================================================= */}

        <div className="mt-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1.5 h-7 bg-orange-500 rounded-full" />

            <div>
              <h2 className="text-2xl font-bold text-[#2A1B12]">
                ความคิดเห็นจากลูกค้า
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                รีวิวทั้งหมด {data.totalReviews} รายการ
              </p>
            </div>
          </div>

          {data.reviews.length === 0 ? (
            <div className="bg-white rounded-3xl border border-orange-100 p-12 text-center">
              <MessageSquare size={46} className="mx-auto text-gray-300" />

              <p className="font-semibold text-gray-500 mt-4">ยังไม่มีรีวิว</p>

              <p className="text-sm text-gray-400 mt-1">
                เมื่อมีลูกค้ารีวิว ความคิดเห็นจะแสดงที่นี่
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6">
              <div className="space-y-6">
                {data.reviews.map((review) => {
                  const customerImage = review.customer?.images?.find((image) =>
                    image.public_id?.startsWith("UserProfile2026"),
                  )?.url;

                  const customerName = review.customer?.username || "ลูกค้า";

                  const reviewDate = review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "-";

                  return (
                    <div
                      key={review.id}
                      className="
                        border-b
                        border-gray-100
                        pb-6
                        last:border-b-0
                        last:pb-0
                      "
                    >
                      <div className="flex gap-4">
                        {/* รูปโปรไฟล์ */}

                        {customerImage ? (
                          <img
                            src={customerImage}
                            alt={customerName}
                            className="
                              w-12
                              h-12
                              rounded-full
                              object-cover
                              flex-shrink-0
                            "
                          />
                        ) : (
                          <div
                            className="
                              w-12
                              h-12
                              rounded-full
                              bg-orange-100
                              text-orange-500
                              flex
                              items-center
                              justify-center
                              font-bold
                              flex-shrink-0
                            "
                          >
                            {customerName.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          {/* ชื่อ + วันที่ */}

                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-bold text-[#2A1B12]">
                              {customerName}
                            </p>

                            <span className="text-xs text-gray-400">
                              {reviewDate}
                            </span>
                          </div>

                          {/* ดาว */}

                          <div className="flex gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={17}
                                className={
                                  star <= Number(review.rating)
                                    ? "fill-[#FFC145] text-[#FFC145]"
                                    : "text-gray-300"
                                }
                              />
                            ))}
                          </div>

                          {/* ความคิดเห็น */}

                          {review.comment ? (
                            <p
                              className="
                                text-gray-600
                                text-sm
                                mt-3
                                leading-relaxed
                                whitespace-pre-wrap
                              "
                            >
                              {review.comment}
                            </p>
                          ) : (
                            <p className="text-gray-400 text-sm mt-3">
                              ลูกค้าไม่ได้เขียนความคิดเห็น
                            </p>
                          )}

                          {/* เลขออเดอร์ */}

                          <p className="text-xs text-gray-400 mt-3">
                            ออเดอร์ #{review.orderId}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewStore;
