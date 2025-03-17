FROM python:3.9

# Set the working directory
WORKDIR /app

# Copy the requirements file
COPY requirements.txt .

# Install the required dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

EXPOSE 8000

# Set the command to run BEIRUtils.py first, then main.py
CMD ["sh", "-c", "python BEIRUtils.py && python main.py"]