import { createClient } from "./create-client";

jest.mock("./actual-client", () => require("./mock-client").MockClient);

test("should set channel.myID via proxy", () => {
  const client = createClient("my-id");
  const channel = client.subscribe("my-channel");
  expect(channel.myID).toBe("my-id");
});
