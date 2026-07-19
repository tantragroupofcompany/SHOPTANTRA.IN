# SHOPTANTRA E-Commerce Project

This is the workspace for the SHOPTANTRA e-commerce website.

## Production Deployment

Before deploying to production, ensure the following environment variables are set in `.env.local`:

### Required Variables

```bash
# Razorpay Production Credentials
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co/rest/v1/
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# Database (if using external PostgreSQL)
# DATABASE_URL=postgresql://user:password@host:port/database
```

### Setup Steps

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run linting:
   ```bash
   npm run lint
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Start the production server:
   ```bash
   npm start
   ```

### Notes

- Do not commit `.env.local` to version control.
- All payment gateway credentials must be provided via environment variables.
- The project uses Prisma ORM with PostgreSQL for production.
- Supabase is used for storage and authentication services.