import { useEffect, useRef, useState } from "react";
import "./MainSlider.css";

type Slider = {
  id: number;
  image: string;
  alt: string;
};

function MainSlider() {
  const [dataSlider, setDataSlider] = useState<Slider[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [topOffset, setTopOffset] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function getSlider() {
      const response = await fetch("/data/slider.json");
      const data = await response.json();
      setDataSlider(data);
    }

    getSlider();
  }, []);

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
            <img src={item.image} alt={item.alt} />
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
