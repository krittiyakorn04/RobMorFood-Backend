import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Minus, Plus, ShoppingCart } from "lucide-react";
import Swal from "sweetalert2";

import usefoodDelivery from "../../globalState/fooddeliveryStore";
import { getUserMenu } from "../../api/UserMenu";
import { addToCart } from "../../api/UserOrder";

const MenuDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const token = usefoodDelivery((state) => state.token);

  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingCart, setAddingCart] = useState(false);
  const isStoreOpen = menu?.store?.status === "OPEN";

  const [selectedOptions, setSelectedOptions] = useState({});
  const [count, setCount] = useState(1);

  // =========================
  // LOAD MENU
  // =========================

  useEffect(() => {
    const loadMenu = async () => {
      if (!token || !id) return;

      try {
        setLoading(true);

        const response = await getUserMenu(token, id);

        // รองรับทั้งกรณี API ส่ง data ตรง ๆ
        // และกรณี axios response
        const data = response?.data || response;

        setMenu(data);
      } catch (error) {
        console.log(
          "โหลดข้อมูลเมนูไม่สำเร็จ:",
          error.response?.data || error.message,
        );

        Swal.fire({
          icon: "error",
          title: "ไม่พบเมนู",
          text: error.response?.data?.message || "ไม่สามารถโหลดข้อมูลเมนูได้",
          confirmButtonText: "กลับ",
          confirmButtonColor: "#f97316",
        }).then(() => {
          navigate(-1);
        });
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, [token, id, navigate]);

  // =========================
  // SELECT OPTION
  // =========================

  const handleSelectOption = (option, choice) => {
    setSelectedOptions((prev) => {
      const current = prev[option.id] || [];

      // เลือกได้ 1 รายการ
      if (option.maxRequire === 1) {
        return {
          ...prev,
          [option.id]: [choice],
        };
      }

      // เลือกได้หลายรายการ
      const exists = current.some((item) => item.id === choice.id);

      let updated;

      if (exists) {
        updated = current.filter((item) => item.id !== choice.id);
      } else {
        updated = [...current, choice];
      }

      return {
        ...prev,
        [option.id]: updated,
      };
    });
  };

  // =========================
  // OPTION PRICE
  // =========================

  const optionTotal = useMemo(() => {
    return Object.values(selectedOptions)
      .flat()
      .reduce((total, choice) => {
        return total + Number(choice.extraPrice || 0);
      }, 0);
  }, [selectedOptions]);

  // =========================
  // PRICE
  // =========================

  const basePrice = Number(menu?.price || 0);

  const unitPrice = basePrice + optionTotal;

  const totalPrice = unitPrice * count;

  // =========================
  // REQUIRED OPTION
  // =========================

  const isRequiredComplete = useMemo(() => {
    if (!menu?.options?.length) {
      return true;
    }

    return menu.options.every((option) => {
      if (!option.required) {
        return true;
      }

      const selected = selectedOptions[option.id] || [];

      return selected.length > 0;
    });
  }, [menu, selectedOptions]);

  // =========================
  // PLUS
  // =========================

  const handleIncrease = () => {
    setCount((prev) => prev + 1);
  };

  // =========================
  // MINUS
  // =========================

  const handleDecrease = () => {
    setCount((prev) => (prev > 1 ? prev - 1 : 1));
  };

  // =========================
  // ADD TO CART
  // =========================

  const handleAddToCart = async () => {
    // ตรวจสอบตัวเลือกที่จำเป็น
    if (!isRequiredComplete) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเลือกตัวเลือก",
        text: "กรุณาเลือกตัวเลือกที่จำเป็นให้ครบก่อน",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    // ตรวจสอบ Token
    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเข้าสู่ระบบ",
        text: "กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าในตะกร้า",
        confirmButtonText: "เข้าสู่ระบบ",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    // ตรวจสอบ Menu
    if (!menu?.id) {
      Swal.fire({
        icon: "error",
        title: "ไม่พบข้อมูลเมนู",
        text: "ไม่สามารถเพิ่มเมนูลงตะกร้าได้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    try {
      setAddingCart(true);

      // =========================
      // แปลง Options
      // =========================

      const options = Object.entries(selectedOptions).flatMap(
        ([optionId, choices]) =>
          choices.map((choice) => {
            const option = menu.options?.find(
              (item) => Number(item.id) === Number(optionId),
            );

            return {
              optionId: Number(optionId),
              optionLabel: option?.label || "",
              choiceId: Number(choice.id),
              choiceName: choice.name || "",
              extraPrice: Number(choice.extraPrice || 0),
            };
          }),
      );

      // =========================
      // DATA ส่ง Backend
      // =========================

      const value = {
        menuId: Number(menu.id),
        count: Number(count),
        options,
      };


      // =========================
      // ADD CART API
      // =========================

      const response = await addToCart(token, value);


      // =========================
      // SUCCESS
      // =========================

      await Swal.fire({
        icon: "success",
        title: "เพิ่มลงตะกร้าแล้ว",
        html: `
          <div style="font-size:15px;">
            <div style="font-weight:600;">
              ${menu.menuItem}
            </div>

            <div style="margin-top:6px;">
              จำนวน ${count} รายการ
            </div>

            <div
              style="
                color:#f97316;
                font-weight:700;
                font-size:18px;
                margin-top:6px;
              "
            >
              ฿${totalPrice.toFixed(2)}
            </div>
          </div>
        `,
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    } catch (error) {
      console.log("ADD CART ERROR =", error.response?.data || error.message);

      Swal.fire({
        icon: "error",
        title: "เพิ่มลงตะกร้าไม่สำเร็จ",
        text:
          error.response?.data?.message ||
          "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setAddingCart(false);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen mb-20 bg-gray-50 animate-pulse font-['Noto_Sans_Thai']">
        {/* HEADER */}
        <div className="sticky top-0 z-30 bg-white border-b border-orange-100">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-200" />

            <div className="space-y-2">
              <div className="h-5 w-32 rounded-lg bg-gray-200" />
              <div className="h-3 w-24 rounded-lg bg-gray-100" />
            </div>
          </div>
        </div>

        {/* MENU IMAGE */}
        <div className="max-w-6xl mx-auto">
          <div className="w-full h-72 md:h-96 bg-gray-200" />

          {/* MENU INFO */}
          <div className="bg-white p-5 md:p-6 space-y-4">
            <div className="h-8 w-64 rounded-lg bg-gray-200" />

            <div className="space-y-2">
              <div className="h-4 w-full rounded-lg bg-gray-100" />
              <div className="h-4 w-5/6 rounded-lg bg-gray-100" />
              <div className="h-4 w-2/3 rounded-lg bg-gray-100" />
            </div>

            <div className="h-8 w-28 rounded-lg bg-orange-100" />
          </div>

          {/* OPTIONS */}
          <div className="mt-3 bg-white">
            {[1, 2].map((option) => (
              <div key={option} className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-6 w-40 rounded-lg bg-gray-200" />
                    <div className="h-4 w-28 rounded-lg bg-gray-100" />
                  </div>

                  <div className="h-7 w-16 rounded-full bg-red-50" />
                </div>

                <div className="mt-4 space-y-3">
                  {[1, 2, 3].map((choice) => (
                    <div
                      key={choice}
                      className="h-14 w-full rounded-2xl bg-gray-100"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CART */}
          <div className="mt-3 bg-white p-4 md:p-5 border-t border-orange-100">
            <div className="flex items-center gap-3">
              <div className="h-11 w-28 rounded-xl bg-gray-200" />

              <div className="flex-1 h-[52px] rounded-2xl bg-orange-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // MENU NOT FOUND
  // =========================

  if (!menu) {
    return (
      <div
        className="
          min-h-screen
          bg-gray-50
          flex
          flex-col
          items-center
          justify-center
          px-4
        "
      >
        <p
          className="
            text-gray-500
            font-['Noto_Sans_Thai']
          "
        >
          ไม่พบข้อมูลเมนู
        </p>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="
            mt-4
            px-5
            py-2.5
            rounded-xl
            bg-orange-500
            text-white
            font-semibold
            hover:bg-orange-600
          "
        >
          กลับ
        </button>
      </div>
    );
  }

  // =========================
  // MENU IMAGE
  // =========================

  const menuImage = menu.images?.[0]?.url || menu.images?.[0]?.secure_url || "";

  // =========================
  // RETURN
  // =========================

  return (
    <div
      className="
        min-h-screen mb-20
        bg-gray-50
        font-['Noto_Sans_Thai']
      "
    >
      {/* =========================
          HEADER
      ========================= */}

      <div
        className="
          sticky
          top-0
          z-30
          bg-white
          border-b
          border-orange-100
        "
      >
        <div
          className="
            max-w-6xl
            mx-auto
            px-4
            py-3
            flex
            items-center
            gap-4
          "
        >
          <button
            type="button"
            onClick={() => navigate(`/user//storeRead/${menu.store.id}`)}
            className="
              w-10
              h-10
              rounded-full
              bg-gray-100
              flex
              items-center
              justify-center
              hover:bg-orange-100
              transition
            "
          >
            <ArrowLeft size={20} />
          </button>

          <div className="min-w-0">
            <h1
              className="
                font-bold
                text-lg
                text-[#2A1B12]
                truncate
              "
            >
              รายละเอียดเมนู
            </h1>

            {menu.store?.storeName && (
              <p
                className="
                  text-xs
                  text-gray-500
                  truncate
                "
              >
                {menu.store.storeName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* =========================
          CONTENT
      ========================= */}

      <div
        className="
          max-w-6xl
          mx-auto
        "
      >
        {/* =========================
            MENU IMAGE
        ========================= */}

        {menuImage ? (
          <img
            src={menuImage}
            alt={menu.menuItem}
            className="
              w-full
              h-72
              md:h-96
              object-cover
            "
          />
        ) : (
          <div
            className="
              w-full
              h-72
              md:h-96
              bg-orange-50
              flex
              items-center
              justify-center
              text-gray-400
            "
          >
            ไม่มีรูปภาพ
          </div>
        )}

        {/* =========================
            MENU INFO
        ========================= */}

        <div
          className="
            bg-white
            p-5
            md:p-6
          "
        >
          <h2
            className="
              text-2xl
              md:text-3xl
              font-bold
              text-[#2A1B12]
            "
          >
            {menu.menuItem}
          </h2>

          <p
            className="
              text-gray-500
              mt-2
              leading-relaxed
            "
          >
            {menu.description || "ไม่มีรายละเอียด"}
          </p>

          <div
            className="
              mt-4
              text-2xl
              font-bold
              text-orange-500
            "
          >
            ฿{basePrice.toFixed(2)}
          </div>
        </div>

        {/* =========================
            OPTIONS
        ========================= */}

        <div
          className="
            mt-3
            bg-white
          "
        >
          {menu.options?.length > 0 ? (
            menu.options.map((option) => {
              const selected = selectedOptions[option.id] || [];

              return (
                <div
                  key={option.id}
                  className="
                    p-5
                    border-b
                    border-gray-100
                    last:border-b-0
                  "
                >
                  {/* OPTION HEADER */}

                  <div
                    className="
                      flex
                      justify-between
                      items-center
                      gap-4
                    "
                  >
                    <div>
                      <h3
                        className="
                          font-bold
                          text-lg
                          text-[#2A1B12]
                        "
                      >
                        {option.label}
                      </h3>

                      <p
                        className="
                          text-sm
                          text-gray-400
                          mt-1
                        "
                      >
                        {option.maxRequire === 1
                          ? "เลือกได้ 1 รายการ"
                          : "เลือกได้หลายรายการ"}
                      </p>
                    </div>

                    {option.required && (
                      <span
                        className="
                          shrink-0
                          text-red-500
                          bg-red-50
                          px-3
                          py-1
                          rounded-full
                          text-sm
                        "
                      >
                        จำเป็น
                      </span>
                    )}
                  </div>

                  {/* CHOICES */}

                  <div
                    className="
                      mt-4
                      space-y-3
                    "
                  >
                    {option.choices?.map((choice) => {
                      const isSelected = selected.some(
                        (item) => item.id === choice.id,
                      );

                      return (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => handleSelectOption(option, choice)}
                          className={`
                            w-full
                            flex
                            items-center
                            justify-between
                            p-4
                            rounded-2xl
                            border
                            transition
                            text-left
                            ${
                              isSelected
                                ? "border-orange-500 bg-orange-50"
                                : "border-gray-200 hover:border-orange-300"
                            }
                          `}
                        >
                          <div
                            className="
                              flex
                              items-center
                              gap-3
                            "
                          >
                            {/* RADIO */}

                            {option.maxRequire === 1 ? (
                              <div
                                className={`
                                  w-5
                                  h-5
                                  rounded-full
                                  border-2
                                  flex
                                  items-center
                                  justify-center
                                  ${
                                    isSelected
                                      ? "border-orange-500"
                                      : "border-gray-300"
                                  }
                                `}
                              >
                                {isSelected && (
                                  <div
                                    className="
                                      w-2.5
                                      h-2.5
                                      rounded-full
                                      bg-orange-500
                                    "
                                  />
                                )}
                              </div>
                            ) : (
                              /* CHECKBOX */

                              <div
                                className={`
                                  w-5
                                  h-5
                                  rounded-md
                                  border-2
                                  flex
                                  items-center
                                  justify-center
                                  ${
                                    isSelected
                                      ? "bg-orange-500 border-orange-500"
                                      : "border-gray-300"
                                  }
                                `}
                              >
                                {isSelected && (
                                  <span
                                    className="
                                      text-white
                                      text-xs
                                    "
                                  >
                                    ✓
                                  </span>
                                )}
                              </div>
                            )}

                            <span
                              className="
                                font-medium
                                text-gray-700
                              "
                            >
                              {choice.name}
                            </span>
                          </div>

                          {/* EXTRA PRICE */}

                          {Number(choice.extraPrice || 0) > 0 && (
                            <span
                              className="
                                text-orange-500
                                font-semibold
                                shrink-0
                              "
                            >
                              +฿
                              {Number(choice.extraPrice).toFixed(2)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div
              className="
                p-5
                text-center
                text-gray-400
              "
            >
              ไม่มีตัวเลือกเพิ่มเติม
            </div>
          )}
        </div>

        {/* =========================
            CART
            อยู่ล่าง OPTIONS
            ไม่ลอย
        ========================= */}

        <div
          className="
            mt-3
            bg-white
            p-4
            md:p-5
            border-t
            border-orange-100
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            {/* COUNT */}

            <div
              className="
                flex
                items-center
                gap-2
                rounded-xl
                border
                border-gray-200
                p-1
                shrink-0
              "
            >
              <button
                type="button"
                onClick={handleDecrease}
                disabled={addingCart}
                className="
                  w-9
                  h-9
                  rounded-lg
                  flex
                  items-center
                  justify-center
                  hover:bg-gray-100
                  disabled:opacity-50
                "
              >
                <Minus size={18} />
              </button>

              <span
                className="
                  w-8
                  text-center
                  font-semibold
                "
              >
                {count}
              </span>

              <button
                type="button"
                onClick={handleIncrease}
                disabled={addingCart}
                className="
                  w-9
                  h-9
                  rounded-lg
                  flex
                  items-center
                  justify-center
                  hover:bg-orange-50
                  text-orange-500
                  disabled:opacity-50
                "
              >
                <Plus size={18} />
              </button>
            </div>

            {/* ADD CART */}

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={addingCart || !isStoreOpen}
              className={`
    flex-1
    min-h-[52px]
    rounded-2xl
    text-white
    font-bold
    flex
    items-center
    justify-between
    px-5
    transition
    ${
      isStoreOpen
        ? "bg-orange-500 hover:bg-orange-600"
        : "bg-gray-400 cursor-not-allowed"
    }
    disabled:opacity-70
  `}
            >
              <div
                className="
      flex
      items-center
      gap-2
    "
              >
                {addingCart ? (
                  <>
                    <div
                      className="
            w-5
            h-5
            border-2
            border-white
            border-t-transparent
            rounded-full
            animate-spin
          "
                    />

                    <span>กำลังเพิ่ม...</span>
                  </>
                ) : !isStoreOpen ? (
                  <>
                    <span>ร้านปิด</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} />

                    <span>เพิ่มลงตะกร้า</span>
                  </>
                )}
              </div>

              <span>฿{totalPrice.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuDetail;
