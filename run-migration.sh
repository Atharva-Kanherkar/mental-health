#!/bin/bash
# Run database migration on DigitalOcean

# Your database URL from .env
source .env

echo "Running migration on DigitalOcean database..."
psql "$DATABASE_URL" -f prisma/migrations/add_is_attachment_field.sql

echo "Migration complete!"
