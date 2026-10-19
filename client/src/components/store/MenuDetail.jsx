import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Minus, Plus, ShoppingCart } from "lucide-react";

import usefoodDelivery from "../../globalState/fooddeliveryStore";

const MenuDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const token = usefoodDelivery((state) => state.token);
  const getMenus = usefoodDelivery((state) => state.getMenus);
  const menus = usefoodDelivery((state) => state.menus);

  const [selectedOptions, setSelectedOptions] = useState({});
  const [count, setCount] = useState(1);

  useEffect(() => {
    if (token) {
      getMenus(token);
    }
  }, [token, getMenus]);

  const menu = useMemo(() => {
    return (menus || []).find(
      (item) => String(item.id) === String(id),
    );
  }, [menus, id]);

  // =========================
  // SELECT OPTION
  // =========================

  const handleSelectOption = (option, choice) => {
    setSelectedOptions((prev) => {
      const current = prev[option.id] || [];

      // เลือกได้ 1
      if (option.maxRequire === 1) {
        return {
          ...prev,
          [option.id]: [choice],
        };
      }

      // Checkbox
      const exists = current.some(
        (item) => item.id === choice.id,
      );

      let updated;

      if (exists) {
        updated = current.filter(
          (item) => item.id !== choice.id,
        );
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
  // CALCULATE OPTION PRICE
  // =========================

  const optionTotal = useMemo(() => {
    return Object.values(selectedOptions)
      .flat()
      .reduce((total, choice) => {
        return total + Number(choice.extraPrice || 0);
      }, 0);
  }, [selectedOptions]);

  const basePrice = Number(menu?.price || 0);

  const totalPrice =
    (basePrice + optionTotal) * count;

  // =========================
  // REQUIRED VALIDATION
  // =========================

  const isRequiredComplete = useMemo(() => {
    if (!menu?.options) return true;

    return menu.options.every((option) => {
      if (!option.required) return true;

      const selected =
        selectedOptions[option.id] || [];

      return selected.length > 0;
    });
  }, [menu, selectedOptions]);

  // =========================
  // ADD CART
  // =========================

  const handleAddToCart = () => {
    if (!isRequiredComplete) {
      alert("กรุณาเลือกตัวเลือกที่จำเป็น");
      return;
    }

    const options = Object.entries(selectedOptions).flatMap(
      ([optionId, choices]) =>
        choices.map((choice) => ({
          optionId: Number(optionId),
          choiceId: choice.id,
        })),
    );


    // ตรงนี้ค่อยเชื่อม API addToCart ของคุณ
    // await addToCart(token, {
    //   menuId: menu.id,
    //   count,
    //   options,
    // });
  };

  // =========================
  // LOADING
  // =========================

  if (!menu) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        กำลังโหลดข้อมูลเมนู...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-36">

      {/* =========================
          HEADER
      ========================= */}

      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              w-10
              h-10
              rounded-full
              bg-gray-100
              flex
              items-center
              justify-center
              hover:bg-gray-200
              transition
            "
          >
            <ArrowLeft size={20} />
          </button>

          <h1 className="font-bold text-lg">
            รายละเอียดเมนู
          </h1>

        </div>
      </div>


      <div className="max-w-6xl mx-auto">

        {/* =========================
            MENU IMAGE
        ========================= */}

        {menu.images?.[0]?.url ? (
          <img
            src={menu.images[0].url}
            alt={menu.menuItem}
            className="
              w-full
              h-72
              object-cover
            "
          />
        ) : (
          <div
            className="
              w-full
              h-72
              bg-gray-200
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

        <div className="bg-white p-5">

          <h2 className="text-2xl font-bold">
            {menu.menuItem}
          </h2>

          <p className="text-gray-500 mt-2 leading-relaxed">
            {menu.description || "ไม่มีรายละเอียด"}
          </p>

          <div className="mt-4 text-2xl font-bold text-orange-500">
            ฿{basePrice.toFixed(2)}
          </div>

        </div>


        {/* =========================
            OPTIONS
        ========================= */}

        <div className="mt-3 bg-white">

          {menu.options?.length > 0 ? (
            menu.options.map((option) => {

              const selected =
                selectedOptions[option.id] || [];

              return (
                <div
                  key={option.id}
                  className="
                    p-5
                    border-b
                    last:border-b-0
                  "
                >

                  {/* OPTION HEADER */}

                  <div className="flex justify-between items-center">

                    <div>
                      <h3 className="font-bold text-lg">
                        {option.label}
                      </h3>

                      <p className="text-sm text-gray-400 mt-1">
                        {option.maxRequire === 1
                          ? "เลือกได้ 1 รายการ"
                          : "เลือกได้หลายรายการ"}
                      </p>

                    </div>


                    {option.required && (
                      <span
                        className="
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

                  <div className="mt-4 space-y-3">

                    {option.choices?.map((choice) => {

                      const isSelected =
                        selected.some(
                          (item) =>
                            item.id === choice.id,
                        );

                      return (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() =>
                            handleSelectOption(
                              option,
                              choice,
                            )
                          }
                          className={`
                            w-full
                            flex
                            items-center
                            justify-between
                            p-4
                            rounded-2xl
                            border
                            transition

                            ${
                              isSelected
                                ? "border-orange-500 bg-orange-50"
                                : "border-gray-200 hover:border-orange-300"
                            }
                          `}
                        >

                          <div className="flex items-center gap-3">

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
                                  <span className="text-white text-xs">
                                    ✓
                                  </span>
                                )}
                              </div>

                            )}

                            <span className="font-medium">
                              {choice.name}
                            </span>

                          </div>


                          {/* EXTRA PRICE */}

                          {Number(choice.extraPrice || 0) > 0 && (
                            <span className="text-orange-500 font-semibold">
                              +฿
                              {Number(
                                choice.extraPrice,
                              ).toFixed(2)}
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

            <div className="p-5 text-center text-gray-400">
              ไม่มีตัวเลือกเพิ่มเติม
            </div>

          )}

        </div>
        
      </div>

    </div>
  );
};

export default MenuDetail;