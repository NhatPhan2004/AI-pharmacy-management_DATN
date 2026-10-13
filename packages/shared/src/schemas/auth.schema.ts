import { z } from "zod";

export const LoginSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(50),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token cannot be empty"),
});

export type LoginDto = z.infer<typeof LoginSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
