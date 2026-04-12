# 🚀 CampusChat Deployment Guide

This guide will walk you through deploying the CampusChat application using **Vercel** for the frontend and **Render** for the backend.

---

## 1. Backend Deployment (Render)

### Step 1: Create a Render Web Service
1. Log in to [Render](https://render.com/).
2. Click **New** -> **Web Service**.
3. Connect your GitHub repository.
4. Set the following configurations:
   - **Name**: `campuschattxx-backend` (or your choice)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`

### Step 2: Configure Environment Variables
In the **Environment** tab of your Render service, add the following:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `PORT` | `10000` | Render usually sets this automatically |
| `SUPABASE_URL` | Your Supabase URL | From Supabase Project Settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Service Role Key | From Supabase Project Settings |
| `JWT_SECRET` | Your Secret | A long random string |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | **Add this after deploying frontend** |
| `NODE_ENV` | `production` | Set to production |

---

## 2. Frontend Deployment (Vercel)

### Step 1: Create a Vercel Project
1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. In **Project Settings**:
   - **FrameWork Preset**: Next.js
   - **Root Directory**: `frontend`

### Step 2: Configure Environment Variables
Before clicking "Deploy", add these environment variables:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_BACKEND_URL` | `https://your-backend.onrender.com` | From Render dashboard |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Same as backend |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Anon Key | From Supabase Project Settings |

---

## 3. Post-Deployment Steps

1. **Update Backend CORS**: Once Vercel gives you a production URL, go to Render environment variables and set `FRONTEND_URL` to that Vercel URL.
2. **Supabase Auth**: Add your Vercel URL to the "Redirect URLs" list in **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.

---

## 🛠️ Local Verification
To ensure everything is ready, you can run these commands locally:

```bash
# Backend Build
cd backend && npm install && npm run build

# Frontend Build
cd frontend && npm install && npm run build
```
