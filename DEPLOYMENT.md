# 🚀 Free Online Deployment Guide & Live Links for Mcubes Cafe

Your **Frontend UI** is now **LIVE ONLINE** on Vercel!

---

## 🌐 Live Application URLs

| Service | Status | Live URL |
| :--- | :--- | :--- |
| **Frontend UI (Vercel)** | 🟢 **LIVE** | **[https://mcubecafe-frontend.vercel.app](https://mcubecafe-frontend.vercel.app)** |
| **GitHub Source Code** | 🟢 **LIVE** | **[https://github.com/Ajaychinnadurai/mcubecafe](https://github.com/Ajaychinnadurai/mcubecafe)** |
| **Backend API (Render)** | ⏳ *Ready to Connect* | `https://mcubecafe-backend.onrender.com/api/` |

---

## 📦 Step-by-step: Connect Backend on Render (100% Free)

1. Sign up at [Render.com](https://render.com) using your GitHub account.
2. Click **New +** -> **Web Service**.
3. Select GitHub Repository: `Ajaychinnadurai/mcubecafe`.
4. Set configurations:
   - **Root Directory**: `backend`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
     ```
   - **Start Command**:
     ```bash
     gunicorn core.wsgi:application
     ```
   - **Environment Variables**:
     - `DJANGO_SECRET_KEY` = `mcube-cafe-secure-prod-secret-key-2026`
     - `DJANGO_DEBUG` = `False`
     - `DJANGO_ALLOWED_HOSTS` = `.onrender.com`
     - `FRONTEND_URL` = `https://mcubecafe-frontend.vercel.app`

5. Click **Create Web Service**. Render will deploy your live backend API!
