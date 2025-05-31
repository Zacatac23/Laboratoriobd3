const express = require('express');
const { sequelize, Estudiante, Materia, Inscripcion } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Ruta principal con vista combinada
app.get('/', async (req, res) => {
  try {
    // Usar las vistas para obtener datos combinados
    const [inscripciones] = await sequelize.query(`
      SELECT * FROM vista_inscripciones_completa 
      ORDER BY nombre_completo, nombre_materia
      LIMIT 20
    `);

    const [estadisticas] = await sequelize.query(`
      SELECT * FROM vista_estadisticas_estudiantes
      ORDER BY nombre_completo
    `);

    // Renderizar usando EJS
    res.render('index', { 
      inscripciones,
      estadisticas,
      title: 'Dashboard - Sistema Académico'
    });

  } catch (error) {
    console.error('Error en página principal:', error);
    res.render('error', { 
      error: 'Error al cargar los datos: ' + error.message,
      title: 'Error'
    });
  }
});

// Lista de estudiantes
app.get('/estudiantes', async (req, res) => {
  try {
    const estudiantes = await Estudiante.findAll({
      include: [{
        model: Inscripcion,
        as: 'inscripciones',
        include: [{
          model: Materia,
          as: 'materia'
        }]
      }],
      order: [['apellidos', 'ASC'], ['nombres', 'ASC']]
    });

    res.render('estudiantes/index', { 
      estudiantes,
      title: 'Lista de Estudiantes'
    });
  } catch (error) {
    console.error('Error listando estudiantes:', error);
    res.render('error', { 
      error: 'Error al cargar estudiantes: ' + error.message,
      title: 'Error'
    });
  }
});

// Formulario nuevo estudiante
app.get('/estudiantes/nuevo', async (req, res) => {
  try {
    const materias = await Materia.findAll({
      where: { activa: true },
      order: [['codigo', 'ASC']]
    });

    res.render('estudiantes/form', { 
      estudiante: null, 
      materias,
      title: 'Nuevo Estudiante'
    });
  } catch (error) {
    console.error('Error cargando formulario:', error);
    res.render('error', { 
      error: 'Error al cargar formulario: ' + error.message,
      title: 'Error'
    });
  }
});

// Crear estudiante con inscripciones
app.post('/estudiantes', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // Crear estudiante
    const estudiante = await Estudiante.create({
      carne: req.body.carne,
      nombres: req.body.nombres,
      apellidos: req.body.apellidos,
      email: req.body.email,
      telefono: req.body.telefono,
      fechaNacimiento: req.body.fechaNacimiento,
      estado: req.body.estado || 'ACTIVO',
      promedio: req.body.promedio || 0.00
    }, { transaction });

    // Crear inscripciones si se seleccionaron materias
    if (req.body.materias && Array.isArray(req.body.materias)) {
      const inscripciones = req.body.materias.map(materiaId => ({
        estudianteId: estudiante.id,
        materiaId: parseInt(materiaId),
        fechaInscripcion: new Date(),
        estado: 'INSCRITO'
      }));

      await Inscripcion.bulkCreate(inscripciones, { transaction });
    }

    await transaction.commit();
    res.redirect('/estudiantes');

  } catch (error) {
    await transaction.rollback();
    console.error('Error creando estudiante:', error);
    
    const materias = await Materia.findAll({
      where: { activa: true },
      order: [['codigo', 'ASC']]
    });

    res.render('estudiantes/form', {
      estudiante: req.body,
      materias,
      title: 'Nuevo Estudiante',
      error: 'Error al crear estudiante: ' + error.message
    });
  }
});

// Ver detalle de estudiante
app.get('/estudiantes/:id', async (req, res) => {
  try {
    const estudiante = await Estudiante.findByPk(req.params.id, {
      include: [{
        model: Inscripcion,
        as: 'inscripciones',
        include: [{
          model: Materia,
          as: 'materia'
        }]
      }]
    });

    if (!estudiante) {
      return res.render('error', { 
        error: 'Estudiante no encontrado',
        title: 'Error'
      });
    }

    res.render('estudiantes/show', { 
      estudiante,
      title: 'Detalle de ' + estudiante.nombres
    });
  } catch (error) {
    console.error('Error cargando estudiante:', error);
    res.render('error', { 
      error: 'Error al cargar estudiante: ' + error.message,
      title: 'Error'
    });
  }
});

// Inicializar servidor
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida');
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
      console.log('📱 Accede desde tu navegador para ver el sistema');
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    console.log('💡 Sugerencia: Verifica tu configuración de PostgreSQL en config/database.js');
  }
}

startServer();