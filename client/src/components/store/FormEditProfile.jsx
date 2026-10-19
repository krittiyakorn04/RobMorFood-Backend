import { useEffect, useState, useRef } from "react";
import usefoodDelivery from "../../globalState/fooddeliveryStore";
import {
  Store,
  User,
  Phone,
  MapPin,
  Pencil,
  X,
  Navigation,
  LocateFixed,
  Megaphone,
  Truck,
  ArrowLeft,
} from "lucide-react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import Resizer from "react-image-file-resizer";

import {
  updateStoreProfile,
  updateStorePassword,
  uploadFiles,
  uploadFilesBanner,
  removeFiles,
  removeFilesBanner,
} from "../../api/createStore";

import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

// =========================================================
// Leaflet Marker
// =========================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// =========================================================
// Default Location
// =========================================================

const DEFAULT_LAT = 16.2465;
const DEFAULT_LNG = 103.2505;

// =========================================================
// Map Controller
// =========================================================

const MapController = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (!position) return;

    map.flyTo(position, 17, {
      duration: 1,
    });
  }, [position, map]);

  return null;
};

// =========================================================
// FormEditProfile
// =========================================================

const FormEditProfile = () => {
  const navigate = useNavigate();

  const token = usefoodDelivery((state) => state.token);
  const getStore = usefoodDelivery((state) => state.getStore);
  const stores = usefoodDelivery((state) => state.stores);

  const storeCategory = usefoodDelivery((state) => state.storeCategory);

  const getStoreCategory = usefoodDelivery((state) => state.getStoreCategory);

  const bannerInputRef = useRef(null);
  const profileInputRef = useRef(null);

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangePassword = async () => {
    const { oldPassword, newPassword, confirmPassword } = passwordForm;

    if (!oldPassword || !newPassword || !confirmPassword) {
      await Swal.fire({
        icon: "warning",
        title: "กรุณากรอกข้อมูลให้ครบ",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s])\S{8,64}$/;

    if (!passwordRegex.test(newPassword)) {
      await Swal.fire({
        icon: "warning",
        title: "รหัสผ่านใหม่ไม่ถูกต้อง",
        text: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร มีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ โดยไม่มีช่องว่าง",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    if (!passwordRegex.test(newPassword)) {
      await Swal.fire({
        icon: "warning",
        title: "รหัสผ่านใหม่ไม่ถูกต้อง",
        text: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร มีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      await Swal.fire({
        icon: "warning",
        title: "รหัสผ่านไม่ตรงกัน",
        text: "กรุณายืนยันรหัสผ่านใหม่ให้ตรงกัน",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    if (oldPassword === newPassword) {
      await Swal.fire({
        icon: "warning",
        title: "รหัสผ่านใหม่ซ้ำกับรหัสผ่านเดิม",
        text: "กรุณากำหนดรหัสผ่านใหม่ที่แตกต่างจากเดิม",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "ยืนยันเปลี่ยนรหัสผ่าน?",
      text: "คุณต้องการเปลี่ยนรหัสผ่านบัญชีร้านค้าหรือไม่",
      showCancelButton: true,
      confirmButtonText: "เปลี่ยนรหัสผ่าน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setPasswordLoading(true);

      const response = await updateStorePassword(token, {
        oldPassword,
        newPassword,
      });

      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      await Swal.fire({
        icon: "success",
        title: "เปลี่ยนรหัสผ่านสำเร็จ",
        text: response?.data?.message || "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว",
        confirmButtonColor: "#f97316",
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "เปลี่ยนรหัสผ่านไม่สำเร็จ",
        text:
          error?.response?.data?.message ||
          "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // =========================================================
  // Form
  // =========================================================

  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    storeName: "",
    storeCategoryIds: [],
    phone: "",
    address: "",
    images: [],
    dayOpen: "",
    Notice: "",

    facebookUrl: "",
    instagramUrl: "",
    tiktokUrl: "",
    lineUrl: "",

    deliveryFee: 0,

    // พิกัด
    lat: null,
    lng: null,
  });

  // =========================================================
  // Location
  // =========================================================

  const [locationFound, setLocationFound] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [markerPosition, setMarkerPosition] = useState(null);

  // =========================================================
  // Images
  // =========================================================

  const bannerImage = stores?.images?.find((image) =>
    image.public_id?.startsWith("StoreBanner2026"),
  );

  const storeImage = stores?.images?.find((image) =>
    image.public_id?.startsWith("StoreProfile2026"),
  );

  // =========================================================
  // โหลดข้อมูลร้าน
  // =========================================================

  useEffect(() => {
    if (!stores) return;


    const categoryIds =
      stores.storeCategories
        ?.filter((item) => item?.storeCategory)
        .map((item) => Number(item.storeCategory.id)) || [];

    const storeLat =
      stores.lat !== null && stores.lat !== undefined
        ? Number(stores.lat)
        : null;

    const storeLng =
      stores.lng !== null && stores.lng !== undefined
        ? Number(stores.lng)
        : null;

    setEditForm({
      username: stores.username || "",
      email: stores.email || "",
      storeName: stores.storeName || "",
      storeCategoryIds: categoryIds,
      phone: stores.phone || "",
      address: stores.address || "",
      dayOpen: stores.dayOpen || "",
      Notice: stores.Notice || "",

      deliveryFee:
        stores.deliveryFee !== undefined && stores.deliveryFee !== null
          ? Number(stores.deliveryFee)
          : 0,

      facebookUrl: stores.facebookUrl || "",
      instagramUrl: stores.instagramUrl || "",
      tiktokUrl: stores.tiktokUrl || "",
      lineUrl: stores.lineUrl || "",

      lat: storeLat,
      lng: storeLng,
    });

    // ถ้ามีพิกัดเดิม
    if (
      storeLat !== null &&
      storeLng !== null &&
      !Number.isNaN(storeLat) &&
      !Number.isNaN(storeLng)
    ) {
      setMarkerPosition([storeLat, storeLng]);
      setLocationFound(true);
    }
  }, [stores]);

  // =========================================================
  // โหลด Category
  // =========================================================

  useEffect(() => {
    getStoreCategory();
  }, [getStoreCategory]);

  // =========================================================
  // Input
  // =========================================================

  const handleOnChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]:
        name === "deliveryFee" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  // =========================================================
  // Category
  // =========================================================

  const toggleCategory = (categoryId) => {
    const id = Number(categoryId);

    setEditForm((prev) => {
      const currentIds = prev.storeCategoryIds || [];

      if (currentIds.includes(id)) {
        return {
          ...prev,
          storeCategoryIds: currentIds.filter((item) => item !== id),
        };
      }

      return {
        ...prev,
        storeCategoryIds: [...currentIds, id],
      };
    });
  };

  const removeCategory = (categoryId) => {
    const id = Number(categoryId);

    setEditForm((prev) => ({
      ...prev,
      storeCategoryIds: prev.storeCategoryIds.filter((item) => item !== id),
    }));
  };

  // =========================================================
  // ค้นหาพิกัดของฉัน
  // =========================================================

  const handleFindLocation = () => {
    if (!navigator.geolocation) {
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถค้นหาพิกัดได้",
        text: "เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(7));

        const lng = Number(position.coords.longitude.toFixed(7));

        

        setMarkerPosition([lat, lng]);

        setEditForm((prev) => ({
          ...prev,
          lat,
          lng,
        }));

        setLocationFound(true);
        setLocationLoading(false);

        Swal.fire({
          icon: "success",
          title: "ค้นหาพิกัดสำเร็จ",
          text: "กำหนดตำแหน่งร้านของคุณเรียบร้อยแล้ว",
          timer: 1500,
          showConfirmButton: false,
        });
      },

      (error) => {
        console.log("LOCATION ERROR =", error);

        setLocationLoading(false);

        let message = "ไม่สามารถค้นหาพิกัดได้";

        if (error.code === 1) {
          message = "กรุณาอนุญาตให้เว็บไซต์เข้าถึงตำแหน่งของคุณ";
        } else if (error.code === 2) {
          message = "ไม่สามารถระบุตำแหน่งได้";
        } else if (error.code === 3) {
          message = "ค้นหาพิกัดใช้เวลานานเกินไป";
        }

        Swal.fire({
          icon: "error",
          title: "ค้นหาพิกัดไม่สำเร็จ",
          text: message,
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#f97316",
        });
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  // =========================================================
  // ลาก Marker
  // =========================================================

  const handleMarkerDragEnd = (event) => {
    const marker = event.target;
    const position = marker.getLatLng();

    const lat = Number(position.lat.toFixed(7));

    const lng = Number(position.lng.toFixed(7));


    setMarkerPosition([lat, lng]);

    setEditForm((prev) => ({
      ...prev,
      lat,
      lng,
    }));

    Swal.fire({
      icon: "success",
      title: "เปลี่ยนตำแหน่งร้านแล้ว",
      timer: 1200,
      showConfirmButton: false,
    });
  };

  // =========================================================
  // Submit
  // =========================================================


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      editForm.lat === null ||
      editForm.lng === null ||
      Number.isNaN(Number(editForm.lat)) ||
      Number.isNaN(Number(editForm.lng))
    ) {
      await Swal.fire({
        icon: "warning",
        title: "ยังไม่ได้กำหนดพิกัด",
        text: "กรุณากำหนดพิกัดร้านก่อนบันทึก",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    // =========================================================
    // ตรวจว่ามีการเปลี่ยน Username / Phone หรือไม่
    // =========================================================

    const usernameChanged = editForm.username !== (stores?.username || "");

    const phoneChanged = editForm.phone !== (stores?.phone || "");

    // =========================================================
    // ถ้าเปลี่ยน Username
    // =========================================================

    if (usernameChanged) {
      const result = await Swal.fire({
        icon: "warning",
        title: "เปลี่ยน Username",
        text: "เมื่อเปลี่ยน Username แล้ว จะสามารถเปลี่ยนได้อีกครั้งหลังจาก 30 วัน",
        showCancelButton: true,
        confirmButtonText: "ยืนยันเปลี่ยน",
        cancelButtonText: "ยกเลิก",
        confirmButtonColor: "#f97316",
        cancelButtonColor: "#6b7280",
        reverseButtons: true,
      });

      if (!result.isConfirmed) {
        return;
      }
    }

    // =========================================================
    // ถ้าเปลี่ยนเบอร์โทรศัพท์
    // =========================================================

    if (phoneChanged) {
      const result = await Swal.fire({
        icon: "warning",
        title: "เปลี่ยนเบอร์โทรศัพท์",
        text: "คุณต้องการเปลี่ยนเบอร์โทรศัพท์ของร้านใช่หรือไม่?",
        showCancelButton: true,
        confirmButtonText: "ยืนยันเปลี่ยน",
        cancelButtonText: "ยกเลิก",
        confirmButtonColor: "#f97316",
        cancelButtonColor: "#6b7280",
        reverseButtons: true,
      });

      if (!result.isConfirmed) {
        return;
      }
    }

    try {
      const data = {
        ...editForm,

        email: editForm.email.trim().toLowerCase(),

        storeCategoryIds: editForm.storeCategoryIds.map(Number),
        deliveryFee: Number(editForm.deliveryFee),

        lat: Number(editForm.lat),
        lng: Number(editForm.lng),
      };


      await updateStoreProfile(token, data);

      await Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        text: "แก้ไขข้อมูลร้านเรียบร้อยแล้ว",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      await getStore(token);

      navigate("/store/Profile");
    } catch (error) {
      console.log("UPDATE STORE ERROR =", error);

      const message = error?.response?.data?.message || "";

      // =========================================================
      // Username ซ้ำ
      // =========================================================

      if (
        message.toLowerCase().includes("username") &&
        (message.includes("ซ้ำ") ||
          message.includes("มีผู้ใช้งานแล้ว") ||
          message.includes("มีอยู่ในระบบ"))
      ) {
        await Swal.fire({
          icon: "error",
          title: "Username ซ้ำ",
          text: "Username นี้มีผู้ใช้งานแล้ว กรุณาใช้ Username อื่น",
          confirmButtonText: "แก้ไข",
          confirmButtonColor: "#f97316",
        });

        return;
      }

      // =========================================================
      // เบอร์โทรซ้ำ
      // =========================================================

      if (
        message.toLowerCase().includes("phone") ||
        message.includes("เบอร์โทร") ||
        message.includes("หมายเลขโทรศัพท์")
      ) {
        await Swal.fire({
          icon: "error",
          title: "เบอร์โทรศัพท์ซ้ำ",
          text: "เบอร์โทรศัพท์นี้มีอยู่ในระบบแล้ว กรุณาใช้เบอร์อื่น",
          confirmButtonText: "แก้ไข",
          confirmButtonColor: "#f97316",
        });

        return;
      }

      // =========================================================
      // Email ซ้ำ
      // =========================================================

      if (
        message.toLowerCase().includes("email") ||
        message.includes("อีเมล")
      ) {
        await Swal.fire({
          icon: "error",
          title: "Email ซ้ำ",
          text: "Email นี้มีอยู่ในระบบแล้ว กรุณาใช้ Email อื่น",
          confirmButtonText: "แก้ไข",
          confirmButtonColor: "#f97316",
        });

        return;
      }

      // =========================================================
      // ชื่อร้านซ้ำ
      // =========================================================

      if (message.includes("ชื่อร้าน") || message.includes("storeName")) {
        await Swal.fire({
          icon: "error",
          title: "ชื่อร้านซ้ำ",
          text: "ชื่อร้านนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่อร้านอื่น",
          confirmButtonText: "แก้ไข",
          confirmButtonColor: "#f97316",
        });

        return;
      }

      // =========================================================
      // Username ยังไม่ครบ 30 วัน
      // =========================================================

      if (message.includes("30 วัน") || message.includes("อีกครั้งใน")) {
        await Swal.fire({
          icon: "warning",
          title: "ยังไม่สามารถเปลี่ยน Username ได้",
          text: message,
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#f97316",
        });

        return;
      }

      // =========================================================
      // Error อื่น ๆ
      // =========================================================

      await Swal.fire({
        icon: "error",
        title: "แก้ไขข้อมูลไม่สำเร็จ",
        text: message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    }
  };

  // =========================================================
  // Upload Profile
  // =========================================================

  const handleProfileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "error",
        title: "ไฟล์ไม่ถูกต้อง",
        text: "กรุณาเลือกไฟล์รูปภาพเท่านั้น",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
      e.target.value = "";
      return;
    }

    Resizer.default.imageFileResizer(
      file,
      720,
      720,
      "JPEG",
      100,
      0,
      async (data) => {
        try {
          // เก็บรูปเก่าไว้ก่อน
          const oldProfileImage = stores?.images?.find((image) =>
            image.public_id?.startsWith("StoreProfile2026"),
          );

          // ==========================================
          // 1. Upload รูปใหม่
          // ==========================================

          const uploadRes = await uploadFiles(token, data);


          // ==========================================
          // 2. ลบรูปเก่า
          // ==========================================

          if (
            oldProfileImage?.public_id &&
            uploadRes.data?.public_id !== oldProfileImage.public_id
          ) {
            try {
              await removeFiles(token, oldProfileImage.public_id);
            } catch (deleteError) {
              console.error("ลบรูปโปรไฟล์เก่าไม่สำเร็จ =", deleteError);
            }
          }

          // ==========================================
          // 3. โหลดข้อมูลร้านใหม่
          // ==========================================

          await getStore(token);

          Swal.fire({
            icon: "success",
            title: "เปลี่ยนรูปโปรไฟล์ร้านสำเร็จ",
            timer: 1500,
            showConfirmButton: false,
          });
        } catch (error) {
          console.error("เปลี่ยนรูปโปรไฟล์ไม่สำเร็จ =", error);

          Swal.fire({
            icon: "error",
            title: "เปลี่ยนรูปโปรไฟล์ไม่สำเร็จ",
            text:
              error?.response?.data?.message ||
              "เปลี่ยนรูปโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่",
            confirmButtonText: "ตกลง",
            confirmButtonColor: "#f97316",
          });
        } finally {
          e.target.value = "";
        }
      },
      "base64",
    );
  };

  // =========================================================
  // Upload Banner
  // =========================================================

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "error",
        title: "ไฟล์ไม่ถูกต้อง",
        text: "กรุณาเลือกไฟล์รูปภาพเท่านั้น",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
      e.target.value = "";
      return;
    }

    Resizer.default.imageFileResizer(
      file,
      1200,
      500,
      "JPEG",
      100,
      0,
      async (data) => {
        try {
          // เก็บ Banner เก่า
          const oldBannerImage = stores?.images?.find((image) =>
            image.public_id?.startsWith("StoreBanner2026"),
          );

          // ==========================================
          // 1. Upload Banner ใหม่
          // ==========================================

          const uploadRes = await uploadFilesBanner(token, data);


          // ==========================================
          // 2. ลบ Banner เก่า
          // ==========================================

          if (
            oldBannerImage?.public_id &&
            uploadRes.data?.public_id !== oldBannerImage.public_id
          ) {
            try {
              await removeFilesBanner(token, oldBannerImage.public_id);
            } catch (deleteError) {
              console.error("ลบ Banner เก่าไม่สำเร็จ =", deleteError);
            }
          }

          // ==========================================
          // 3. โหลดร้านใหม่
          // ==========================================

          await getStore(token);

          Swal.fire({
            icon: "success",
            title: "เปลี่ยน Banner สำเร็จ",
            timer: 1500,
            showConfirmButton: false,
          });
        } catch (error) {
          console.error("เปลี่ยน Banner ไม่สำเร็จ =", error);

          Swal.fire({
            icon: "error",
            title: "เปลี่ยน Banner ไม่สำเร็จ",
            text:
              error?.response?.data?.message ||
              "เปลี่ยน Banner ไม่สำเร็จ กรุณาลองใหม่",
            confirmButtonText: "ตกลง",
            confirmButtonColor: "#f97316",
          });
        } finally {
          e.target.value = "";
        }
      },
      "base64",
    );
  };

  // =========================================================
  // Render
  // =========================================================

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-28">
      <form onSubmit={handleSubmit}>
        {/* Back Button */}
        <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-1 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-sm font-medium text-[#8A6A54] shadow-sm transition hover:border-orange-300 hover:text-orange-500"
          >
            <ArrowLeft size={16} />
            กลับหน้าก่อนหน้า
          </button>
        </div>
        {/* =====================================================
            HEADER / STORE PREVIEW
        ====================================================== */}
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-orange-100">
            {/* Banner */}
            <div className="relative h-52 overflow-hidden sm:h-64">
              {bannerImage?.url ? (
                <img
                  src={bannerImage.url}
                  alt="Banner ร้าน"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 to-[#FFE4C4]">
                  <div className="text-center">
                    <Store size={42} className="mx-auto mb-2 text-orange-300" />
                    <span className="text-sm text-orange-400">
                      ยังไม่มีรูป Banner
                    </span>
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />

              {/* Edit Banner */}
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-orange-500 shadow-lg backdrop-blur-sm transition hover:scale-105 hover:bg-white"
              >
                <Pencil size={17} />
              </button>

              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerChange}
              />
            </div>

            {/* Store Info */}
            <div className="relative px-5 pb-7 pt-16 sm:px-8">
              {/* Profile Image */}
              <div className="absolute -top-14 left-1/2 -translate-x-1/2">
                <div className="relative">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-[5px] border-white bg-orange-100 shadow-lg">
                    {storeImage?.url ? (
                      <img
                        src={storeImage.url}
                        alt="รูปโปรไฟล์ร้าน"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Store size={48} className="text-orange-400" />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => profileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white shadow-md transition hover:scale-105 hover:bg-orange-600"
                  >
                    <Pencil size={15} />
                  </button>

                  <input
                    ref={profileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfileChange}
                  />
                </div>
              </div>

              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
                  {stores?.storeName || "ร้านของฉัน"}
                </h1>

                {/* Categories */}
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {stores?.storeCategories?.length > 0 ? (
                    stores.storeCategories
                      .filter((item) => item?.storeCategory)
                      .map((item) => (
                        <span
                          key={item.storeCategory.id}
                          className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600 ring-1 ring-orange-100"
                        >
                          {item.storeCategory.name}
                        </span>
                      ))
                  ) : (
                    <span className="text-sm text-gray-400">
                      ยังไม่ได้เลือกประเภทร้าน
                    </span>
                  )}
                </div>

                {/* Store Status */}
                <div className="mt-4 flex justify-center">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${
                      stores?.status === "OPEN"
                        ? "bg-green-50 text-green-600 ring-1 ring-green-200"
                        : "bg-red-50 text-red-600 ring-1 ring-red-200"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        stores?.status === "OPEN"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                    {stores?.status === "OPEN" ? "เปิดรับออเดอร์" : "ปิดร้าน"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            FORM CONTENT
        ====================================================== */}
        <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
              แก้ไขข้อมูลร้านอาหาร
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              จัดการข้อมูลและรายละเอียดร้านของคุณ
            </p>
          </div>

          <div className="space-y-5">
            {/* =====================================================
                ACCOUNT
            ====================================================== */}
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-orange-100 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <User size={18} />
                </div>

                <div>
                  <h2 className="font-bold text-gray-800">ข้อมูลบัญชี</h2>

                  <p className="text-xs text-gray-400">
                    ข้อมูลสำหรับเข้าสู่ระบบร้าน
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600">
                    Username
                  </label>

                  <input
                    type="text"
                    name="username"
                    value={editForm.username}
                    onChange={handleOnChange}
                    placeholder="username"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleOnChange}
                    placeholder="store@gmail.com"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>
            </section>

            {/* Delivery Fee */}
            <div className="mb-5 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF3E4]">
                  <Truck size={22} className="text-[#FF6B35]" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#2A1B12]">
                    ค่าจัดส่ง
                  </h3>
                  <p className="mt-1 text-xs text-[#A58D7B]">
                    กำหนดค่าจัดส่งที่ลูกค้าต้องชำระ
                  </p>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  name="deliveryFee"
                  min="0"
                  step="1"
                  value={editForm.deliveryFee}
                  onChange={handleOnChange}
                  placeholder="0"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-16 text-sm text-gray-700 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
                />

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  บาท
                </span>
              </div>
            </div>

            {/* =====================================================
                NOTICE
            ====================================================== */}
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-orange-100 sm:p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
                    <Megaphone size={20} />
                  </span>

                  <div>
                    <h2 className="font-bold text-gray-800">ประกาศร้าน</h2>

                    <p className="text-xs text-gray-400">
                      ข้อความนี้จะแสดงให้ลูกค้าเห็นในหน้าร้าน
                    </p>
                  </div>
                </div>
              </div>

              <textarea
                name="Notice"
                value={editForm.Notice}
                onChange={handleOnChange}
                placeholder="เช่น วันนี้เปิดปกติ | ช่วง 11:30 - 13:00 อาจใช้เวลาจัดส่งเพิ่ม"
                rows={4}
                className="w-full resize-none rounded-2xl border border-yellow-100 bg-yellow-50/70 px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </section>

            {/* =====================================================
                STORE INFORMATION
            ====================================================== */}
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-orange-100 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <Store size={18} />
                </div>

                <div>
                  <h2 className="font-bold text-gray-800">ข้อมูลร้าน</h2>

                  <p className="text-xs text-gray-400">
                    ข้อมูลพื้นฐานของร้านอาหาร
                  </p>
                </div>
              </div>

              {/* Store Name */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-600">
                  ชื่อร้าน
                </label>

                <input
                  type="text"
                  name="storeName"
                  value={editForm.storeName}
                  onChange={handleOnChange}
                  placeholder="Pizza House"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* Category */}
              <div className="mb-5">
                <label className="mb-1 block text-sm font-medium text-gray-600">
                  ประเภทร้าน
                </label>

                <p className="mb-3 text-xs text-gray-400">
                  เลือกได้มากกว่า 1 ประเภท
                </p>

                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      toggleCategory(e.target.value);
                    }
                  }}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
                >
                  <option value="">+ เลือกประเภทของร้าน</option>

                  {storeCategory
                    ?.filter(
                      (item) =>
                        !editForm.storeCategoryIds?.includes(Number(item.id)),
                    )
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                </select>

                <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                  <p className="mb-3 text-xs font-semibold text-gray-500">
                    ประเภทที่เลือก
                  </p>

                  {editForm.storeCategoryIds?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {editForm.storeCategoryIds.map((id) => {
                        const category = storeCategory?.find(
                          (item) => Number(item.id) === Number(id),
                        );

                        if (!category) return null;

                        return (
                          <div
                            key={id}
                            className="flex items-center gap-2 rounded-xl bg-orange-100 px-3 py-2 text-sm font-medium text-orange-600"
                          >
                            <span>{category.name}</span>

                            <button
                              type="button"
                              onClick={() => removeCategory(id)}
                              className="flex h-5 w-5 items-center justify-center rounded-full text-orange-500 transition hover:bg-orange-200 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-white p-3 text-center text-sm text-gray-400">
                      ยังไม่ได้เลือกประเภทร้าน
                    </div>
                  )}
                </div>
              </div>

              {/* Phone */}

              <div className="mb-5">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Phone size={14} className="text-orange-500" />
                  เบอร์โทรศัพท์
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={editForm.phone}
                  onChange={(e) => {
                    const digits = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);

                    handleOnChange({
                      target: {
                        name: "phone",
                        value: digits,
                      },
                    });
                  }}
                  placeholder="089xxxxxxx"
                  inputMode="numeric"
                  maxLength={10}
                  className={`w-full rounded-2xl border bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:bg-white focus:ring-2 ${
                    editForm.phone.length === 0
                      ? "border-gray-200 focus:border-orange-300 focus:ring-orange-100"
                      : /^0[689]\d{8}$/.test(editForm.phone)
                        ? "border-green-400 focus:border-green-400 focus:ring-green-100"
                        : "border-red-300 focus:border-red-400 focus:ring-red-100"
                  }`}
                />

                {editForm.phone.length > 0 && (
                  <p
                    className={`mt-2 text-xs ${
                      /^0[689]\d{8}$/.test(editForm.phone)
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {/^0[689]\d{8}$/.test(editForm.phone)
                      ? "✓ รูปแบบเบอร์โทรศัพท์ถูกต้อง"
                      : editForm.phone.length < 10
                        ? `กรอกอีก ${10 - editForm.phone.length} หลัก`
                        : "เบอร์ต้องมี 10 หลัก และขึ้นต้นด้วย 06, 08 หรือ 09"}
                  </p>
                )}
              </div>

     

              {/* Address */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-600">
                  <MapPin size={14} className="text-orange-500" />
                  ที่อยู่ร้าน
                </label>

                <textarea
                  name="address"
                  value={editForm.address}
                  onChange={handleOnChange}
                  placeholder="Store Address"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </section>

            {/* =====================================================
                SOCIAL MEDIA
            ====================================================== */}
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-orange-100 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-lg">
                  🌐
                </div>

                <div>
                  <h2 className="font-bold text-gray-800">ช่องทางติดต่อร้าน</h2>

                  <p className="text-xs text-gray-400">
                    เพิ่มช่องทางโซเชียลมีเดียให้ลูกค้าติดต่อร้าน
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Facebook */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600">
                    Facebook
                  </label>

                  <input
                    type="url"
                    name="facebookUrl"
                    value={editForm.facebookUrl}
                    onChange={handleOnChange}
                    placeholder="https://www.facebook.com/ชื่อร้าน"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* Instagram */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600">
                    Instagram
                  </label>

                  <input
                    type="url"
                    name="instagramUrl"
                    value={editForm.instagramUrl}
                    onChange={handleOnChange}
                    placeholder="https://www.instagram.com/ชื่อร้าน"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* TikTok */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600">
                    TikTok
                  </label>

                  <input
                    type="url"
                    name="tiktokUrl"
                    value={editForm.tiktokUrl}
                    onChange={handleOnChange}
                    placeholder="https://www.tiktok.com/@ชื่อร้าน"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* Line */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600">
                    Line
                  </label>

                  <input
                    type="url"
                    name="lineUrl"
                    value={editForm.lineUrl}
                    onChange={handleOnChange}
                    placeholder="https://line.me/ti/p/xxxxxxxx"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>
            </section>

            {/* =====================================================
                LOCATION
            ====================================================== */}
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-orange-100 sm:p-6">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                    <MapPin size={18} />
                  </div>

                  <div>
                    <h2 className="font-bold text-gray-800">พิกัดร้าน</h2>

                    <p className="text-xs text-gray-400">
                      ค้นหาพิกัด แล้วลากหมุดเพื่อปรับตำแหน่งร้าน
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleFindLocation}
                  disabled={locationLoading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {locationLoading ? (
                    <>
                      <LocateFixed size={16} className="animate-pulse" />
                      กำลังค้นหา...
                    </>
                  ) : (
                    <>
                      <Navigation size={16} />
                      ค้นหาพิกัดของฉัน
                    </>
                  )}
                </button>
              </div>

              {/* Map */}
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                {" "}
                <MapContainer
                  center={markerPosition || [DEFAULT_LAT, DEFAULT_LNG]}
                  zoom={15}
                  scrollWheelZoom={true}
                  className="h-[400px] w-full"
                  style={{ zIndex: 0, position: "relative" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <MapController position={markerPosition} />

                  {markerPosition && locationFound && (
                    <Marker
                      position={markerPosition}
                      draggable={true}
                      eventHandlers={{
                        dragend: handleMarkerDragEnd,
                      }}
                    />
                  )}
                </MapContainer>
                {!locationFound && (
                  <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/65 backdrop-blur-[2px]">
                    <div className="mx-4 rounded-2xl bg-white px-6 py-5 text-center shadow-xl ring-1 ring-gray-100">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
                        <MapPin size={25} className="text-orange-500" />
                      </div>

                      <p className="font-semibold text-gray-700">
                        ยังไม่ได้กำหนดพิกัดร้าน
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        กด "ค้นหาพิกัดของฉัน" เพื่อเริ่มต้น
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Coordinates */}
              {locationFound && (
                <>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
                      <p className="text-xs text-gray-400">Latitude</p>

                      <p className="mt-1 font-mono text-sm font-semibold text-gray-700">
                        {editForm.lat}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
                      <p className="text-xs text-gray-400">Longitude</p>

                      <p className="mt-1 font-mono text-sm font-semibold text-gray-700">
                        {editForm.lng}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-start gap-2 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                    <span className="font-bold">✓</span>

                    <span>
                      กำหนดพิกัดแล้ว
                      สามารถลากหมุดบนแผนที่เพื่อปรับตำแหน่งร้านได้
                    </span>
                  </div>
                </>
              )}
            </section>
          </div>

          {/* =====================================================
              BUTTONS
          ====================================================== */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/store/Profile")}
              className="flex-1 rounded-2xl border border-gray-200 bg-white py-3.5 font-semibold text-gray-600 shadow-sm transition hover:bg-gray-50"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="flex-1 rounded-2xl bg-orange-500 py-3.5 font-semibold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md"
            >
              บันทึกข้อมูล
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FormEditProfile;
