#!/bin/bash

# Tunnel Manager Script
# Automatically manages SSH tunnels with Docker containers

# Configuration
TUNNEL_TYPE=${TUNNEL_TYPE:-"cloudflare"}  # Options: cloudflare, ngrok, localhost
RETRY_INTERVAL=30  # Seconds between reconnection attempts
MAX_RETRIES=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check if container is running
check_container() {
    docker ps --format "table {{.Names}}" | grep -q "gastos-app"
    return $?
}

# Get container IP
get_container_ip() {
    docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' gastos-app 2>/dev/null
}

# Setup Cloudflare Tunnel
setup_cloudflare_tunnel() {
    log "Setting up Cloudflare tunnel..."
    
    # Check if cloudflared is installed
    if ! command -v cloudflared &> /dev/null; then
        error "cloudflared is not installed. Install it with: brew install cloudflared"
        return 1
    fi
    
    # Kill existing cloudflared processes
    pkill -f cloudflared 2>/dev/null
    
    # Start tunnel
    cloudflared tunnel --url http://localhost:3000 &
    TUNNEL_PID=$!
    
    sleep 5
    
    # Get tunnel URL
    TUNNEL_URL=$(cloudflared tunnel list 2>&1 | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | head -1)
    
    if [ -n "$TUNNEL_URL" ]; then
        log "Cloudflare tunnel established: $TUNNEL_URL"
        echo "$TUNNEL_URL" > .tunnel-url
        return 0
    else
        error "Failed to establish Cloudflare tunnel"
        return 1
    fi
}

# Setup Ngrok Tunnel
setup_ngrok_tunnel() {
    log "Setting up Ngrok tunnel..."
    
    # Check if ngrok is installed
    if ! command -v ngrok &> /dev/null; then
        error "ngrok is not installed. Install it with: brew install ngrok"
        return 1
    fi
    
    # Kill existing ngrok processes
    pkill -f ngrok 2>/dev/null
    
    # Start tunnel
    ngrok http 3000 > /dev/null &
    TUNNEL_PID=$!
    
    sleep 3
    
    # Get tunnel URL from ngrok API
    TUNNEL_URL=$(curl -s localhost:4040/api/tunnels | python3 -c "import sys, json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])" 2>/dev/null)
    
    if [ -n "$TUNNEL_URL" ]; then
        log "Ngrok tunnel established: $TUNNEL_URL"
        echo "$TUNNEL_URL" > .tunnel-url
        return 0
    else
        error "Failed to establish Ngrok tunnel"
        return 1
    fi
}

# Monitor and restart tunnel if needed
monitor_tunnel() {
    local retries=0
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if ! check_container; then
            warning "Container is not running. Waiting..."
            sleep $RETRY_INTERVAL
            retries=$((retries + 1))
            continue
        fi
        
        # Check if tunnel process is still running
        if [ -n "$TUNNEL_PID" ] && ! kill -0 $TUNNEL_PID 2>/dev/null; then
            warning "Tunnel process died. Restarting..."
            
            case $TUNNEL_TYPE in
                cloudflare)
                    setup_cloudflare_tunnel
                    ;;
                ngrok)
                    setup_ngrok_tunnel
                    ;;
                *)
                    log "Using localhost - no tunnel needed"
                    ;;
            esac
        fi
        
        sleep $RETRY_INTERVAL
        retries=0  # Reset retries on successful check
    done
    
    error "Max retries reached. Exiting."
    exit 1
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    if [ -n "$TUNNEL_PID" ]; then
        kill $TUNNEL_PID 2>/dev/null
    fi
    rm -f .tunnel-url
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    log "Starting Tunnel Manager for Docker containers"
    log "Tunnel type: $TUNNEL_TYPE"
    
    # Wait for container to be ready
    while ! check_container; do
        warning "Waiting for gastos-app container to start..."
        sleep 5
    done
    
    log "Container is running. IP: $(get_container_ip)"
    
    # Setup initial tunnel
    case $TUNNEL_TYPE in
        cloudflare)
            setup_cloudflare_tunnel
            ;;
        ngrok)
            setup_ngrok_tunnel
            ;;
        localhost)
            log "Using localhost - no tunnel needed"
            ;;
        *)
            error "Unknown tunnel type: $TUNNEL_TYPE"
            exit 1
            ;;
    esac
    
    # Monitor tunnel
    monitor_tunnel
}

# Run main function
main