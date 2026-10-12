import { runSql } from '../runSql.js'

export async function up({ sequelize }) {
  await runSql(sequelize, [
    `ALTER TABLE census_data.census_radios ADD
      edad_0_14 int NOT NULL CONSTRAINT DF_census_radios_edad_0_14 DEFAULT 0,
      edad_15_34 int NOT NULL CONSTRAINT DF_census_radios_edad_15_34 DEFAULT 0,
      edad_35_59 int NOT NULL CONSTRAINT DF_census_radios_edad_35_59 DEFAULT 0,
      edad_60_mas int NOT NULL CONSTRAINT DF_census_radios_edad_60_mas DEFAULT 0,
      mujeres int NOT NULL CONSTRAINT DF_census_radios_mujeres DEFAULT 0,
      varones int NOT NULL CONSTRAINT DF_census_radios_varones DEFAULT 0`,
  ])
}

export async function down({ sequelize }) {
  await runSql(sequelize, [
    `ALTER TABLE census_data.census_radios DROP CONSTRAINT
      DF_census_radios_edad_0_14,
      DF_census_radios_edad_15_34,
      DF_census_radios_edad_35_59,
      DF_census_radios_edad_60_mas,
      DF_census_radios_mujeres,
      DF_census_radios_varones`,
    `ALTER TABLE census_data.census_radios DROP COLUMN
      edad_0_14,
      edad_15_34,
      edad_35_59,
      edad_60_mas,
      mujeres,
      varones`,
  ])
}

