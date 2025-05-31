const { sequelize, Estudiante, Materia, Inscripcion } = require('./models');

async function setupDatabase() {
  try {
    console.log('🔄 Iniciando configuración de PostgreSQL...');

    // Verificar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');

    // Sincronizar modelos (crear tablas)
    console.log('🔄 Sincronizando modelos...');
    await sequelize.sync({ force: true });
    console.log('✅ Modelos sincronizados correctamente');

    // Crear las vistas
    console.log('🔄 Creando vistas...');
    await createViews();
    console.log('✅ Vistas creadas correctamente');

    // Cargar datos de prueba
    console.log('🔄 Cargando datos de prueba...');
    await loadSampleData();
    console.log('✅ Datos de prueba cargados correctamente');

    console.log('🎉 ¡Configuración completada exitosamente!');
    console.log('📝 Ejecute "npm start" para iniciar la aplicación');
    
  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
    process.exit(1);
  }
}

async function createViews() {
  // Vista principal de inscripciones
  await sequelize.query(`
    CREATE VIEW vista_inscripciones_completa AS
    SELECT 
      i.id as inscripcion_id,
      e.id as estudiante_id,
      e.carne,
      CONCAT(e.nombres, ' ', e.apellidos) as nombre_completo,
      e.email as estudiante_email,
      e.estado as estado_estudiante,
      e.promedio as promedio_estudiante,
      m.id as materia_id,
      m.codigo as codigo_materia,
      m.nombre as nombre_materia,
      m.creditos,
      m.tipo as tipo_materia,
      i."fechaInscripcion",
      i.calificacion,
      i.estado as estado_inscripcion,
      i.observaciones,
      i."createdAt" as fecha_creacion,
      i."updatedAt" as fecha_actualizacion
    FROM inscripciones i
    INNER JOIN estudiantes e ON i."estudianteId" = e.id
    INNER JOIN materias m ON i."materiaId" = m.id
    ORDER BY e.apellidos, e.nombres, m.nombre
  `);

  // Vista de estadísticas por estudiante
  await sequelize.query(`
    CREATE VIEW vista_estadisticas_estudiantes AS
    SELECT 
      e.id,
      e.carne,
      CONCAT(e.nombres, ' ', e.apellidos) as nombre_completo,
      e.estado,
      COUNT(i.id) as total_materias_inscritas,
      COUNT(CASE WHEN i.estado = 'APROBADO' THEN 1 END) as materias_aprobadas,
      COUNT(CASE WHEN i.estado = 'REPROBADO' THEN 1 END) as materias_reprobadas,
      SUM(CASE WHEN i.estado = 'APROBADO' THEN m.creditos ELSE 0 END) as creditos_aprobados,
      AVG(CASE WHEN i.calificacion IS NOT NULL THEN i.calificacion END) as promedio_calculado
    FROM estudiantes e
    LEFT JOIN inscripciones i ON e.id = i."estudianteId"
    LEFT JOIN materias m ON i."materiaId" = m.id
    GROUP BY e.id, e.carne, e.nombres, e.apellidos, e.estado
    ORDER BY e.apellidos, e.nombres
  `);
}

