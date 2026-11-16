import { z } from "zod";

export const loginSchema = z
  .object({
    username: z.string().trim().min(1, "Enter your username").max(200),
    password: z.string().min(1, "Enter your password").max(1000),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
