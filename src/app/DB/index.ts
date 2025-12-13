import { UserModel } from "../modules/User/user.model";

const admin = {
  name: "Montasir",
  email: "admin@gmail.com",
  role: "admin",
  password: "123456",
  phoneNumber: "01979053892",
  profileImage:
    "https://res.cloudinary.com/dmzmx97wn/image/upload/v1754835427/IMG-20250331-WA0261.jpg",
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
