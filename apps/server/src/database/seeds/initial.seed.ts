import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { Role } from '../../modules/users/entities/role.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Supplier } from '../../modules/suppliers/entities/supplier.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { Product } from '../../modules/products/entities/product.entity';
import { ProductUnit } from '../../modules/products/entities/product-unit.entity';

export async function runInitialSeed(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ==========================================
    // 1. INITIALIZE REPOSITORIES
    // ==========================================

    const roleRepo = queryRunner.manager.getRepository(Role);
    const userRepo = queryRunner.manager.getRepository(User);
    const supplierRepo = queryRunner.manager.getRepository(Supplier);
    const catRepo = queryRunner.manager.getRepository(Category);
    const prodRepo = queryRunner.manager.getRepository(Product);
    const unitRepo = queryRunner.manager.getRepository(ProductUnit);

    console.log('⚡ Bắt đầu quá trình Initial Seed...');

    // ==========================================
    // 2. SEED ROLES
    // ==========================================

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

    for (const roleData of rolesData) {
      const exists = await roleRepo.findOne({
        where: { code: roleData.code },
      });

      if (!exists) {
        await roleRepo.save(roleRepo.create(roleData));
      }
    }

    console.log('✔ Đã hoàn tất danh mục vai trò.');

    // ==========================================
    // 3. SEED SUPPLIERS
    // ==========================================

    const suppliersData = [
      {
        code: 'DHG',
        name: 'Công ty Cổ phần Dược Hậu Giang (DHG Pharma)',
        phone: '02923891433',
        email: 'dhgpharma@dhgpharma.com.vn',
        address: '288 Bis Nguyễn Văn Cừ, Cần Thơ',
        isActive: true,
      },
      {
        code: 'DOMESCO',
        name: 'Công ty Cổ phần Xuất Nhập khẩu Y tế DOMESCO',
        phone: '02773852278',
        email: 'domesco@domesco.com',
        address: 'Số 66, Quốc lộ 30, Đồng Tháp',
        isActive: true,
      },
    ];

    for (const supplierData of suppliersData) {
      const exists = await supplierRepo.findOne({
        where: { code: supplierData.code },
      });

      if (!exists) {
        await supplierRepo.save(supplierRepo.create(supplierData));
      }
    }

    console.log('✔ Đã hoàn tất danh mục nhà cung cấp.');

    // ==========================================
    // 4. SEED CATEGORIES
    // ==========================================

    const categoriesData = [
      {
        name: 'Thuốc Giảm Đau - Hạ Sốt',
        description: 'Các thuốc hạ sốt giảm đau',
      },
      {
        name: 'Thuốc Kháng Sinh',
        description: 'Các nhóm thuốc kháng sinh',
      },
    ];

    const savedCategories: Record<string, Category> = {};

    for (const categoryData of categoriesData) {
      let category = await catRepo.findOne({
        where: { name: categoryData.name },
      });

      if (!category) {
        category = await catRepo.save(
          catRepo.create({
            ...categoryData,
            isActive: true,
          }),
        );
      }

      savedCategories[categoryData.name] = category;
    }

    console.log('✔ Đã hoàn tất danh mục nhóm thuốc.');

    // ==========================================
    // 5. SEED PRODUCTS & PRODUCT UNITS
    // ==========================================

    const productsSeed = [
      {
        sku: 'MED-PARA-500',
        name: 'Paracetamol 500mg Khapharco',
        activeSubstance: 'Paracetamol 500mg',
        category: savedCategories['Thuốc Giảm Đau - Hạ Sốt'],
        safetyStockThreshold: 200,
        units: [
          {
            unitName: 'Viên',
            conversionToBase: 1,
            sellingPrice: 1500,
            isBaseUnit: true,
          },
          {
            unitName: 'Vỉ',
            conversionToBase: 10,
            sellingPrice: 14000,
            isBaseUnit: false,
          },
          {
            unitName: 'Hộp',
            conversionToBase: 100,
            sellingPrice: 130000,
            isBaseUnit: false,
          },
        ],
      },
      {
        sku: 'MED-AMOX-500',
        name: 'Amoxicillin 500mg Domesco',
        activeSubstance: 'Amoxicillin trihydrat 500mg',
        category: savedCategories['Thuốc Kháng Sinh'],
        safetyStockThreshold: 150,
        units: [
          {
            unitName: 'Viên',
            conversionToBase: 1,
            sellingPrice: 3000,
            isBaseUnit: true,
          },
          {
            unitName: 'Vỉ',
            conversionToBase: 10,
            sellingPrice: 28000,
            isBaseUnit: false,
          },
          {
            unitName: 'Hộp',
            conversionToBase: 100,
            sellingPrice: 270000,
            isBaseUnit: false,
          },
        ],
      },
    ];

    for (const item of productsSeed) {
      const existingProduct = await prodRepo.findOne({
        where: { sku: item.sku },
      });

      if (!existingProduct && item.category) {
        const newProduct = prodRepo.create({
          sku: item.sku,
          name: item.name,
          categoryId: item.category.id,
          safetyStockThreshold: item.safetyStockThreshold,
          isActive: true,
        });

        const savedProduct = await queryRunner.manager.save(newProduct);

        for (const u of item.units) {
          const newUnit = unitRepo.create({
            productId: savedProduct.id,
            product: savedProduct,
            unitName: u.unitName,
            conversionToBase: u.conversionToBase,
            sellingPrice: u.sellingPrice,
            isBaseUnit: u.isBaseUnit,
          });
          await queryRunner.manager.save(newUnit);
        }
      }
    }

    console.log('✔ Đã hoàn tất danh mục thuốc và đơn vị tính.');
    // ==========================================
    // 6. SEED DEFAULT USERS
    // ==========================================

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

    for (const userData of sampleUsers) {
      const role = await roleRepo.findOne({
        where: { code: userData.roleCode },
      });

      if (!role) {
        throw new Error(`Không tìm thấy vai trò: ${userData.roleCode}`);
      }

      let user = await userRepo.findOne({
        where: { username: userData.username },
      });

      if (!user) {
        user = userRepo.create({
          username: userData.username,
          password_hash: defaultPassword,
          full_name: userData.fullName,
          phone: userData.phone,
          role_id: role.id,
          is_active: true,
        });

        await queryRunner.manager.save(User, user);

        console.log(
          `[SEED] Đã tạo tài khoản: ${userData.username} (${userData.roleCode})`,
        );
      } else {
        user.password_hash = defaultPassword;
        user.role_id = role.id;
        user.full_name = userData.fullName;
        user.phone = userData.phone;
        user.is_active = true;

        await queryRunner.manager.save(User, user);

        console.log(
          `[SEED] Đã đồng bộ tài khoản: ${userData.username} (${userData.roleCode})`,
        );
      }
    }

    // ==========================================
    // 7. COMMIT TRANSACTION
    // ==========================================

    await queryRunner.commitTransaction();

    console.log('====================================');
    console.log('🎉 INITIAL SEED HOÀN TẤT!');
    console.log('====================================');
    console.log('Tài khoản demo:');
    console.log('ADMIN   : admin / 666666');
    console.log('MANAGER : manager / 666666');
    console.log('STAFF   : staff / 666666');
    console.log('====================================');
  } catch (error) {
    await queryRunner.rollbackTransaction();

    console.error('❌ INITIAL SEED THẤT BẠI:', error);

    throw error;
  } finally {
    await queryRunner.release();
  }
}
