import { runSql } from '../runSql.js'

export async function up({ sequelize }) {
  await runSql(sequelize, [
    `CREATE TABLE analysis.analyses (
      id uniqueidentifier NOT NULL CONSTRAINT DF_analyses_id DEFAULT NEWSEQUENTIALID(),
      user_id uniqueidentifier NULL,
      subcategory_id int NOT NULL,
      status varchar(10) NOT NULL CONSTRAINT DF_analyses_status DEFAULT 'draft',
      created_at datetime2 NOT NULL CONSTRAINT DF_analyses_created_at DEFAULT SYSUTCDATETIME(),
      updated_at datetime2 NOT NULL CONSTRAINT DF_analyses_updated_at DEFAULT SYSUTCDATETIME(),
      CONSTRAINT PK_analyses PRIMARY KEY (id),
      CONSTRAINT CK_analyses_status CHECK (status IN ('draft', 'saved')),
      CONSTRAINT FK_analyses_user_id FOREIGN KEY (user_id) REFERENCES users.users (id),
      CONSTRAINT FK_analyses_subcategory_id FOREIGN KEY (subcategory_id) REFERENCES catalog.subcategories (id)
    )`,

    `CREATE TABLE analysis.analysis_answers (
      id bigint IDENTITY(1,1) NOT NULL,
      analysis_id uniqueidentifier NOT NULL,
      question_id int NOT NULL,
      option_id int NULL,
      value_number decimal(18,2) NULL,
      value_text nvarchar(500) NULL,
      created_at datetime2 NOT NULL CONSTRAINT DF_analysis_answers_created_at DEFAULT SYSUTCDATETIME(),
      CONSTRAINT PK_analysis_answers PRIMARY KEY (id),
      CONSTRAINT UQ_analysis_answers_analysis_question_option UNIQUE (analysis_id, question_id, option_id),
      CONSTRAINT CK_analysis_answers_value CHECK (
        option_id IS NOT NULL OR value_number IS NOT NULL OR value_text IS NOT NULL
      ),
      CONSTRAINT FK_analysis_answers_analysis_id FOREIGN KEY (analysis_id)
        REFERENCES analysis.analyses (id) ON DELETE CASCADE,
      CONSTRAINT FK_analysis_answers_question_id FOREIGN KEY (question_id) REFERENCES catalog.questions (id),
      CONSTRAINT FK_analysis_answers_option_id FOREIGN KEY (option_id) REFERENCES catalog.question_options (id)
    )`,

    `CREATE INDEX IX_analysis_answers_analysis_id_question_id ON analysis.analysis_answers (analysis_id, question_id)`,
  ])
}

export async function down({ sequelize }) {
  await runSql(sequelize, ['DROP TABLE analysis.analysis_answers', 'DROP TABLE analysis.analyses'])
}
