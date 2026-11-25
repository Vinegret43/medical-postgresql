import pg from 'pg';
import { DataTypes, Sequelize } from 'sequelize';
import { databaseUrl } from './config.js';

export const sequelize = new Sequelize(databaseUrl, {
	dialect: 'postgres',
	logging: false,
	define: { timestamps: false, freezeTableName: true }
});

export const AuthUser = sequelize.define(
	'AuthUser',
	{
		id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
		role: { type: DataTypes.STRING(20), allowNull: false },
		subjectId: { type: DataTypes.STRING(30), allowNull: false, field: 'subject_id' },
		credential: { type: DataTypes.TEXT, allowNull: false }
	},
	{ tableName: 'auth_users' }
);

export const Session = sequelize.define(
	'Session',
	{
		token: { type: DataTypes.STRING(64), primaryKey: true },
		userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' }
	},
	{ tableName: 'sessions' }
);

Session.belongsTo(AuthUser, { foreignKey: 'userId', targetKey: 'id' });

/** For calling the stored procedures/functions in create_db.sql later. */
export const pool = new pg.Pool({ connectionString: databaseUrl });
