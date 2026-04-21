import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const faqs = [
  {
    keywords: ['no funciona', 'caido', 'caida', 'down', 'error', 'no carga', 'caido el sistema'],
    question: '¿Por qué no funciona mi aplicación?',
    answer:
      'Estamos verificando el estado de los servicios. Si hay una interrupción activa, nuestro equipo ya está trabajando en ello. Te mantendremos informado sobre el progreso.',
    category: 'incidentes',
  },
  {
    keywords: ['contraseña', 'password', 'acceso', 'login', 'entrar', 'ingresar', 'no puedo entrar'],
    question: '¿Cómo puedo recuperar mi contraseña?',
    answer:
      'Para recuperar tu contraseña, hacé clic en "Olvidé mi contraseña" en la pantalla de inicio de sesión. Recibirás un email con instrucciones. Si no recibís el email en 5 minutos, revisá tu carpeta de spam.',
    category: 'acceso',
  },
  {
    keywords: ['factura', 'billing', 'pago', 'cobro', 'cargo', 'cuenta', 'facturacion'],
    question: '¿Cómo puedo ver mi facturación?',
    answer:
      'Podés acceder a tu historial de facturas desde el panel de administración en la sección "Facturación". Si tenés problemas con un cobro específico, nuestro equipo financiero puede ayudarte.',
    category: 'facturacion',
  },
  {
    keywords: ['lento', 'tarda', 'demora', 'performance', 'rendimiento', 'velocidad', 'lentitud'],
    question: '¿Por qué la aplicación está lenta?',
    answer:
      'La lentitud puede deberse a alta carga en el servidor, conexión a internet del usuario, o caché desactualizado. Intentá limpiar el caché del navegador. Si el problema persiste, abriremos un ticket para que nuestro equipo investigue.',
    category: 'rendimiento',
  },
  {
    keywords: ['backup', 'respaldo', 'datos', 'recuperar', 'perdi', 'perdí'],
    question: '¿Cómo recupero mis datos?',
    answer:
      'Realizamos backups automáticos diarios. Para recuperar información específica, necesitamos abrir un ticket de soporte indicando qué datos necesitás recuperar y de qué fecha.',
    category: 'datos',
  },
  {
    keywords: ['integracion', 'integración', 'api', 'conectar', 'webhook', 'tercero', 'plugin', 'conectar con'],
    question: '¿Cómo integro un sistema externo?',
    answer:
      'Contamos con una API REST documentada. Para integraciones específicas o personalizadas, nuestro equipo técnico puede asesorarte. Abrí un ticket de soporte y un especialista se pondrá en contacto.',
    category: 'integraciones',
  },
  {
    keywords: ['usuario', 'nuevo usuario', 'agregar usuario', 'invitar', 'alta usuario'],
    question: '¿Cómo agrego un nuevo usuario?',
    answer:
      'Desde el panel de administración, en la sección "Usuarios", podés invitar nuevos miembros con su email. El usuario recibirá un correo para completar su registro.',
    category: 'usuarios',
  },
  {
    keywords: ['horas', 'contrato', 'soporte', 'mantenimiento', 'plan', 'cuantas horas', 'horas disponibles'],
    question: '¿Cuántas horas de soporte me quedan?',
    answer:
      'Podés consultar tus horas de soporte disponibles contactándonos directamente. Si las horas de tu contrato mensual están agotadas, los tickets adicionales se tratarán como horas excedentes y serán facturados por separado.',
    category: 'contrato',
  },
  {
    keywords: ['ticket', 'estado ticket', 'mi ticket', 'consultar ticket', 'ver ticket'],
    question: '¿Cómo consulto el estado de mi ticket?',
    answer:
      'Podés consultar el estado de tu ticket enviando su ID por este mismo canal. Simplemente respondé con el número de ticket y te daré la información actualizada.',
    category: 'tickets',
  },
];

async function main(): Promise<void> {
  console.log('🌱 Iniciando seed...');

  // Limpiar FAQs existentes y recrearlas
  await prisma.faq.deleteMany();
  await prisma.faq.createMany({ data: faqs });

  console.log(`✅ ${faqs.length} FAQs cargadas correctamente.`);
  console.log('🌱 Seed completado.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
