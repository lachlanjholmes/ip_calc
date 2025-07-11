# Use a lightweight Nginx image as the base
FROM nginx:alpine

# Copy your index.html file into the Nginx default public directory
# /usr/share/nginx/html is the default document root for Nginx in this image
COPY index.html /usr/share/nginx/html/index.html

# Copy test files
COPY test-suite.html /usr/share/nginx/html/test-suite.html

# Copy your lib directory (containing JS and CSS files) into the Nginx public directory
# This ensures that your JavaScript and CSS files are accessible relative to index.html
COPY lib/ /usr/share/nginx/html/lib/

# Fix permissions so nginx can read all static files
RUN chmod -R 755 /usr/share/nginx/html

# Expose port 80, which is the default port Nginx listens on
EXPOSE 80