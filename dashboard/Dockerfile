# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Run stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
COPY startup.sh /startup.sh
RUN chmod +x /startup.sh
HEALTHCHECK CMD curl -f http://localhost:80/ || exit 1
CMD ["/startup.sh"]
