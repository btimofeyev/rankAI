import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  const rounds = 10;
  return await bcrypt.hash(password, rounds);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
