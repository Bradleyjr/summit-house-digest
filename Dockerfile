FROM mcr.microsoft.com/playwright:v1.60.0-noble

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV SUMMIT_DIGEST_SLACK_PORT=8787

EXPOSE 8787

CMD ["npm", "run", "slack:dev"]

