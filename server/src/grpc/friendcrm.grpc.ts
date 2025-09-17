import { friendcrm } from "@friendcrm/protos";
import { getDriver } from "../storage/loader.ts";

export const friendcrmImpl: friendcrm.FriendCRMServiceImplementation = {
  async addFriend(request) {
    request.id = Bun.randomUUIDv7();
    return await getDriver().addFriend(request);
  },
  async updateFriend(request) {
    const result = await getDriver().updateFriend(request);
    if (!result) {
      throw new Error(`Friend with ID ${request.id} not found`);
    }

    return result;
  },
  async listFriends(request) {
    return {
      friends: await getDriver().listFriends(request),
    };
  },
  async birthdaysSoon(request) {
    const friends = await getDriver().birthdaysSoon(request.daysAhead || 7);
    return {
      friends,
    };
  },
  async reconnectSoon(request) {
    const suggestions = await getDriver().reconnectSoon(
      request.minDaysSinceLastInteraction || 30,
    );
    return {
      suggestions,
    };
  },
};
