import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../modules/users/entities/role.entity';
import { User } from '../../modules/users/entities/user.entity';

export async function runInitialSeed(dataSource: DataSource) {
  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);

  const rolesData = [
    {
      code: 'ADMIN',
      name: 'Quản trị viên',
      description: 'Toàn quyền cấu hình và quản trị hệ thống',
    },
    {
      code: 'MANAGER',
      name: 'Quản lý cửa hàng',
      description: 'Theo dõi báo cáo, duyệt ROP, xem DSS từ AI',
    },
    {
      code: 'STAFF',
      name: 'Dược sĩ / Nhân viên',
      description: 'Thực hiện bán lẻ POS và tra cứu kho hàng',
    },
  ];

  for (const r of rolesData) {
    const exists = await roleRepo.findOne({ where: { code: r.code } });
    if (!exists) {
      await roleRepo.save(roleRepo.create(r));
    }
  }

  const adminRole = await roleRepo.findOne({ where: { code: 'ADMIN' } });
  if (adminRole) {
    const existingAdmin = await userRepo.findOne({
      where: { username: 'admin' },
    });
    if (!existingAdmin) {
      const password_hash = await bcrypt.hash('Admin@123456', 10);
      await userRepo.save(
        userRepo.create({
          username: 'admin',
          password_hash,
          full_name: 'System Administrator',
          phone: '0901234567',
          role_id: adminRole.id,
          is_active: true,
        }),
      );
      console.log('Seeded Admin account: admin / Admin@123456');
    }
  }
}