async function loadSampleData() {
  // Cargar estudiantes
  const estudiantes = [
    {
      carne: '201801001',
      nombres: 'María José',
      apellidos: 'García López',
      email: 'maria.garcia@uvg.edu.gt',
      telefono: '50234567',
      fechaNacimiento: '2000-03-15',
      estado: 'ACTIVO',
      promedio: 85.50
    },
    {
      carne: '201801002',
      nombres: 'Carlos Andrés',
      apellidos: 'Rodríguez Pérez',
      email: 'carlos.rodriguez@uvg.edu.gt',
      telefono: '50234568',
      fechaNacimiento: '1999-07-22',
      estado: 'ACTIVO',
      promedio: 78.25
    },
    {
      carne: '201801003',
      nombres: 'Ana Sofía',
      apellidos: 'Martínez Gómez',
      email: 'ana.martinez@uvg.edu.gt',
      telefono: '50234569',
      fechaNacimiento: '2000-11-08',
      estado: 'ACTIVO',
      promedio: 92.75
    },
    {
      carne: '201801004',
      nombres: 'José Luis',
      apellidos: 'Hernández Castro',
      email: 'jose.hernandez@uvg.edu.gt',
      telefono: '50234570',
      fechaNacimiento: '1999-12-03',
      estado: 'ACTIVO',
      promedio: 76.80
    },
    {
      carne: '201801005',
      nombres: 'Lucía Fernanda',
      apellidos: 'Morales Vásquez',
      email: 'lucia.morales@uvg.edu.gt',
      telefono: '50234571',
      fechaNacimiento: '2000-05-18',
      estado: 'ACTIVO',
      promedio: 88.60
    }
  ];

  await Estudiante.bulkCreate(estudiantes);
  console.log('📊 Estudiantes creados:', estudiantes.length);

  // Cargar materias
  const materias = [
    {
      codigo: 'CC1000',
      nombre: 'Introducción a la Programación',
      descripcion: 'Conceptos básicos de programación y algoritmos',
      creditos: 4,
      tipo: 'OBLIGATORIA',
      prerrequisitos: null,
      activa: true
    },
    {
      codigo: 'CC1001',
      nombre: 'Matemática Discreta',
      descripcion: 'Fundamentos matemáticos para ciencias de la computación',
      creditos: 4,
      tipo: 'OBLIGATORIA',
      prerrequisitos: null,
      activa: true
    },
    {
      codigo: 'CC3088',
      nombre: 'Bases de Datos I',
      descripcion: 'Fundamentos de sistemas de bases de datos',
      creditos: 4,
      tipo: 'OBLIGATORIA',
      prerrequisitos: 'CC1000',
      activa: true
    },
    {
      codigo: 'CC4003',
      nombre: 'Inteligencia Artificial',
      descripcion: 'Fundamentos de inteligencia artificial',
      creditos: 3,
      tipo: 'ELECTIVA',
      prerrequisitos: 'CC1000',
      activa: true
    },
    {
      codigo: 'CC4004',
      nombre: 'Desarrollo Web',
      descripcion: 'Tecnologías para desarrollo de aplicaciones web',
      creditos: 3,
      tipo: 'ELECTIVA',
      prerrequisitos: 'CC3088',
      activa: true
    }
  ];

  await Materia.bulkCreate(materias);
  console.log('📚 Materias creadas:', materias.length);

  // Cargar inscripciones
  const inscripciones = [
    { estudianteId: 1, materiaId: 1, fechaInscripcion: '2022-01-15', calificacion: 88.50, estado: 'APROBADO', observaciones: 'Excelente desempeño' },
    { estudianteId: 1, materiaId: 2, fechaInscripcion: '2022-01-15', calificacion: 85.75, estado: 'APROBADO', observaciones: 'Buena comprensión' },
    { estudianteId: 1, materiaId: 3, fechaInscripcion: '2024-01-15', calificacion: null, estado: 'CURSANDO', observaciones: 'En progreso' },
    
    { estudianteId: 2, materiaId: 1, fechaInscripcion: '2022-01-15', calificacion: 75.50, estado: 'APROBADO', observaciones: 'Nivel básico alcanzado' },
    { estudianteId: 2, materiaId: 2, fechaInscripcion: '2022-01-15', calificacion: 78.25, estado: 'APROBADO', observaciones: 'Progreso satisfactorio' },
    { estudianteId: 2, materiaId: 3, fechaInscripcion: '2024-01-15', calificacion: null, estado: 'CURSANDO', observaciones: 'Cursando actualmente' },
    
    { estudianteId: 3, materiaId: 1, fechaInscripcion: '2022-01-15', calificacion: 95.00, estado: 'APROBADO', observaciones: 'Estudiante destacada' },
    { estudianteId: 3, materiaId: 2, fechaInscripcion: '2022-01-15', calificacion: 93.50, estado: 'APROBADO', observaciones: 'Excelente en matemáticas' },
    { estudianteId: 3, materiaId: 3, fechaInscripcion: '2022-08-15', calificacion: 94.75, estado: 'APROBADO', observaciones: 'Sobresaliente' },
    { estudianteId: 3, materiaId: 4, fechaInscripcion: '2024-01-15', calificacion: null, estado: 'CURSANDO', observaciones: 'Curso electivo actual' },
    
    { estudianteId: 4, materiaId: 1, fechaInscripcion: '2022-01-15', calificacion: 72.50, estado: 'APROBADO', observaciones: 'Aprobado con esfuerzo' },
    { estudianteId: 4, materiaId: 2, fechaInscripcion: '2022-01-15', calificacion: 76.75, estado: 'APROBADO', observaciones: 'Mejora gradual' },
    
    { estudianteId: 5, materiaId: 1, fechaInscripcion: '2022-01-15', calificacion: 90.00, estado: 'APROBADO', observaciones: 'Excelente estudiante' },
    { estudianteId: 5, materiaId: 2, fechaInscripcion: '2022-01-15', calificacion: 88.75, estado: 'APROBADO', observaciones: 'Muy buena base' },
    { estudianteId: 5, materiaId: 3, fechaInscripcion: '2022-08-15', calificacion: 91.50, estado: 'APROBADO', observaciones: 'Destaca en BD' },
    { estudianteId: 5, materiaId: 5, fechaInscripcion: '2024-01-15', calificacion: null, estado: 'CURSANDO', observaciones: 'Desarrollo web actual' }
  ];

  await Inscripcion.bulkCreate(inscripciones);
  console.log('📋 Inscripciones creadas:', inscripciones.length);
}

// Ejecutar setup si es llamado directamente
if (require.main === module) {
  setupDatabase().finally(() => {
    sequelize.close();
  });
}

module.exports = { setupDatabase };