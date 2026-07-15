# THE WORLD IS YOURS — API (Express / Node ≥22)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV TZ=Indian/Antananarivo

RUN addgroup -S twiy && adduser -S twiy -G twiy
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

USER twiy
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1

CMD ["npm", "start"]
