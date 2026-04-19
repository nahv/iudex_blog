FROM nginx:alpine

COPY . /usr/share/nginx/html

RUN rm -rf /usr/share/nginx/html/.git \
           /usr/share/nginx/html/.github \
           /usr/share/nginx/html/.claude \
           /usr/share/nginx/html/.specify \
           /usr/share/nginx/html/scripts \
           /usr/share/nginx/html/docs \
           /usr/share/nginx/html/Dockerfile \
           /usr/share/nginx/html/docker-compose.yml \
           /usr/share/nginx/html/.dockerignore \
           /usr/share/nginx/html/CLAUDE.md \
           /usr/share/nginx/html/README.md 2>/dev/null || true

EXPOSE 80
