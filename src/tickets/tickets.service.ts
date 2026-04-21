import { Injectable, Logger } from '@nestjs/common';
import { PlaneService } from '../integrations/plane/plane.service';

export type Channel = 'WHATSAPP' | 'EMAIL';

export interface CreateTicketInput {
  planeCustomerId: string;
  planeProjectId: string;
  projectName: string;
  description: string;
  channel: Channel;
  isOverage: boolean;
  intencion?: 'problema' | 'consulta' | 'cambio';
  tipo?: string;
  subtipo?: string;
  confianza?: number;
}

export interface TicketResult {
  planeTicketId: string | null;
  sequenceId?: number;
  planeUrl?: string;
  isOverage: boolean;
}

export interface TicketStatusResult {
  found: boolean;
  status?: string;
  description?: string;
  planeTicketId?: string;
  sequenceId?: number;
}

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(private readonly plane: PlaneService) {}

  /**
   * Crea un ticket en Plane. Sin persistencia local.
   */
  async createTicket(input: CreateTicketInput): Promise<TicketResult> {
    try {
      const planeTicket = await this.plane.createTicket({
        name: `[Soporte] ${input.projectName} — ${input.description.substring(0, 60)}`,
        description: input.description,
        customerId: input.planeCustomerId,
        projectName: input.projectName,
        channel: input.channel,
        isOverage: input.isOverage,
        planeProjectId: input.planeProjectId,
        intencion: input.intencion,
        tipo: input.tipo,
        subtipo: input.subtipo,
        confianza: input.confianza,
      });

      this.logger.log(`Ticket creado en Plane: ${planeTicket.id} (seq: ${planeTicket.sequence_id})`);

      return {
        planeTicketId: planeTicket.id,
        sequenceId: planeTicket.sequence_id,
        planeUrl: `https://app.plane.so/`,
        isOverage: input.isOverage,
      };
    } catch (err: unknown) {
      this.logger.error(`Error al crear ticket en Plane: ${(err as Error).message}`);
      return {
        planeTicketId: null,
        isOverage: input.isOverage,
      };
    }
  }

  /**
   * Consulta el estado de un ticket en Plane.
   * Acepta UUID o número de secuencia. Usa el projectId del cliente para buscar.
   */
  async getTicketStatus(ticketId: string, projectId?: string): Promise<TicketStatusResult> {
    try {
      const ticket = await this.plane.getTicket(ticketId, projectId);
      return {
        found: true,
        status: ticket.state_detail?.name ?? 'Abierto',
        description: ticket.name,
        planeTicketId: ticket.id,
        sequenceId: ticket.sequence_id,
      };
    } catch {
      return { found: false };
    }
  }
}
