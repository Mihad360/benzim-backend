import { UserModel } from "../modules/User/user.model";

const admin = {
  name: "Montasir",
  email: "admin@gmail.com",
  role: "admin",
  password: "123456",
  phoneNumber: "01979053892",
  profileImage:
    "https://i.ibb.co/MHpMRvT/c9c023a7-7a94-4101-b73e-c4b5bea09c38-enhanced.png",
  isVerified: true,
};

const seedSuperAdmin = async () => {
  const isSuperAdminExist = await UserModel.findOne({
    email: admin.email,
  });
  if (!isSuperAdminExist) {
    await UserModel.create(admin);
  }
};

export default seedSuperAdmin;
