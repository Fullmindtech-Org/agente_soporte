/**
 * SCRIPT: Agregar Codigo + PIN a los proyectos de soporte en Plane
 * ─────────────────────────────────────────────────────────────────
 * Ejecutar con:
 *   npx ts-node scripts/update-project-credentials.ts
 */
import 'dotenv/config';
import axios from 'axios';

const BASE_URL = process.env['PLANE_API_URL'] ?? 'https://api.plane.so/api/v1';
const API_KEY = process.env['PLANE_API_KEY'] ?? '';
const WORKSPACE = process.env['PLANE_WORKSPACE_SLUG'] ?? '';

if (!API_KEY || !WORKSPACE) {
  console.error('❌ PLANE_API_KEY y PLANE_WORKSPACE_SLUG son requeridos en .env');
  process.exit(1);
}

const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
});

// ─── Proyectos a actualizar ──────────────────────────────────────────────────
const PROJECTS = [
  {
    id: '4357cb5a-a5c4-47e1-9981-031771da9867',
    description: [
      'Cliente: TechNova',
      'Telefono: +5491100000001',
      'Plan Horas de Soporte: 15hs',
      'Codigo: TN-001',
      'PIN: 4521',
      'App: Agente conversacional IA integrado con WhatsApp y CRM',
      '',
      'Pasos de resolucion basica:',
      '1. Verificar que el agente este activo (reiniciar el servicio si no responde)',
      '2. Cerrar sesion en WhatsApp Web y volver a escanear el QR',
      '3. Revisar que la API key de OpenAI no este vencida o con credito insuficiente',
      '4. Limpiar cache del navegador si el panel de administracion no carga',
      '5. Verificar que el webhook de Gupshup apunte a la URL correcta del servidor',
    ].join('\n'),
  },
  {
    id: 'e219e590-11c2-403d-a7d5-15e41bc59b5f',
    description: [
      'Cliente: RetailPlus SRL',
      'Telefono: +5491100000002',
      'Plan Horas de Soporte: 10hs',
      'Codigo: RP-001',
      'PIN: 7832',
      'App: Plataforma e-commerce con pasarela de pagos',
      '',
      'Pasos de resolucion basica:',
      '1. Si el sitio no carga, verificar estado del hosting',
      '2. Si la pasarela de pagos da error, revisar credenciales MercadoPago/Stripe',
      '3. Para errores de stock, sincronizar desde Productos > Sincronizar',
      '4. Limpiar cache del servidor (Purge Cache)',
      '5. Si los emails no llegan, verificar configuracion SMTP en Ajustes > Email',
    ].join('\n'),
  },
  {
    id: 'c84354d0-d1ff-41ba-9a88-65b2ce698cca',
    description: [
      'Cliente: Municipalidad de Zarate',
      'Telefono: +5492487000001',
      'Plan Horas de Soporte: 5hs',
      'Codigo: MZ-001',
      'PIN: 3641',
      'App: Sistema de gestion de tramites digitales municipales',
      '',
      'Pasos de resolucion basica:',
      '1. Si el sistema no carga, probar desde otro navegador',
      '2. Para errores al cargar documentos, verificar que sea PDF menor a 5MB',
      '3. Si el tramite queda pendiente mas de 24hs, comunicar al area',
      '4. Para problemas de acceso, verificar que el usuario este activo',
      '5. Limpiar cache y cookies si la sesion se cuelga',
    ].join('\n'),
  },
  {
    id: '47438090-ee18-4ec9-82fa-01a9bdcf41b4',
    description: [
      'Cliente: Frigorifico Del Sur',
      'Telefono: +5492487000002',
      'Plan Horas de Soporte: 3hs',
      'Codigo: FD-001',
      'PIN: 9175',
      'App: ERP de produccion y stock para planta frigorifica',
      '',
      'Pasos de resolucion basica:',
      '1. Si el stock no actualiza, cerrar y reabrir sesion del ERP',
      '2. Para errores en etiquetas, verificar que la impresora este en linea',
      '3. Si ingresos no se registran, verificar permisos del usuario',
      '4. Para errores de AFIP, verificar vigencia del certificado digital',
      '5. Reiniciar el servicio de sincronizacion si los datos no sincronizan',
    ].join('\n'),
  },
  {
    id: '0c6ea255-f776-4211-b2b0-c0e9ee48cec2',
    description: [
      'Cliente: LogiTrans Latam',
      'Telefono: +5491100000003',
      'Plan Horas de Soporte: 5hs',
      'Codigo: LT-001',
      'PIN: 6283',
      'App: Plataforma de tracking de envios en tiempo real',
      '',
      'Pasos de resolucion basica:',
      '1. Si el mapa no actualiza, refrescar la pagina y limpiar cache',
      '2. Si los camiones no aparecen, verificar que el GPS tenga senal',
      '3. Para errores de login, usar recuperar contrasena',
      '4. Si los reportes no se generan, verificar el rango de fechas',
      '5. Para problemas con el ERP, verificar que el token de API no este vencido',
    ].join('\n'),
  },
];

// ─── Ejecución ───────────────────────────────────────────────────────────────
async function run(): Promise<void> {
  console.log(`Actualizando ${PROJECTS.length} proyectos en workspace "${WORKSPACE}"...\n`);

  for (const p of PROJECTS) {
    try {
      const res = await http.patch<{ id: string; name: string }>(
        `/workspaces/${WORKSPACE}/projects/${p.id}/`,
        { description: p.description },
      );
      console.log(`✅ ${res.data.name} (${p.id.slice(0, 8)}...)`);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? JSON.stringify(err.response?.data ?? err.message)
        : String(err);
      console.error(`❌ ${p.id.slice(0, 8)}...: ${msg}`);
    }
  }

  console.log('\n✔ Listo.');
}

run();
