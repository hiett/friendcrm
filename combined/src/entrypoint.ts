import { createServer } from "nice-grpc";
import { addDefinitions, FSStorageDriver, setDriver } from "@friendcrm/server";
import { getConfig, runProgram } from "@friendcrm/cli";

const config = await getConfig();
setDriver(new FSStorageDriver(config.combinedDataPath ?? "./data"));
const server = createServer();
addDefinitions(server);

const port = await server.listen("localhost:0");

await runProgram(port);
await server.shutdown();
