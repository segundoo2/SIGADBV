import { Repository } from 'typeorm';
import { Role } from '../../modules/roles/entities/role.entity';
import {
  ALL_PERMISSIONS,
  SYSTEM_ADMIN_ROLE_NAME,
} from '../../common/enum/role/permissions.enum';

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000000';

export async function syncAdminRolePermissions(
  roleRepository: Repository<Role>,
): Promise<Role> {
  let adminRole = await roleRepository.findOne({
    where: { name: SYSTEM_ADMIN_ROLE_NAME, tenantId: DEFAULT_TENANT_ID },
  });

  if (!adminRole) {
    console.info(
      `Criando a role '${SYSTEM_ADMIN_ROLE_NAME}' com todas as permissões atuais...`,
    );
    adminRole = roleRepository.create({
      name: SYSTEM_ADMIN_ROLE_NAME,
      tenantId: DEFAULT_TENANT_ID,
      permissions: ALL_PERMISSIONS,
    });
    await roleRepository.save(adminRole);
    console.info(`Role '${SYSTEM_ADMIN_ROLE_NAME}' criada com sucesso.`);
  } else {
    console.info(
      `Role '${SYSTEM_ADMIN_ROLE_NAME}' encontrada. Atualizando o array de permissões...`,
    );
    adminRole.permissions = ALL_PERMISSIONS;
    await roleRepository.save(adminRole);
    console.info(
      `Permissões da role '${SYSTEM_ADMIN_ROLE_NAME}' sincronizadas com sucesso.`,
    );
  }

  return adminRole;
}
