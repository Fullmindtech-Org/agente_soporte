/**
 * SCRIPT DE EXPLORACIÓN — Plane API
 * ============================================================
 * Ejecutar con:
 *   npx ts-node scripts/explore-plane.ts
 *
 * Requiere que el .env tenga configuradas:
 *   PLANE_API_URL, PLANE_API_KEY, PLANE_WORKSPACE_SLUG
 *
 * Qué hace:
 *   1. Lista todos los customers del workspace (campos reales)
 *   2. Lista todos los proyectos del workspace
 *   3. Por cada proyecto: obtiene el estimate configurado + estimate points
 *   4. Por cada customer: lista sus work items linkados con estimate_point
 *   5. Vuelca JSON crudo del primer work item para ver todos los campos
 *   6. Imprime resumen arquitectural actualizado
 */

import 'dotenv/config';
import axios from 'axios';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const BASE_URL = process.env['PLANE_API_URL'] ?? 'https://api.plane.so/api/v1';
const API_KEY = process.env['PLANE_API_KEY'] ?? '';
const WORKSPACE = process.env['PLANE_WORKSPACE_SLUG'] ?? '';

if (!API_KEY || !WORKSPACE) {
  console.error('❌ PLANE_API_KEY y PLANE_WORKSPACE_SLUG son requeridos en .env');
  process.exit(1);
}

