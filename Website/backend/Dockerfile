# Stage 1: install full deps (incl. devDependencies) and generate the Prisma client.
# `prisma generate` needs the `prisma` CLI, which is a devDependency — this
# stage exists specifically so the final image doesn't need to carry it.
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .

# Stage 2: production image — only production deps, plus the already-
# generated Prisma client artifacts copied over from the builder stage.
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY . .

EXPOSE 5000
CMD ["node", "server.js"]
