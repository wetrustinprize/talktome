import { SOCKET, VERSION } from "../globals";
import { program } from "commander";
import net from "node:net";
import fs from "node:fs";
import { TalkPackageScheme } from "../package";

require("better-logging")(console);

if (!fs.existsSync(SOCKET)) {
	console.error("There is no socket avaliable, please start the deamon first.");
	process.exit(1);
}

program
	.version(VERSION)
	.argument("<message>", "The message to send to be talked.");

program.parse();

const message = program.args[0];

console.log("Connecting to socket...");

const client = net.createConnection(SOCKET, () => {
	console.log("Connected to socket.");
	console.log("Sending message...");

	try {
		const pkg = TalkPackageScheme.parse({
			message,
		});

		client.write(JSON.stringify(pkg));
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
});

client.on("data", (data) => {
	client.end();
});

client.on("error", (err) => {
	console.error(err.message);
	client.end();
	process.exit(1);
});

process.on("SIGINT", () => {
	client.end();
	process.exit();
});
