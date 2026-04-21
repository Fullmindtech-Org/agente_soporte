import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Channel } from '../../tickets/tickets.service';
import { TicketsService } from '../../tickets/tickets.service';
import { HoursService } from '../../hours/hours.service';
import { CustomersService } from '../../customers/customers.service';
import { classifyTicket } from '../../tickets/ticket-classifier';

/**
 * Tool: Crear ticket de soporte
 */
export function buildCreateTicketTool(
  ticketsService: TicketsService,
  hoursService: HoursService,
  customersService: CustomersService,
) {
  return createTool({
    id: 'create-ticket',
    description:
      'Crea un ticket de soporte en Plane. Usá el teléfono del cliente (disponible en el contexto como [Teléfono del cliente:...]) y el nombre del proyecto afectado. Verifica automáticamente las horas disponibles y marca el ticket como excedente si corresponde. Retorna el ID del ticket creado.',
    inputSchema: z.object({
      customerPhone: z.string().describe('Número de teléfono del cliente, tal como aparece en [Teléfono del cliente:...] en el contexto de la conversación. Ejemplo: +5491100000001'),
      projectName: z.string().optional().describe('Nombre parcial del proyecto afectado. Si el cliente tiene un solo proyecto, omitir.'),
      description: z
        .string()
        .describe('Descripción detallada del problema reportado por el cliente.'),
      channel: z
        .enum(['WHATSAPP', 'EMAIL'])
        .describe('Canal por el cual llegó la consulta.'),
      intencion: z
        .enum(['problema', 'consulta', 'cambio'])
        .optional()
        .describe('Intención clasificada del ticket.'),
      tipo: z.string().optional().describe('Tipo de ticket según catálogo.'),
      subtipo: z.string().optional().describe('Subtipo de ticket según catálogo.'),
      confianza: z.number().optional().describe('Nivel de confianza de la clasificación (0-1).'),
    }),
    execute: async (inputData) => {
      const { customerPhone, projectName, description, channel, intencion, tipo, subtipo, confianza } = inputData;

      // Auto-clasificar si el agente no proveyó clasificación
      const classification = (tipo && subtipo)
        ? { intencion: intencion ?? 'problema', tipo, subtipo, confianza: confianza ?? 0.9, requiereRevisionHumana: false }
        : classifyTicket(description);

      // Resolver cliente y proyecto por teléfono (no depende de UUIDs que el agente pueda olvidar)
      const customer = await customersService.validateCustomer(customerPhone);
      if (!customer) {
        return { success: false, message: `Cliente con teléfono ${customerPhone} no encontrado en el sistema.` };
      }

      const projects = await customersService.getActiveProjects(customer.id);
      if (projects.length === 0) {
        return { success: false, message: 'El cliente no tiene proyectos con soporte activo.' };
      }

      // Seleccionar proyecto: por nombre si se indicó, si no el primero
      const project = projectName
        ? (projects.find((p) => p.name.toLowerCase().includes(projectName.toLowerCase())) ?? projects[0])
        : projects[0];

      if (!project) {
        return {
          success: false,
          message: 'Proyecto no encontrado o sin estimate de soporte activo en Plane.',
        };
      }

      const customerId = customer.id;
      const projectId = project.id;

      // Verificar si está en excedente
      const hoursStatus = hoursService.statusFromProject(project);
      const isOverage = hoursStatus.isOverage;

      // Crear el ticket en Plane + guardar registro local
      const result = await ticketsService.createTicket({
        planeCustomerId: customerId,
        planeProjectId: projectId,
        projectName: project.name,
        description,
        channel: channel as Channel,
        isOverage,
        intencion: classification.intencion as 'problema' | 'consulta' | 'cambio',
        tipo: classification.tipo,
        subtipo: classification.subtipo,
        confianza: classification.confianza,
      });

      return {
        success: true,
        planeTicketId: result.planeTicketId,
        sequenceId: result.sequenceId,
        isOverage: result.isOverage,
        hoursRemaining: hoursStatus.remainingHoursLabel,
        message: isOverage
          ? `✅ Ticket #${result.sequenceId ?? result.planeTicketId ?? 'pendiente'} creado. ⚠️ Nota: las horas de soporte del mes están agotadas (${hoursStatus.usedHoursLabel} usadas de ${hoursStatus.contractedHoursLabel}). Este ticket será tratado como hora excedente y facturado por separado.`
          : `✅ Ticket #${result.sequenceId ?? result.planeTicketId ?? 'pendiente'} creado exitosamente. Horas restantes: ${hoursStatus.remainingHoursLabel}. Nuestro equipo estará contactándote a la brevedad.`,
      };
    },
  });
}
