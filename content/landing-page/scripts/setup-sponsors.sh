#!/bin/bash

# Sponsor Grid Setup Script
# This script helps you set up the sponsor grid feature quickly

set -e

echo "🎯 Sponsor Grid Setup Script"
echo "=============================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "📝 Creating .env.local from .env.example..."
  cp .env.example .env.local
  echo "✅ Created .env.local"
  echo "⚠️  Please edit .env.local with your Stripe keys and database URL"
  echo ""
else
  echo "✅ .env.local already exists"
  echo ""
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo "✅ Dependencies installed"
  echo ""
else
  echo "✅ Dependencies already installed"
  echo ""
fi

# Check if MONGODB_URI is set
if grep -q "MONGODB_URI=\"mongodb://localhost:27017" .env.local 2>/dev/null; then
  echo "⚠️  MONGODB_URI in .env.local looks like a placeholder"
  echo "   Please update it with your actual MongoDB connection string"
  echo "   Local: mongodb://localhost:27017/auth-sdk-sponsors"
  echo "   Atlas: mongodb+srv://username:password@cluster.mongodb.net/auth-sdk-sponsors"
  echo ""
else
  echo "✅ MONGODB_URI is configured"
  echo "   MongoDB will create collections automatically on first use"
  echo ""
fi

# Create sponsors directory if it doesn't exist
if [ ! -d public/sponsors ]; then
  echo "📁 Creating public/sponsors directory..."
  mkdir -p public/sponsors
  touch public/sponsors/.gitkeep
  echo "✅ Sponsors directory created"
  echo ""
else
  echo "✅ Sponsors directory already exists"
  echo ""
fi

echo "=============================="
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your Stripe API keys"
echo "2. Update .env.local with your MongoDB connection string"
echo "3. Ensure MongoDB is running (local) or use MongoDB Atlas (cloud)"
echo "4. Set up Stripe webhook (see SPONSOR_SETUP.md)"
echo "5. Run 'npm run dev' to start the development server"
echo ""
echo "For detailed setup instructions, see:"
echo "  - SPONSOR_SETUP.md"
echo "  - SPONSOR_IMPLEMENTATION.md"
echo ""
