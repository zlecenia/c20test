FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/
COPY pages/ /usr/share/nginx/html/pages/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
