import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import Swal from "sweetalert2";
import Resizer from "react-image-file-resizer";

import usefoodDelivery from "../../globalState/fooddeliveryStore";
import {
  readMenu,
  updateMenu,
  uploadFilesMenu,
  getOptionFormats,
} from "../../api/StoreMenu";

import UploadFile from "./UploadFile";

const initialState = {
  menuItem: "",
  categoryId: "",
  description: "",
  price: "",
  images: [],
  options: [],
  imageFile: null,
  imagePreview: null,
};

const FormEditMenu = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const token = usefoodDelivery((state) => state.token);
  const getCategory = usefoodDelivery((state) => state.getCategory);
  const categories = usefoodDelivery((state) => state.catagories);

  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Format ตัวเลือก
  const [optionFormats, setOptionFormats] = useState([]);
  const [loadingFormats, setLoadingFormats] = useState(false);

  // สถานะเปิด/ปิดหัวข้อตัวเลือก
  const [openOptions, setOpenOptions] = useState({});

  // =====================================================
  // โหลดข้อมูลเมนูและ Format
  // =====================================================

  useEffect(() => {
    if (!token || !id) return;

    const loadData = async () => {
      setLoading(true);

      try {
        await Promise.all([
          getCategory(token),
          fetchMenu(),
          loadOptionFormats(),
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, id]);

  // =====================================================
  // โหลดข้อมูลเมนู
  // =====================================================

  const fetchMenu = async () => {
    try {
      const res = await readMenu(token, id);
      const menu = res.data?.menu || res.data;

      const options = (menu.options || []).map((option) => ({
        ...option,
        label: option.label || "",
        required: Boolean(option.required),
        maxRequire: Number(option.maxRequire || 1),
        choices: (option.choices || []).map((choice) => ({
          ...choice,
          name: choice.name || "",
          extraPrice: Number(choice.extraPrice || 0),
        })),
        sourceFormatId: option.sourceFormatId ?? null,
        sourceFormatName: option.sourceFormatName ?? null,
      }));

      setForm({
        ...initialState,
        ...menu,
        categoryId: menu.categoryId ? String(menu.categoryId) : "",
        price: menu.price ?? "",
        images: menu.images || [],
        options,
        imageFile: null,
        imagePreview:
          menu.images?.[0]?.secure_url || menu.images?.[0]?.url || null,
      });

      setOpenOptions(
        Object.fromEntries(options.map((_, index) => [index, true])),
      );
    } catch (error) {
      console.error("Read Menu Error =", error);

      await Swal.fire({
        icon: "error",
        title: "โหลดข้อมูลเมนูไม่สำเร็จ",
        text: error?.response?.data?.message || "ไม่สามารถโหลดข้อมูลเมนูได้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#FF6B35",
      });

      navigate("/store/menu");
    }
  };

  // =====================================================
  // โหลด Format
  // =====================================================

  const loadOptionFormats = async () => {
    try {
      setLoadingFormats(true);

      const res = await getOptionFormats(token);
      setOptionFormats(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Load Option Formats Error =", error);

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

  // =====================================================
  // เปลี่ยนข้อมูลเมนู
  // =====================================================

  const handleOnChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // เปลี่ยนข้อมูลหัวข้อตัวเลือก
  // =====================================================

  const handleOptionChange = (e, optionIndex) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => {
      const options = [...prev.options];

      options[optionIndex] = {
        ...options[optionIndex],
        [name]: type === "checkbox" ? checked : value,
      };

      return { ...prev, options };
    });
  };

  // =====================================================
  // เปลี่ยนข้อมูลรายการตัวเลือก
  // =====================================================

  const handleChoiceChange = (e, optionIndex, choiceIndex) => {
    const { name, value } = e.target;

    setForm((prev) => {
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

      return { ...prev, options };
    });
  };

  // =====================================================
  // ใช้ Format กับหัวข้อตัวเลือก
  // =====================================================

  const applyFormatToOption = (optionIndex, formatId) => {
    if (!formatId) {
      clearSelectedFormat(optionIndex);
      return;
    }

    const format = optionFormats.find(
      (item) => String(item.id) === String(formatId),
    );

    if (!format) return;

    setForm((prev) => {
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

      return { ...prev, options };
    });

    setOpenOptions((prev) => ({
      ...prev,
      [optionIndex]: true,
    }));
  };

  // =====================================================
  // ยกเลิกการเลือก Format
  // =====================================================

  const clearSelectedFormat = (optionIndex) => {
    setForm((prev) => {
      const options = [...prev.options];

      options[optionIndex] = {
        ...options[optionIndex],
        sourceFormatId: null,
        sourceFormatName: null,
      };

      return { ...prev, options };
    });
  };

  // =====================================================
  // เพิ่มหัวข้อตัวเลือก
  // =====================================================

  const addOption = () => {
    const newIndex = form.options.length;

    setForm((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        {
          label: "",
          required: false,
          maxRequire: 1,
          choices: [{ name: "", extraPrice: 0 }],
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

  // =====================================================
  // ลบหัวข้อตัวเลือก
  // =====================================================

  const removeOption = async (optionIndex) => {
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

    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, index) => index !== optionIndex),
    }));

    setOpenOptions((prev) => {
      const next = {};

      Object.keys(prev).forEach((key) => {
        const index = Number(key);

        if (index < optionIndex) next[index] = prev[index];
        if (index > optionIndex) next[index - 1] = prev[index];
      });

      return next;
    });
  };

  // =====================================================
  // เพิ่มรายการตัวเลือก
  // =====================================================

  const addChoice = (optionIndex) => {
    setForm((prev) => {
      const options = [...prev.options];

      options[optionIndex] = {
        ...options[optionIndex],
        choices: [...options[optionIndex].choices, { name: "", extraPrice: 0 }],
      };

      return { ...prev, options };
    });
  };

  // =====================================================
  // ลบรายการตัวเลือก
  // =====================================================

  const removeChoice = async (optionIndex, choiceIndex) => {
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

    setForm((prev) => {
      const options = [...prev.options];

      options[optionIndex] = {
        ...options[optionIndex],
        choices: options[optionIndex].choices.filter(
          (_, index) => index !== choiceIndex,
        ),
      };

      return { ...prev, options };
    });
  };

  // =====================================================
  // หด/ขยายหัวข้อตัวเลือก
  // =====================================================

  const toggleOption = (index) => {
    setOpenOptions((prev) => ({
      ...prev,
      [index]: prev[index] === false,
    }));
  };

  // =====================================================
  // ย่อขนาดรูปภาพ
  // =====================================================

  const resizeImage = (file) =>
    new Promise((resolve, reject) => {
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

  // =====================================================
  // บันทึกการแก้ไขเมนู
  // =====================================================

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
      setSaving(true);

      const payload = {
        menuItem: form.menuItem.trim(),
        categoryId: Number(form.categoryId),
        description: form.description || "",
        price: Number(form.price),

        // ส่งเฉพาะฟิลด์ที่ API ใช้ ไม่ส่ง sourceFormatId/Name
        options: (form.options || []).map((option) => ({
          label: option.label || "",
          required: Boolean(option.required),
          maxRequire: Math.max(1, Number(option.maxRequire || 1)),
          choices: (option.choices || []).map((choice) => ({
            name: choice.name || "",
            extraPrice: Number(choice.extraPrice || 0),
          })),
        })),
      };

      await updateMenu(token, id, payload);

      if (form.imageFile) {
        const imageData = await resizeImage(form.imageFile);
        await uploadFilesMenu(token, imageData, id);
      }

      await Swal.fire({
        icon: "success",
        title: "แก้ไขเมนูสำเร็จ",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#FF6B35",
      });

      navigate("/store/menu");
    } catch (error) {
      console.error("Update Menu Error =", error);

      await Swal.fire({
        icon: "error",
        title: "แก้ไขเมนูไม่สำเร็จ",
        text:
          error?.response?.data?.message ||
          error?.message ||
          "เกิดข้อผิดพลาด กรุณาลองใหม่",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#FF6B35",
      });
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================


  return (
    <div className="min-h-screen bg-[#FFFCF8] pb-20">
      <form onSubmit={handleSubmit}>
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-5 sm:px-6 sm:py-7">
          {/* หัวข้อ */}
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
                แก้ไขเมนูอาหาร
              </h1>
              <p className="mt-2 text-sm text-[#8B8179]">
                แก้ไขรายละเอียด ราคา รูปภาพ และตัวเลือกของเมนู
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
                  required
                  name="menuItem"
                  value={form.menuItem}
                  onChange={handleOnChange}
                  placeholder="เช่น ข้าวกะเพราหมู"
                  className="w-full rounded-xl border border-[#E9DED4] bg-[#FFFCF8] p-3 text-sm outline-none transition focus:border-[#FF6B35] focus:bg-white focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#514237]">
                  หมวดหมู่
                </label>
                <select
                  required
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleOnChange}
                  className="w-full rounded-xl border border-[#E9DED4] bg-[#FFFCF8] p-3 text-sm outline-none transition focus:border-[#FF6B35] focus:bg-white focus:ring-2 focus:ring-orange-100"
                >
                  <option value="">เลือกหมวดหมู่</option>
                  {(categories || []).map((item) => (
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
                  name="description"
                  value={form.description || ""}
                  onChange={handleOnChange}
                  placeholder="อธิบายรายละเอียดหรือส่วนประกอบของเมนู"
                  className="w-full resize-none rounded-xl border border-[#E9DED4] bg-[#FFFCF8] p-3 text-sm outline-none transition focus:border-[#FF6B35] focus:bg-white focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#514237]">
                  ราคา (บาท)
                </label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  name="price"
                  value={form.price}
                  onChange={handleOnChange}
                  placeholder="เช่น 50"
                  className="w-full rounded-xl border border-[#E9DED4] bg-[#FFFCF8] p-3 text-sm outline-none transition focus:border-[#FF6B35] focus:bg-white focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>
          </section>

          {/* รูปภาพ */}
          <section className="rounded-2xl border border-[#F1E5D9] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-5 text-lg font-bold text-[#2A1B12]">
              รูปภาพเมนู
            </h2>
            <UploadFile form={form} setform={setForm} />
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
                        onClick={() => removeOption(index)}
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
                            value={option.sourceFormatId ?? ""}
                            onChange={(e) =>
                              applyFormatToOption(index, e.target.value)
                            }
                            disabled={loadingFormats}
                            className="w-full rounded-xl border border-[#E9DED4] bg-white p-3 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 disabled:cursor-wait disabled:bg-gray-50"
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
                              name="label"
                              value={option.label || ""}
                              onChange={(e) => handleOptionChange(e, index)}
                              placeholder="เช่น ระดับความเผ็ด"
                              className="w-full rounded-xl border border-[#E9DED4] p-3 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
                            />
                          </div>

                          <div className="flex items-center">
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#514237]">
                              <input
                                type="checkbox"
                                name="required"
                                checked={Boolean(option.required)}
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
                              value={option.maxRequire ?? 1}
                              onChange={(e) => handleOptionChange(e, index)}
                              className="w-full rounded-xl border border-[#E9DED4] p-3 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
                            />
                          </div>
                        </div>

                        {/* รายการตัวเลือก */}
                        <div>
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <h3 className="font-bold text-[#2A1B12]">
                              รายการตัวเลือก
                            </h3>
                            <span className="text-xs text-[#8B8179]">
                              {option.choices.length} รายการ
                            </span>
                          </div>

                          <div className="space-y-3">
                            {option.choices.map((choice, choiceIndex) => (
                              <div
                                key={choiceIndex}
                                className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3"
                              >
                                <input
                                  name="name"
                                  value={choice.name || ""}
                                  onChange={(e) =>
                                    handleChoiceChange(e, index, choiceIndex)
                                  }
                                  placeholder="ชื่อตัวเลือก เช่น ไม่เผ็ด"
                                  className="min-w-0 flex-1 rounded-xl border border-[#E9DED4] p-3 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
                                />

                                <div className="relative w-28 shrink-0 sm:w-36">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    name="extraPrice"
                                    value={choice.extraPrice ?? 0}
                                    onChange={(e) =>
                                      handleChoiceChange(e, index, choiceIndex)
                                    }
                                    className="w-full rounded-xl border border-[#E9DED4] p-3 pr-10 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
                                    placeholder="0"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A69A90]">
                                    บาท
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeChoice(index, choiceIndex)
                                  }
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
              disabled={saving}
              className="w-full rounded-2xl bg-[#FF6B35] py-4 font-bold text-white shadow-lg transition hover:bg-[#E8491D] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FormEditMenu;
