#!/bin/bash

# Database Reset Script for Testing
# This script resets the database and adds sample data

echo "🔄 Resetting Database..."

cd /home/ayush99336/Desktop/Code/Bitspeed

# Reset database
echo "Dropping and recreating database schema..."
npx prisma db push --force-reset

echo "✅ Database reset complete!"
echo ""
echo "🌱 You can now run fresh tests:"
echo "  ./test-api.sh"
echo ""
echo "📊 To view database:"
echo "  npx prisma studio"
