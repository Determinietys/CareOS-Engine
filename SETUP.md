# Setup Instructions

## Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your application URL (http://localhost:3000 for dev)

3. **Set up database:**
```bash
# Create database (PostgreSQL)
createdb careos

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

4. **Run development server:**
```bash
npm run dev
```

5. **Open browser:**
Navigate to http://localhost:3000

## First User

1. Go to http://localhost:3000/auth/signup
2. Create an account
3. Sign in at http://localhost:3000/auth/signin
4. Access settings at http://localhost:3000/settings

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database exists: `psql -l`

### NextAuth Errors
- Ensure NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your app URL
- Verify database migrations are applied

### Build Errors
- Run `npx prisma generate` to regenerate Prisma client
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

