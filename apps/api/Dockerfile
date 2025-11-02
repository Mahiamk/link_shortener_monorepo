# /apps/api/Dockerfile

# Use an official Python slim-buster image as the base
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /code

# Copy the requirements file first to leverage Docker cache
COPY ./requirements.txt /code/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir -r /code/requirements.txt

# Copy your application code into the container
COPY ./app /code/app

# Command to run your application
# Use --host 0.0.0.0 to make it accessible outside the container
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}