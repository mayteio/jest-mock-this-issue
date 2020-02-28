import { MockPusherInstance } from "./mock-instance";
import { proxyMockChannel } from "./proxyMockChannel";

export class MockClient {
  constructor(config) {
    this.config = config;
    this.setID = this.setID.bind(this);
    this.subscribe = this.subscribe.bind(this);
  }

  setID(id) {
    this.id = id;
  }

  subscribe(name) {
    this.config.authorizer().authorize(this.setID);
    return proxyMockChannel(
      MockPusherInstance.channel(name),
      // we're passing in `this` (referring to the class) as the client
      this
    );
  }
}
