import Header from "./assets/components/Header/Header";
import Footer from "./assets/components/Footer/Footer";
import ButtonContact from "./assets/components/ButtonContact/ButtonContact";
import Home from "./pages/Home/Home";
import { Route, Routes, Navigate } from "react-router-dom";
import Contact from "./pages/Contact/Contact";
import News from "./pages/News/News";
import NewsDetail from "./pages/News/NewsDetail";
import AboutUs from "./pages/Introduct/AboutUs/AboutUs";
import MainProduct from "./pages/Product/MainProduct";
import SelectProduct from "./pages/Product/SelectProduct";
import Warranty from "./pages/Sevices/Warranty";
import Repair from "./pages/Sevices/Repair";
import Rent from "./pages/Sevices/Rent";

function App() {
  return (
    <section>
      <header>
        <Header /> {/* Header chính */}
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} /> {/* Trang chủ */}
          <Route path="/contact" element={<Contact />} /> {/* Trang liên hệ */}
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
        </Routes>
      </main>
      <footer>
        <ButtonContact /> {/* Nút liên hệ */}
        <Footer /> {/* Footer chính */}
      </footer>
    </section>
  );
}

export default App;
