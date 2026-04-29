#!/bin/sh
# start.sh
echo "Pushing database schema..."
npx prisma db push

echo "Starting the application..."
npm start
