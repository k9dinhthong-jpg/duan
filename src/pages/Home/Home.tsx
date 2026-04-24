import MainSlider from "../../assets/components/Main-slider/MainSlider";
import ProductSection from "../../assets/components/ProductSection/ProductSection";
import IntroCompany from "../../assets/components/IntroCompany/IntroCompany";
import FeaturedNews from "../../assets/components/FeaturedNews/FeaturedNews";
import "./Home.css";

function Home() {
  return (
    <section className="home-page">
      <div className="home-page__slider">
        <MainSlider /> {/* Slider chính */}
      </div>

      <div className="home-page__content home-page__products">
        <ProductSection /> {/* Phần sản phẩm */}
      </div>

      <div className="home-page__content home-page__company">
        <IntroCompany /> {/* Giới thiệu công ty */}
      </div>

      <div className="home-page__content home-page__news">
        <FeaturedNews /> {/* Tin tức nổi bật */}
      </div>
    </section>
  );
}

export default Home;
