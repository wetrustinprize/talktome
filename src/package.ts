import z from "zod";

export const TalkPackageScheme = z.object({
	message: z.string().nonempty(),
});

export type TalkPackage = z.infer<typeof TalkPackageScheme>;
