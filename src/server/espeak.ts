import { execSync, exec, spawn } from "node:child_process";

interface SpeakOptions {
	abortSignal?: AbortSignal;
	hear?: boolean;
}

export const speak = (
	message: string,
	options: SpeakOptions = {},
): Promise<{ aborted: boolean }> =>
	new Promise((resolve, reject) => {
		execSync(`espeak -w /tmp/talktome.wav -v pt-br "${message}"`);
		const child = spawn(
			"paplay",
			["/tmp/talktome.wav", "--device=TTMSpeaker"],
			{ signal: options.abortSignal },
		);

		if (options.hear) exec("paplay /tmp/talktome.wav");

		child.on("error", (e) => {
			console.error(e.message);

			if (e.message.includes("The operation was aborted."))
				return resolve({ aborted: true });
			reject(e);
		});
		child.on("close", () => resolve({ aborted: false }));
	});
