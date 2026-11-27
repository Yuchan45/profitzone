import { runSql } from '../runSql.js'

// Modelo de créditos: cada usuario tiene créditos gratis (3 al registrarse, para análisis
// básicos) y créditos pagos (se compran en packs, para análisis completos). Los movimientos
// quedan en billing.credit_transactions y las compras en billing.orders. Cada análisis guarda
// su nivel (basic | complete) y qué crédito se gastó, para no cobrar de nuevo al reabrirlo y
// poder devolver el crédito si el reporte no se pudo generar.
export async function up({ sequelize }) {
  await runSql(sequelize, [
    'CREATE SCHEMA [billing]',

    `ALTER TABLE users.users ADD
      free_credits int NOT NULL CONSTRAINT DF_users_free_credits DEFAULT 0,
      paid_credits int NOT NULL CONSTRAINT DF_users_paid_credits DEFAULT 0,
      free_credits_granted_at datetime2 NULL`,
    'ALTER TABLE users.users ADD CONSTRAINT CK_users_free_credits CHECK (free_credits >= 0)',
    'ALTER TABLE users.users ADD CONSTRAINT CK_users_paid_credits CHECK (paid_credits >= 0)',
    // Las cuentas que ya existían reciben el regalo de bienvenida (3 créditos gratis)
    `UPDATE users.users SET free_credits = 3, free_credits_granted_at = SYSUTCDATETIME()
      WHERE free_credits_granted_at IS NULL`,

    `CREATE TABLE billing.orders (
      id uniqueidentifier NOT NULL CONSTRAINT DF_orders_id DEFAULT NEWSEQUENTIALID(),
      user_id uniqueidentifier NOT NULL,
      pack_code varchar(20) NOT NULL,
      credits int NOT NULL,
      amount_usd decimal(10,2) NOT NULL,
      amount_ars decimal(14,2) NOT NULL,
      usd_ars_rate decimal(12,4) NOT NULL,
      provider varchar(20) NOT NULL,
      provider_ref nvarchar(120) NULL,
      provider_payment_id nvarchar(120) NULL,
      status varchar(12) NOT NULL CONSTRAINT DF_orders_status DEFAULT 'pending',
      paid_at datetime2 NULL,
      created_at datetime2 NOT NULL CONSTRAINT DF_orders_created_at DEFAULT SYSUTCDATETIME(),
      updated_at datetime2 NOT NULL CONSTRAINT DF_orders_updated_at DEFAULT SYSUTCDATETIME(),
      CONSTRAINT PK_orders PRIMARY KEY (id),
      CONSTRAINT CK_orders_status CHECK (status IN ('pending', 'paid', 'failed')),
      CONSTRAINT FK_orders_user_id FOREIGN KEY (user_id) REFERENCES users.users (id) ON DELETE CASCADE
    )`,
    'CREATE INDEX IX_orders_user_id_created_at ON billing.orders (user_id, created_at)',

    // Libro de movimientos: amount > 0 ingresa créditos, amount < 0 los gasta
    `CREATE TABLE billing.credit_transactions (
      id bigint IDENTITY(1,1) NOT NULL,
      user_id uniqueidentifier NOT NULL,
      kind varchar(4) NOT NULL,
      amount int NOT NULL,
      reason varchar(20) NOT NULL,
      analysis_id uniqueidentifier NULL,
      order_id uniqueidentifier NULL,
      created_at datetime2 NOT NULL CONSTRAINT DF_credit_transactions_created_at DEFAULT SYSUTCDATETIME(),
      CONSTRAINT PK_credit_transactions PRIMARY KEY (id),
      CONSTRAINT CK_credit_transactions_kind CHECK (kind IN ('free', 'paid')),
      CONSTRAINT CK_credit_transactions_reason CHECK (reason IN ('signup', 'purchase', 'analysis', 'upgrade', 'refund')),
      CONSTRAINT FK_credit_transactions_user_id FOREIGN KEY (user_id) REFERENCES users.users (id) ON DELETE CASCADE
    )`,
    'CREATE INDEX IX_credit_transactions_user_id_created_at ON billing.credit_transactions (user_id, created_at)',

    `ALTER TABLE analysis.analyses ADD
      tier varchar(10) NULL,
      charged_credit varchar(4) NULL,
      charged_at datetime2 NULL,
      upgraded_at datetime2 NULL,
      report_generated_at datetime2 NULL`,
    "ALTER TABLE analysis.analyses ADD CONSTRAINT CK_analyses_tier CHECK (tier IN ('basic', 'complete'))",
    "ALTER TABLE analysis.analyses ADD CONSTRAINT CK_analyses_charged_credit CHECK (charged_credit IN ('free', 'paid'))",
    // Los reportes guardados antes de los créditos quedan como básicos y ya generados
    `UPDATE analysis.analyses SET tier = 'basic', report_generated_at = updated_at
      WHERE status = 'saved' AND tier IS NULL`,
  ])
}

export async function down({ sequelize }) {
  await runSql(sequelize, [
    'ALTER TABLE analysis.analyses DROP CONSTRAINT CK_analyses_charged_credit',
    'ALTER TABLE analysis.analyses DROP CONSTRAINT CK_analyses_tier',
    'ALTER TABLE analysis.analyses DROP COLUMN tier, charged_credit, charged_at, upgraded_at, report_generated_at',
    'DROP TABLE billing.credit_transactions',
    'DROP TABLE billing.orders',
    'ALTER TABLE users.users DROP CONSTRAINT CK_users_paid_credits',
    'ALTER TABLE users.users DROP CONSTRAINT CK_users_free_credits',
    'ALTER TABLE users.users DROP CONSTRAINT DF_users_paid_credits',
    'ALTER TABLE users.users DROP CONSTRAINT DF_users_free_credits',
    'ALTER TABLE users.users DROP COLUMN free_credits, paid_credits, free_credits_granted_at',
    'DROP SCHEMA [billing]',
  ])
}
