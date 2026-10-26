import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Role } from '../../modules/users/entities/role.entity';
import { User } from '../../modules/users/entities/user.entity';

export async function runInitialSeed(dataSource: DataSource): Promise<void> {
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
      name: 'Dược sĩ bán lẻ',
      description: 'Thực hiện bán lẻ POS và tra cứu kho hàng',
    },
  ];

  for (const r of rolesData) {
    const exists = await roleRepo.findOne({ where: { code: r.code } });
    if (!exists) {
      await roleRepo.save(roleRepo.create(r));
    }
  }

  const targetPassword = '666666';
  const defaultPassword = await bcrypt.hash(targetPassword, 10);

  const sampleUsers = [
    {
      username: 'admin',
      fullName: 'System Administrator',
      roleCode: 'ADMIN',
      phone: '0979797979',
    },
    {
      username: 'manager',
      fullName: 'Quản Lý Cửa Hàng',
      roleCode: 'MANAGER',
      phone: '0868686868',
    },
    {
      username: 'staff',
      fullName: 'Dược Sĩ Bán Hàng',
      roleCode: 'STAFF',
      phone: '0939393939',
    },
  ];

  for (const u of sampleUsers) {
    const role = await roleRepo.findOne({ where: { code: u.roleCode } });
    if (!role) continue;

    const existing = await userRepo.findOne({
      where: { username: u.username },
    });

    if (!existing) {
      await userRepo.save(
        userRepo.create({
          username: u.username,
          password_hash: defaultPassword,
          full_name: u.fullName,
          phone: u.phone,
          role_id: role.id,
          is_active: true,
        }),
      );
      console.log(
        `[SEED] Đã tạo mới tài khoản: ${u.username} (${u.roleCode}) - Mật khẩu: ${targetPassword}`,
      );
    } else {
      existing.password_hash = defaultPassword;
      existing.role_id = role.id;
      existing.full_name = u.fullName;
      existing.phone = u.phone;
      existing.is_active = true;

      await userRepo.save(existing);
      console.log(
        `[SEED] Đã đồng bộ mật khẩu tài khoản: ${u.username} (${u.roleCode}) -> ${targetPassword}`,
      );
    }
  }
}
