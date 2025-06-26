# Digital Signature

---

## 📌 Thông tin dự án
Hệ thống thực hiện ký số văn bản sử dụng RSA cùng SHA1 với giao diện đẹp mắt, tương tác dễ dàng. Hệ thống ký số và ghép chữ ký vào văn bản theo tiêu chuẩn PadES.

---

## 🛠 Các chức năng chính

### 🔐 Quản lý tài khoản
- **Đăng ký tài khoản**  
  → Tự động sinh cặp khóa RSA cho người dùng
- **Đăng nhập**  
  → Xác thực bằng email và mật khẩu

### ✍️ Ký số văn bản
- Hỗ trợ file PDF
- Cho phép:
  → Chọn vị trí ký  
  → Xem trước chữ ký  
  → Lưu văn bản đã ký

### 🔎 Xác thực văn bản
- Tùy chọn xác thực:
  → Sử dụng khóa công khai từ hệ thống (cho chữ ký của bạn)  
  → Nhập khóa công khai (cho chữ ký người khác)

### 📂 Quản lý dữ liệu
- Quản lý tài khoản
- Quản lý khóa
- Xem/Tải/Xóa văn bản

---

## 💻 Công nghệ sử dụng

| Loại         | Công nghệ                  |
|--------------|----------------------------|
| **Backend**  | FastAPI                    |
| **Frontend** | React + ElectronJS         |
| **Thư viện** | cryptography, pypdf2       |

---

## 🖼️ Hình ảnh sản phẩm

| Chức năng | Hình ảnh |
|-----------|----------|
| **Giao diện ứng dụng** | ![App Interface](https://github.com/xuanndong/Signature/blob/9534f2cd846c0ba2c05939b13ecf7d64e7da497b/images/Screenshot%20from%202025-06-26%2012-05-53.png) |
| **Giao diện web** | ![Web Interface](https://github.com/xuanndong/Signature/blob/9534f2cd846c0ba2c05939b13ecf7d64e7da497b/images/Screenshot%20from%202025-06-26%2012-06-26.png) |
| **Ký số văn bản** | ![Signing](https://github.com/xuanndong/Signature/blob/9534f2cd846c0ba2c05939b13ecf7d64e7da497b/images/Screenshot%20from%202025-06-26%2012-07-19.png) |
| **Kết quả ký số** | ![Signed Doc](https://github.com/xuanndong/Signature/blob/9534f2cd846c0ba2c05939b13ecf7d64e7da497b/images/Screenshot%20from%202025-06-26%2012-07-54.png) |
| **Xác thực** | ![Verification](https://github.com/xuanndong/Signature/blob/9534f2cd846c0ba2c05939b13ecf7d64e7da497b/images/Screenshot%20from%202025-06-26%2012-09-29.png) |

---

## 📥 Cài đặt & Sử dụng
(Thêm hướng dẫn cài đặt tại đây nếu cần)
