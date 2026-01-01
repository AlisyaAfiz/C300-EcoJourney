# 🚨 URGENT: Security Fix Required

Your `.env` file was accidentally committed to GitHub with sensitive credentials exposed.

## Immediate Actions Required:

### 1. Change MongoDB Password (CRITICAL - Do This First!)

**Current exposed credentials:**
- Username: `adminfyp`
- Password: `qh6jtEXxTTDq7uuG` ⚠️ **COMPROMISED**

**Steps:**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Log in to your account
3. Go to **Database Access** (left sidebar)
4. Find user `adminfyp`
5. Click **Edit** → **Edit Password**
6. Generate a new strong password (use the Auto-generate option)
7. **SAVE THE NEW PASSWORD** - you'll need it in step 3

### 2. Regenerate JWT Secret

The JWT secret `1c2b9a5608c99d50c331d72622512be1de67af3ee5196047d71f9fe670585db4` was exposed.

**Generate new secret:**
```bash
# Run this command in PowerShell:
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

Copy the output - this is your new JWT_SECRET.

### 3. Update Render Environment Variables

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your `rpecocjourney-backend` service
3. Go to **Environment** tab
4. Update these variables:

   **MONGODB_URI:**
   ```
   mongodb+srv://adminfyp:YOUR_NEW_PASSWORD_HERE@rpecojourney.meawj2c.mongodb.net/?appName=RPEcoJourney&retryWrites=true&w=majority
   ```
   (Replace `YOUR_NEW_PASSWORD_HERE` with the password from Step 1)

   **JWT_SECRET:**
   ```
   YOUR_NEW_JWT_SECRET_FROM_STEP_2
   ```

4. Click **Save Changes** - this will redeploy your backend automatically

### 4. Update Local .env File

Your local `backend/.env` file still has the old credentials. Update it:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://adminfyp:YOUR_NEW_PASSWORD@rpecojourney.meawj2c.mongodb.net/?appName=RPEcoJourney&retryWrites=true&w=majority
JWT_SECRET=YOUR_NEW_JWT_SECRET
JWT_EXPIRE=7d
EMAIL_USER=alisyaafiz@gmail.com
EMAIL_PASSWORD=your_email_app_password_if_any

CLOUDINARY_CLOUD_NAME=dfbarqwby
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 5. (Optional but Recommended) Remove from Git History

The old credentials are still in git history. To completely remove them:

**⚠️ WARNING: This rewrites git history and will affect anyone else working on this repo!**

```bash
# Install BFG Repo Cleaner (easier than git filter-branch)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Or use git filter-branch:
cd "d:\Downloads\C300-EcoJourney-main (1)\C300-EcoJourney-main"
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch backend/.env" --prune-empty --tag-name-filter cat -- --all

# Force push to GitHub (destructive!)
git push origin --force --all
```

**Easier alternative:** Delete the repo and re-create it without the .env file history.

### 6. Close GitHub Security Alert

After completing steps 1-3:
1. Go to your [GitHub repository Security alerts](https://github.com/AlisyaAfiz/C300-EcoJourney/security)
2. Click on the MongoDB alert
3. Click **Dismiss alert** → **Revoked**
4. Add note: "Rotated MongoDB credentials and updated environment variables"

## What Was Fixed:

✅ `.env` removed from future commits  
⚠️ Old credentials still in git history (see Step 5)  
⚠️ MongoDB password needs to be changed  
⚠️ JWT secret needs to be regenerated  

## Prevention:

- `.gitignore` already includes `.env` files
- Never commit `.env` files
- Always use environment variables for secrets
- Use GitHub secret scanning alerts

## Questions?

If you need help with any of these steps, let me know!
