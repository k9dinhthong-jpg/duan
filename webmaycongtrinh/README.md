# Thuận Phát Website

Website giới thiệu máy công trình và dịch vụ kỹ thuật, xây dựng bằng React + TypeScript + Vite.

## Chạy dự án

```bash
npm install
npm run dev
```

Mặc định dùng HashRouter để tương thích GitHub Pages. Nếu deploy trên hạ tầng có rewrite route, có thể chuyển sang BrowserRouter:

```bash
VITE_USE_HASH_ROUTER=false npm run dev
```

## Scripts

- `npm run dev`: chạy môi trường phát triển
- `npm run build`: build production
- `npm run preview`: preview bản build
- `npm run lint`: kiểm tra eslint
- `npm run test`: chạy unit test với Vitest
- `npm run test:watch`: test watch mode
- `npm run deploy`: deploy lên GitHub Pages

## Cải tiến đã bổ sung

- Lazy loading theo route (giảm tải bundle ban đầu)
- Error Boundary cho fallback UI an toàn
- SEO metadata cơ bản + metadata động theo route/bài viết
- Web manifest (`public/site.webmanifest`)
- Cải thiện điều hướng keyboard cho menu dropdown
- CTA trang Product điều hướng thực tế sang trang chi tiết/liên hệ
- Loading/error state khi tải dữ liệu sản phẩm
- Tối ưu ảnh với `loading="lazy"` và `decoding="async"`
- Thiết lập test + CI workflow (`.github/workflows/ci.yml`)
