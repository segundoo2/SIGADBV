FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM nginx:1.27-alpine AS runtime
RUN apk add --no-cache openssl
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/runtime-config.template.js /etc/nginx/templates/runtime-config.js.template
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 443
ENTRYPOINT ["/bin/sh", "-c", "mkdir -p /etc/nginx/certs && if [ ! -s /etc/nginx/certs/tls.crt ]; then openssl req -x509 -nodes -newkey rsa:2048 -days 30 -keyout /etc/nginx/certs/tls.key -out /etc/nginx/certs/tls.crt -subj '/CN=localhost' -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1'; fi && envsubst '$SIMULATION_API_URL' < /etc/nginx/templates/runtime-config.js.template > /usr/share/nginx/html/runtime-config.js && exec nginx -g 'daemon off;'" ]
