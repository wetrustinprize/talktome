import { PulseAudio } from "pulseaudio.js";
import { execSync } from "node:child_process";

export const pa = new PulseAudio();

export const pulseDisconnect = async () => {
	await pa.disconnect();
};

export const pulseConnect = async () => {
	await pa.connect();

	const info = await pa.getServerInfo();

	console.log(`${info.name}, ${info.version}`);
};

let TTMSpeaker: number;
let TTMMic: number;

export const pulseCreate = async () => {
	try {
		TTMSpeaker = await pa.lookupSink("TTMSpeaker");
	} catch {
		TTMSpeaker = await pa.loadModule("module-null-sink", {
			sink_name: "TTMSpeaker",
			"media.class": "Audio/Sink",
			channel_map: "stereo",
		});
	}

	try {
		TTMMic = await pa.lookupSource("TTMMic");
	} catch {
		TTMMic = await pa.loadModule("module-null-sink", {
			sink_name: "TTMMic",
			"media.class": "Audio/Source/Virtual",
			channel_map: "front-left,front-right",
		});
	}

	try {
		execSync("pw-link TTMSpeaker:monitor_FL TTMMic:input_FL", {
			stdio: "pipe",
		});
	} catch (error: unknown) {
		if (
			error instanceof Error &&
			'stderr' in error &&
			error.stderr instanceof String &&
			!error.stderr.toString().includes("failed to link ports: File exists")
		) {
			throw error;
		}
	}

	try {
		execSync("pw-link TTMSpeaker:monitor_FR TTMMic:input_FR", {
			stdio: "pipe",
		});
	} catch (error: unknown) {
		if (
			error instanceof Error &&
			'stderr' in error &&
			error.stderr instanceof String &&
			!error.stderr.toString().includes("failed to link ports: File exists")
		) {
			throw error;
		}
	}
};

export const pulseDestroy = async () => {
	execSync("pw-link TTMSpeaker:monitor_FL TTMMic:input_FL --disconnect");
	execSync("pw-link TTMSpeaker:monitor_FR TTMMic:input_FR --disconnect");

	await pa.unloadModule(TTMSpeaker);
	await pa.unloadModule(TTMMic);
};
