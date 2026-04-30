import { useEffect, useRef, useState } from "react";
import "./MainSlider.css";
import { toPublicPath } from "../../../utils/publicPath";

type Slider = {
  id: number;
  image: string;
  alt: string;
};

const defaultSliderData: Slider[] = [
  {
    id: 1,
    image: "/img/Main-slider/slider-1.png",
    alt: "Máy xúc Komatsu nhập khẩu đang thi công tại công trường",
  },
  {
    id: 2,
    image: "/img/Main-slider/slider-2.png",
    alt: "Máy công trình nhập khẩu Hitachi và Kobelco chất lượng cao",
  },
  {
    id: 3,
    image: "/img/Main-slider/slider-3.png",
    alt: "Dịch vụ sửa chữa và bảo hành máy công trình chuyên nghiệp",
  },
  {
    id: 4,
    image: "/img/Main-slider/slider-4.png",
    alt: "Danh mục máy xúc, máy đào nhập khẩu sẵn hàng toàn quốc",
  },
  {
    id: 5,
    image: "/img/Main-slider/slider-5.png",
    alt: "Máy Công Trình Nhập Khẩu tư vấn nhanh 24/7",
  },
];

function MainSlider() {
  const dataSlider = defaultSliderData;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [topOffset, setTopOffset] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dataSlider.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % dataSlider.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [dataSlider]);

  useEffect(() => {
    function syncSliderWithNavBottom() {
      const nav = document.querySelector<HTMLElement>(".site-nav");
      const slider = sliderRef.current;

      if (!nav || !slider) return;

      const gapRaw = getComputedStyle(document.documentElement)
        .getPropertyValue("--site-nav-gap")
        .trim();
      const gapValue = Number.parseFloat(gapRaw);
      const nextOffset =
        nav.offsetHeight + (Number.isNaN(gapValue) ? 0 : gapValue);

      setTopOffset(nextOffset);
      setSlideWidth(slider.offsetWidth);
    }

    function handleResize() {
      syncSliderWithNavBottom();
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handlePrev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + dataSlider.length) % dataSlider.length,
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % dataSlider.length);
  };

  return (
    <div
      className="main-slider"
      ref={sliderRef}
      style={{ marginTop: `${topOffset}px` }}
    >
      <button
        className="slider-btn slider-btn--prev"
        onClick={handlePrev}
        aria-label="Previous slide"
      >
        &#8249;
      </button>
      <div
        className="slider-track"
        style={{ transform: `translateX(-${currentIndex * slideWidth}px)` }}
      >
        {dataSlider.map((item) => (
          <div className="slide-item" key={item.id}>
            <img src={toPublicPath(item.image)} alt={item.alt} />
          </div>
        ))}
      </div>
      <button
        className="slider-btn slider-btn--next"
        onClick={handleNext}
        aria-label="Next slide"
      >
        &#8250;
      </button>
    </div>
  );
}

export default MainSlider;
