#!/bin/bash

# Deployment Helper Script
# This        docker build -t contacthub .
        echo "Docker image built successfully"
        echo "To run: docker run -p 3000:3000 contacthub"ript helps deploy the application to various platforms

echo "🚀 ContactHub Identity Reconciliation - Deployment Helper"
echo "======================================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "🔍 Checking prerequisites..."

# Check for required tools
if ! command_exists docker; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm not found. Please install Node.js first."
    exit 1
fi

echo "✅ Prerequisites check passed!"

echo ""
echo "📦 Available deployment options:"
echo "1. Local Development"
echo "2. Docker Production Build"
echo "3. Railway Deployment"
echo "4. Render Deployment" 
echo "5. Heroku Deployment"
echo ""

read -p "Select deployment option (1-5): " choice

case $choice in
    1)
        echo "🏠 Starting Local Development..."
        npm run dev
        ;;
    2)
        echo "🐳 Building Docker Production Image..."
        docker build -t bitespeed-identity-reconciliation .
        echo "✅ Docker image built successfully!"
        echo "To run: docker run -p 3000:3000 bitespeed-identity-reconciliation"
        ;;
    3)
        echo "🚂 Railway Deployment Instructions:"
        echo "1. Install Railway CLI: npm install -g @railway/cli"
        echo "2. Login: railway login"
        echo "3. Create project: railway new"
        echo "4. Add PostgreSQL: railway add postgresql"
        echo "5. Deploy: railway up"
        echo "6. Set environment variables in Railway dashboard"
        ;;
    4)
        echo "🎨 Render Deployment Instructions:"
        echo "1. Push code to GitHub"
        echo "2. Connect GitHub repo to Render"
        echo "3. Create PostgreSQL database on Render"
        echo "4. Set environment variables:"
        echo "   - DATABASE_URL=<postgres-connection-string>"
        echo "   - NODE_ENV=production"
        echo "5. Deploy service"
        ;;
    5)
        echo "🟣 Heroku Deployment Instructions:"
        echo "1. Install Heroku CLI"
        echo "2. heroku create your-app-name"
        echo "3. heroku addons:create heroku-postgresql:hobby-dev"
        echo "4. git push heroku main"
        echo "5. heroku run npx prisma db push"
        ;;
    *)
        echo "❌ Invalid option selected"
        exit 1
        ;;
esac

echo ""
echo "📚 For detailed deployment instructions, see README.md"
echo "🔗 API Documentation: API.md"
echo "🧪 Test the API: ./test-api.sh"
