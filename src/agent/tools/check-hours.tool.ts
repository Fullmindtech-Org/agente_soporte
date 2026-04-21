import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { HoursService } from '../../hours/hours.service';
import { PlaneProjectWithHours } from '../../integrations/plane/dto/plane-ticket.dto';

/**
 * Tool: Verificar horas de soporte disponibles
 */
export function buildCheckHoursTool(hoursService: HoursService) {
  return createTool({
    id: 'check-hours',
    description:
      'Verifica las horas de soporte contratadas y disponibles para un proyecto en el mes actual. Indica si hay horas disponibles o si el próximo ticket será considerado hora excedente.',
    inputSchema: z.object({
      customerPhone: z
        .string()
        .describe('Número de teléfono del cliente, tal como aparece en [Teléfono del cliente:...] en el contexto. Ejemplo: +5491100000001'),
      projectName: z.string().optional().describe('Nombre parcial del proyecto a consultar. Omitir si el cliente tiene un solo proyecto.'),
    }),
    execute: async (inputData: { customerPhone: string; projectName?: string; context?: { project?: PlaneProjectWithHours } }) => {
      const { customerPhone, projectName } = inputData;

      const status = await hoursService.checkAvailableHoursByPhone(customerPhone, projectName);

      return {
        projectId: status.projectId,
        projectName: status.projectName,
        contractedMinutes: status.contractedMinutes,
        usedMinutes: status.usedMinutes,
        remainingMinutes: status.remainingMinutes,
        isOverage: status.isOverage,
        message: status.isOverage
          ? `⚠️ Las ${status.contractedHoursLabel} de soporte del mes ya fueron utilizadas (usadas: ${status.usedHoursLabel}). El ticket se creará como **hora excedente** y será facturado por separado.`
          : `✅ Tenés ${status.remainingHoursLabel} disponibles de ${status.contractedHoursLabel} mensuales (usado: ${status.usedHoursLabel}).`,
      };
    },
  });
}
