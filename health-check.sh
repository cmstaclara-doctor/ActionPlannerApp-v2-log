#!/bin/bash
# ActionPlanner v2.0-log Health Check Script
# Run locally: bash health-check.sh

echo "═══════════════════════════════════════════════════════════"
echo "ActionPlanner v2.0-log Health Check"
echo "Timestamp: $(date)"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "1️⃣ LOCAL (Development):"
curl -s -o /dev/null -w "   HTTP %{http_code}\n" http://localhost:3002 || echo "   ❌ Not running (start with: npm run dev)"

echo ""
echo "2️⃣ CLOUDFLARE (Primary):"
curl -s -o /dev/null -w "   HTTP %{http_code} ✅\n" https://toolkit-women-conditions-judicial.trycloudflare.com

echo ""
echo "3️⃣ CODESPACES (Backup):"
curl -s -o /dev/null -w "   HTTP %{http_code}\n" https://refactored-doodle-4jx99qjgpp5xc7g4r-3002.app.github.dev/

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✓ Health checks complete"
echo "═══════════════════════════════════════════════════════════"
