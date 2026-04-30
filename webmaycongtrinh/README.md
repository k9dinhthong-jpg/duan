# Thuận Phát Website

Website giới thiệu máy công trình và dịch vụ kỹ thuật, xây dựng bằng React + TypeScript + Vite.

## Chạy dự án

```bash
npm install
npm run dev
```

Routing dùng BrowserRouter mặc định (URL đẹp, không có `#`). Khi deploy production cần cấu hình web server rewrite tất cả route về `index.html`.

## Kết nối backend VPS

Frontend lấy dữ liệu qua REST API. Bạn có thể cấu hình trong file `.env`:

```bash
VITE_API_BASE_URL=https://maycongtrinhnhapkhau.com.vn
VITE_API_COMPANY_INFO_PATH=/api/company-info
VITE_API_NEWS_PATH=/api/news
VITE_API_PRODUCTS_HITACHI_PATH=/api/products/hitachi
VITE_API_PRODUCTS_KOBELCO_PATH=/api/products/kobelco
VITE_API_PRODUCTS_KOMATSU_PATH=/api/products/komatsu
VITE_API_PRODUCT_ITEMS_PATH=/api/product-items
VITE_API_SERVICES_ITEMS_PATH=/api/services-items
VITE_API_INTRO_ITEMS_PATH=/api/intro-items
```

Ghi chú:

- Nếu frontend và backend cùng domain, có thể bỏ `VITE_API_BASE_URL` để dùng đường dẫn tương đối `/api/...`.
- Các biến `VITE_API_*_PATH` là tùy chọn, chỉ cần đặt khi endpoint thực tế khác mặc định.

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
