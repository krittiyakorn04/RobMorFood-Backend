import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  Store,
  Plus,
  Minus,
  MapPin,
} from "lucide-react";
import Swal from "sweetalert2";

import usefoodDelivery from "../../globalState/fooddeliveryStore";
import { getUserCart } from "../../api/UserOrder";

const UserCartAll = () => {
  const navigate = useNavigate();

  const token = usefoodDelivery((state) => state.token);

  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // LOAD CART
  // =========================================================

  useEffect(() => {
    const fetchCart = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const res = await getUserCart(token);


        setCarts(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.log("โหลดตะกร้ารวมไม่สำเร็จ =", error);

        if (error.response?.status === 404) {
          setCarts([]);
        } else {
          Swal.fire({
            icon: "error",
            title: "โหลดตะกร้าไม่สำเร็จ",
            text:
              error.response?.data?.message || "ไม่สามารถโหลดข้อมูลตะกร้าได้",
            confirmButtonText: "ตกลง",
            confirmButtonColor: "#f97316",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [token]);

  // =========================================================
  // NORMALIZE CART
  // =========================================================

  const cartList = useMemo(() => {
    return carts.map((cart) => {
      const menus = Array.isArray(cart.menu) ? cart.menu : [];

      const items = menus.map((item) => {
        const menu = item.menu || {};

        const quantity = Number(item.quantity || item.amount || item.qty || 1);

        const price = Number(menu.price || 0);

        const options = Array.isArray(item.options) ? item.options : [];

        const optionPrice = options.reduce(
          (sum, option) => sum + Number(option.price || 0),
          0,
        );

        const unitPrice = price + optionPrice;

        return {
          id: item.id,
          menuId: menu.id,
          menuName: menu.menuItem || menu.name || "ไม่พบชื่อเมนู",

          image:
            menu.images?.find((image) => image.public_id?.startsWith("Menu"))
              ?.url ||
            menu.images?.[0]?.url ||
            "",

          quantity,
          price,
          optionPrice,
          unitPrice,
          totalPrice: unitPrice * quantity,

          options,
          isAvailable: menu.isAvailable !== false,
        };
      });

      const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

      return {
        ...cart,
        items,
        total,
        totalItems,
      };
    });
  }, [carts]);

  // =========================================================
  // CHECKOUT
  // =========================================================

  const handleCheckout = (cart) => {
    if (!cart?.id || !cart?.storeId) {
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถดำเนินการต่อได้",
        text: "ไม่พบข้อมูลตะกร้าหรือร้านค้า",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    const unavailableItems = cart.items.filter((item) => !item.isAvailable);

    if (unavailableItems.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "มีเมนูที่หมดชั่วคราว",
        text: "กรุณาตรวจสอบเมนูที่ไม่พร้อมขายก่อนชำระเงิน",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    if (cart.store?.status !== "OPEN") {
      Swal.fire({
        icon: "warning",
        title: "ร้านปิดอยู่",
        text: "ขณะนี้ร้านยังไม่เปิดให้บริการ",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    navigate(`/user/orderUser?cartId=${cart.id}&storeId=${cart.storeId}`);
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center px-4">
        
        <p className="text-gray-500 font-['Noto_Sans_Thai']">
          กำลังโหลดตะกร้า...
        </p>
      </div>
    );
  }

  // =========================================================
  // EMPTY
  // =========================================================

  if (cartList.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFF8F0]">
        {" "}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
          {" "}
          <div className="flex items-center gap-3 mb-7">
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
shrink-0
"
            >
              {" "}
              <ArrowLeft size={20} />{" "}
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#2A1B12] font-['Kanit']">
                ตะกร้าของฉัน
              </h1>

              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-['Noto_Sans_Thai']">
                รายการอาหารจากร้านที่คุณเลือก
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-orange-100 p-10 sm:p-14 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-orange-50 flex items-center justify-center">
              <ShoppingCart size={30} className="text-orange-400" />
            </div>

            <h2 className="mt-5 text-lg sm:text-xl font-bold text-[#2A1B12] font-['Kanit']">
              ตะกร้ายังว่างอยู่
            </h2>

            <p className="mt-2 text-sm text-gray-500 font-['Noto_Sans_Thai']">
              เลือกร้านอาหารและเพิ่มเมนูที่คุณต้องการ
            </p>

            <button
              type="button"
              onClick={() => navigate("/user")}
              className="
            mt-6
            px-6
            py-3
            rounded-xl
            bg-orange-500
            text-white
            font-semibold
            text-sm
            font-['Noto_Sans_Thai']
            hover:bg-orange-600
            transition
          "
            >
              เลือกร้านอาหาร
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-32">
      {" "}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Kanit:wght@600;700;800&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap"
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        {/* HEADER */}

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
          shrink-0
        "
          >
            <ArrowLeft size={20} />
          </button>

          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[#2A1B12] font-['Kanit']">
              ตะกร้าของฉัน
            </h1>

            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-['Noto_Sans_Thai']">
              {cartList.length} ร้าน
            </p>
          </div>
        </div>

        {/* CART LIST */}

        <div className="space-y-5 sm:space-y-6">
          {cartList.map((cart) => {
            const store = cart.store;

            const profileImage = Array.isArray(store?.images)
              ? store.images.find((image) =>
                  image.public_id?.startsWith("StoreProfile2026"),
                )?.url
              : null;

            return (
              <div
                key={cart.id}
                className="
              bg-white
              rounded-2xl
              sm:rounded-3xl
              border
              border-orange-100
              shadow-sm
              overflow-hidden
            "
              >
                {/* STORE HEADER */}

                <div className="p-4 sm:p-5 border-b border-orange-100">
                  <div className="flex items-center gap-3">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={store?.storeName || "ร้านอาหาร"}
                        className="
                      w-12
                      h-12
                      sm:w-14
                      sm:h-14
                      rounded-xl
                      object-cover
                      shrink-0
                    "
                      />
                    ) : (
                      <div
                        className="
                      w-12
                      h-12
                      sm:w-14
                      sm:h-14
                      rounded-xl
                      bg-orange-50
                      flex
                      items-center
                      justify-center
                      shrink-0
                    "
                      >
                        <Store size={24} className="text-orange-400" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-[#2A1B12] font-['Kanit'] text-base sm:text-lg truncate">
                          {store?.storeName || "ไม่พบชื่อร้าน"}
                        </h2>

                        <span
                          className={`
                        px-2
                        py-0.5
                        rounded-full
                        text-[10px]
                        sm:text-[11px]
                        font-semibold
                        font-['Noto_Sans_Thai']
                        ${
                          store?.status === "OPEN"
                            ? "bg-green-50 text-green-600"
                            : "bg-gray-100 text-gray-500"
                        }
                      `}
                        >
                          {store?.status === "OPEN" ? "เปิด" : "ปิด"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                        <MapPin size={13} className="text-orange-400" />

                        <span className="truncate">ตะกร้าของร้านนี้</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ITEMS */}

                <div className="p-4 sm:p-5">
                  <div className="space-y-4">
                    {cart.items.map((item) => (
                      <div
                        key={item.id}
                        className="
                      flex
                      gap-3
                      sm:gap-4
                      pb-4
                      border-b
                      border-gray-100
                      last:border-b-0
                      last:pb-0
                    "
                      >
                        {/* IMAGE */}

                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-orange-50">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.menuName}
                              className={`
                            w-full
                            h-full
                            object-cover
                            ${item.isAvailable ? "" : "grayscale opacity-50"}
                          `}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingCart
                                size={24}
                                className="text-orange-300"
                              />
                            </div>
                          )}

                          {!item.isAvailable && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <span className="px-2 py-1 rounded-full bg-gray-700/90 text-white text-[11px] font-bold font-['Noto_Sans_Thai']">
                                หมด
                              </span>
                            </div>
                          )}
                        </div>

                        {/* INFO */}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3
                                className={`
                              font-semibold
                              text-sm
                              sm:text-base
                              font-['Noto_Sans_Thai']
                              break-words
                              ${
                                item.isAvailable
                                  ? "text-[#2A1B12]"
                                  : "text-gray-400"
                              }
                            `}
                              >
                                {item.menuName}
                              </h3>

                              {item.options.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {item.options.map((option, index) => (
                                    <p
                                      key={option.id || index}
                                      className="text-[11px] sm:text-xs text-gray-400"
                                    >
                                      {option.name ||
                                        option.optionName ||
                                        "ตัวเลือก"}

                                      {Number(option.price || 0) > 0 &&
                                        ` +฿${Number(
                                          option.price,
                                        ).toLocaleString()}`}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>

                            <p
                              className={`
                            font-bold
                            text-sm
                            sm:text-base
                            shrink-0
                            ${
                              item.isAvailable
                                ? "text-orange-500"
                                : "text-gray-400"
                            }
                          `}
                            >
                              ฿{Number(item.totalPrice).toLocaleString()}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <p className="text-xs text-gray-400">
                              ฿{Number(item.unitPrice).toLocaleString()} /
                              รายการ
                            </p>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled
                                className="
                              w-7
                              h-7
                              rounded-lg
                              border
                              border-gray-200
                              text-gray-300
                              flex
                              items-center
                              justify-center
                            "
                              >
                                <Minus size={14} />
                              </button>

                              <span className="min-w-[22px] text-center text-sm font-semibold">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                disabled
                                className="
                              w-7
                              h-7
                              rounded-lg
                              border
                              border-gray-200
                              text-gray-300
                              flex
                              items-center
                              justify-center
                            "
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* STORE TOTAL */}

                  <div className="mt-5 pt-4 border-t border-orange-100">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#2A1B12] font-['Noto_Sans_Thai']">
                          รวมร้านนี้
                        </p>

                        <p className="text-xs text-gray-400 mt-0.5">
                          {cart.totalItems} รายการ
                        </p>
                      </div>

                      <p className="text-lg sm:text-xl font-bold text-orange-500">
                        ฿{Number(cart.total).toLocaleString()}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCheckout(cart)}
                      className="
                    w-full
                    mt-4
                    py-3
                    rounded-xl
                    bg-orange-500
                    hover:bg-orange-600
                    text-white
                    font-semibold
                    text-sm
                    font-['Noto_Sans_Thai']
                    transition
                  "
                    >
                      สั่งซื้อ
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UserCartAll;
