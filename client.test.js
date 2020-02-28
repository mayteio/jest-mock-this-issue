import { MockClient } from "./mock-client";

test("should set channel.members.myID via proxy", () => {
  const client = new MockClient({
    authorizer: () => ({ authorize: callback => callback("my-id") })
  });

  const channel = client.subscribe("my-channel");

  // here we assert that the channel has the property channel
  // equal to the channel we passed into the client
  expect(channel.members.myID).toBe("my-id");
});
