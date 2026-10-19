import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";

import usefoodDelivery from "../../globalState/fooddeliveryStore";
import { getStoreReviews } from "../../api/UserOrder";

const StoreReviews = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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
  // โหลดรีวิวร้าน
  // =========================================================

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id || !token) return;

      try {
        setLoading(true);

        const res = await getStoreReviews(token, id);


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
        console.log("โหลดรีวิวร้านไม่สำเร็จ =", error);

        setData({
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
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [id, token]);



  // =========================================================
  // Render
  // =========================================================

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {" "}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 pb-40">
        {" "}
        {/* =================================================
        HEADER
    ================================================= */}
        <div className="flex items-center gap-3 mb-5 sm:mb-7">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
          w-10
          h-10
          rounded-full
          bg-white
          border
          border-orange-100
          flex
          items-center
          justify-center
          text-gray-600
          hover:bg-orange-50
          hover:text-orange-500
          transition
          flex-shrink-0
        "
          >
            <ArrowLeft size={20} />
          </button>

          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[#2A1B12]">
              รีวิวจากลูกค้า
            </h1>

            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              ความคิดเห็นจากลูกค้าที่เคยสั่งอาหารจากร้านนี้
            </p>
          </div>
        </div>
        {/* =================================================
        SUMMARY
    ================================================= */}
        <div
          className="
        bg-white
        rounded-2xl
        sm:rounded-3xl
        border
        border-orange-100
        shadow-sm
        p-4
        sm:p-6
      "
        >
          <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-5 sm:gap-6">
            {/* =================================================
            คะแนนเฉลี่ย
        ================================================= */}

            <div
              className="
            flex
            flex-col
            items-center
            justify-center
            pb-5
            md:pb-0
            border-b
            md:border-b-0
            md:border-r
            border-orange-100
          "
            >
              <p className="text-4xl sm:text-5xl font-bold text-[#2A1B12]">
                {data.totalReviews > 0 ? data.averageRating.toFixed(1) : "0.0"}
              </p>

              <div className="flex gap-1 mt-2.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={19}
                    className={
                      star <= Math.round(data.averageRating)
                        ? "fill-[#FFC145] text-[#FFC145]"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>

              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                จาก {data.totalReviews} รีวิว
              </p>
            </div>

            {/* =================================================
            RATING DISTRIBUTION
        ================================================= */}

            <div className="space-y-2.5 sm:space-y-3">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = data.ratingCounts[star] || 0;

                const percentage =
                  data.totalReviews > 0 ? (count / data.totalReviews) * 100 : 0;

                return (
                  <div key={star} className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-1 w-10 sm:w-12 flex-shrink-0">
                      <span className="text-xs sm:text-sm font-medium">
                        {star}
                      </span>

                      <Star
                        size={13}
                        className="fill-[#FFC145] text-[#FFC145]"
                      />
                    </div>

                    <div className="flex-1 h-2 sm:h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="
                      h-full
                      bg-[#FFC145]
                      rounded-full
                      transition-all
                    "
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <span className="text-xs text-gray-500 w-6 sm:w-8 text-right flex-shrink-0">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* =================================================
        REVIEW HEADER
    ================================================= */}
        <div className="mt-7 sm:mt-8 mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-[#2A1B12]">
            รีวิวทั้งหมด
          </h2>

          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {data.totalReviews} รีวิว
          </p>
        </div>
        {/* =================================================
        EMPTY
    ================================================= */}
        {data.reviews.length === 0 ? (
          <div
            className="
          bg-white
          rounded-2xl
          sm:rounded-3xl
          border
          border-orange-100
          p-8
          sm:p-10
          text-center
        "
          >
            <Star size={42} className="mx-auto text-gray-300" />

            <p className="font-semibold text-gray-500 mt-4">ยังไม่มีรีวิว</p>

            <p className="text-sm text-gray-400 mt-1">
              ร้านนี้ยังไม่มีลูกค้ารีวิว
            </p>
          </div>
        ) : (
          /* =================================================
         REVIEW LIST
      ================================================= */

          <div
            className="
          bg-white
          rounded-2xl
          sm:rounded-3xl
          border
          border-orange-100
          shadow-sm
          p-4
          sm:p-6
        "
          >
            <div className="space-y-5 sm:space-y-6">
              {data.reviews.map((review) => {
                // =================================================
                // รูปลูกค้า
                // =================================================

                const customerImage = review.customer?.images?.find((image) =>
                  image.public_id?.startsWith("UserProfile2026"),
                )?.url;

                const customerName = review.customer?.username || "ลูกค้า";

                // =================================================
                // วันที่รีวิว
                // =================================================

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
                  pb-5
                  sm:pb-6
                  last:border-b-0
                  last:pb-0
                "
                  >
                    <div className="flex gap-3">
                      {/* =================================================
                      PROFILE
                  ================================================= */}

                      {customerImage ? (
                        <img
                          src={customerImage}
                          alt={customerName}
                          className="
                        w-10
                        h-10
                        sm:w-11
                        sm:h-11
                        rounded-full
                        object-cover
                        flex-shrink-0
                      "
                        />
                      ) : (
                        <div
                          className="
                        w-10
                        h-10
                        sm:w-11
                        sm:h-11
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

                      {/* =================================================
                      REVIEW CONTENT
                  ================================================= */}

                      <div className="flex-1 min-w-0">
                        {/* ชื่อ + วันที่ */}

                        <div
                          className="
                        flex
                        flex-col
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                        gap-1
                      "
                        >
                          <p className="font-bold text-[#2A1B12] break-words">
                            {customerName}
                          </p>

                          <span className="text-[11px] sm:text-xs text-gray-400">
                            {reviewDate}
                          </span>
                        </div>

                        {/* ดาว */}

                        <div className="flex gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={15}
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
                          mt-2.5
                          leading-relaxed
                          whitespace-pre-wrap
                          break-words
                        "
                          >
                            {review.comment}
                          </p>
                        ) : (
                          <p className="text-gray-400 text-sm mt-2.5">
                            ลูกค้าไม่ได้เขียนความคิดเห็น
                          </p>
                        )}
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
  );
};

export default StoreReviews;
