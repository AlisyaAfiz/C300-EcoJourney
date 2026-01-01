# Environment Variables Configuration

## Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your actual credentials

## Render Deployment

To configure environment variables on Render:

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your service (rpecocjourney-backend)
3. Click on "Environment" in the left sidebar
4. Add the following environment variables:

### Required Variables:

```
MONGODB_URI=mongodb+srv://adminfyp:TLqTN0XXr7OUDvDS@rpecojourney.meawj2c.mongodb.net/?appName=RPEcoJourney&retryWrites=true&w=majority
PORT=8000
NODE_ENV=production
JWT_SECRET=1c2b9a5608c99d50c331d72622512be1de67af3ee5196047d71f9fe670585db4
JWT_EXPIRE=7d
```

### Optional Variables (for email features):

```
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@ecojourney.com
CORS_ORIGIN=https://AlisyaAfiz.github.io/C300-EcoJourney
```

4. Click "Save Changes"
5. Render will automatically redeploy your service with the new environment variables

## Security Notes

- **NEVER** commit `.env` files to Git
- `.env` is already in `.gitignore` to prevent accidental commits
- If credentials are exposed, immediately:
  1. Rotate MongoDB password in Atlas
  2. Update environment variables on Render
  3. Generate new JWT_SECRET
  4. Remove sensitive commits from Git history

## Rotating Exposed Secrets

If your MongoDB credentials have been exposed:

1. **Change MongoDB Password:**
   - Go to MongoDB Atlas: https://cloud.mongodb.com
   - Navigate to Database Access
   - Edit the `adminfyp` user
   - Change the password
   - Update `MONGODB_URI` with new password

2. **Update Environment Variables:**
   - Update `.env` locally (not committed)
   - Update Render environment variables
   
3. **Clear Git History** (if credentials were committed):
   ```bash
   # This is destructive - make sure you have backups
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch backend/server.js" \
     --prune-empty --tag-name-filter cat -- --all
   
   git push origin --force --all
   ```

## Alternative: Using Render Secrets

For even better security, use Render's Secret Files feature:
1. Go to Render Dashboard → Your Service → Environment
2. Click "Add Secret File"
3. Name: `.env`
4. Content: Paste your environment variables
5. This keeps secrets encrypted and out of environment variable logs
