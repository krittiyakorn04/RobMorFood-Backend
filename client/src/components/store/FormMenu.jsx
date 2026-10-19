import { useState, useEffect } from "react";
import usefoodDelivery from "../../globalState/fooddeliveryStore";
import {
  createMenu,
  deleteMenu,
  changeMenuAvailability,
  uploadFilesMenu,
  getOptionFormats,
} from "../../api/StoreMenu";

import UploadFile from "./UploadFile";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  FileText,
  ArrowLeft,
  Soup,
} from "lucide-react";
import Swal from "sweetalert2";
import Resizer from "react-image-file-resizer";
import { useNavigate } from "react-router-dom";

const FormMenu = () => {
  const token = usefoodDelivery((state) => state.token);
  const getCategory = usefoodDelivery((state) => state.getCategory);
  const categories = usefoodDelivery((state) => state.catagories);
  const getMenus = usefoodDelivery((state) => state.getMenus);
  const menus = usefoodDelivery((state) => state.menus);
  const navigate = useNavigate();
  // =========================
  // FORM
  // =========================

  const [form, setform] = useState({
    menuItem: "",
    categoryId: "",
    description: "",
    price: "",
    images: [],
    options: [],
    imageFile: null,
    imagePreview: null,
  });

  // =========================
  // FORMAT
  // =========================

  const [optionFormats, setOptionFormats] = useState([]);
  const [loadingFormats, setLoadingFormats] = useState(false);

  // =========================
  // โหลดข้อมูล
  // =========================

  useEffect(() => {
    if (!token) return;

    getCategory(token);
    getMenus(token);
    loadOptionFormats();
  }, [token]);

  // =========================
  // โหลด Format
  // =========================

  const loadOptionFormats = async () => {
    try {
      setLoadingFormats(true);

      const res = await getOptionFormats(token);

      setOptionFormats(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("โหลดรูปแบบตัวเลือกไม่สำเร็จ =", error);

      await Swal.fire({
        icon: "error",
        title: "โหลดรูปแบบตัวเลือกไม่สำเร็จ",
        text:
          error?.response?.data?.message || "ไม่สามารถโหลดรูปแบบตัวเลือกได้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#FF6B35",
      });
    } finally {
      setLoadingFormats(false);
    }
  };

  // =========================
  // State สำหรับหด/ขยายตัวเลือก
  // =========================

  const [openOptions, setOpenOptions] = useState({});

  // =========================
  // INPUT
  // =========================

  const handleOnChacnge = (e) => {
    setform((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // =========================
  // OPTION CHANGE
  // =========================

  const handleOptionChange = (e, index) => {
    const { name, value, type, checked } = e.target;

    setform((prev) => {
      const options = [...prev.options];

      options[index] = {
        ...options[index],
        [name]: type === "checkbox" ? checked : value,
      };

      return {
        ...prev,
        options,
      };
    });
  };

  // =========================
  // CHOICE CHANGE
  // =========================

  const handleChoiceChange = (e, optionIndex, choiceIndex) => {
    const { name, value } = e.target;

    setform((prev) => {
      const options = [...prev.options];
      const choices = [...options[optionIndex].choices];

      choices[choiceIndex] = {
        ...choices[choiceIndex],
        [name]: value,
      };

      options[optionIndex] = {
        ...options[optionIndex],
        choices,
      };

      return {
        ...prev,
        options,
      };
    });
  };

  // =========================
  // เลือก FORMAT
  // =========================

  const applyFormatToOption = (optionIndex, formatId) => {
    if (!formatId) return;

    const format = optionFormats.find(
      (item) => Number(item.id) === Number(formatId),
    );

    if (!format) return;

    setform((prev) => {
      const options = [...prev.options];

      options[optionIndex] = {
        ...options[optionIndex],
        label: format.name || "",
        required: Boolean(format.required),
        maxRequire: Number(format.maxRequire || 1),
        choices: (format.choices || []).map((choice) => ({
          name: choice.name || "",
          extraPrice: Number(choice.extraPrice || 0),
        })),
        sourceFormatId: format.id,
        sourceFormatName: format.name,
      };

      return {
        ...prev,
        options,
      };
    });

    setOpenOptions((prev) => ({
      ...prev,
      [optionIndex]: true,
    }));
  };

  // =========================
  // CLEAR FORMAT
  // =========================

  const clearSelectedFormat = (optionIndex) => {
    setform((prev) => {
      const options = [...prev.options];

      options[optionIndex] = {
        ...options[optionIndex],
        sourceFormatId: null,
        sourceFormatName: null,
      };

      return {
        ...prev,
        options,
      };
    });
  };

  // =========================
  // TOGGLE AVAILABILITY
  // =========================

  const handleToggleAvailability = async (menu) => {
    try {
      const result = await changeMenuAvailability(token, menu.id);

      await Swal.fire({
        icon: "success",
        title: result.data.menu.isAvailable ? "เปิดเมนูแล้ว" : "ปิดเมนูแล้ว",
        timer: 1200,
        showConfirmButton: false,
      });

      await getMenus(token);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error?.response?.data?.message || "ไม่สามารถเปลี่ยนสถานะเมนูได้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#FF6B35",
      });
    }
  };

  // =========================
  // ADD OPTION
  // =========================

  const addOption = () => {
    const newIndex = form.options.length;

    setform((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        {
          label: "",
          required: false,
          maxRequire: 1,
          choices: [
            {
              name: "",
              extraPrice: 0,
            },
          ],
          sourceFormatId: null,
          sourceFormatName: null,
        },
      ],
    }));

    setOpenOptions((prev) => ({
      ...prev,
      [newIndex]: true,
    }));
  };

  // =========================
  // DELETE OPTION
  // =========================

  const deleteOption = async (optionIndex) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบหัวข้อ",
      text: "ต้องการลบหัวข้อตัวเลือกนี้หรือไม่?",
      showCancelButton: true,
      confirmButtonText: "ลบหัวข้อ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#E8491D",
      cancelButtonColor: "#6B7280",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setform((prev) => ({
      ...prev,
      options: prev.options.filter((_, index) => index !== optionIndex),
    }));

    setOpenOptions((prev) => {
      const newState = {};

      Object.keys(prev).forEach((key) => {
        const index = Number(key);

        if (index < optionIndex) {
          newState[index] = prev[index];
        }

        if (index > optionIndex) {
          newState[index - 1] = prev[index];
        }
      });

      return newState;
    });
  };

  // =========================
  // ADD CHOICE
  // =========================

  const addChoice = (optionIndex) => {
    setform((prev) => {
      const options = [...prev.options];

      options[optionIndex] = {
        ...options[optionIndex],
        choices: [
          ...options[optionIndex].choices,
          {
            name: "",
            extraPrice: 0,
          },
        ],
      };

      return {
        ...prev,
        options,
      };
    });
  };

  // =========================
  // DELETE CHOICE
  // =========================

  const deleteChoice = async (optionIndex, choiceIndex) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบตัวเลือก",
      text: "ต้องการลบตัวเลือกนี้หรือไม่?",
      showCancelButton: true,
      confirmButtonText: "ลบตัวเลือก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#E8491D",
      cancelButtonColor: "#6B7280",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setform((prev) => {
      const options = [...prev.options];

      const choices = options[optionIndex].choices.filter(
        (_, index) => index !== choiceIndex,
      );

      options[optionIndex] = {
        ...options[optionIndex],
        choices,
      };

      return {
        ...prev,
        options,
      };
    });
  };

  // =========================
  // TOGGLE OPTION
  // =========================

  const toggleOption = (index) => {
    setOpenOptions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // =========================
  // RESIZE IMAGE
  // =========================

  const resizeImage = (file) => {
    return new Promise((resolve, reject) => {
      try {
        Resizer.default.imageFileResizer(
          file,
          1200,
          1200,
          "JPEG",
          90,
          0,
          (data) => resolve(data),
          "base64",
        );
      } catch (error) {
        reject(error);
      }
    });
  };

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.menuItem.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "กรุณากรอกชื่อเมนู",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#FF6B35",
      });
      return;
    }

    if (!form.categoryId) {
      await Swal.fire({
        icon: "warning",
        title: "กรุณาเลือกหมวดหมู่",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#FF6B35",
      });
      return;
    }

    if (
      form.price === "" ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) <= 0
    ) {
      await Swal.fire({
        icon: "warning",
        title: "กรุณากรอกราคาเมนูให้ถูกต้อง",
        text: "ราคาต้องมากกว่า 0 บาท",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#FF6B35",
      });
      return;
    }

    try {
      const { imageFile, imagePreview, ...menuForm } = form;

      const data = {
        ...menuForm,
        price: Number(form.price),
        categoryId: Number(form.categoryId),
        options: (form.options || []).map((option) => ({
          label: option.label,
          required: Boolean(option.required),
          maxRequire: Math.max(1, Number(option.maxRequire || 1)),
          choices: (option.choices || []).map((choice) => ({
            name: choice.name,
            extraPrice: Number(choice.extraPrice || 0),
          })),
        })),
      };

      const res = await createMenu(token, data);
      const newMenu = res.data?.menu || res.data;
      const menuId = newMenu?.id;

      if (!menuId) {
        throw new Error("สร้างเมนูสำเร็จแต่ไม่พบรหัสเมนู");
      }

      if (imageFile) {
        const imageData = await resizeImage(imageFile);

        await uploadFilesMenu(token, imageData, menuId);
      }

      await getMenus(token);

      setform({
        menuItem: "",
        categoryId: "",
        description: "",
        price: "",
        images: [],
        options: [],
        imageFile: null,
        imagePreview: null,
      });

      setOpenOptions({});

      await Swal.fire({
        icon: "success",
        title: "เพิ่มเมนูสำเร็จ",
        text: `เพิ่มข้อมูล ${newMenu?.menuItem || form.menuItem} สำเร็จ`,
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#FF6B35",
      });
    } catch (error) {
      console.error("Create Menu Error =", error);

      await Swal.fire({
        icon: "error",
        title: "เพิ่มเมนูไม่สำเร็จ",
        text:
          error?.response?.data?.message ||
          error?.message ||
          "เกิดข้อผิดพลาด กรุณาลองใหม่",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#FF6B35",
      });
    }
  };

  // =========================
  // DELETE MENU
  // =========================

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบเมนู",
      text: "คุณต้องการลบเมนูนี้หรือไม่?",
      showCancelButton: true,
      confirmButtonText: "ลบเมนู",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#E8491D",
      cancelButtonColor: "#6B7280",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await deleteMenu(token, id);
      await getMenus(token);

      await Swal.fire({
        icon: "success",
        title: "ลบเมนูสำเร็จ",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Delete Menu Error =", error);

      await Swal.fire({
        icon: "error",
        title: "ลบเมนูไม่สำเร็จ",
        text:
          error?.response?.data?.message || "ไม่สามารถลบเมนูได้ กรุณาลองใหม่",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#FF6B35",
      });
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="min-h-screen bg-[#FFFCF8] pb-20">
      <form onSubmit={handleSubmit}>
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-5 sm:px-6 sm:py-7">
          {/* ปุ่มกลับและหัวข้อ */}
          <div>
            <button
              type="button"
              onClick={() => {
                navigate(-1);
              }}
              className="inline-flex mb-6 cursor-pointer items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-sm font-medium text-[#8A6A54] shadow-sm transition hover:border-orange-300 hover:text-orange-500"
            >
              <ArrowLeft size={16} />
              กลับหน้าก่อนหน้า
            </button>

            <div className="rounded-2xl border border-[#F1E5D9] bg-white px-5 py-5 shadow-sm sm:px-6">
              <h1 className="text-2xl font-bold tracking-tight text-[#2A1B12] sm:text-3xl">
                เพิ่มเมนูอาหาร
              </h1>
              <p className="mt-2 text-sm text-[#8B8179]">
                เพิ่มรายละเอียด ราคา รูปภาพ และตัวเลือกของเมนูในร้าน
              </p>
            </div>
          </div>

          {/* ข้อมูลเมนู */}
          <section className="rounded-2xl border border-[#F1E5D9] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-5 text-lg font-bold text-[#2A1B12]">
              ข้อมูลเมนู
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#514237]">
                  ชื่อเมนู
                </label>
                <input
                  className="w-full rounded-xl border border-[#E9DED4] bg-[#FFFCF8] p-3 text-sm outline-none transition focus:border-[#FF6B35] focus:bg-white focus:ring-2 focus:ring-orange-100"
                  value={form.menuItem}
                  onChange={handleOnChacnge}
                  name="menuItem"
                  placeholder="เช่น ข้าวกะเพราหมู"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-[#514237]">
                    หมวดหมู่
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate("/store/MenuCategory")}
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#FF6B35] transition hover:text-[#E8491D]"
                  >
                    <Plus size={16} />
                    เพิ่มหมวดหมู่
                  </button>
                </div>

                <select
                  className="w-full rounded-xl border border-[#E9DED4] bg-[#FFFCF8] p-3 text-sm outline-none transition focus:border-[#FF6B35] focus:bg-white focus:ring-2 focus:ring-orange-100"
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleOnChacnge}
                >
                  <option value="">เลือกหมวดหมู่</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nameCate}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-[#514237]">
                  รายละเอียดเมนู
                </label>
                <textarea
                  rows={4}
                  className="w-full resize-none rounded-xl border border-[#E9DED4] bg-[#FFFCF8] p-3 text-sm outline-none transition focus:border-[#FF6B35] focus:bg-white focus:ring-2 focus:ring-orange-100"
                  value={form.description}
                  onChange={handleOnChacnge}
                  name="description"
                  placeholder="อธิบายรายละเอียดหรือส่วนประกอบของเมนู"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#514237]">
                  ราคา (บาท)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-xl border border-[#E9DED4] bg-[#FFFCF8] p-3 text-sm outline-none transition focus:border-[#FF6B35] focus:bg-white focus:ring-2 focus:ring-orange-100"
                  value={form.price}
                  onChange={handleOnChacnge}
                  name="price"
                  placeholder="เช่น 50"
                />
              </div>
            </div>
          </section>

          {/* รูปภาพ */}
          <section className="rounded-2xl border border-[#F1E5D9] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-5 text-lg font-bold text-[#2A1B12]">
              รูปภาพเมนู
            </h2>
            <UploadFile form={form} setform={setform} />
          </section>

          {/* ตัวเลือกเมนู */}
          <section className="rounded-2xl border border-[#F1E5D9] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-[#2A1B12]">ตัวเลือกเมนู</h2>
              <p className="mt-1 text-sm text-[#8B8179]">
                เช่น ระดับความเผ็ด ขนาดอาหาร หรือท็อปปิ้งเพิ่มเติม
              </p>
            </div>

            {form.options.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#E9DED4] bg-[#FFFCF8] px-4 py-9 text-center">
                <div className="mb-3 text-4xl">⚙️</div>
                <p className="font-semibold text-[#514237]">
                  ยังไม่มีตัวเลือกเมนู
                </p>
                <p className="mt-1 text-sm text-[#A69A90]">
                  กดเพิ่มหัวข้อเพื่อกำหนดตัวเลือกให้ลูกค้า
                </p>
              </div>
            )}

            <div className="space-y-4">
              {form.options.map((option, index) => {
                const isOpen = openOptions[index] !== false;

                return (
                  <div
                    key={index}
                    className="overflow-hidden rounded-2xl border border-[#F1E5D9] bg-white"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-[#F1E5D9] bg-[#FFF9F3] px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleOption(index)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#FF6B35] shadow-sm">
                          {isOpen ? (
                            <ChevronUp size={19} />
                          ) : (
                            <ChevronDown size={19} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#2A1B12]">
                            หัวข้อที่ {index + 1}
                          </p>
                          <p className="truncate text-sm text-[#8B8179]">
                            {option.label || "ยังไม่ได้ตั้งชื่อหัวข้อ"}
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteOption(index)}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-red-500 transition hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                        <span className="hidden sm:inline">ลบหัวข้อ</span>
                      </button>
                    </div>

                    {isOpen && (
                      <div className="space-y-6 p-4 sm:p-5">
                        {/* เลือก Format */}
                        <div className="rounded-2xl border border-orange-100 bg-[#FFF9F3] p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <FileText size={19} className="text-[#FF6B35]" />
                            <div>
                              <p className="font-semibold text-[#2A1B12]">
                                รูปแบบตัวเลือก
                              </p>
                              <p className="text-xs text-[#8B8179]">
                                เลือกรูปแบบที่บันทึกไว้เพื่อนำมาใช้
                              </p>
                            </div>
                          </div>

                          <select
                            value={option.sourceFormatId || ""}
                            onChange={(e) =>
                              applyFormatToOption(index, e.target.value)
                            }
                            className="w-full rounded-xl border border-[#E9DED4] bg-white p-3 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
                          >
                            <option value="">
                              {loadingFormats
                                ? "กำลังโหลดรูปแบบ..."
                                : "เลือก Format ที่ต้องการ"}
                            </option>
                            {optionFormats.map((format) => (
                              <option key={format.id} value={format.id}>
                                {format.name}
                              </option>
                            ))}
                          </select>

                          {option.sourceFormatName && (
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs text-[#B45309]">
                                ใช้รูปแบบ: {option.sourceFormatName}
                              </p>
                              <button
                                type="button"
                                onClick={() => clearSelectedFormat(index)}
                                className="text-xs text-[#8B8179] hover:text-red-500"
                              >
                                ยกเลิกการเลือก Format
                              </button>
                            </div>
                          )}
                        </div>

                        {/* ตั้งค่าหัวข้อ */}
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-[#514237]">
                              ชื่อหัวข้อ
                            </label>
                            <input
                              className="w-full rounded-xl border border-[#E9DED4] p-3 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
                              value={option.label}
                              name="label"
                              onChange={(e) => handleOptionChange(e, index)}
                              placeholder="เช่น ระดับความเผ็ด"
                            />
                          </div>

                          <div className="flex items-center">
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#514237]">
                              <input
                                type="checkbox"
                                name="required"
                                checked={option.required}
                                onChange={(e) => handleOptionChange(e, index)}
                                className="h-4 w-4 accent-[#FF6B35]"
                              />
                              บังคับเลือก
                            </label>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-[#514237]">
                              เลือกได้สูงสุด
                            </label>
                            <input
                              type="number"
                              min="1"
                              name="maxRequire"
                              value={option.maxRequire}
                              onChange={(e) => handleOptionChange(e, index)}
                              className="w-full rounded-xl border border-[#E9DED4] p-3 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
                            />
                          </div>
                        </div>

                        {/* รายการตัวเลือก */}
                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="font-bold text-[#2A1B12]">
                              รายการตัวเลือก
                            </h3>
                            <span className="text-xs text-[#8B8179]">
                              {option.choices.length} รายการ
                            </span>
                          </div>

                          <div className="space-y-3">
                            {option.choices.map((choice, i) => (
                              <div
                                key={i}
                                className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3"
                              >
                                <input
                                  className="min-w-0 flex-1 rounded-xl border border-[#E9DED4] p-3 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
                                  value={choice.name}
                                  name="name"
                                  onChange={(e) =>
                                    handleChoiceChange(e, index, i)
                                  }
                                  placeholder="ชื่อตัวเลือก เช่น ไม่เผ็ด"
                                />

                                <div className="relative w-28 shrink-0 sm:w-36">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-xl border border-[#E9DED4] p-3 pr-10 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
                                    value={choice.extraPrice}
                                    name="extraPrice"
                                    onChange={(e) =>
                                      handleChoiceChange(e, index, i)
                                    }
                                    placeholder="0"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A69A90]">
                                    บาท
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => deleteChoice(index, i)}
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50"
                                  title="ลบตัวเลือก"
                                >
                                  <Trash2 size={17} />
                                </button>
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => addChoice(index)}
                            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#FF6B35] hover:text-[#E8491D]"
                          >
                            <Plus size={17} />
                            เพิ่มตัวเลือก
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addOption}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-orange-200 bg-[#FFF9F3] px-4 py-3 font-semibold text-[#FF6B35] transition hover:border-[#FF6B35] hover:bg-orange-50"
            >
              <Plus size={18} />
              เพิ่มหัวข้อ
            </button>
          </section>

          {/* ปุ่มบันทึก */}
          <div className="sticky bottom-4 z-10">
            <button
              type="submit"
              className="w-full rounded-2xl bg-[#FF6B35] py-4 font-bold text-white shadow-lg transition hover:bg-[#E8491D]"
            >
              บันทึกเมนู
            </button>
          </div>
        </div>
      </form>

      {/* รายการเมนูทั้งหมด */}
      <div className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
        <div className="mb-5 flex items-center justify-between border-t border-[#F1E5D9] pt-7">
          <div>
            <h2 className="text-xl font-bold text-[#2A1B12] sm:text-2xl">
              เมนูทั้งหมด
            </h2>
            <p className="mt-1 text-sm text-[#8B8179]">
              รายการเมนูอาหารของร้าน
            </p>
          </div>
          <span className="rounded-full bg-[#FFF0E7] px-3 py-1.5 text-sm font-semibold text-[#E8491D]">
            {menus.length} เมนู
          </span>
        </div>

        {menus.length === 0 ? (
          <div className="rounded-2xl border border-[#F1E5D9] bg-white px-4 py-12 text-center">
            <div className="mb-3 flex justify-center">
              <Soup size={56} strokeWidth={1.8} className="text-[#FF6B35]" />
            </div>
            <h3 className="font-semibold text-[#2A1B12]">ยังไม่มีเมนูอาหาร</h3>
            <p className="mt-1 text-sm text-[#8B8179]">
              เพิ่มเมนูแรกของร้านได้จากแบบฟอร์มด้านบน
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {menus.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-[#F1E5D9] bg-white shadow-sm transition hover:shadow-md"
              >
                {item.images?.length > 0 ? (
                  <img
                    src={item.images[0].url}
                    alt={item.menuItem}
                    className="h-52 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-52 w-full items-center justify-center bg-[#FFF5EC] text-sm text-[#A69A90]">
                    ไม่มีรูปภาพเมนู
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-[#2A1B12]">
                        {item.menuItem}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-[#8B8179]">
                        {item.description || "ไม่มีรายละเอียดเมนู"}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-[#FFF0E7] px-3 py-1 text-xs font-medium text-[#E8491D]">
                      ขาย {item.sold}
                    </span>
                  </div>

                  <div className="mt-4 space-y-4 border-t border-[#F1E5D9] pt-4">
                    {/* ราคาและสถานะ */}
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-[#9A8D82]">ราคาเมนู</p>
                        <p className="text-2xl font-bold text-[#E8491D]">
                          ฿{item.price}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          item.isAvailable
                            ? "bg-[#E8F5E9] text-[#388E3C]"
                            : "bg-[#F5F0EC] text-[#8B8179]"
                        }`}
                      >
                        {item.isAvailable ? "● เปิดขายอยู่" : "● ปิดขายอยู่"}
                      </span>
                    </div>

                    {/* ปุ่มจัดการ */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(item)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition active:scale-[0.98] ${
                          item.isAvailable
                            ? "border border-[#F4B7A0] bg-[#FFF4EE] text-[#D94F24] hover:bg-[#FFE7DC]"
                            : "bg-[#FF6B35] text-white shadow-sm shadow-orange-200 hover:bg-[#E8491D]"
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full bg-current" />
                        {item.isAvailable ? "ปิดการขาย" : "เปิดขายเมนู"}
                      </button>

                      <Link
                        to={`/store/EditMenu/${item.id}`}
                        className="flex items-center justify-center rounded-xl border border-[#F1E5D9] bg-white px-4 py-3 text-sm font-medium text-[#65564B] transition hover:bg-[#FFFCF8]"
                      >
                        แก้ไข
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="flex items-center justify-center rounded-xl border border-red-100 bg-white px-4 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormMenu;
