import { Command, program } from "commander";
import { getFriendClient } from "../client.ts";
import dayjs from "dayjs";
import { friendSelector } from "../index.ts";

const updateBirthdayCommand = new Command("update")
  .aliases(["edit"])
  .description("Update a friend's birthday")
  .argument("<name>", "Name of the friend to update")
  .argument("<birthday>", "Birthday in YYYY-MM-DD format")
  .action(async (name: string, birthday: string) => {
    const parsedDate = dayjs(birthday, "YYYY-MM-DD", true);
    if (!parsedDate.isValid()) {
      console.log("Invalid date format. Please use YYYY-MM-DD.");
      return;
    }

    const { friends } = await getFriendClient().listFriends({
      nameFilter: name,
    });
    const friend = await friendSelector(friends);

    if (!friend) {
      console.log("No matching friend found.");
      return;
    }

    friend.birthday = parsedDate.toDate();
    const updatedFriend = await getFriendClient().updateFriend(friend);

    console.log(
      `Updated birthday for ${updatedFriend.name} to ${parsedDate.format("YYYY-MM-DD")}`,
    );
  });

program
  .command("birthdays")
  .aliases(["birthday"])
  .addCommand(updateBirthdayCommand)
  .description('Find birthdays in the next "n" days (default 7)')
  .argument("[days]", "Number of days to look ahead", "7")
  .action(async (days: string) => {
    const numDays = parseInt(days, 10);
    if (isNaN(numDays) || numDays <= 0) {
      console.log("Invalid number of days");
      return;
    }

    const { friends } = await getFriendClient().birthdaysSoon({
      daysAhead: numDays,
    });

    if (friends.length === 0) {
      console.log(`No birthdays in the next ${numDays} days.`);
      return;
    }

    friends.forEach((friend) => {
      if (!friend.birthday) return;

      let thisYearBirthday = dayjs(friend.birthday).set("year", dayjs().year());
      if (thisYearBirthday.isBefore(dayjs())) {
        thisYearBirthday = thisYearBirthday.add(1, "year");
      }

      const age = thisYearBirthday.year() - dayjs(friend.birthday).year();
      console.log(
        `${friend.name} on ${thisYearBirthday.format("dddd, MMMM D")} (they will be ${age} years old)`,
      );
    });
  });
