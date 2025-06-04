#!/bin/bash

echo "Preparing to deploy to Render.com"
echo "--------------------------------"
echo "Make sure you have:"
echo "1. Created a Render account"
echo "2. Installed Render CLI (npm install -g @render/cli)"
echo "3. Logged in with 'render login'"
echo "--------------------------------"

# Ask for confirmation
read -p "Ready to deploy? (y/n): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Deploy using blueprint
echo "Deploying to Render..."
render blueprint apply

echo "Deployment initiated. Check your Render dashboard for progress."
echo "Your app will be available at https://contacthub-app.onrender.com once deployed"
