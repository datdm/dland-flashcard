# Quy tắc dự án (Workspace Rules)

## Quy trình sau khi hoàn thành yêu cầu (Post-Task Workflow)
Mỗi khi hoàn thành một yêu cầu hoặc chỉnh sửa code trong prompt:
1. **Kiểm tra build (Run Build)**:
   - Chạy lệnh build của ứng dụng để đảm bảo không có lỗi type hoặc compile:
     - Trên môi trường Windows PowerShell, luôn sử dụng `npm.cmd`:
       - Frontend: `npm.cmd run build`
       - Server (khi có thay đổi liên quan đến `server/`): `npm.cmd --prefix server run build`
2. **Commit Git (Auto Commit)**:
   - Khi build thành công (exit code 0), tự động stage và tạo git commit với commit message rõ ràng, tóm tắt các thay đổi vừa thực hiện.
   - Nếu build gặp lỗi, phân tích log lỗi, sửa lỗi cho đến khi build thành công rồi mới tiến hành commit.
3. **Đẩy mã nguồn lên Git (Auto Push)**:
   - Sau khi commit thành công, tự động đẩy lên repository: `git push`
