import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Header from "./assets/components/Header/Header";
import Footer from "./assets/components/Footer/Footer";
import ButtonContact from "./assets/components/ButtonContact/ButtonContact";
import WelcomePopup from "./assets/components/WelcomePopup/WelcomePopup";
import { applySeo } from "./utils/seo";

const Home = lazy(() => import("./pages/Home/Home"));
const Contact = lazy(() => import("./pages/Contact/Contact"));
const News = lazy(() => import("./pages/News/News"));
const NewsDetail = lazy(() => import("./pages/News/NewsDetail"));
const AboutUs = lazy(() => import("./pages/Introduct/AboutUs/AboutUs"));
const MainProduct = lazy(() => import("./pages/Product/MainProduct"));
const SelectProduct = lazy(() => import("./pages/Product/SelectProduct"));
const ShowProduct = lazy(() => import("./pages/Product/ShowProduct"));
const Warranty = lazy(() => import("./pages/Services/Warranty"));
const Repair = lazy(() => import("./pages/Services/Repair"));
const Rent = lazy(() => import("./pages/Services/Rent"));
const PrivacyPolicy = lazy(() => import("./pages/Policy/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./pages/Policy/TermsOfUse"));
const WarrantyPolicy = lazy(() => import("./pages/Policy/WarrantyPolicy"));
const PaymentPolicy = lazy(() => import("./pages/Policy/PaymentPolicy"));
const ShippingPolicy = lazy(() => import("./pages/Policy/ShippingPolicy"));
const NotFound = lazy(() => import("./pages/NotFound/NotFound"));
const LoginAccount = lazy(
  () => import("./assets/components/LoginAccount/LoginAccount"),
);

function getSeoByPath(pathname: string) {
  if (pathname === "/" || pathname === "/home") {
    return {
      title: "Máy Công Trình Nhập Khẩu Hitachi, Kobelco, Komatsu chính hãng",
      description:
        "Máy Công Trình Nhập Khẩu chuyên máy xúc, máy đào Hitachi, Kobelco, Komatsu chính hãng; hỗ trợ tư vấn, báo giá, bảo hành, sửa chữa và cho thuê toàn quốc.",
    };
  }

  if (pathname === "/product") {
    return {
      title: "Sản phẩm máy công trình nhập khẩu - cập nhật mới mỗi ngày",
      description:
        "Danh mục máy xúc, máy đào nhập khẩu theo thương hiệu Hitachi, Kobelco, Komatsu; đầy đủ model, tình trạng, xuất xứ và thông tin liên hệ tư vấn nhanh.",
    };
  }

  if (pathname === "/product/detail") {
    return {
      title: "Chi tiết sản phẩm máy công trình nhập khẩu",
      description:
        "Trang chi tiết sản phẩm máy công trình với model, năm đời, xuất xứ, giá tham khảo, trạng thái và kênh liên hệ tư vấn trực tiếp.",
    };
  }

  if (pathname.startsWith("/product/")) {
    return {
      title: "Máy công trình theo thương hiệu Hitachi, Kobelco, Komatsu",
      description:
        "Tra cứu máy xúc, máy đào theo thương hiệu, model, tình trạng, xuất xứ và thông tin tư vấn để chọn thiết bị phù hợp nhu cầu thi công thực tế.",
    };
  }

  if (pathname === "/news" || pathname.startsWith("/news/")) {
    return {
      title: "Tin tức máy công trình và kinh nghiệm vận hành",
      description:
        "Cập nhật tin tức thị trường máy công trình, kinh nghiệm vận hành, bảo dưỡng máy xúc máy đào và thông tin sản phẩm mới.",
    };
  }

  if (pathname === "/about-us") {
    return {
      title: "Giới thiệu công ty Máy Công Trình Nhập Khẩu",
      description:
        "Tìm hiểu về Máy Công Trình Nhập Khẩu: năng lực cung ứng thiết bị, đội ngũ kỹ thuật, kinh nghiệm vận hành và cam kết hậu mãi.",
    };
  }

  if (pathname.startsWith("/services/")) {
    return {
      title: "Dịch vụ bảo hành, sửa chữa, cho thuê máy công trình",
      description:
        "Dịch vụ bảo hành, sửa chữa, cho thuê máy công trình với kỹ thuật viên giàu kinh nghiệm, quy trình minh bạch và hỗ trợ nhanh 24/7.",
    };
  }

  if (pathname === "/contact") {
    return {
      title: "Liên hệ tư vấn và báo giá máy công trình",
      description:
        "Liên hệ Máy Công Trình Nhập Khẩu để nhận tư vấn chọn máy, báo giá nhanh, hỗ trợ kỹ thuật và lịch hẹn xem máy trực tiếp.",
    };
  }

  if (pathname === "/login") {
    return {
      title: "Đăng nhập",
      description:
        "Đăng nhập tài khoản để quản lý thông tin, theo dõi yêu cầu tư vấn và đồng bộ dữ liệu làm việc.",
      noIndex: true,
    };
  }

  if (pathname === "/policy/privacy") {
    return {
      title: "Chính sách bảo mật",
      description:
        "Thông tin về cách Máy Công Trình Nhập Khẩu thu thập, lưu trữ và sử dụng dữ liệu khách hàng.",
    };
  }

  if (pathname === "/policy/terms") {
    return {
      title: "Điều khoản sử dụng",
      description:
        "Quy định và điều kiện áp dụng khi sử dụng website Máy Công Trình Nhập Khẩu.",
    };
  }

  if (pathname === "/policy/warranty") {
    return {
      title: "Chính sách bảo hành",
      description:
        "Nội dung, phạm vi và điều kiện bảo hành cho sản phẩm máy công trình.",
    };
  }

  if (pathname === "/policy/payment") {
    return {
      title: "Chính sách thanh toán",
      description:
        "Thông tin phương thức và quy trình thanh toán khi mua sản phẩm, dịch vụ.",
    };
  }

  if (pathname === "/policy/shipping") {
    return {
      title: "Chính sách vận chuyển",
      description:
        "Thông tin phạm vi, thời gian và quy trình bàn giao vận chuyển sản phẩm.",
    };
  }

  return {
    title: "Không tìm thấy trang",
    description: "Trang bạn yêu cầu không tồn tại hoặc đã được di chuyển.",
    noIndex: true,
  };
}

