/**
 * Clasificador de tickets por intención, tipo y subtipo.
 * Basado en el catálogo definido en "Tipos y subtipos.md".
 */

export interface TicketClassification {
  intencion: 'problema' | 'consulta' | 'cambio';
  tipo: string;
  subtipo: string;
  confianza: number;
  requiereRevisionHumana: boolean;
}

interface ClassificationRule {
  intencion: 'problema' | 'consulta' | 'cambio';
  tipo: string;
  subtipo: string;
  keywords: string[];
}

const RULES: ClassificationRule[] = [
  // ── ACCESO ──────────────────────────────────────────────────────
  {
    intencion: 'problema', tipo: 'acceso', subtipo: 'problema_contrasena',
    keywords: ['contraseña', 'contrasena', 'password', 'clave', 'olvide', 'restablecer', 'reset password'],
  },
  {
    intencion: 'problema', tipo: 'acceso', subtipo: 'usuario_bloqueado_o_inexistente',
    keywords: ['bloqueado', 'bloqueada', 'inexistente', 'no existe el usuario', 'cuenta bloqueada'],
  },
  {
    intencion: 'problema', tipo: 'acceso', subtipo: 'permisos_insuficientes',
    keywords: ['permiso', 'permisos', 'no tengo acceso', 'sin acceso', 'no puedo ver', 'no me deja'],
  },
  {
    intencion: 'problema', tipo: 'acceso', subtipo: 'no_puedo_ingresar',
    keywords: ['no puedo entrar', 'no puedo ingresar', 'no me deja entrar', 'no inicia sesion', 'no carga el login', 'pantalla de login'],
  },
  {
    intencion: 'problema', tipo: 'acceso', subtipo: 'visibilidad_incorrecta',
    keywords: ['no veo', 'no aparece', 'no muestra el menu', 'falta opcion', 'no encuentro la seccion'],
  },

  // ── OPERACION SISTEMA ────────────────────────────────────────────
  {
    intencion: 'problema', tipo: 'operacion_sistema', subtipo: 'no_funciona',
    keywords: ['no funciona', 'roto', 'falla', 'error', 'no responde', 'caido', 'no anda'],
  },
  {
    intencion: 'problema', tipo: 'operacion_sistema', subtipo: 'no_guarda_o_no_procesa',
    keywords: ['no guarda', 'no graba', 'no procesa', 'no se registra', 'no confirma', 'no completa'],
  },
  {
    intencion: 'problema', tipo: 'operacion_sistema', subtipo: 'no_muestra_correctamente',
    keywords: ['pantalla en blanco', 'blanco', 'no carga', 'se congela', 'cuelga', 'no abre'],
  },
  {
    intencion: 'problema', tipo: 'operacion_sistema', subtipo: 'flujo_incorrecto',
    keywords: ['flujo incorrecto', 'paso mal', 'orden incorrecto', 'no fluye', 'proceso roto'],
  },
  {
    intencion: 'problema', tipo: 'operacion_sistema', subtipo: 'reporte_o_exportacion',
    keywords: ['exportar', 'exportacion', 'descargar', 'excel', 'pdf', 'reporte no genera', 'no puedo exportar'],
  },

  // ── DATOS ────────────────────────────────────────────────────────
  {
    intencion: 'problema', tipo: 'datos', subtipo: 'datos_incorrectos',
    keywords: ['dato incorrecto', 'datos incorrectos', 'mal dato', 'informacion erronea', 'numero mal', 'precio incorrecto'],
  },
  {
    intencion: 'problema', tipo: 'datos', subtipo: 'datos_faltantes',
    keywords: ['falta dato', 'faltan datos', 'dato faltante', 'no aparecen los datos', 'campos vacios'],
  },
  {
    intencion: 'problema', tipo: 'datos', subtipo: 'datos_duplicados',
    keywords: ['duplicado', 'duplicados', 'dos veces', 'repetido', 'se duplico'],
  },
  {
    intencion: 'problema', tipo: 'datos', subtipo: 'datos_desactualizados',
    keywords: ['no actualiza', 'desactualizado', 'no refleja', 'sigue mostrando', 'no se actualizo'],
  },
  {
    intencion: 'problema', tipo: 'datos', subtipo: 'importacion_exportacion_datos',
    keywords: ['importar', 'importacion', 'carga masiva', 'subir archivo', 'no importa'],
  },

  // ── INTEGRACIONES ────────────────────────────────────────────────
  {
    intencion: 'problema', tipo: 'integraciones', subtipo: 'integracion_caida',
    keywords: ['integracion caida', 'integracion no funciona', 'api caida', 'servicio externo'],
  },
  {
    intencion: 'problema', tipo: 'integraciones', subtipo: 'no_sincroniza',
    keywords: ['no sincroniza', 'no sincronizo', 'no se sincroniza', 'sync', 'sincronizacion'],
  },
  {
    intencion: 'problema', tipo: 'integraciones', subtipo: 'error_autenticacion',
    keywords: ['token expirado', 'credenciales incorrectas', 'no autorizado', '401', '403', 'certificado', 'afip'],
  },
  {
    intencion: 'problema', tipo: 'integraciones', subtipo: 'mensajes_o_envios_no_salen',
    keywords: ['no llegan mensajes', 'no se envian', 'whatsapp no funciona', 'email no llega', 'notificacion no llega'],
  },
  {
    intencion: 'problema', tipo: 'integraciones', subtipo: 'error_sistema_externo',
    keywords: ['sistema externo', 'erp', 'sistema tercero', 'proveedor', 'portal externo'],
  },

  // ── LENTITUD / CAIDA ─────────────────────────────────────────────
  {
    intencion: 'problema', tipo: 'lentitud_caida', subtipo: 'sistema_caido',
    keywords: ['sistema caido', 'no disponible', 'down', 'no entra nadie', 'todos tienen el problema'],
  },
  {
    intencion: 'problema', tipo: 'lentitud_caida', subtipo: 'lentitud',
    keywords: ['lento', 'tarda mucho', 'demora', 'muy lento', 'tarda demasiado'],
  },
  {
    intencion: 'problema', tipo: 'lentitud_caida', subtipo: 'intermitencia',
    keywords: ['intermitente', 'a veces funciona', 'a veces no', 'aleatorio', 'esporadico'],
  },
  {
    intencion: 'problema', tipo: 'lentitud_caida', subtipo: 'timeout',
    keywords: ['timeout', 'tiempo de espera', 'se desconecta solo', 'pierde conexion'],
  },
  {
    intencion: 'problema', tipo: 'lentitud_caida', subtipo: 'ambiente_no_disponible',
    keywords: ['ambiente de prueba', 'testing', 'staging', 'qa', 'entorno no disponible'],
  },

  // ── CONSULTA FUNCIONAL ───────────────────────────────────────────
  {
    intencion: 'consulta', tipo: 'consulta_funcional', subtipo: 'como_hacer',
    keywords: ['como hago', 'como se hace', 'como puedo', 'como uso', 'como configuro'],
  },
  {
    intencion: 'consulta', tipo: 'consulta_funcional', subtipo: 'duda_funcional',
    keywords: ['donde esta', 'no entiendo', 'me explican', 'que significa', 'para que sirve'],
  },
  {
    intencion: 'consulta', tipo: 'consulta_funcional', subtipo: 'configuracion',
    keywords: ['configurar', 'configuracion', 'parametro', 'ajuste', 'setting'],
  },
  {
    intencion: 'consulta', tipo: 'consulta_funcional', subtipo: 'seguimiento_estado',
    keywords: ['estado del ticket', 'como va', 'en que estado', 'hay novedades', 'cuando lo resuelven'],
  },
  {
    intencion: 'consulta', tipo: 'consulta_funcional', subtipo: 'asistencia_operativa',
    keywords: ['ayuda con', 'asistencia', 'acompañamiento', 'guiar', 'capacitar'],
  },

  // ── MEJORA ───────────────────────────────────────────────────────
  {
    intencion: 'cambio', tipo: 'mejora', subtipo: 'nuevo_campo_o_dato',
    keywords: ['agregar campo', 'nuevo campo', 'agregar dato', 'nuevo dato', 'falta un campo'],
  },
  {
    intencion: 'cambio', tipo: 'mejora', subtipo: 'cambio_regla_o_validacion',
    keywords: ['cambiar regla', 'modificar validacion', 'cambiar logica', 'nueva validacion'],
  },
  {
    intencion: 'cambio', tipo: 'mejora', subtipo: 'nuevo_reporte_o_exportacion',
    keywords: ['nuevo reporte', 'nueva exportacion', 'quiero un excel', 'agregar columna', 'nuevo informe'],
  },
  {
    intencion: 'cambio', tipo: 'mejora', subtipo: 'ajuste_visual_o_pantalla',
    keywords: ['cambiar pantalla', 'mover boton', 'ajuste visual', 'cambiar texto', 'cambiar orden'],
  },
  {
    intencion: 'cambio', tipo: 'mejora', subtipo: 'nueva_funcionalidad',
    keywords: ['nueva funcionalidad', 'quiero que pueda', 'agregar opcion', 'nueva feature', 'desarrollo'],
  },
];

const FALLBACK: TicketClassification = {
  intencion: 'problema',
  tipo: 'operacion_sistema',
  subtipo: 'no_funciona',
  confianza: 0.3,
  requiereRevisionHumana: true,
};

/**
 * Clasifica un texto libre en intención, tipo y subtipo.
 * Retorna la clasificación con mayor score o el fallback si no hay match suficiente.
 */
export function classifyTicket(text: string): TicketClassification {
  const textLower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let best: { rule: ClassificationRule; score: number } | null = null;

  for (const rule of RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      const kwNorm = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (textLower.includes(kwNorm)) {
        // Keywords más largas (frases) valen más
        score += kwNorm.split(' ').length;
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { rule, score };
    }
  }

  if (!best || best.score < 1) return FALLBACK;

  // Normalizar confianza: score máximo posible ~8, mapeamos a 0.5-0.99
  const confianza = Math.min(0.99, 0.5 + best.score * 0.06);
  const requiereRevisionHumana = confianza < 0.6;

  return {
    intencion: best.rule.intencion,
    tipo: best.rule.tipo,
    subtipo: best.rule.subtipo,
    confianza: Math.round(confianza * 100) / 100,
    requiereRevisionHumana,
  };
}
