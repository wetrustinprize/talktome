import util from "util";
import { execSync, spawn } from "child_process";


interface SpeakOptions {
	abortSignal?: AbortSignal;
};

export const speak = (message: string, options: SpeakOptions = {}): Promise<void> => new Promise((resolve, reject) => {
	execSync(`espeak -w /tmp/talktome.wav --voices=pt-br ${message}`);
	const child = spawn("paplay", ['/tmp/talktome.wav', '--device=TTMSpeaker'], { signal: options.abortSignal });

	child.on("error", reject);
	child.on("close", resolve);
});