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

## Atlas TLS / `SSL handshake failed` on Render

If `/api/health` returns `mongo: disconnected` with `TLSV1_ALERT_INTERNAL_ERROR`:

1. **Use the Atlas “Drivers” connection string** — it must start with **`mongodb+srv://`**.  
   Avoid pasting a `mongodb://` host list unless you know what you’re doing; Python often mis-handles TLS with direct shard hosts.
2. **URL-encode the DB user password** in the URI (`@`, `#`, `/`, `:`, etc.).
3. **Network Access** in Atlas: allow **`0.0.0.0/0`** (at least while testing).
4. **Do not** add `tls=false` or `ssl=false` to the URI.
5. **Optional Render env (debug only):** `MONGO_TLS_INSECURE=1` turns off TLS verification to confirm the problem is TLS-related — **remove after testing** and fix the URI/Atlas settings.
6. **Optional:** `MONGO_USE_CERTIFI=1` forces the `certifi` CA bundle (some hosts need it; others work better with the system store — the app defaults to system store).
7. **If TLS still fails on Render:** add **`MONGO_TLS_FORCE_12=1`** (forces TLS 1.2 for the driver). You can combine with **`MONGO_TLS_INSECURE=1`** only while testing.
8. **Atlas → Network Access:** allow **`0.0.0.0/0`** and also **`::/0`** (IPv6). Some cloud egress uses IPv6; without `::/0` you can get odd TLS/network failures.

After deploy, open **`/api/health`**: it returns safe diagnostics (scheme, host, whether insecure/force-12 flags are active). If `tls_allow_invalid_certs` is **false** but you set `MONGO_TLS_INSECURE=1`, the variable name is wrong or the latest code isn’t deployed.

## Notes

- Keep local `.env` files for development only.
- Never commit real secrets (`sk_live`, DB passwords, JWT secret).
- Regenerate secrets immediately if leaked.
