import Footer from "../../assets/components/Footer/Footer";
import Header from "../../assets/components/Header/Header";
import ButtonContact from "../../assets/components/ButtonContact/ButtonContact";
import MainSlider from "../../assets/components/Main-slider/MainSlider";
import ProductSection from "../../assets/components/ProductSection/ProductSection";
import IntroCompany from "../../assets/components/IntroCompany/IntroCompany";
import FeaturedNews from "../../assets/components/FeaturedNews/FeaturedNews";

function Home() {
  return (
    <section>
      <header>
        <Header />
      </header>
      <main>
        <section className="container">
          <div>
            <ButtonContact />
          </div>
          <div>
            <MainSlider />
          </div>
          <div>
            <ProductSection />
          </div>
          <div>
            <IntroCompany />
          </div>
          <div>
            <FeaturedNews />
          </div>
        </section>
      </main>
      <footer>
        <Footer />
      </footer>
    </section>
  );
}

export default Home;
