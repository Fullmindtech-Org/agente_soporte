# Agente de Soporte — Fullmindtech

Backend del agente de soporte tecnico de Fullmindtech. Atiende clientes por WhatsApp (via Gupshup), valida clientes, intenta resolver consultas automaticamente y crea tickets en Plane cuando es necesario.

## Stack

- Runtime: Node.js 20 + TypeScript
- Framework: NestJS
- Base de datos: PostgreSQL 16 + Prisma ORM v7 (con @prisma/adapter-pg)
- Agente IA: Mastra AI + OpenRouter (gateway LLM)
- Canal principal: WhatsApp via Gupshup
- Tickets: Plane
- Monitoreo: UptimeRobot (o compatible)

## Requisitos previos

- Node.js 20+
- Docker + Docker Compose
- Una cuenta en Gupshup con linea de WhatsApp activa
- Una instancia de Plane con API Key
- Una cuenta en OpenRouter con creditos

## Levantar en local

### 1. Instalar dependencias

npm install

### 2. Configurar variables de entorno

cp .env.example .env
# Completar .env con los valores reales

### 3. Levantar la base de datos

docker-compose up db -d

### 4. Ejecutar migraciones y seed inicial

npm run db:migrate
npm run db:seed

### 5. Iniciar el servidor

npm run start:dev

### Levantar todo con Docker

docker-compose up --build

## Endpoints

POST /webhooks/whatsapp  - Webhook receptor de mensajes desde Gupshup
POST /webhooks/plane     - Webhook de eventos de Plane (ticket resuelto)

## Variables de entorno

Ver .env.example para la lista completa documentada.

DATABASE_URL, GUPSHUP_API_KEY, GUPSHUP_APP_ID, GUPSHUP_PHONE_NUMBER,
PLANE_API_KEY, PLANE_WORKSPACE_SLUG, PLANE_PROJECT_ID,
UPTIME_API_URL, UPTIME_API_KEY, LLM_API_KEY, LLM_MODEL

## Scripts

npm run start:dev           # Desarrollo con hot-reload
npm run build               # Compilar TypeScript
npm run db:migrate          # Crear/aplicar migraciones
npm run db:migrate:deploy   # Aplicar migraciones en produccion
npm run db:seed             # Cargar FAQs iniciales
npm run db:studio           # Abrir Prisma Studio
npm run prisma:generate     # Regenerar Prisma Client
