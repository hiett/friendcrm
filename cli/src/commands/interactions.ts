import { Command, program } from "commander";
import { friendSelector } from "../index.ts";
import dayjs from "dayjs";
import { friendcrm } from "@friendcrm/protos";
import { getFriendClient } from "../client.ts";

const addInteractionCommand = new Command("add")
  .description("Add an interaction to a friend")
  .argument("<name>", "Name of the friend")
  .argument("<title>", "Title of interaction (e.g., call, message, meet)")
  .argument("[description]", "Description of the interaction", "")
  .argument(
    "[date]",
    "Date of interaction in YYYY-MM-DD format (defaults today)",
    "",
  )
  .option("-t, --tags <tags...>", "Tags associated with the interaction")
  .action(
    async (
      name: string,
      title: string,
      description: string,
      date: string,
      options: { tags?: string[] },
    ) => {
      const { friends } = await getFriendClient().listFriends({
        nameFilter: name,
      });
      const friend = await friendSelector(friends);
      if (!friend) {
        console.log("No matching friend found.");
        return;
      }

      const interactionDate = date ? dayjs(date, "YYYY-MM-DD", true) : dayjs();
      if (!interactionDate.isValid()) {
        console.log("Invalid date format. Please use YYYY-MM-DD.");
        return;
      }

      const interaction = friendcrm.FriendInteraction.create({
        title,
        description,
        date: interactionDate.toDate(),
        tags: options.tags || [],
      });

      friend.interactions.push(interaction);
      await getFriendClient().updateFriend(friend);

      console.log(`Added interaction to ${friend.name}`);
    },
  );

const reconnectCommand = new Command("reconnect")
  .description("List friends to reconnect with")
  .argument("[months]", "Number of months since last interaction", "6")
  .option("-d, --days <days>", "Number of days since last interaction", "0") // If used, overrides months
  .action(async (months: string, options: { days: string }) => {
    let days;
    if (options.days !== "0") {
      days = parseInt(options.days);
    } else {
      days = parseInt(months) * 30;
    }

    const result = await getFriendClient().reconnectSoon({
      minDaysSinceLastInteraction: days,
    });

    if (result.suggestions.length === 0) {
      console.log("No friends to reconnect with.");
    }

    result.suggestions.forEach((suggestion) => {
      console.log(
        `- ${suggestion.friend!.name}: Last interaction was ${dayjs().subtract(suggestion.daysSinceLastInteraction, "days").fromNow()} (${dayjs()
          .subtract(suggestion.daysSinceLastInteraction, "days")
          .format("YYYY-MM-DD")})`,
      );
    });
  });

// Also bind reconnect to global
program.addCommand(reconnectCommand);

program
  .command("interactions")
  .aliases(["interaction"])
  .addCommand(addInteractionCommand)
  .addCommand(reconnectCommand)
  .description("List interactions with a friend")
  .argument("<name>", "Name of the friend")
  .action(async (name: string) => {
    const { friends } = await getFriendClient().listFriends({
      nameFilter: name,
    });
    const friend = await friendSelector(friends);
    if (!friend) {
      console.log("No matching friend found.");
      return;
    }

    if (friend.interactions.length === 0) {
      console.log(`No interactions found for ${friend.name}.`);
      return;
    }

    const sorted = friend.interactions.toSorted((a, b) => {
      return b.date!.getTime() - a.date!.getTime();
    });

    console.log(
      `Interactions with ${friend.name}: (Most recent was ${dayjs(sorted[0]!.date).fromNow()})`,
    );
    sorted.forEach((interaction) => {
      console.log(
        `- [${dayjs(interaction.date).format("YYYY-MM-DD")}] ${interaction.title}: ${interaction.description} ${interaction.tags.length > 0 ? `(tags: ${interaction.tags.join(", ")})` : ""}`,
      );
    });
  });
