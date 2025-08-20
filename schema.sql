-- Tabela de escolas (deve ser criada primeiro)
CREATE TABLE IF NOT EXISTS schools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'professor', 'operador')),
    school_id UUID REFERENCES schools(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de alunos
CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    student_id VARCHAR(100),
    school_id UUID REFERENCES schools(id) NOT NULL,
    embedding VECTOR(512),
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de eventos de reconhecimento
CREATE TABLE IF NOT EXISTS recognition_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) NOT NULL,
    school_id UUID REFERENCES schools(id) NOT NULL,
    confidence FLOAT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS desabilitado para permitir acesso livre aos dados
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE recognition_events ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança removidas para facilitar o acesso
-- Todos os usuários podem acessar todos os dados

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados iniciais
-- Primeiro inserir a escola
INSERT INTO schools (name, address) VALUES 
    ('Escola Exemplo', 'Rua das Flores, 123')
ON CONFLICT DO NOTHING;

-- Depois inserir os usuários (alguns vinculados à escola)
DO $$
DECLARE
    escola_id UUID;
BEGIN
    -- Obter o ID da escola
    SELECT id INTO escola_id FROM schools WHERE name = 'Escola Exemplo' LIMIT 1;
    
    -- Inserir usuários
    INSERT INTO users (email, name, role, school_id) VALUES 
        ('admin@escola.com', 'Administrador', 'admin', NULL),
        ('professor@escola.com', 'Professor Teste', 'professor', escola_id),
        ('operador@escola.com', 'Operador Teste', 'operador', escola_id)
    ON CONFLICT (email) DO NOTHING;
END $$;