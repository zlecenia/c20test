FROM nginx:1.27-alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy frontend files
COPY ./ /usr/share/nginx/html

# Copy nginx config template 
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Set default environment variables
ENV FRONTEND_PORT=80
ENV BACKEND_PORT=5000

EXPOSE $FRONTEND_PORT

# Use envsubst to substitute variables and start nginx
CMD ["/bin/sh", "-c", "envsubst '$FRONTEND_PORT,$BACKEND_PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
