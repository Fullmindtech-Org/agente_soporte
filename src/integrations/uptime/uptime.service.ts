import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface ServiceStatus {
  name: string;
  status: 'up' | 'down' | 'degraded' | 'unknown';
  uptimePercent?: number;
  lastChecked?: string;
}

@Injectable()
export class UptimeService {
  private readonly logger = new Logger(UptimeService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  /** Lista de monitores directos: [{ name, url }] */
  private readonly directMonitors: Array<{ name: string; url: string }>;

  constructor(private readonly config: ConfigService) {
    this.apiUrl = this.config.get<string>('UPTIME_API_URL', '');
    this.apiKey = this.config.get<string>('UPTIME_API_KEY', '');

    // UPTIME_MONITOR_URLS = "Nombre1=https://url1,Nombre2=https://url2"
    const raw = this.config.get<string>('UPTIME_MONITOR_URLS', '');
    this.directMonitors = raw
      ? raw.split(',').flatMap((entry) => {
          const eqIdx = entry.indexOf('=');
          if (eqIdx < 1) return [];
          return [{ name: entry.slice(0, eqIdx).trim(), url: entry.slice(eqIdx + 1).trim() }];
        })
      : [];
  }

  /**
   * Consulta el estado de todos los monitores.
   * Prioridad: UPTIME_MONITOR_URLS (ping directo) → UptimeRobot API.
   */
  async getAllServicesStatus(): Promise<ServiceStatus[]> {
    if (this.directMonitors.length > 0) {
      return this.pingAllDirect();
    }
    if (this.apiUrl) {
      return this.queryUptimeRobot();
    }
    this.logger.warn('Sin configuración de uptime — usando UPTIME_MONITOR_URLS o UPTIME_API_URL');
    return [];
  }

  /**
   * Consulta el estado de un servicio específico por nombre (búsqueda parcial).
   */
  async getServiceStatus(serviceName: string): Promise<ServiceStatus> {
    const all = await this.getAllServicesStatus();
    const match = all.find((s) =>
      s.name.toLowerCase().includes(serviceName.toLowerCase()),
    );
    return match ?? { name: serviceName, status: 'unknown' };
  }

  // ─── Ping directo ───────────────────────────────────────────────────────────

  private async pingAllDirect(): Promise<ServiceStatus[]> {
    const results = await Promise.allSettled(
      this.directMonitors.map((m) => this.pingOne(m.name, m.url)),
    );
    return results.map((r) => (r.status === 'fulfilled' ? r.value : { name: 'unknown', status: 'unknown' as const }));
  }

  private async pingOne(name: string, url: string): Promise<ServiceStatus> {
    const now = new Date().toISOString();
    try {
      const resp = await axios.head(url, { timeout: 6000, validateStatus: () => true });
      const status: ServiceStatus['status'] =
        resp.status >= 200 && resp.status < 500 ? 'up' : 'down';
      return { name, status, lastChecked: now };
    } catch {
      return { name, status: 'down', lastChecked: now };
    }
  }

  // ─── UptimeRobot API ────────────────────────────────────────────────────────

  private async queryUptimeRobot(): Promise<ServiceStatus[]> {
    try {
      const response = await axios.get<{
        monitors?: Array<{ friendly_name: string; status: number; uptime_ratio?: string }>;
      }>(`${this.apiUrl}/getMonitors`, {
        params: { api_key: this.apiKey, format: 'json', logs: 0 },
      });

      return (response.data?.monitors ?? []).map((m) => ({
        name: m.friendly_name,
        status: m.status === 2 ? 'up' : m.status === 8 ? 'degraded' : 'down',
        uptimePercent: m.uptime_ratio ? parseFloat(m.uptime_ratio) : undefined,
      }));
    } catch (error: unknown) {
      this.logger.error(`Error al consultar UptimeRobot: ${(error as Error).message}`);
      return [];
    }
  }

  /** @deprecated No se usa en el flujo actual */
  async areAllServicesUp(): Promise<boolean> {
    const all = await this.getAllServicesStatus();
    if (all.length === 0) return true;
    return all.every((s) => s.status === 'up');
  }
}
