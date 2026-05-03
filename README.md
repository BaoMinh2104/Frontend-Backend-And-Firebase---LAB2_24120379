# Firebase Image Captioning Lab

Họ tên: Chu Bảo Minh
MSSV: 24120379
Lớp TDTT: 24CTT3

## 1. Mô tả
- **Backend**: FastAPI + Firebase Auth + Firestore + Hugging Face BLIP
- **Frontend**: React + TypeScript + Vite + Tailwind
- **Chức năng chính**:
  - Đăng ký / đăng nhập bằng email-password
  - Đăng nhập Google
  - Tạo conversation
  - Upload ảnh + nhập prompt tùy chọn
  - Sinh caption bằng model `Salesforce/blip-image-captioning-large`
  - Lưu lịch sử caption vào Firestore theo từng user
## 2. Model caption và yêu cầu
-  **Model:**
```text
Salesforce/blip-image-captioning-large
```
- **Yêu cầu:**
- Python 3.11 trở lên
- Node JS
## 3. Cấu trúc thư mục

```text
image_captioning_firebase_lab/
├─ backend/
│  └─ app/
│     ├─ core/
│     │  ├─ firebase_config.py
│     │  └─ settings.py
│     ├─ dependencies/
│     │  └─ auth.py
│     ├─ routers/
│     │  ├─ auth.py
│     │  └─ conversations.py
│     ├─ schemas/
│     │  ├─ auth.py
│     │  └─ conversation.py
│     ├─ services/
│     │  ├─ caption_service.py
│     │  ├─ firebase_auth_service.py
│     │  └─ firestore_service.py
│     └─ main.py
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  ├─ lib/
│  │  ├─ App.tsx
│  │  ├─ index.css
│  │  └─ main.tsx
│  ├─ package.json
│  ├─ tailwind.config.ts
│  └─ vite.config.ts
├─ .streamlit/
│  └─ secrets.example.toml
├─ .gitignore
├─ requirements.txt
└─ test_api.py
```

## 4. Tạo Firebase mới cho project

### Bước 1: Tạo project Firebase
- Vào Firebase Console
- Create project
- Add Web App

### Bước 2: Bật Authentication
- Authentication -> Sign-in method
- Bật `Email/Password`
- Nếu muốn login Google thì bật thêm `Google`

### Bước 3: Tạo Firestore
- Build -> Firestore Database
- Create database
- Chọn location phù hợp

### Bước 4: Tạo service account cho backend
- Project settings -> Service accounts
- Generate new private key
- Lấy JSON service account

### Bước 5: Tạo file secret
Tạo file:

```text
.streamlit/secrets.toml
```

Rồi copy nội dung từ:

```text
.streamlit/secrets.example.toml
```

và điền thông tin Firebase / Google OAuth của bạn.

## 5. Cài đặt backend

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Nếu dùng macOS/Linux:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 6. Chạy backend

```bash
uvicorn backend.app.main:app --reload
```

Backend mặc định chạy tại:

```text
http://127.0.0.1:8000
```

Swagger docs:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/health
```

## 7. Cài đặt frontend
```bash
cd frontend
npm install
```
## 8. Chạy frontend
```bash
cd frontend
npm run dev
```
Frontend mặc định chạy tại:
```text
http://127.0.0.1:5173
```
## 9. Test API

```bash
pytest test_api.py -v
```

Lưu ý:
- Muốn test conversation/auth đầy đủ thì Firebase phải được cấu hình đúng.
- Test file hiện tại chỉ smoke-test các endpoint public.

## 10. Link Video Demo
[VIDEO DEMO](https://youtu.be/YU10mf2aBUI)
