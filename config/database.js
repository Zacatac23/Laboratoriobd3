const { Sequelize, DataTypes } = require('sequelize');

// ⚠️ CAMBIAR POR TUS CREDENCIALES DE POSTGRESQL
const sequelize = new Sequelize('laboratorio3', 'postgres', '1999', {
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',
  logging: console.log
});

const EstadoEstudiante = DataTypes.ENUM('ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'GRADUADO');
const TipoMateria = DataTypes.ENUM('OBLIGATORIA', 'ELECTIVA', 'PRACTICA', 'TEORIA');

module.exports = { sequelize, DataTypes, EstadoEstudiante, TipoMateria };