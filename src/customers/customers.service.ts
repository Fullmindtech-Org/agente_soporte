import { Injectable, Logger } from '@nestjs/common';
import { PlaneService } from '../integrations/plane/plane.service';
import { PlaneCustomer, PlaneProjectWithHours } from '../integrations/plane/dto/plane-ticket.dto';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private readonly plane: PlaneService) {}

  /**
   * Valida que el cliente exista buscando su teléfono en la descripción de los proyectos.
   * El proyecto debe tener en su descripción:
   *   - "Cliente: NombreEmpresa"
   *   - "Teléfono: +549XXXXXXXXXX"
   *   - "Plan Horas de Soporte: Xhs"
   *
   * Como fallback acepta también email o ID de customer nativo de Plane.
   * Retorna un PlaneCustomer virtual donde id = projectId del proyecto de soporte.
   */
  async validateCustomer(identifier: string): Promise<PlaneCustomer | null> {
    // 1. Buscar proyecto cuya descripción tenga el teléfono
    const project = await this.plane.findProjectByPhone(identifier);

    if (project) {
      const clientName = this.plane.parseClientNameFromDescription(project.description);
      const phone = this.plane.parsePhoneFromDescription(project.description);
      this.logger.log(`Cliente validado por teléfono en proyecto "${project.name}": ${clientName}`);
      return {
        id: project.id, // el projectId ES el identificador del cliente en este modelo
        name: clientName,
        website_url: phone ?? identifier,
        email: undefined,
        contract_status: 'active',
      };
    }

    // 2. Fallback: buscar en customers nativos de Plane (por email o ID)
    const customer = await this.plane.findCustomer(identifier);
    if (!customer) {
      this.logger.log(`Cliente no encontrado: ${identifier}`);
      return null;
    }
    const status = (customer.contract_status ?? '').toLowerCase();
    if (status && status !== 'active') {
      this.logger.log(`Cliente con contrato inactivo (${status}): ${customer.id}`);
      return null;
    }
    return customer;
  }

  /**
   * Retorna los proyectos de soporte del cliente.
   * Con el nuevo modelo, customerId = projectId, así que retorna directamente ese proyecto.
   * Si el ID corresponde a un customer nativo de Plane, usa el flujo legacy.
   */
  async getActiveProjects(customerId: string): Promise<PlaneProjectWithHours[]> {
    // Intento directo: customerId es un projectId válido (nuevo modelo)
    const project = await this.plane.getProjectWithHours(customerId);
    if (project) return [project];

    // Fallback legacy: customerId es un customer nativo de Plane
    return this.plane.getCustomerProjectsWithHours(customerId);
  }

  /**
   * Busca un proyecto del cliente por ID o nombre (búsqueda parcial).
   */
  async findProjectByNameOrId(
    customerId: string,
    query: string,
  ): Promise<PlaneProjectWithHours | null> {
    const projects = await this.getActiveProjects(customerId);
    return (
      projects.find(
        (p) =>
          p.id === query ||
          p.name.toLowerCase().includes(query.toLowerCase()),
      ) ?? null
    );
  }
}
