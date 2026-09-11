# Dland Language - Sổ Tay & Tra Mazii (Chrome Extension v1.1.0)

Tiện ích mở rộng Google Chrome / Microsoft Edge (Manifest V3) hỗ trợ học tiếng Nhật:
1. **Hiển thị toàn bộ sổ tay** trong Popup: thống kê số lượng, danh sách từ vựng, âm Hán Việt (Onyomi), nghe phát âm tiếng Nhật chuẩn (TTS), thêm/xóa từ và sổ tay.
2. **Chế độ Đăng nhập & Đồng bộ Database**:
   - **Đăng nhập trực tiếp**: Đăng nhập ngay trong tiện ích bằng tài khoản (Username & Password) để tải trực tiếp toàn bộ sổ tay từ Database máy chủ về tiện ích.
   - **Đồng bộ tự động từ Web App**: Chỉ cần click *"🔗 Đồng bộ từ Web App"*, tiện ích sẽ tự động nhận diện tab Web App đang mở tại `https://flashcard-japanese-eight.vercel.app/` và đồng bộ tài khoản cũng như sổ tay ngay lập tức!
3. **Thay đổi Setting vào Database (Cài đặt linh hoạt)**:
   - Thay đổi linh hoạt Web App URL (Vercel `https://flashcard-japanese-eight.vercel.app/` hoặc Localhost:3000).
   - Thay đổi API Server / Database URL (Vercel backend hoặc Localhost:3001 hoặc server VPS riêng).
   - Nút **"⚡ Kiểm tra kết nối"** để test xem Database/Server có phản hồi tốt không kèm thời gian phản hồi (latency ms).
   - Nút **"🔄 Tải lại từ Database"** và **"☁️ Đẩy máy lên Database"** để chủ động đồng bộ dữ liệu hai chiều bất cứ khi nào.
   - Bật / tắt chế độ tự động đồng bộ từ vựng lên Database khi tra Mazii.
4. **Option Tool Bật/Tắt (ON/OFF) Tooltip Mazii**:
   - Ngay đầu Popup Extension có thanh công tắc nhanh: **"Tooltip Mazii khi bôi đen: [BẬT / TẮT]"**.
   - Bật/tắt tức thì chỉ với 1 click, cập nhật thời gian thực trên tất cả các tab trình duyệt mà không cần tải lại trang.
   - Khi tắt: bôi đen văn bản sẽ không hiện tooltip nổi, tránh gây vướng khi đọc báo/làm việc. (Bạn vẫn có thể tra cứu khi cần bằng cách click chuột phải vào từ vựng).
5. **Bôi đen từ vựng trên mọi trang web**: Tự động hiện tooltip nổi `[ 🔍 Tra & Thêm Mazii ]` (hoặc click chuột phải) để tra nhanh Kanji, Hiragana, âm Hán Việt, nghĩa tiếng Việt, loại từ và lưu thẳng vào Database hoặc sổ tay máy.

---

## 🚀 Hướng dẫn cài đặt vào Chrome / Edge

1. Mở trình duyệt Chrome hoặc Edge.
2. Vào đường dẫn quản lý tiện ích:
   - Trên Chrome: `chrome://extensions`
   - Trên Edge: `edge://extensions`
3. Bật công tắc **"Chế độ dành cho nhà phát triển" (Developer mode)** ở góc trên bên phải.
4. Nhấp vào nút **"Tải tiện ích đã giải nén" (Load unpacked)** ở góc trên bên trái.
5. Chọn thư mục extension:
   ```
   d:\project\flashcard\chrome-extension
   ```
6. Tiện ích **Dland Language - Sổ Tay & Tra Mazii** v1.1.0 sẽ xuất hiện. Bấm biểu tượng 📌 Ghim để tiện sử dụng trên thanh công cụ.

---

## 🔑 Hướng dẫn Đăng nhập & Đồng bộ Web App

### Cách 1: Đồng bộ một chạm từ Web App (Khuyên dùng - Nhanh & Tiện nhất)
1. Mở trang web ứng dụng của bạn: [https://flashcard-japanese-eight.vercel.app/](https://flashcard-japanese-eight.vercel.app/)
2. Đăng nhập tài khoản của bạn trên web app.
3. Mở Extension Popup ➔ Bấm nút **"🔗 Đồng bộ từ Web App"** (hoặc nút tương tự trong hộp thoại Đăng nhập).
4. Tiện ích sẽ tự động nhận phiên đăng nhập và tải toàn bộ sổ tay của bạn từ Web App về máy, chuyển trạng thái sang: `🟢 Đã kết nối DB (Tên của bạn)`.
> 💡 **Lưu ý:** Vì Web App trên Vercel chỉ đóng vai trò Client Frontend, cách này không cần bạn phải cấu hình hay chạy thêm server API nào khác.

### Cách 2: Đăng nhập trực tiếp trong tiện ích
1. Mở Extension Popup.
2. Bấm nút **"🔑 Đăng nhập"**.
3. Nhập **Username** và **Password**.
4. Bấm **"Đăng nhập"** ➔ Tiện ích sẽ kết nối tới máy chủ API Backend (`http://localhost:3001` hoặc URL do Admin thiết lập) để xác thực.

---

## ⚙️ Cài Đặt URL Client & API Server (🔒 Phân Quyền Chỉ Admin)

Để đảm bảo bảo mật và tránh người dùng thông thường vô tình làm sai lệch địa chỉ kết nối, **URL Client** và **URL API Server** được khóa mặc định và **chỉ Quản trị viên (Admin) mới có quyền chỉnh sửa**:

1. Mở biểu tượng bánh răng **⚙️ Cài đặt** trên Popup Extension.
2. Hai trường **Web App URL (Client)** và **API Server / Database URL** sẽ ở trạng thái khóa `🔒 Chỉ Admin`.
3. Để mở khóa chỉnh sửa:
   - Nếu bạn đã đăng nhập bằng tài khoản Quản trị viên (`isAdmin = true`), hệ thống sẽ **tự động mở khóa**.
   - Nếu chưa đăng nhập: Nhấp vào nút **"🔓 Mở khóa Admin"** ➔ Nhập mã Quản trị viên (mặc định: `admin`, `admin123`, hoặc mật khẩu Admin của bạn) ➔ Bấm **"Xác nhận"**.
4. Sau khi mở khóa thành công:
   - Các ô nhập URL và các nút chọn nhanh (*Vercel*, *Local*, *Port 3001*) sẽ sáng lên và cho phép bạn chỉnh sửa.
   - Bạn có thể bấm nút **"⚡ Kiểm tra kết nối"** để test ping server.
   - Bấm **"💾 Lưu Cài Đặt"** để hoàn tất.


---

## 📖 Bôi đen từ vựng & Tra cứu Mazii

- Lướt bất kỳ trang web nào (NHK, Wikipedia, báo chí Nhật...).
- Bôi đen một từ tiếng Nhật (ví dụ: `約束`, `日本語`, `勉強`).
- Nút tooltip tím `[ 🔍 Tra & Thêm Mazii ]` sẽ nổi lên ngay trên vùng chọn.
- Nhấp vào nút ➔ Modal dialog mở ra với đầy đủ thông tin từ Mazii:
  - Xem và chỉnh sửa Kanji, Hiragana, âm Hán Việt, nghĩa tiếng Việt, loại từ.
  - Nghe phát âm 🔊 tiếng Nhật.
  - Hiển thị badge: `☁️ Đã kết nối Database (Username)` hoặc `💾 Lưu cục bộ`.
  - Chọn sổ tay đích (hoặc tạo sổ tay mới) và bấm **"💾 Lưu vào Sổ tay"**!
