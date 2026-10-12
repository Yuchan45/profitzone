import { runSql } from '../runSql.js'

export async function up({ sequelize }) {
  await runSql(sequelize, [
    `CREATE TABLE catalog.categories (
      id int IDENTITY(1,1) NOT NULL,
      code varchar(50) NOT NULL,
      name nvarchar(100) NOT NULL,
      description nvarchar(300) NULL,
      sort_order int NOT NULL CONSTRAINT DF_categories_sort_order DEFAULT 0,
      is_active bit NOT NULL CONSTRAINT DF_categories_is_active DEFAULT 1,
      created_at datetime2 NOT NULL CONSTRAINT DF_categories_created_at DEFAULT SYSUTCDATETIME(),
      updated_at datetime2 NOT NULL CONSTRAINT DF_categories_updated_at DEFAULT SYSUTCDATETIME(),
      CONSTRAINT PK_categories PRIMARY KEY (id),
      CONSTRAINT UQ_categories_code UNIQUE (code)
    )`,

    `CREATE TABLE catalog.subcategories (
      id int IDENTITY(1,1) NOT NULL,
      category_id int NOT NULL,
      code varchar(50) NOT NULL,
      name nvarchar(100) NOT NULL,
      description nvarchar(300) NULL,
      sort_order int NOT NULL CONSTRAINT DF_subcategories_sort_order DEFAULT 0,
      is_active bit NOT NULL CONSTRAINT DF_subcategories_is_active DEFAULT 1,
      created_at datetime2 NOT NULL CONSTRAINT DF_subcategories_created_at DEFAULT SYSUTCDATETIME(),
      updated_at datetime2 NOT NULL CONSTRAINT DF_subcategories_updated_at DEFAULT SYSUTCDATETIME(),
      CONSTRAINT PK_subcategories PRIMARY KEY (id),
      CONSTRAINT UQ_subcategories_category_id_code UNIQUE (category_id, code),
      CONSTRAINT FK_subcategories_category_id FOREIGN KEY (category_id) REFERENCES catalog.categories (id)
    )`,

    `CREATE TABLE catalog.subcategory_search_terms (
      id int IDENTITY(1,1) NOT NULL,
      subcategory_id int NOT NULL,
      term_type varchar(10) NOT NULL,
      term_value varchar(100) NOT NULL,
      is_primary bit NOT NULL CONSTRAINT DF_subcategory_search_terms_is_primary DEFAULT 0,
      CONSTRAINT PK_subcategory_search_terms PRIMARY KEY (id),
      CONSTRAINT UQ_subcategory_search_terms_subcategory_type_value UNIQUE (subcategory_id, term_type, term_value),
      CONSTRAINT CK_subcategory_search_terms_term_type CHECK (term_type IN ('type', 'keyword')),
      CONSTRAINT FK_subcategory_search_terms_subcategory_id FOREIGN KEY (subcategory_id)
        REFERENCES catalog.subcategories (id) ON DELETE CASCADE
    )`,

    `CREATE TABLE catalog.questions (
      id int IDENTITY(1,1) NOT NULL,
      code varchar(60) NOT NULL,
      prompt nvarchar(200) NOT NULL,
      help_text nvarchar(300) NULL,
      input_type varchar(20) NOT NULL,
      is_active bit NOT NULL CONSTRAINT DF_questions_is_active DEFAULT 1,
      created_at datetime2 NOT NULL CONSTRAINT DF_questions_created_at DEFAULT SYSUTCDATETIME(),
      updated_at datetime2 NOT NULL CONSTRAINT DF_questions_updated_at DEFAULT SYSUTCDATETIME(),
      CONSTRAINT PK_questions PRIMARY KEY (id),
      CONSTRAINT UQ_questions_code UNIQUE (code),
      CONSTRAINT CK_questions_input_type CHECK (input_type IN ('single_choice', 'multi_choice'))
    )`,

    `CREATE TABLE catalog.question_options (
      id int IDENTITY(1,1) NOT NULL,
      question_id int NOT NULL,
      code varchar(60) NOT NULL,
      label nvarchar(150) NOT NULL,
      value_min decimal(18,2) NULL,
      value_max decimal(18,2) NULL,
      is_unknown bit NOT NULL CONSTRAINT DF_question_options_is_unknown DEFAULT 0,
      metadata nvarchar(max) NULL,
      sort_order int NOT NULL CONSTRAINT DF_question_options_sort_order DEFAULT 0,
      is_active bit NOT NULL CONSTRAINT DF_question_options_is_active DEFAULT 1,
      CONSTRAINT PK_question_options PRIMARY KEY (id),
      CONSTRAINT UQ_question_options_question_id_code UNIQUE (question_id, code),
      CONSTRAINT CK_question_options_metadata CHECK (metadata IS NULL OR ISJSON(metadata) = 1),
      CONSTRAINT FK_question_options_question_id FOREIGN KEY (question_id)
        REFERENCES catalog.questions (id) ON DELETE CASCADE
    )`,

    `CREATE TABLE catalog.question_assignments (
      id int IDENTITY(1,1) NOT NULL,
      question_id int NOT NULL,
      scope varchar(12) NOT NULL,
      category_id int NULL,
      subcategory_id int NULL,
      section varchar(10) NOT NULL,
      is_required bit NOT NULL CONSTRAINT DF_question_assignments_is_required DEFAULT 1,
      sort_order int NOT NULL CONSTRAINT DF_question_assignments_sort_order DEFAULT 0,
      is_active bit NOT NULL CONSTRAINT DF_question_assignments_is_active DEFAULT 1,
      CONSTRAINT PK_question_assignments PRIMARY KEY (id),
      CONSTRAINT UQ_question_assignments_question_scope UNIQUE (question_id, scope, category_id, subcategory_id),
      CONSTRAINT CK_question_assignments_section CHECK (section IN ('business', 'details')),
      CONSTRAINT CK_question_assignments_scope CHECK (
        (scope = 'global' AND category_id IS NULL AND subcategory_id IS NULL)
        OR (scope = 'category' AND category_id IS NOT NULL AND subcategory_id IS NULL)
        OR (scope = 'subcategory' AND category_id IS NULL AND subcategory_id IS NOT NULL)
      ),
      CONSTRAINT FK_question_assignments_question_id FOREIGN KEY (question_id)
        REFERENCES catalog.questions (id) ON DELETE CASCADE,
      CONSTRAINT FK_question_assignments_category_id FOREIGN KEY (category_id) REFERENCES catalog.categories (id),
      CONSTRAINT FK_question_assignments_subcategory_id FOREIGN KEY (subcategory_id)
        REFERENCES catalog.subcategories (id)
    )`,

    `CREATE TABLE catalog.implicit_rules (
      id int IDENTITY(1,1) NOT NULL,
      code varchar(60) NOT NULL,
      option_id int NOT NULL,
      feature_type varchar(30) NOT NULL,
      effect varchar(20) NOT NULL,
      message_template nvarchar(300) NOT NULL,
      is_active bit NOT NULL CONSTRAINT DF_implicit_rules_is_active DEFAULT 1,
      CONSTRAINT PK_implicit_rules PRIMARY KEY (id),
      CONSTRAINT UQ_implicit_rules_code UNIQUE (code),
      CONSTRAINT CK_implicit_rules_effect CHECK (effect IN ('card', 'conclusion', 'both')),
      CONSTRAINT FK_implicit_rules_option_id FOREIGN KEY (option_id) REFERENCES catalog.question_options (id)
    )`,
  ])
}

export async function down({ sequelize }) {
  await runSql(sequelize, [
    'DROP TABLE catalog.implicit_rules',
    'DROP TABLE catalog.question_assignments',
    'DROP TABLE catalog.question_options',
    'DROP TABLE catalog.questions',
    'DROP TABLE catalog.subcategory_search_terms',
    'DROP TABLE catalog.subcategories',
    'DROP TABLE catalog.categories',
  ])
}
