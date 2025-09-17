import { friendcrm } from "@friendcrm/protos";
import { type Channel, createChannel, createClient } from "nice-grpc";

let channel: Channel | null = null;

export function createChannelsAndClients(address: string) {
  channel = createChannel(address);
}

function createFriendClient(channel: Channel) {
  return createClient(friendcrm.FriendCRMDefinition, channel);
}

let friendClient: ReturnType<typeof createFriendClient> | null = null;

export function getFriendClient() {
  if (!channel) {
    throw new Error(
      "Channel not created. Call createChannelsAndClients first.",
    );
  }

  friendClient ??= createFriendClient(channel);
  return friendClient;
}
