#!/bin/bash

# Build all frontends for GitHub Pages deployment
# Usage: ./build-for-gh-pages.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${GREEN}Building all frontends for GitHub Pages...${NC}"
echo ""

# Build Medical Labeling
echo -e "${YELLOW}[1/3] Building Medical Labeling...${NC}"
(cd "$SCRIPT_DIR/medicalLabeling/medical-labeling-app" && npm run build)
echo -e "${GREEN}Medical Labeling build complete!${NC}"
echo ""

# Build Speaker Diarization
echo -e "${YELLOW}[2/3] Building Speaker Diarization frontend...${NC}"
(cd "$SCRIPT_DIR/youtube_downloader/frontend" && npm run build)
echo -e "${GREEN}Speaker Diarization build complete!${NC}"
echo ""

# Build Cephalometric
echo -e "${YELLOW}[3/3] Building Cephalometric frontend...${NC}"
(cd "$SCRIPT_DIR/cephalometric_mvp/frontend" && npm run build)
echo -e "${GREEN}Cephalometric build complete!${NC}"
echo ""

# Create docs directory structure
echo -e "${YELLOW}Creating docs directory structure...${NC}"
rm -rf "$SCRIPT_DIR/docs"
mkdir -p "$SCRIPT_DIR/docs/medical-labeling"
mkdir -p "$SCRIPT_DIR/docs/speaker-diarization"
mkdir -p "$SCRIPT_DIR/docs/cephalometric"

# Copy build outputs
echo -e "${YELLOW}Copying build outputs...${NC}"
cp -r "$SCRIPT_DIR/medicalLabeling/medical-labeling-app/dist/"* "$SCRIPT_DIR/docs/medical-labeling/"
cp -r "$SCRIPT_DIR/youtube_downloader/frontend/dist/"* "$SCRIPT_DIR/docs/speaker-diarization/"
cp -r "$SCRIPT_DIR/cephalometric_mvp/frontend/dist/"* "$SCRIPT_DIR/docs/cephalometric/"

# Create root redirect page
cat > "$SCRIPT_DIR/docs/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0; url=./medical-labeling/">
  <title>YC Demo</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      color: white;
    }
    .container {
      text-align: center;
    }
    a {
      color: #a5b4fc;
    }
  </style>
</head>
<body>
  <div class="container">
    <p>Redirecting to <a href="./medical-labeling/">Medical Labeling</a>...</p>
  </div>
</body>
</html>
EOF

# Create .nojekyll file to prevent Jekyll processing
touch "$SCRIPT_DIR/docs/.nojekyll"

# Create 404.html for SPA routing support
cat > "$SCRIPT_DIR/docs/404.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found</title>
  <script>
    // Redirect to the appropriate app based on the path
    const path = window.location.pathname;
    if (path.startsWith('/medical-labeling')) {
      window.location.href = '/medical-labeling/';
    } else if (path.startsWith('/speaker-diarization')) {
      window.location.href = '/speaker-diarization/';
    } else if (path.startsWith('/cephalometric')) {
      window.location.href = '/cephalometric/';
    } else {
      window.location.href = '/medical-labeling/';
    }
  </script>
</head>
<body>
  <p>Redirecting...</p>
</body>
</html>
EOF

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Build complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Output directory: $SCRIPT_DIR/docs/"
echo ""
echo "Directory structure:"
echo "  docs/"
echo "  ├── index.html              (redirects to medical-labeling)"
echo "  ├── 404.html                (SPA routing support)"
echo "  ├── .nojekyll               (disable Jekyll processing)"
echo "  ├── medical-labeling/       (Medical Labeling app)"
echo "  ├── speaker-diarization/    (Speaker Diarization app)"
echo "  └── cephalometric/          (Cephalometric Tool app)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Commit and push to GitHub"
echo "2. Enable GitHub Pages from Settings > Pages"
echo "3. Select 'Deploy from a branch' and choose 'main' branch, '/docs' folder"
echo "4. Update .env.production files with your actual GitHub Pages URL"
echo ""
