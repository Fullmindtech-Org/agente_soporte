import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { TicketsService } from '../../tickets/tickets.service';
import { CustomersService } from '../../customers/customers.service';

/**
 * Tool: Consultar estado de un ticket
 */
export function buildQueryTicketTool(
  ticketsService: TicketsService,
  customersService: CustomersService,
) {
  return createTool({
    id: 'query-ticket',
    description:
      'Consulta el estado actual de un ticket de soporte por su número de secuencia (ej: 1, 2, 3) o UUID. Requiere el teléfono del cliente para buscar en el proyecto correcto.',
    inputSchema: z.object({
      ticketId: z
        .string()
        .describe('Número de secuencia del ticket (ej: "1", "2") o UUID de Plane.'),
      customerPhone: z
        .string()
        .describe('Teléfono del cliente para buscar en su proyecto. Disponible en [Teléfono del cliente:...] del contexto.'),
    }),
    execute: async (inputData) => {
      const { ticketId, customerPhone } = inputData;

      // Resolver proyecto del cliente para buscar en él
      const customer = await customersService.validateCustomer(customerPhone);
      if (!customer) {
        return { found: false, message: `Cliente con teléfono ${customerPhone} no encontrado.` };
      }
      const projects = await customersService.getActiveProjects(customer.id);
      const projectId = projects[0]?.id;

      const result = await ticketsService.getTicketStatus(ticketId, projectId);

      if (!result.found) {
        return {
          found: false,
          message: `No se encontró ningún ticket con el ID **${ticketId}**. Verificá que el número sea correcto.`,
        };
      }

      return {
        found: true,
        ticketId: result.sequenceId ?? result.planeTicketId ?? ticketId,
        status: result.status,
        description: result.description,
        message: `Ticket #${result.sequenceId ?? result.planeTicketId}: Estado actual — **${result.status}**.`,
      };
    },
  });
}
