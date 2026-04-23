import { useEffect, useState } from "react";

function useHeader() {
  const [isSticky, setIsSticky] = useState(false);
  const [bannerHeight, setBannerHeight] = useState(0);
  const [navGap, setNavGap] = useState(0);
  const [navTop, setNavTop] = useState(0);

  useEffect(() => {
    function updateMeasurements() {
      const banner = document.querySelector<HTMLElement>(".header-banner");
      setBannerHeight(banner?.offsetHeight ?? 0);

      const gapRaw = getComputedStyle(document.documentElement)
        .getPropertyValue("--site-nav-gap")
        .trim();
      const gapValue = Number.parseFloat(gapRaw);
      setNavGap(Number.isNaN(gapValue) ? 0 : gapValue);
    }

    updateMeasurements();
    window.addEventListener("resize", updateMeasurements);

    return () => {
      window.removeEventListener("resize", updateMeasurements);
    };
  }, []);

  useEffect(() => {
    function handleScroll() {
      const nextTop = Math.max(bannerHeight + navGap - window.scrollY, 0);
      setNavTop(nextTop);
      setIsSticky(window.scrollY >= bannerHeight + navGap);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [bannerHeight, navGap]);

  return { isSticky, navTop };
}

export default useHeader;
