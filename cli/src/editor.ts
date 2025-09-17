import { friendcrm } from "@friendcrm/protos";
import { dump } from "js-yaml";

type PrintFormat = "yaml" | "json";

export function printFriendToString(
  friend: friendcrm.Friend,
  format: PrintFormat = "yaml",
): string {
  switch (format) {
    case "json":
      return JSON.stringify(friend, null, 2);

    case "yaml":
    default:
      return dump(JSON.parse(JSON.stringify(friend)));
  }
}

export function printStringToFriend(
  data: string,
  format: PrintFormat = "yaml",
): friendcrm.Friend {
  switch (format) {
    case "json":
      return friendcrm.Friend.fromJSON(JSON.parse(data));

    case "yaml":
    default:
      const asJson = Bun.YAML.parse(data);
      return friendcrm.Friend.fromJSON(asJson);
  }
}

export async function createEditorSession(
  friend: friendcrm.Friend,
  format: PrintFormat = "yaml",
): Promise<friendcrm.Friend> {
  const initialContent = printFriendToString(friend, format);

  // Write to a temp file on the system that this user can access
  const tmpFile = `/tmp/friend-${friend.id}.${format}`;
  await Bun.write(tmpFile, initialContent);

  const editor = Bun.spawnSync({
    cmd: [process.env.EDITOR || "nano", tmpFile], // process.env.EDITOR || "nano"
    stdout: "inherit",
    stdin: "inherit",
    stderr: "inherit",
  });

  if (editor.exitCode !== 0) {
    await Bun.file(tmpFile).delete();
    throw new Error(`Editor exited with code ${editor.exitCode}`);
  }

  const updatedContent = await Bun.file(tmpFile).text();
  await Bun.file(tmpFile).delete();

  return printStringToFriend(updatedContent, format);
}
