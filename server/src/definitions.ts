import type { Server } from "nice-grpc";
import { friendcrm } from "@friendcrm/protos";
import { friendcrmImpl } from "./grpc/friendcrm.grpc.ts";

export function addDefinitions(server: Server) {
  server.add(friendcrm.FriendCRMDefinition, friendcrmImpl);
}
