# Firebase Image Captioning Lab

## 1. Mô tả

Đây là project full-stack có cấu trúc tương tự repo LAB2 cũ:

- **Backend**: FastAPI + Firebase Auth + Firestore + Hugging Face BLIP
- **Frontend**: React + TypeScript + Vite + Tailwind
- **Chức năng chính**:
  - Đăng ký / đăng nhập bằng email-password
  - Đăng nhập Google
  - Tạo conversation
  - Upload ảnh + nhập prompt tùy chọn
  - Sinh caption bằng model `Salesforce/blip-image-captioning-large`
  - Lưu lịch sử caption vào Firestore theo từng user

## 2. Cấu trúc thư mục

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

## 3. Tạo Firebase mới cho project

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

## 4. Cài đặt backend

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

## 5. Chạy backend

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

## 6. Cài đặt frontend

```bash
cd frontend
npm install
```

Nếu frontend cần gọi backend ở URL khác mặc định, tạo:

```text
frontend/.env.local
```

với nội dung:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## 7. Chạy frontend

```bash
cd frontend
npm run dev
```

Frontend mặc định chạy tại:

```text
http://127.0.0.1:5173
```

## 8. Dữ liệu Firestore mà project dùng

Project sẽ tự tạo dữ liệu theo cấu trúc:

```text
users/{uid}
users/{uid}/conversations/{conversation_id}
users/{uid}/conversations/{conversation_id}/messages/{message_id}
```

Mỗi `message` ở project này là một lần caption ảnh, gồm:
- `filename`
- `content_type`
- `prompt`
- `caption`
- `thumbnail_data_url`
- `created_at`

## 9. Model caption

Mặc định project dùng:

```text
Salesforce/blip-image-captioning-large
```

Bạn cũng có thể đổi sang đường dẫn local model bằng cách sửa phần `[caption_model]` trong `.streamlit/secrets.toml`.

## 10. Gợi ý nếu model tải chậm

Bạn có thể cấu hình local model path trong secret:

```toml
[caption_model]
model_name = "D:/hf_models/blip-image-captioning-large"
cache_dir = "D:/hf_cache"
local_files_only = true
```

## 11. Test API

```bash
pytest test_api.py -v
```

Lưu ý:
- Muốn test conversation/auth đầy đủ thì Firebase phải được cấu hình đúng.
- Test file hiện tại chỉ smoke-test các endpoint public.
