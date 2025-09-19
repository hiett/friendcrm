import { program } from "commander";
import { createEditorSession, printFriendToString } from "./editor.ts";
import type { friendcrm } from "@friendcrm/protos";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import "./commands";
import { getConfig, isJsonDefault } from "./config.ts";
import { createChannelsAndClients, getFriendClient } from "./client.ts";

dayjs.extend(relativeTime);

program
  .name("friendcrm")
  .description("manage who you know from the comfort of your shell")
  .version("1.0.0");

program
  .command("add")
  .description("Add a new friend")
  .argument("[name]", "Name of the friend to add")
  .action(async (name: string) => {
    const friend = await getFriendClient().addFriend({
      name,
    });

    // Open the editor session in case they want to add more
    const updatedFriend = await createEditorSession(friend);
    const resultant = await getFriendClient().updateFriend(updatedFriend);

    console.log(`Added ${resultant.name}`);
  });

export async function friendSelector(
  friends: friendcrm.Friend[],
): Promise<friendcrm.Friend> {
  if (friends.length === 0) {
    throw new Error("No friends found");
  }

  if (friends.length === 1) {
    return friends[0]!;
  }

  // Interactive selection in the CLI
  console.log("Multiple friends found, please select one:");
  friends.forEach((friend, index) => {
    console.log(`${index + 1}. ${friend.name} (known: ${friend.knowsBecause})`);
  });

  const choice = prompt("Enter the number of the friend:");
  const index = parseInt(choice || "", 10) - 1;

  if (isNaN(index) || index < 0 || index >= friends.length) {
    throw new Error("Invalid selection");
  }

  return friends[index]!;
}

async function findFriend(criteria: string): Promise<friendcrm.Friend | null> {
  const items = await getFriendClient().listFriends({
    nameFilter: criteria,
  });

  if (items.friends.length === 0) {
    return null;
  }

  if (items.friends.length === 1) {
    return items.friends[0]!;
  }

  return await friendSelector(items.friends);
}

program
  .command("update")
  .aliases(["edit"])
  .description("Update a friend")
  .argument("<name>", "Name of the friend to update")
  .option("--json", "Use JSON format in the editor", await isJsonDefault())
  .action(async (name: string, options: { json: boolean }) => {
    const selected = await findFriend(name);
    if (!selected) {
      console.log("nothing found :(");
      return;
    }

    const updatedFriend = await createEditorSession(
      selected,
      options.json ? "json" : "yaml",
    );
    const resultant = await getFriendClient().updateFriend(updatedFriend);

    console.log(`Updated ${resultant.name}`);
  });

program
  .command("remove")
  .aliases(["delete"])
  .description("Remove a friend")
  .argument("<name>", "Name of the friend to remove")
  .action(async (name: string) => {
    const selected = await findFriend(name);
    if (!selected) {
      console.log("nothing found :(");
      return;
    }

    const confirm = prompt(
      `Are you sure you want to remove ${selected.name}? (y/N) `,
    );
    if (confirm?.toLowerCase() !== "y") {
      console.log("Aborted.");
      return;
    }

    await getFriendClient().removeFriend({ id: selected.id! });
    console.log(`Removed ${selected.name}`);
  });

program
  .command("find")
  .aliases(["get", "search"])
  .description("Finds a friend based on string criteria")
  .argument("<criteria>", "Criteria to search for")
  .option("--json", "Output as JSON", await isJsonDefault())
  .action(async (criteria: string, options: { json: boolean }) => {
    const selected = await findFriend(criteria);
    if (!selected) {
      console.log("nothing found :(");
      return;
    }

    console.log(printFriendToString(selected, options.json ? "json" : "yaml"));
  });

program
  .command("list")
  .description("List all friends")
  .option("--json", "Output as JSON", await isJsonDefault())
  .action(async (options: { json: boolean }) => {
    const items = await getFriendClient().listFriends({});

    if (options.json) {
      console.log(
        JSON.stringify(
          items.friends.map((f) => JSON.parse(printFriendToString(f, "json"))),
        ),
      );
      return;
    }

    console.log(
      items.friends.map((f) => printFriendToString(f, "yaml")).join("\n---\n"),
    );
  });

export * from "./config.ts";

export async function runProgram(clientPort?: number) {
  const config = await getConfig();
  createChannelsAndClients(
    clientPort ? `localhost:${clientPort}` : config.serverAddress,
  );
  await program.parseAsync();
}
