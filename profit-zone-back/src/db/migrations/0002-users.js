import { runSql } from '../runSql.js'

export async function up({ sequelize }) {
  await runSql(sequelize, [
    `CREATE TABLE users.roles (
      id int IDENTITY(1,1) NOT NULL,
      name varchar(50) NOT NULL,
      description nvarchar(200) NULL,
      created_at datetime2 NOT NULL CONSTRAINT DF_roles_created_at DEFAULT SYSUTCDATETIME(),
      CONSTRAINT PK_roles PRIMARY KEY (id),
      CONSTRAINT UQ_roles_name UNIQUE (name)
    )`,

    `CREATE TABLE users.users (
      id uniqueidentifier NOT NULL,
      email nvarchar(320) NOT NULL,
      password_hash varchar(255) NOT NULL,
      first_name nvarchar(100) NOT NULL,
      last_name nvarchar(100) NOT NULL,
      role_id int NOT NULL,
      is_active bit NOT NULL CONSTRAINT DF_users_is_active DEFAULT 1,
      last_login_at datetime2 NULL,
      created_at datetime2 NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSUTCDATETIME(),
      updated_at datetime2 NOT NULL CONSTRAINT DF_users_updated_at DEFAULT SYSUTCDATETIME(),
      CONSTRAINT PK_users PRIMARY KEY (id),
      CONSTRAINT UQ_users_email UNIQUE (email),
      CONSTRAINT FK_users_role_id FOREIGN KEY (role_id) REFERENCES users.roles (id)
    )`,

    `CREATE TABLE users.auth_tokens (
      id uniqueidentifier NOT NULL CONSTRAINT DF_auth_tokens_id DEFAULT NEWSEQUENTIALID(),
      user_id uniqueidentifier NOT NULL,
      type varchar(20) NOT NULL,
      token_hash char(64) NOT NULL,
      expires_at datetime2 NOT NULL,
      used_at datetime2 NULL,
      revoked_at datetime2 NULL,
      created_at datetime2 NOT NULL CONSTRAINT DF_auth_tokens_created_at DEFAULT SYSUTCDATETIME(),
      CONSTRAINT PK_auth_tokens PRIMARY KEY (id),
      CONSTRAINT UQ_auth_tokens_token_hash UNIQUE (token_hash),
      CONSTRAINT CK_auth_tokens_type CHECK (type IN ('refresh', 'reset_password', 'verify_email')),
      CONSTRAINT FK_auth_tokens_user_id FOREIGN KEY (user_id) REFERENCES users.users (id) ON DELETE CASCADE
    )`,

    `CREATE INDEX IX_auth_tokens_user_id_type ON users.auth_tokens (user_id, type)`,
  ])
}

export async function down({ sequelize }) {
  await runSql(sequelize, [
    'DROP TABLE users.auth_tokens',
    'DROP TABLE users.users',
    'DROP TABLE users.roles',
  ])
}
