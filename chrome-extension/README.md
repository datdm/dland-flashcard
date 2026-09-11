# Dland Language - Sổ Tay & Tra Mazii (Chrome Extension)

Extension Chrome Manifest V3 hỗ trợ:
1. **Hiển thị toàn bộ sổ tay** của người dùng trong popup extension (thống kê số lượng, danh sách từ vựng, nghe phát âm, thêm/xóa từ, tạo sổ tay mới).
2. **Tự động hiện tooltip tra Mazii** (`🔍 Tra & Thêm Mazii`) khi bạn bôi đen bất kỳ chữ/từ tiếng Nhật nào trên mọi trang web.
3. **Mở modal dialog** tự động điền Kanji, Hiragana, âm Hán Việt (Onyomi), nghĩa tiếng Việt từ Mazii API, chọn sổ tay đích hoặc tạo sổ tay mới, phát âm audio TTS và lưu trực tiếp vào sổ tay.
4. **Đồng bộ dữ liệu** tự động với Web App Dland Flashcard (`http://localhost:3000`).

---

## 🚀 Hướng dẫn cài đặt vào Google Chrome / Microsoft Edge

1. Mở trình duyệt Chrome hoặc Microsoft Edge.
2. Truy cập vào trang quản lý tiện ích:
   - Trên Chrome: nhập `chrome://extensions` vào thanh địa chỉ và nhấn Enter.
   - Trên Edge: nhập `edge://extensions` vào thanh địa chỉ và nhấn Enter.
3. Bật công tắc **Chế độ dành cho nhà phát triển (Developer mode)** ở góc trên bên phải màn hình.
4. Nhấp vào nút **Tải tiện ích đã giải nén (Load unpacked)** ở góc trên bên trái.
5. Chọn thư mục extension:
   ```
   d:\project\flashcard\chrome-extension
   ```
6. Tiện ích **Dland Language - Sổ Tay & Tra Mazii** sẽ xuất hiện trong danh sách extension. Nhấp vào biểu tượng ghim (Pin) trên thanh công cụ trình duyệt để dễ dàng sử dụng.

---

## 📖 Cách sử dụng chi tiết

### 1. Bôi đen từ vựng để tra Mazii & Thêm vào sổ tay
- Mở bất kỳ trang web nào có tiếng Nhật (ví dụ: đọc báo NHK News Easy, Yahoo Japan, Wikipedia, hoặc các trang học tập).
- Dùng chuột **bôi đen** một từ vựng tiếng Nhật (ví dụ: `約束`, `日本語`, `勉強`, `食べる`).
- Một tooltip nổi màu tím đậm `[ 🔍 Tra & Thêm Mazii ]` sẽ ngay lập tức xuất hiện phía trên từ được bôi đen.
- Click vào nút tooltip đó (hoặc click chuột phải và chọn `"🔍 Tra Mazii & Thêm vào Sổ tay Dland"`).
- Một hộp thoại (Modal Dialog) hiển thị mượt mà trên màn hình:
  - Tự động gọi API Mazii để lấy: **Kanji, Hiragana / Cách đọc, Âm Hán Việt, Nghĩa tiếng Việt, Loại từ**.
  - Có nút phát âm 🔊 để nghe cách đọc tiếng Nhật chuẩn.
  - Bạn có thể chỉnh sửa lại nghĩa hoặc thông tin theo ý thích.
  - Chọn **Sổ tay đích** muốn lưu (hoặc chọn *"➕ Tạo sổ tay mới..."* nếu muốn tạo nhanh một sổ tay mới ngay tại chỗ).
  - Nhấp **"💾 Lưu vào Sổ tay"** ➔ Thông báo Toast thành công sẽ hiện lên.

### 2. Xem toàn bộ sổ tay từ Extension Popup
- Click vào biểu tượng Extension **Dland Language** trên thanh công cụ trình duyệt.
- Popup mở ra với giao diện hiện đại:
  - **Thống kê tổng quan**: Số lượng sổ tay, tổng số từ vựng đã lưu.
  - **Thanh tìm kiếm**: Nhập từ khóa tiếng Nhật, Romaji hoặc nghĩa tiếng Việt để lọc tức thì danh sách từ vựng trong tất cả sổ tay.
  - **Danh sách Sổ tay**: Dạng thẻ accordion. Nhấp vào từng sổ tay để mở rộng/thu gọn danh sách từ vựng.
  - **Chi tiết từng từ**: Hiển thị chữ Kanji, Hiragana, âm Hán Việt (tag màu hổ phách), nghĩa tiếng Việt, loại từ.
  - **Phát âm nhanh**: Nhấp vào biểu tượng 🔊 bên cạnh mỗi từ để nghe phát âm ngay trong popup.
  - **Thêm từ thủ công**: Nhấp vào nút *"➕ Thêm từ"* ở từng sổ tay hoặc nút *"➕ Tạo sổ mới"* ở banner đầu popup.
  - **Xóa từ / Xóa sổ tay**: Dễ dàng quản lý dữ liệu trực tiếp trong popup.

### 3. Đồng bộ với Web App Dland Flashcard
- Khi bạn mở trang web Flashcard trên trình duyệt (`http://localhost:3000`), extension sẽ tự động nhận diện và đồng bộ danh sách sổ tay cũng như token tài khoản của bạn.
- Các từ vựng bạn thêm từ extension sẽ tự động lưu vào bộ nhớ cục bộ của extension và đồng thời đồng bộ tới backend (`http://localhost:3001/api/vocab/upload`) khi bạn đăng nhập.