function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    applySeo(getSeoByPath(pathname));
  }, [pathname]);

  return (
    <section>
      <WelcomePopup />
      <header>
        <Header /> {/* Header chính */}
      </header>
      <main>
        <Suspense fallback={<p className="container">Đang tải trang...</p>}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} /> {/* Trang chủ */}
            <Route path="/contact" element={<Contact />} />{" "}
            {/* Trang liên hệ */}
            <Route path="/login" element={<LoginAccount />} />
            <Route path="/news" element={<News />} /> {/* Trang tin tức */}
            <Route path="/news/:slug" element={<NewsDetail />} />
            <Route path="/about-us" element={<AboutUs />} />
            {/* Trang về chúng tôi */}
            <Route path="/product" element={<MainProduct />} />
            {/* Trang sản phẩm chung */}
            <Route path="/product/detail" element={<ShowProduct />} />
            {/* Trang chi tiết sản phẩm */}
            <Route path="/product/:brand" element={<SelectProduct />} />
            {/* Trang sản phẩm theo brand (Hitachi/Kobelco/Komatsu) */}
            <Route path="/services/warranty" element={<Warranty />} />
            <Route path="/services/repair" element={<Repair />} />
            <Route path="/services/rent" element={<Rent />} />
            <Route path="/policy/privacy" element={<PrivacyPolicy />} />
            <Route path="/policy/terms" element={<TermsOfUse />} />
            <Route path="/policy/warranty" element={<WarrantyPolicy />} />
            <Route path="/policy/payment" element={<PaymentPolicy />} />
            <Route path="/policy/shipping" element={<ShippingPolicy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <footer>
        <ButtonContact /> {/* Nút liên hệ */}
        <Footer /> {/* Footer chính */}
      </footer>
    </section>
  );
}

export default App;
