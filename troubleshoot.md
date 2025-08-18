# Troubleshooting Guide

## Error: "next: not found"

This error means Next.js is not properly installed. Here are the steps to fix it:

### Step 1: Check Node.js Version
```bash
node --version
npm --version
```
You need Node.js 18+ and npm 9+.

### Step 2: Clear and Reinstall
```bash
# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Install dependencies
npm install
```

### Step 3: Alternative Installation
If npm install fails, try:
```bash
# Using yarn instead
npm install -g yarn
yarn install

# Or using npx
npx create-next-app@14 gym-management-new --typescript --tailwind --app
# Then copy our files over
```

### Step 4: Manual Next.js Installation
```bash
npm install next@14.0.4 react@18 react-dom@18 --save
npm install typescript @types/node @types/react @types/react-dom --save-dev
```

### Step 5: Run Development Server
```bash
# Try these in order:
npm run dev
npx next dev
./node_modules/.bin/next dev
```

### Step 6: Check Dependencies
Make sure these are in your package.json:
```json
{
  "dependencies": {
    "next": "14.0.4",
    "react": "^18",
    "react-dom": "^18"
  }
}
```

### Alternative: Use Development Container

If you continue having issues, you can use a development container:

1. **Using Docker:**
```bash
# Create Dockerfile
cat > Dockerfile << EOF
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
EOF

# Build and run
docker build -t gym-management .
docker run -p 3000:3000 gym-management
```

2. **Using CodeSandbox:**
- Go to https://codesandbox.io
- Create new Next.js project
- Copy all files from this project
- Install dependencies: @supabase/supabase-js, @supabase/auth-helpers-nextjs, etc.

3. **Using Stackblitz:**
- Go to https://stackblitz.com
- Create new Next.js project
- Import the files

### Environment Issues

If you're using a restricted environment:
1. Check if you have permission to install global packages
2. Try using a Node.js version manager like nvm
3. Use a cloud IDE like GitHub Codespaces or Gitpod

### Quick Test
To verify your setup works:
```bash
# Create a simple test
echo 'console.log("Node.js works!")' > test.js
node test.js
# Should print: Node.js works!
```

## Common Solutions

### Solution 1: Permission Issues
```bash
# Fix npm permissions
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### Solution 2: Use Different Package Manager
```bash
# Install and use pnpm
npm install -g pnpm
pnpm install
pnpm dev
```

### Solution 3: Manual Setup
If all else fails, you can set up the project manually:
1. Create a new Next.js project: `npx create-next-app@latest`
2. Copy our files over to the new project
3. Install the additional dependencies we need

Let me know which solution works for you!