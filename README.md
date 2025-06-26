# Digital Signature

---

### Thông tin dự án
Hệ thống thực hiện ký số văn bản sử dụng RSA cùng SHA1 với giao diện đẹp mắt, tương tác dễ dàng. Hệ thống ký số và ghép chữ ký vào văn bản theo tiêu chuẩn PadES.

### Các chức năng hiện có
- **Đăng ký tài khoản**  
  ↳ Kết hợp sinh cặp khóa RSA cho người sử dụng

- **Đăng nhập tài khoản**  
  ↳ Sử dụng email đi kèm mật khẩu

- **Ký số văn bản** (hiện tại chỉ hỗ trợ file PDF)  
  ↳ Cho phép người dùng chọn vị trí và tiến hành ký số vào file PDF

- **Xác thực văn bản**  
  ↳ Cho phép người dùng lấy khóa công khai từ hệ thống (nếu là xác thực chữ ký của bản thân)  
  ↳ Chọn khóa công khai (nếu muốn xác thực chữ ký của người khác)

- **Các chức năng khác**  
  ↳ Quản lý tài khoản  
  ↳ Quản lý khóa  
  ↳ Xem, tải xuống và xóa văn bản

---

### Công nghệ
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/)
- **Frontend**: [React](https://react.dev/)
- **Thư viện khác**:  
  ↳ cryptography  
  ↳ pypdf  
  ↳ electronjs

### Sản phẩm
![](https://github.com/xuanndong/Signature/blob/9534f2cd846c0ba2c05939b13ecf7d64e7da497b/images/Screenshot%20from%202025-06-26%2012-05-53.png)
Giao diện ứng dụng của dự án

![](https://github.com/xuanndong/Signature/blob/9534f2cd846c0ba2c05939b13ecf7d64e7da497b/images/Screenshot%20from%202025-06-26%2012-06-26.png)
Giao diện web của dự án

![](https://github.com/xuanndong/Signature/blob/9534f2cd846c0ba2c05939b13ecf7d64e7da497b/images/Screenshot%20from%202025-06-26%2012-07-19.png)
Giao diện ký số

![](https://github.com/xuanndong/Signature/blob/9534f2cd846c0ba2c05939b13ecf7d64e7da497b/images/Screenshot%20from%202025-06-26%2012-07-54.png)
Trạng thái cập nhật sau khi ký số thành công

![](https://github.com/xuanndong/Signature/blob/9534f2cd846c0ba2c05939b13ecf7d64e7da497b/images/Screenshot%20from%202025-06-26%2012-08-45.png)
Văn bản sau khi ký số (hiện tại dùng stamp để hiển thị)

![](https://github.com/xuanndong/Signature/blob/9534f2cd846c0ba2c05939b13ecf7d64e7da497b/images/Screenshot%20from%202025-06-26%2012-09-29.png)
Giao diện xác thực

![](https://github.com/xuanndong/Signature/blob/9534f2cd846c0ba2c05939b13ecf7d64e7da497b/images/Screenshot%20from%202025-06-26%2012-10-05.png)
Trạng thái cập nhật sau khi xác thực thành công


