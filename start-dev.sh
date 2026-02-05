#!/bin/bash

# Start all applications for local development
# Usage: ./start-dev.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${GREEN}Starting YC Demo Applications...${NC}"
echo ""

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}Port $1 is already in use!${NC}"
        return 1
    fi
    return 0
}

# Check required ports
echo "Checking port availability..."
check_port 5173 || exit 1
check_port 5174 || exit 1
check_port 5175 || exit 1
check_port 5176 || exit 1
check_port 8000 || exit 1
check_port 8001 || exit 1
echo -e "${GREEN}All ports available!${NC}"
echo ""

# Start Medical Labeling frontend (port 5173)
echo -e "${YELLOW}Starting Medical Labeling frontend (port 5173)...${NC}"
(cd "$SCRIPT_DIR/medicalLabeling/medical-labeling-app" && npm run dev) &
MEDICAL_PID=$!

# Start Speaker Diarization backend (port 8000)
echo -e "${YELLOW}Starting Speaker Diarization backend (port 8000)...${NC}"
(cd "$SCRIPT_DIR/youtube_downloader" && uvicorn backend.main:app --reload --port 8000) &
DIARIZATION_BACKEND_PID=$!

# Start Speaker Diarization frontend (port 5174)
echo -e "${YELLOW}Starting Speaker Diarization frontend (port 5174)...${NC}"
(cd "$SCRIPT_DIR/youtube_downloader/frontend" && npm run dev) &
DIARIZATION_FRONTEND_PID=$!

# Start Cephalometric backend (port 8001)
echo -e "${YELLOW}Starting Cephalometric backend (port 8001)...${NC}"
(cd "$SCRIPT_DIR/cephalometric_mvp/backend" && uvicorn app.main:app --reload --port 8001) &
CEPHALOMETRIC_BACKEND_PID=$!

# Start Cephalometric frontend (port 5175)
echo -e "${YELLOW}Starting Cephalometric frontend (port 5175)...${NC}"
(cd "$SCRIPT_DIR/cephalometric_mvp/frontend" && npm run dev) &
CEPHALOMETRIC_FRONTEND_PID=$!

# Start Op Note Annotation frontend (port 5176)
echo -e "${YELLOW}Starting Op Note Annotation frontend (port 5176)...${NC}"
(cd "$SCRIPT_DIR/note_annotation/frontend" && npm run dev) &
OPNOTE_FRONTEND_PID=$!

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}All services starting...${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  Medical Labeling:      ${GREEN}http://localhost:5173${NC}"
echo -e "  Speaker Diarization:   ${GREEN}http://localhost:5174${NC}"
echo -e "  Cephalometric Tool:    ${GREEN}http://localhost:5175${NC}"
echo -e "  Op Note Annotation:    ${GREEN}http://localhost:5176${NC}"
echo ""
echo -e "  Backend APIs:"
echo -e "    - Diarization API:   http://localhost:8000/docs"
echo -e "    - Cephalometric API: http://localhost:8001/docs"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for all background processes
wait