const http = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function section(title: string): void {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
interface PlaneCustomer {
  id: string;
  name: string;
  email?: string;
  website_url?: string;
  domain?: string;
  contract_status?: string;
  stage?: string;
  employees?: number;
  revenue?: string;
  description?: string;
  description_html?: string;
  description_stripped?: string;
  customer_request_count?: number;
  created_at?: string;
}

interface PlaneProject {
  id: string;
  name: string;
  description?: string;
  identifier?: string;
  network?: number;
  project_lead?: string;
  total_members?: number;
  total_cycles?: number;
  total_modules?: number;
  estimate?: string | null;   // UUID del estimate activo del proyecto (si tiene)
  created_at?: string;
}

interface PlaneEstimate {
  id: string;
  name: string;
  description?: string;
  type: 'categories' | 'points' | 'time';
  last_used: boolean;
  project: string;
}

interface PlaneEstimatePoint {
  id: string;
  key: number;
  value: string;
  description?: string;
  estimate: string;
}

interface PlaneWorkItem {
  id: string;
  sequence_id?: number;
  name: string;
  state?: string;
  priority?: string;
  estimate_point?: string | null;  // UUID del estimate point asignado
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

interface PlaneListResponse<T> {
  results: T[];
  total_results?: number;
  count?: number;
  next_page_results?: boolean;
}

// ---------------------------------------------------------------------------
// Llamadas a la API
// ---------------------------------------------------------------------------
async function listCustomers(): Promise<PlaneCustomer[]> {
  const res = await http.get<PlaneListResponse<PlaneCustomer>>(
    `/workspaces/${WORKSPACE}/customers/`,
    { params: { per_page: 100 } },
  );
  return res.data.results ?? [];
}

async function listProjects(): Promise<PlaneProject[]> {
  const res = await http.get<PlaneListResponse<PlaneProject>>(
    `/workspaces/${WORKSPACE}/projects/`,
    { params: { per_page: 100 } },
  );
  return res.data.results ?? [];
}

/** Obtiene el estimate configurado en un proyecto (puede retornar null si no tiene) */
async function getProjectEstimate(projectId: string): Promise<PlaneEstimate | null> {
  try {
    const res = await http.get<PlaneEstimate>(
      `/workspaces/${WORKSPACE}/projects/${projectId}/estimates/`,
    );
    return res.data ?? null;
  } catch {
    return null;
  }
}

/** Lista los estimate points de un estimate dado */
async function listEstimatePoints(projectId: string, estimateId: string): Promise<PlaneEstimatePoint[]> {
  try {
    const res = await http.get<PlaneEstimatePoint[]>(
      `/workspaces/${WORKSPACE}/projects/${projectId}/estimates/${estimateId}/estimate-points/`,
    );
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

/** Lista los work items (issues) linkados a un customer */
async function listCustomerWorkItems(customerId: string): Promise<PlaneWorkItem[]> {
  const res = await http.get<PlaneListResponse<PlaneWorkItem> | PlaneWorkItem[]>(
    `/workspaces/${WORKSPACE}/customers/${customerId}/issues/`,
    { params: { per_page: 20 } },
  );
  if (Array.isArray(res.data)) return res.data;
  return (res.data as PlaneListResponse<PlaneWorkItem>).results ?? [];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log(`\n🔍 Explorando Plane workspace: "${WORKSPACE}"`);
  console.log(`📡 API URL: ${BASE_URL}`);

  // ─── 1. CUSTOMERS ────────────────────────────────────────────────────────
  section('1. CUSTOMERS DEL WORKSPACE (estructura real)');
  let customers: PlaneCustomer[] = [];
  try {
    customers = await listCustomers();
    console.log(`\n  Total customers encontrados: ${customers.length}\n`);

    if (customers.length === 0) {
      console.log('  ⚠️  No hay customers. Crear desde la UI o vía POST /customers/');
      console.log('     Campos clave a completar: name, email, website_url (para WhatsApp),');
      console.log('     contract_status (ACTIVE/INACTIVE), description (apps con soporte)');
    }

    for (const c of customers) {
      console.log(`\n  ┌─ Customer: ${c.name} [${c.id}]`);
      console.log(`  │  email:            ${c.email ?? '(vacío)'}`);
      console.log(`  │  website_url:      ${c.website_url ?? '(vacío)'}`);
      console.log(`  │  domain:           ${c.domain ?? '(vacío)'}`);
      console.log(`  │  contract_status:  ${c.contract_status ?? '(vacío)'}`);
      console.log(`  │  stage:            ${c.stage ?? '(vacío)'}`);
      console.log(`  │  description:      ${c.description_stripped ? c.description_stripped.substring(0, 100) : '(vacío)'}`);
      console.log(`  │  work_items:       ${c.customer_request_count ?? 0} issues linkados`);
      console.log(`  └─ created_at: ${c.created_at ?? '?'}`);
    }
  } catch (err: unknown) {
    const e = err as { response?: { status: number; data: unknown }; message: string };
    console.error(`\n  ❌ Error al listar customers: ${e.response?.status ?? e.message}`);
    if (e.response?.data) console.error('  Detalle:', JSON.stringify(e.response.data, null, 2));
  }

  // ─── 2. PROYECTOS + ESTIMATES ─────────────────────────────────────────────
  section('2. PROYECTOS + ESTIMATE CONFIGURADO (horas de soporte)');
  let projects: PlaneProject[] = [];
  try {
    projects = await listProjects();
    console.log(`\n  Total proyectos encontrados: ${projects.length}\n`);

    for (const p of projects) {
      console.log(`\n  ┌─ Proyecto: ${p.name} (${p.identifier}) [${p.id}]`);
      console.log(`  │  description:   ${p.description ? p.description.substring(0, 80) : '(vacío)'}`);
      console.log(`  │  total_members: ${p.total_members ?? 0}`);
      console.log(`  │  estimate_id:   ${p.estimate ?? '(sin estimate configurado)'}`);

      // Obtener el estimate del proyecto
      const estimate = await getProjectEstimate(p.id);
      if (estimate) {
        console.log(`  │`);
        console.log(`  │  📊 ESTIMATE: ${estimate.name} (type: ${estimate.type}) [${estimate.id}]`);
        console.log(`  │     → type "time" = horas | "points" = puntos | "categories" = etiquetas`);

        // Obtener los estimate points
        const points = await listEstimatePoints(p.id, estimate.id);
        if (points.length > 0) {
          console.log(`  │     Estimate points (${points.length} valores):`);
          for (const pt of points) {
            console.log(`  │       key=${pt.key}  value="${pt.value}"  desc="${pt.description ?? ''}"  [${pt.id}]`);
          }
        } else {
          console.log(`  │     (sin estimate points definidos)`);
        }
      } else {
        console.log(`  │  ⚠️  Sin estimate — no se puede rastrear horas por este proyecto`);
      }
      console.log(`  └─────────────────`);
    }
  } catch (err: unknown) {
    const e = err as { response?: { status: number; data: unknown }; message: string };
    console.error(`\n  ❌ Error al listar proyectos: ${e.response?.status ?? e.message}`);
    if (e.response?.data) console.error('  Detalle:', JSON.stringify(e.response.data, null, 2));
  }

  // ─── 3. WORK ITEMS POR CUSTOMER (con estimate_point) ─────────────────────
  section('3. WORK ITEMS LINKADOS A CUSTOMERS (con estimate_point)');
  for (const c of customers) {
    console.log(`\n  Customer: ${c.name}`);
    try {
      const items = await listCustomerWorkItems(c.id);
      console.log(`  Issues linkados: ${items.length}`);

      if (items.length === 0) {
        console.log('  (sin work items linkados)');
        continue;
      }

      // Mostrar los primeros 5
      const sample = items.slice(0, 5);
      for (const item of sample) {
        console.log(`\n    ┌─ #${item.sequence_id ?? '?'} — ${item.name}`);
        console.log(`    │  state:          ${String(item.state ?? '?')}`);
        console.log(`    │  priority:       ${String(item.priority ?? '?')}`);
        console.log(`    │  estimate_point: ${item.estimate_point ?? '(sin asignar)'}`);
        console.log(`    └─ id: ${item.id}`);
      }

      if (items.length > 5) console.log(`\n  ... y ${items.length - 5} más`);

      // Raw JSON del primer item para ver TODOS los campos
      console.log(`\n  📄 RAW JSON del primer work item (todos los campos):`);
      console.log(JSON.stringify(items[0], null, 4));

    } catch (err: unknown) {
      const e = err as { response?: { status: number; data: unknown }; message: string };
      console.error(`  ❌ Error: ${e.response?.status ?? e.message}`);
      if (e.response?.data) console.error('  Detalle:', JSON.stringify(e.response.data, null, 2));
    }
  }

  if (customers.length === 0) {
    // Sin customers: mostrar raw de un issue del primer proyecto
    section('3b. RAW JSON DE UN ISSUE (primer proyecto, sin customers)');
    if (projects.length > 0) {
      const p = projects[0]!;
      try {
        const res = await http.get<PlaneListResponse<PlaneWorkItem>>(
          `/workspaces/${WORKSPACE}/projects/${p.id}/issues/`,
          { params: { per_page: 1 } },
        );
        const items = res.data.results ?? [];
        if (items.length > 0) {
          console.log(`\n  Proyecto: ${p.name} — 1er issue:`);
          console.log(JSON.stringify(items[0], null, 4));
        } else {
          console.log(`  (proyecto vacío: ${p.name})`);
        }
      } catch (err: unknown) {
        const e = err as { response?: { status: number; data: unknown }; message: string };
        console.error(`  ❌ Error: ${e.response?.status ?? e.message}`);
      }
    }
  }

  // ─── 4. RESUMEN ARQUITECTURAL ─────────────────────────────────────────────
  section('4. RESUMEN — ARQUITECTURA DE DATOS PARA EL AGENTE');
  console.log(`
  FUENTE DE VERDAD: Plane.so (sin DB externa de clientes)
  ────────────────────────────────────────────────────────────────────────

  DATO                        | CAMPO EN PLANE
  ────────────────────────────|──────────────────────────────────────────
  Nombre del cliente          | Customer.name
  Email de contacto           | Customer.email
  WhatsApp del cliente        | Customer.website_url  ← convención FMT
  Estado del contrato         | Customer.contract_status (ACTIVE/INACTIVE)
  Apps/proyectos con soporte  | Customer.description_stripped
  Proyectos (boards)          | Project.name + Project.id
  Tope de horas de soporte    | Estimate (type=time) ligado al Project
                              |   → cada estimate point = un valor de horas
                              |   → el issue tiene estimate_point = horas usadas
  Tickets de soporte          | Issue (work item) dentro del Project
  Horas consumidas por ticket | Issue.estimate_point → valor del EstimatePoint
  Historial de conversación   | BD local (tabla Conversation/Message) ✅

  VALIDACIÓN DEL CLIENTE (flujo del agente):
  ────────────────────────────────────────────────────────────────────────
  1. Recibir número WhatsApp del usuario
  2. GET /customers/ → buscar customer por website_url === número
  3. Si contract_status !== ACTIVE → rechazar
  4. GET /projects/ → encontrar proyectos de ese customer (via customer work items o description)
  5. GET /projects/{id}/estimates/ → obtener estimate del proyecto
  6. Sumar estimate_point.value de todos sus issues → horas consumidas
  7. Comparar vs tope definido en el estimate → ¿tiene saldo?

  CAMPOS QUE FALTA DEFINIR EN PLANE (pedirle al PM):
  ────────────────────────────────────────────────────────────────────────
  - Llenar website_url de cada Customer con el número WhatsApp
  - Definir contract_status como "ACTIVE" o "INACTIVE"  
  - Configurar Estimate de tipo "time" en cada proyecto con soporte
  - Crear un estimate point especial para "horas contratadas" en la descripción
  `);
}

main().catch((err: unknown) => {
  console.error('Error fatal:', (err as Error).message);
  process.exit(1);
});
