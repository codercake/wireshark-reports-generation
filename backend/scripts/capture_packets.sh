#!/bin/bash

# Shell script for automating packet capture
INTERFACE="en0"
DURATION=10
PING_TARGET="8.8.8.8"

echo "Pinging $PING_TARGET..."
ping -c 5 $PING_TARGET > /dev/null

echo "Capturing packets on $INTERFACE..."
curl -X POST -H "Content-Type: application/json" \
     -d '{"interface": "'$INTERFACE'", "duration": '$DURATION'}' \
     http://localhost:5002/api/capture
