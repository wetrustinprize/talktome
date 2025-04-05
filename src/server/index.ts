require('better-logging')(console);

import net from 'net';
import fs from 'fs';

import { NAME, SOCKET, VERSION } from "../globals";
import { speak } from './espeak';
import { TalkPackageScheme } from '../package';
import { pulseConnect, pulseCreate, pulseDestroy, pulseDisconnect } from './pulse';

console.log(`Starting: ${NAME} v${VERSION}...`)

await pulseConnect();
await pulseCreate();

if(fs.existsSync(SOCKET)) {
	console.warn(`There was a socket already running, deleting...`);
	fs.unlinkSync(SOCKET);
}

console.log("Starting socket...");

let abortController: AbortController = new AbortController();

const server = net.createServer(socket => {
	socket.on("data", async (data) => {
		console.log("Data received...");

		try {
			const pkg = TalkPackageScheme.parse(JSON.parse(data.toString()));

			console.log(`Speaking: ${pkg.message}`);

			abortController.abort();

			await speak(pkg.message);

			console.log("Done speaking, closing connection...");
			socket.end();
		} catch(e) {
			console.error("Error speaking!");
			console.error(e);
			socket.end();
		}
	});
});

server.listen(SOCKET, () => {
	console.log(`Listening on ${SOCKET}`)
});

process.on("SIGINT", () => {
	console.log("Closing socket...");

	pulseDestroy();
	pulseDisconnect();

	server.close();

	if(fs.existsSync(SOCKET))
		fs.unlinkSync(SOCKET);

	process.exit();
});
