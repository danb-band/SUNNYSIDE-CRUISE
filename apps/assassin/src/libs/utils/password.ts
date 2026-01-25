import bcrypt from "bcryptjs";

const getPepper = (): string => {
  return process.env.DELETE_PW_PEPPER ?? "";
};

const getCost = (): number => {
  const raw = process.env.DELETE_PW_BCRYPT_COST;
  if (!raw) return 10;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 8 && parsed <= 15 ? parsed : 10;
};

export const hashPassword = (plain: string): string => {
  const peppered = `${plain}${getPepper()}`;
  return bcrypt.hashSync(peppered, getCost());
};

export const verifyPassword = (plain: string, hashed: string): boolean => {
  if (!hashed) return false;

  const peppered = `${plain}${getPepper()}`;
  return bcrypt.compareSync(peppered, hashed);
};
