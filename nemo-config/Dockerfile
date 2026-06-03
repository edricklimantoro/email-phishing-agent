# Use the lightweight Python image
FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# IMPORTANT FIX FOR MAC M2: 
# Install the C++ compilers and build tools required by NeMo's dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Now install NeMo Guardrails and uvicorn
RUN pip install "nemoguardrails[server]"

# Copy your configuration files into the container
COPY . /app

# Make the entrypoint executable
RUN chmod +x /app/entrypoint.sh

# Expose the port the server will run on
EXPOSE 8000

# Start the NeMo Guardrails server (entrypoint substitutes env vars in config.yml)
CMD ["/app/entrypoint.sh"]