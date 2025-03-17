# Use the official PostgreSQL image from the Docker Hub
FROM postgres:latest

# Set environment variables for PostgreSQL
ENV POSTGRES_USER=toolkit
ENV POSTGRES_PASSWORD=123
ENV POSTGRES_DB=metadata

# Copy the database initialization script to the Docker image
COPY database-init.sql /docker-entrypoint-initdb.d/

# Expose port 5432 for PostgreSQL
EXPOSE 5432

# Start PostgreSQL
CMD ["postgres"]