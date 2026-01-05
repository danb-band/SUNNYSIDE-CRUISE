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

const looksLikeBcryptHash = (value: string): boolean => {
  try {
    bcrypt.getRounds(value);
    return true;
  } catch {
    return false;
  }
};

export const hashDeletePw = (plain: string): string => {
  if (looksLikeBcryptHash(plain)) return plain;
  const peppered = `${plain}${getPepper()}`;
  return bcrypt.hashSync(peppered, getCost());
};

export const verifyDeletePw = (plain: string, stored: string): boolean => {
  if (!stored) return false;

  const peppered = `${plain}${getPepper()}`;

  if (!looksLikeBcryptHash(stored)) {
    return plain === stored;
  }

  return bcrypt.compareSync(peppered, stored);
};
