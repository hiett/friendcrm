import { createServer } from "nice-grpc";
import { addDefinitions } from "./definitions.ts";
import { setDriver } from "./storage/loader.ts";
import { FSStorageDriver } from "./storage/driver/fs.ts";

await setDriver(new FSStorageDriver("./data"));

const server = createServer();
addDefinitions(server);

const port = await server.listen("0.0.0.0:50051");

console.log(`gRPC server running on ${port}`);
