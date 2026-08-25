# 🚀 Free Online Deployment Guide & Live Links for Mcubes Cafe

Both your **Frontend UI (Vercel)** and **Backend API (Render)** are configured for production deployment!

---

## 🌐 Live Application URLs

| Service | Status | Live URL |
| :--- | :--- | :--- |
| **Frontend UI (Vercel)** | 🟢 **LIVE** | **[https://mcubecafe-frontend.vercel.app](https://mcubecafe-frontend.vercel.app)** |
| **GitHub Source Code** | 🟢 **LIVE** | **[https://github.com/Ajaychinnadurai/mcubecafe](https://github.com/Ajaychinnadurai/mcubecafe)** |
| **Backend API (Render)** | 🟢 **CONFIGURED** | `https://mcubecafe-backend.onrender.com/api/` |

---

## ⚡ Option A: Redeploy Existing Render Service (Fastest)

If you already created the web service `mcubecafe-backend` on Render:
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Select your Web Service **`mcubecafe-backend`**.
3. Click **Manual Deploy** ➔ **Deploy latest commit** (or wait for auto-deploy on git push).
4. Verify Environment Variables in Render Dashboard under **Environment**:
   - `PYTHON_VERSION`: `3.11.0`
   - `DJANGO_SECRET_KEY`: `mcube-cafe-secure-prod-secret-key-2026`
   - `DJANGO_DEBUG`: `False`
   - `DJANGO_ALLOWED_HOSTS`: `*`
   - `FRONTEND_URL`: `https://mcubecafe-frontend.vercel.app`

---

## 📦 Option B: New Deploy via Render Blueprint (1-Click)

1. Sign up/Log in at [Render.com](https://render.com).
2. Click **New +** ➔ **Blueprint**.
3. Connect your GitHub repository: **`Ajaychinnadurai/mcubecafe`**.
4. Render will automatically detect `render.yaml` and configure the build command, start command, and environment variables!
5. Click **Apply**. Render will build and deploy your backend service.

---

## 🛠️ Manual Settings Reference (if creating Web Service manually)

- **Root Directory**: *(leave blank or set to `./`)*
- **Build Command**: `./backend/build.sh` (or `pip install -r backend/requirements.txt && python backend/manage.py collectstatic --noinput && python backend/manage.py migrate`)
- **Start Command**: `gunicorn --chdir backend core.wsgi:application`
