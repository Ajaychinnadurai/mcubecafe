# 🚀 Free Online Deployment Guide for Mcubes Cafe

This guide explains how to deploy both **Frontend (React + Vite)** and **Backend (Django REST Framework)** online for **100% FREE** without payment cards.

---

## 🛠️ Free Architecture Overview

| Component | Platform | Free Tier Features |
| :--- | :--- | :--- |
| **Frontend UI** | **Vercel** (`vercel.com`) | Free SSL, Global CDN, Unlimited Bandwidth, Auto GitHub Deploys |
| **Backend API** | **Render** (`render.com`) | Free Python Web Service, SSL, Auto GitHub Deploys |
| **Database** | **Render PostgreSQL** | 100% Free PostgreSQL Database Instance |

---

## 📦 Step 1: Deploy Backend API on Render (Free)

1. Sign up at [Render.com](https://render.com) using your GitHub account.
2. **Create a Free PostgreSQL Database**:
   - Click **New +** -> **PostgreSQL**.
   - Name: `mcubecafe-db`
   - Database: `mcubecafe`
   - Region: Choose nearest (e.g. *Singapore* or *Oregon*).
   - Copy the **Internal Database URL** or **External Database URL**.

3. **Create a Free Web Service for Django Backend**:
   - Click **New +** -> **Web Service**.
   - Connect your GitHub repository: `https://github.com/Ajaychinnadurai/mcubecafe`.
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
     ```
   - **Start Command**:
     ```bash
     gunicorn core.wsgi:application
     ```
   - **Environment Variables**:
     - `DJANGO_SECRET_KEY` = `generate-a-secure-random-secret-key`
     - `DJANGO_DEBUG` = `False`
     - `DJANGO_ALLOWED_HOSTS` = `.onrender.com`
     - `DATABASE_URL` = *(Paste the PostgreSQL Database URL from step 2)*
     - `FRONTEND_URL` = `https://mcubecafe.vercel.app` *(Your Vercel URL)*

4. Click **Create Web Service**. Render will build and launch your backend at `https://mcubecafe-backend.onrender.com`.

---

## 🎨 Step 2: Deploy Frontend on Vercel (Free)

1. Sign up at [Vercel.com](https://vercel.com) using your GitHub account.
2. Click **Add New...** -> **Project**.
3. Import the GitHub repository: `Ajaychinnadurai/mcubecafe`.
4. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Environment Variables**:
   - `VITE_API_BASE_URL` = `https://mcubecafe-backend.onrender.com/api` *(Your Render backend URL)*
6. Click **Deploy**. Vercel will build your website and generate a live URL (e.g. `https://mcubecafe.vercel.app`).

---

## ⚡ Step 3: Populate Admin & Sample Data

Once your Render backend is live:
1. Open Render Dashboard -> Web Service -> **Shell**.
2. Run Django superuser creation:
   ```bash
   python manage.py createsuperuser
   ```
3. Run initial menu & sample data script:
   ```bash
   python upload_images.py
   ```

---

## 🌐 Complete Live URLs

- **Live Frontend**: `https://mcubecafe.vercel.app`
- **Live Backend API**: `https://mcubecafe-backend.onrender.com/api/`
- **Live Admin Panel**: `https://mcubecafe-backend.onrender.com/admin/`
