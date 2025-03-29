#!/bin/bash

# Cleanup Chrome user data directory
rm -rf /app/.chrome-user-data/*

# Execute the main command
exec "$@"