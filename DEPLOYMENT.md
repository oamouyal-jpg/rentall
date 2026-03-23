# RentAll Deployment Guide

This guide uses:
- Backend: Render (Python web service)
- Database: MongoDB Atlas
- Frontend: Vercel (React app in `frontend`)

## 1) MongoDB Atlas (Production DB)

1. Create an Atlas project and cluster.
2. Create a DB user with read/write access to your app DB.
3. In Network Access, allow Render egress IPs or temporarily `0.0.0.0/0` while testing.
4. Copy your connection string and set database name (example: `rentall_prod`).

## 2) Stripe (Live)

1. In Stripe Dashboard, switch to Live mode.
2. Copy:
   - `sk_live_...` (secret key)
   - `whsec_...` (webhook secret)
3. Create webhook endpoint:
   - URL: `https://<your-render-service>.onrender.com/api/webhook/stripe`
   - Events: at minimum `checkout.session.completed`

## 3) Deploy Backend to Render

You already have `render.yaml` and `render-build.sh`.

### Render Setup

1. Push this repo to GitHub.
2. In Render: **New +** -> **Blueprint** -> connect repo.
3. Render will read `render.yaml` and create service.
4. Set env vars in Render service (from `backend/.env.production.example`):
   - `MONGO_URL`
   - `DB_NAME`
   - `JWT_SECRET`
   - `STRIPE_API_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `CORS_ORIGINS` (add Vercel URL and custom domain if any)

### Health Check

After deploy, verify:
- `https://<your-render-service>.onrender.com/api/`

Expected response includes `RentAll API`.

## 4) Deploy Frontend to Vercel

1. In Vercel, import your GitHub repo.
2. Set **Root Directory** to: `frontend`
3. Framework: Create React App (auto-detected in most cases)
4. Set environment variable:
   - `REACT_APP_BACKEND_URL=https://<your-render-service>.onrender.com`
5. Deploy.

## 5) Wire CORS Correctly

Update Render backend env var `CORS_ORIGINS` to include:
- `https://<your-vercel-project>.vercel.app`
- `https://www.yourdomain.com` (if you use a custom domain)

Comma-separated, no spaces.

## 6) Go-Live Smoke Test

Run these checks in production URLs:

1. Register + login
2. Create listing (with images)
3. Search/filter listing
4. Book listing + Stripe checkout
5. Payment success/cancel flow
6. Messages between renter and owner
7. Quantity booking conflict logic

## 7) Optional CLI Commands

If you use the CLIs:

```bash
# Render CLI (optional)
render services list

# Vercel CLI (optional, from frontend/)
vercel
vercel --prod
```

## Notes

- Keep local `.env` files for development only.
- Never commit real secrets (`sk_live`, DB passwords, JWT secret).
- Regenerate secrets immediately if leaked.
