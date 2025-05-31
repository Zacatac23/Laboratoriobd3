const { sequelize, DataTypes, EstadoEstudiante, TipoMateria } = require('../config/database');

// Modelo Estudiante
const Estudiante = sequelize.define('Estudiante', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  carne: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [5, 10]
    }
  },
  nombres: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  apellidos: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  telefono: {
    type: DataTypes.STRING(15),
    validate: {
      isNumeric: true
    }
  },
  fechaNacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true,
      isBefore: new Date().toISOString()
    }
  },
  estado: {
    type: EstadoEstudiante,
    defaultValue: 'ACTIVO'
  },
  promedio: {
    type: DataTypes.DECIMAL(4, 2),
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100
    }
  }
}, {
  tableName: 'estudiantes',
  timestamps: true
});

// Modelo Materia
const Materia = sequelize.define('Materia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 10]
    }
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 150]
    }
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  creditos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10
    }
  },
  tipo: {
    type: TipoMateria,
    defaultValue: 'OBLIGATORIA'
  },
  prerrequisitos: {
    type: DataTypes.STRING(200)
  },
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'materias',
  timestamps: true
});

// Modelo Inscripcion (tabla intermedia)
const Inscripcion = sequelize.define('Inscripcion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  estudianteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Estudiante,
      key: 'id'
    }
  },
  materiaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Materia,
      key: 'id'
    }
  },
  fechaInscripcion: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  calificacion: {
    type: DataTypes.DECIMAL(4, 2),
    validate: {
      min: 0,
      max: 100
    }
  },
  estado: {
    type: DataTypes.ENUM('INSCRITO', 'CURSANDO', 'APROBADO', 'REPROBADO', 'RETIRADO'),
    defaultValue: 'INSCRITO'
  },
  observaciones: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'inscripciones',
  timestamps: true,
  indexes: [
    { 
      unique: true, 
      fields: ['estudianteId', 'materiaId'],
      name: 'unique_estudiante_materia'
    }
  ]
});

// Definir relaciones
Estudiante.belongsToMany(Materia, {
  through: Inscripcion,
  foreignKey: 'estudianteId',
  otherKey: 'materiaId',
  as: 'materias'
});

Materia.belongsToMany(Estudiante, {
  through: Inscripcion,
  foreignKey: 'materiaId',
  otherKey: 'estudianteId',
  as: 'estudiantes'
});

Estudiante.hasMany(Inscripcion, { foreignKey: 'estudianteId', as: 'inscripciones' });
Materia.hasMany(Inscripcion, { foreignKey: 'materiaId', as: 'inscripciones' });
Inscripcion.belongsTo(Estudiante, { foreignKey: 'estudianteId', as: 'estudiante' });
Inscripcion.belongsTo(Materia, { foreignKey: 'materiaId', as: 'materia' });

module.exports = {
  sequelize,
  Estudiante,
  Materia,
  Inscripcion
};