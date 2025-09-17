import { Command, program } from "commander";
import { friendSelector } from "../index.ts";
import { getFriendClient } from "../client.ts";

const addFactCommand = new Command("add")
  .description("Add a fact to a friend")
  .argument("<name>", "Name of the friend")
  .argument("<fact>", "Fact about the friend")
  .action(async (name: string, fact: string) => {
    const { friends } = await getFriendClient().listFriends({
      nameFilter: name,
    });
    const friend = await friendSelector(friends);
    if (!friend) {
      console.log("No matching friend found.");
      return;
    }

    friend.facts.push(fact);
    const updated = await getFriendClient().updateFriend(friend);
    console.log(`Added fact to ${updated.name}: ${fact}`);
  });

program
  .command("facts")
  .addCommand(addFactCommand)
  .aliases(["fact"])
  .description("List facts about your friends")
  .argument("<name>", "Name of the friend")
  .option("-l, --lower", "Lowercase the facts for grep", false)
  .action(async (name: string, options: { lower: boolean }) => {
    const { friends } = await getFriendClient().listFriends({
      nameFilter: name,
    });
    const friend = await friendSelector(friends);
    if (!friend) {
      console.log("No matching friend found.");
      return;
    }

    if (friend.facts.length === 0) {
      console.log(`No facts found for ${friend.name}.`);
      return;
    }

    console.log(`Facts about ${friend.name}:`);
    friend.facts.forEach((fact) => {
      console.log(`- ${options.lower ? fact.toLowerCase() : fact}`);
    });
  });
