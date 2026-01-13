-- Create dedicated role and database for development
CREATE ROLE maiinji_dev WITH LOGIN PASSWORD 'dev_password_123';
ALTER ROLE maiinji_dev CREATEDB;

-- Create database owned by maiinji_dev
CREATE DATABASE maiinji_dev OWNER maiinji_dev;

-- Grant privileges
GRANT CONNECT ON DATABASE maiinji_dev TO maiinji_dev;

-- Set search path
ALTER ROLE maiinji_dev SET search_path TO public;

-- Verify
\du
\l
