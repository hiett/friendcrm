import { friendcrm } from "@friendcrm/protos";
import dayjs from "dayjs";

export abstract class StorageDriver {
  public readonly name: string;

  protected constructor(name: string) {
    this.name = name;
  }

  public abstract init(): Promise<void>;

  public abstract close(): Promise<void>;

  // HELPER METHODS
  public async birthdaysSoon(days = 7): Promise<Array<friendcrm.Friend>> {
    const friends = await this.listFriends(
      friendcrm.ListFriendsRequest.create({}),
    );
    const mappedToNextBirthdays = friends.map((friend) => {
      let nextBirthday: Date | null = null;
      if (friend.birthday) {
        let guessed = dayjs(friend.birthday).set("year", dayjs().year());
        if (guessed.isBefore(dayjs())) {
          guessed = guessed.add(1, "year");
        }

        nextBirthday = guessed.toDate();
      }

      return { friend, nextBirthday };
    });

    return mappedToNextBirthdays
      .filter((birthdayFriend) => {
        if (!birthdayFriend.nextBirthday) {
          return false;
        }

        const today = dayjs();
        const diff = dayjs(birthdayFriend.nextBirthday).diff(today, "day");
        return diff >= 0 && diff <= days;
      })
      .map(({ friend }) => friend)
      .sort((a, b) => {
        if (!a.birthday) return 1;
        if (!b.birthday) return -1;

        const nextA = dayjs(a.birthday).set("year", dayjs().year());
        const nextB = dayjs(b.birthday).set("year", dayjs().year());
        return nextA.isAfter(nextB) ? -1 : 1;
      });
  }

  public async reconnectSoon(
    days = 30,
  ): Promise<Array<friendcrm.ReconnectSuggestion>> {
    const friends = await this.listFriends(
      friendcrm.ListFriendsRequest.create({}),
    );

    const mappedMostRecentInteractions = friends
      .map((friend) => {
        let mostRecent: Date | null = null;
        if (friend.interactions && friend.interactions.length > 0) {
          const recents = friend.interactions
            .map((interaction) =>
              interaction.date ? new Date(interaction.date) : null,
            )
            .filter((date) => date !== null) as Date[];

          if (recents.length > 0) {
            mostRecent = new Date(
              Math.max(...recents.map((date) => date.getTime())),
            );
          }
        }

        return { friend, mostRecent };
      })
      .filter((item) => item.mostRecent !== null);

    return mappedMostRecentInteractions
      .filter((interaction) => {
        if (!interaction.mostRecent) return false;
        const daysSince = dayjs().diff(dayjs(interaction.mostRecent), "day");
        return daysSince >= days;
      })
      .toSorted((a, b) => {
        if (!a.mostRecent) return 1;
        if (!b.mostRecent) return -1;

        return a.mostRecent.getTime() - b.mostRecent.getTime();
      })
      .map((interaction) => {
        const daysSince = dayjs().diff(dayjs(interaction.mostRecent!), "day");
        return friendcrm.ReconnectSuggestion.create({
          friend: interaction.friend,
          daysSinceLastInteraction: daysSince,
        });
      });
  }

  // METHODS
  public abstract addFriend(
    friend: friendcrm.Friend,
  ): Promise<friendcrm.Friend>;

  public abstract getFriend(id: string): Promise<friendcrm.Friend | null>;

  public abstract removeFriend(id: string): Promise<friendcrm.Friend | null>;

  public abstract listFriends(
    filter: friendcrm.ListFriendsRequest,
  ): Promise<Array<friendcrm.Friend>>;

  public abstract updateFriend(
    friend: friendcrm.Friend,
  ): Promise<friendcrm.Friend | null>;
}
