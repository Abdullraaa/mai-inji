#!/bin/bash
# mai-inji-backend startup script
# Usage: ./start.sh

set -e

echo "🔄 Mai Inji Backend Startup"
echo ""

# Check .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found"
    echo "Please create .env with DATABASE_URL from Railway"
    exit 1
fi

# Check NODE_ENV
ENV=$(grep NODE_ENV .env | cut -d '=' -f 2)
echo "📝 Environment: $ENV"

# Check database connection
echo "🔌 Testing database connection..."
if timeout 5 npm run migrate 2>&1 | head -5; then
    echo "✅ Database connected and migrations applied"
else
    echo "❌ Database connection failed"
    echo "Check your DATABASE_URL in .env"
    exit 1
fi

# Seed if development
if [ "$ENV" = "development" ]; then
    echo "🌱 Seeding test data..."
    npm run seed
fi

# Start server
echo ""
echo "🚀 Starting backend server..."
npm run dev
