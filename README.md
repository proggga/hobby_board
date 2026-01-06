# 🚀 TL;DR Deployment Guide (GitHub Pages)

## 1. Create Repository
1. Go to [GitHub.com/new](https://github.com/new).
2. Create an **empty** repository (don't add README/gitignore).

## 2. Connect & Push
Run these commands in your terminal (replace `YOUR_REPO_URL` with the one from step 1):

```bash
# Initialize git (if you haven't already)
git init

# Add remote
git remote add origin YOUR_REPO_URL

# Set correct base path in vite.config.js
# Open vite.config.js and add: base: '/REPO_NAME/',
# Example: if repo is 'my-calc-app', add base: '/my-calc-app/',

# Push code
git add .
git commit -m "Ready for deploy"
git branch -M main
git push -u origin main
```

## 3. Deploy
```bash
npm run deploy
```

## 4. Enable Pages
1. Go to your GitHub Repo -> **Settings** -> **Pages**.
2. Source: **Deploy from a branch**.
3. Branch: **gh-pages** / /(root).
4. Save.
