import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
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

function getAdminCredentialsFromEnv(): AdminCredentials {
  const username = process.env.ADMIN_USERNAME || 'admin.super';
  const envPassword = process.env.ADMIN_PASSWORD;

  if (!envPassword || envPassword.trim() === '') {
    const passwordToUse = crypto.randomBytes(6).toString('hex');
    console.info(
      'ℹ️ Nenhuma senha de admin informada via ambiente. Senha temporária gerada automaticamente.',
    );
    return { username, passwordToUse, mustChangePassword: true };
  }

  return { username, passwordToUse: envPassword, mustChangePassword: false };
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
    console.info(
      `\nCriando o usuário admin automatizado: '${credentials.username}'...`,
    );
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
      console.info(`🔑 Senha definida via variável de ambiente.`);
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
    '🌱 Iniciando o processo automatizado de criação/configuração de administrador...',
  );

  const adminRole = await syncAdminRolePermissions(roleRepository);

  const credentials = getAdminCredentialsFromEnv();

  await ensureAdminUser(userRepository, adminRole, credentials);

  console.info('✨ Processo concluído com sucesso!');
}
