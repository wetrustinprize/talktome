require("better-logging")(console);

import net from "node:net";
import fs from "node:fs";
import { program } from "commander";
import { NAME, SOCKET, VERSION } from "../globals";
import { speak } from "./espeak";
import { TalkPackageScheme } from "../package";
import {
	pulseConnect,
	pulseCreate,
	pulseDestroy,
	pulseDisconnect,
} from "./pulse";

program
	.version(VERSION)
	.option("--hear", "Listen to the audio output of the system.");

program.parse();

console.log(`Starting: ${NAME} v${VERSION}...`);

await pulseConnect();
await pulseCreate();

if (fs.existsSync(SOCKET)) {
	console.warn("There was a socket already running, deleting...");
	fs.unlinkSync(SOCKET);
}

console.log("Starting socket...");

let abort: { controller: AbortController; socket: net.Socket } | undefined;

const server = net.createServer((socket) => {
	socket.on("data", async (data) => {
		console.log("Data received...");

		try {
			const pkg = TalkPackageScheme.parse(JSON.parse(data.toString()));

			console.log(`Speaking: ${pkg.message}`);

			if (abort) {
				abort.controller.abort();
				abort.socket.write(JSON.stringify({ type: "aborted" }));
			}

			abort = { controller: new AbortController(), socket };
			const result = await speak(pkg.message, {
				abortSignal: abort.controller.signal,
				hear: !!program.opts().hear,
			});

			if (result.aborted) {
				socket.write(JSON.stringify({ type: "aborted" }));
				socket.write(JSON.stringify({ type: "done" }));
			}
		} catch (e) {
			console.error("Error speaking!");
			console.error(e);

			socket.write(JSON.stringify({ type: "error", error: e }));
		}

		console.log("Done speaking.");
	});
});

server.listen(SOCKET, () => {
	console.log(`Listening on ${SOCKET}`);
});

process.on("SIGINT", () => {
	console.log("Closing socket...");

	pulseDestroy();
	pulseDisconnect();

	server.close();

	if (fs.existsSync(SOCKET)) fs.unlinkSync(SOCKET);

	process.exit();
});
