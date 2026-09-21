import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';
import * as crypto from 'crypto';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { SYSTEM_ADMIN_ROLE_NAME } from '../../common/enum/role/permissions.enum';
import { syncAdminRolePermissions } from './sync-permissions.seed';

interface AdminCredentials {
  username: string;
  passwordToUse: string;
  mustChangePassword: boolean;
}

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000000';

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function promptAdminCredentials(): Promise<AdminCredentials> {
  console.info('\n--- Configuração do Usuário Administrador ---');

  const inputUsername = await askQuestion(
    'Digite o username do admin (Deixe vazio para usar "admin"): ',
  );
  const username = inputUsername !== '' ? inputUsername : 'admin';

  const inputPassword = await askQuestion(
    'Digite a senha do admin (deixe vazio para gerar automaticamente): ',
  );

  if (inputPassword === '') {
    const passwordToUse = crypto.randomBytes(6).toString('hex');
    return { username, passwordToUse, mustChangePassword: true };
  }

  return { username, passwordToUse: inputPassword, mustChangePassword: false };
}

async function ensureAdminUser(
  userRepository: Repository<User>,
  adminRole: Role,
  credentials: AdminCredentials,
): Promise<void> {
  let adminUser = await userRepository.findOne({
    where: { username: credentials.username, tenantId: DEFAULT_TENANT_ID },
    relations: { roles: true },
  });

  if (!adminUser) {
    console.info(`\nCriando o usuário admin: '${credentials.username}'...`);
    const hashedPassword = await bcrypt.hash(credentials.passwordToUse, 10);

    adminUser = userRepository.create({
      username: credentials.username,
      password: hashedPassword,
      tenantId: DEFAULT_TENANT_ID,
      mustChangePassword: credentials.mustChangePassword,
      roles: [adminRole],
    });

    await userRepository.save(adminUser);

    console.info(`\n--------------------------------------------------`);
    console.info(`✅ Usuário '${credentials.username}' criado com sucesso!`);
    if (credentials.mustChangePassword) {
      console.info(`🔑 SENHA TEMPORÁRIA GERADA: ${credentials.passwordToUse}`);
      console.info(`⚠️ O usuário precisará alterar a senha no primeiro login.`);
    } else {
      console.info(`🔑 Senha definida manualmente.`);
    }
    console.info(`--------------------------------------------------\n`);
  } else {
    const hasRole = adminUser.roles?.some(
      (role: Role) => role.id === adminRole.id,
    );
    if (!hasRole) {
      adminUser.roles = [...(adminUser.roles || []), adminRole];
      await userRepository.save(adminUser);
      console.info(
        `Role '${SYSTEM_ADMIN_ROLE_NAME}' reassociada ao usuário '${credentials.username}'.`,
      );
    } else {
      console.info(
        `Usuário '${credentials.username}' já existe e possui a role correta.`,
      );
    }
  }
}

export async function runCreateAdminSeed(
  dataSource: DataSource,
): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const roleRepository = dataSource.getRepository(Role);

  console.info(
    '🌱 Iniciando o processo de criação/configuração de administrador...',
  );

  const adminRole = await syncAdminRolePermissions(roleRepository);

  const credentials = await promptAdminCredentials();

  await ensureAdminUser(userRepository, adminRole, credentials);

  console.info('✨ Processo concluído com sucesso!');
}
