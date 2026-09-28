#!/bin/sh
set -e

# Ensure prisma directory exists
mkdir -p prisma

# Automatically run prisma db push and seed script if database does not exist
if [ ! -f "prisma/dev.db" ]; then
  echo "📦 Database dev.db missing. Initializing schema..."
  npx prisma db push
  echo "🌱 Seeding database with official fixtures.json..."
  npx tsx prisma/seed.ts
fi

echo "🚀 Starting VERA application server..."
exec npm start
