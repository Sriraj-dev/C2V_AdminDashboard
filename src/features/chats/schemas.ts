import { z } from "zod";

export const replySchema = z.object({ text: z.string().trim().min(1).max(4096) }).strict();
export type ReplyInput = z.infer<typeof replySchema>;

export const customerIdSchema = z.uuid();
