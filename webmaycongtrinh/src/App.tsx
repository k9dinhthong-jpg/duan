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
      title: "Máy Công Trình Nhập Khẩu Hitachi, Kobelco, Komatsu",
      description:
        "Máy Công Trình Nhập Khẩu cung cấp máy xúc, máy đào Hitachi, Kobelco, Komatsu cùng dịch vụ bảo hành, sửa chữa, cho thuê tại Phú Thọ và toàn quốc.",
    };
  }

  if (pathname === "/product") {
    return {
      title: "Sản phẩm máy công trình nhập khẩu",
      description:
        "Danh mục máy công trình nhập khẩu chính hãng, cập nhật liên tục theo thương hiệu Hitachi, Kobelco, Komatsu và tình trạng thực tế.",
    };
  }

  if (pathname.startsWith("/product/")) {
    return {
      title: "Chi tiết máy công trình theo thương hiệu",
      description:
        "Tra cứu nhanh máy xúc, máy đào theo thương hiệu, tình trạng, mức giá và thông số kỹ thuật phù hợp nhu cầu thi công.",
    };
  }

  if (pathname === "/news" || pathname.startsWith("/news/")) {
    return {
      title: "Tin tức máy công trình",
      description:
        "Tin tức thị trường máy công trình, kinh nghiệm vận hành, bảo dưỡng máy xúc và cập nhật sản phẩm mới từ Máy Công Trình Nhập Khẩu.",
    };
  }

  if (pathname === "/about-us") {
    return {
      title: "Giới thiệu Máy Công Trình Nhập Khẩu",
      description:
        "Thông tin doanh nghiệp, năng lực vận hành, đội ngũ kỹ thuật và cam kết dịch vụ của Máy Công Trình Nhập Khẩu.",
    };
  }

  if (pathname.startsWith("/services/")) {
    return {
      title: "Dịch vụ bảo hành, sửa chữa, cho thuê máy công trình",
      description:
        "Dịch vụ bảo hành, sửa chữa và cho thuê máy công trình với hỗ trợ kỹ thuật nhanh, linh kiện phù hợp và quy trình rõ ràng.",
    };
  }

  if (pathname === "/contact") {
    return {
      title: "Liên hệ tư vấn máy công trình",
      description:
        "Liên hệ Máy Công Trình Nhập Khẩu để được tư vấn nhanh về sản phẩm, báo giá máy xúc, dịch vụ sửa chữa và cho thuê máy công trình.",
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
