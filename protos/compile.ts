import {$} from "bun";
import path from "node:path";
import {fileURLToPath} from "node:url";
import fs from "node:fs/promises";

const protocGenTsProtoPath = path.join(fileURLToPath(import.meta.resolve("ts-proto")), "../../../", "protoc-gen-ts_proto");

await $`
  grpc_tools_node_protoc \
  --plugin=protoc-gen-ts_proto=${protocGenTsProtoPath} \
  --ts_proto_out=./src/proto \
  --ts_proto_opt=outputServices=nice-grpc,outputServices=generic-definitions,useExactTypes=false,outputIndex=true \
  --proto_path=./ \
  ./friendcrm.proto
`;