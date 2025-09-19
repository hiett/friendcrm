import { friendcrm } from "@friendcrm/protos";
import { StorageDriver } from "./index.ts";
import * as fs from "node:fs/promises";
import { BinaryWriter } from "@bufbuild/protobuf/wire";

export class FSStorageDriver extends StorageDriver {
  private readonly DATA_DIR: string;
  private readonly FRIENDS_DIR: string;
  private readonly ALL_DIRS: string[];

  constructor(pathPrefix: string) {
    super("fs");

    this.DATA_DIR = pathPrefix;
    this.FRIENDS_DIR = `${this.DATA_DIR}/friends`;
    this.ALL_DIRS = [this.DATA_DIR, this.FRIENDS_DIR];
  }

  async init() {
    // Create the data directory if it doesn't exist, and all child paths
    for (const dir of this.ALL_DIRS) {
      const exists = await fs.exists(dir);
      if (exists) {
        continue;
      }

      await fs.mkdir(dir, { recursive: true });
    }
  }

  async close() {}

  async addFriend(friend: friendcrm.Friend) {
    const path = this.friendPath(friend);
    await this.writeFriend(path, friend);
    return friend;
  }

  async updateFriend(friend: friendcrm.Friend) {
    const existingFriend = await this.getFriend(friend.id);
    if (!existingFriend) {
      return null;
    }

    const path = this.friendPath(friend);
    await this.writeFriend(path, friend);
    return friend;
  }

  async getFriend(id: string) {
    const path = this.friendPath(id);
    const exists = await Bun.file(path).exists();
    if (!exists) {
      return null;
    }

    const data = await Bun.file(path).arrayBuffer();
    return friendcrm.Friend.decode(new Uint8Array(data));
  }

  async removeFriend(id: string) {
    const friend = await this.getFriend(id);
    if (!friend) {
      return null;
    }

    const path = this.friendPath(id);
    await fs.unlink(path);
    return friend;
  }

  async listFriends(request: friendcrm.ListFriendsRequest) {
    const friends: friendcrm.Friend[] = [];
    const dirEntries = await fs.readdir(this.FRIENDS_DIR);
    for (const entry of dirEntries) {
      if (!entry.endsWith(".friend")) {
        continue;
      }

      const id = entry.replace(".friend", "");
      const friend = await this.getFriend(id);
      if (!friend) {
        continue;
      }

      if (request.nameFilter) {
        const nameMatch = friend.name
          .toLowerCase()
          .includes(request.nameFilter.toLowerCase());

        if (!nameMatch) {
          continue;
        }
      }

      friends.push(friend);
    }

    return friends;
  }

  private friendPath(id: string | friendcrm.Friend) {
    const resolvedId = typeof id === "string" ? id : id.id;
    return `${this.FRIENDS_DIR}/${resolvedId}.friend`;
  }

  private async writeFriend(path: string, message: friendcrm.Friend) {
    await this.writeProto(path, (writer) => {
      friendcrm.Friend.encode(message, writer);
    });
  }

  private async writeProto(
    path: string,
    writerFunc: (writer: BinaryWriter) => void,
  ) {
    const binaryWriter = new BinaryWriter();
    writerFunc(binaryWriter);
    const bytes = binaryWriter.finish();
    await Bun.write(path, bytes);
  }
}
