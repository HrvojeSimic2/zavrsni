import { z } from "zod";

export const guideApplicationCreateSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(1).max(40),
  location: z.string().trim().min(1).max(120),
  languages: z.string().trim().min(1).max(200),
  experience: z.string().trim().min(1).max(2000),
  tourIdeas: z.string().trim().min(1).max(4000),
  agreedToTerms: z.literal(true),
  locale: z.string().trim().min(2).max(10).optional(),
});

export type GuideApplicationCreateInput = z.infer<
  typeof guideApplicationCreateSchema
>;

