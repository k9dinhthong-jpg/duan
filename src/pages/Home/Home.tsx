import MainSlider from "../../assets/components/Main-slider/MainSlider";
import ProductSection from "../../assets/components/ProductSection/ProductSection";
import IntroCompany from "../../assets/components/IntroCompany/IntroCompany";
import FeaturedNews from "../../assets/components/FeaturedNews/FeaturedNews";

function Home() {
  return (
    <section className="container">
      <MainSlider /> {/* Slider chính */}
      <ProductSection /> {/* Phần sản phẩm */}
      <IntroCompany /> {/* Giới thiệu công ty */}
      <FeaturedNews /> {/* Tin tức nổi bật */}
    </section>
  );
}

export default Home;
