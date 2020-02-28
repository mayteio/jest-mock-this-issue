import { MockChannel } from "./mock-channel";

class MockInstance {
  constructor() {
    this.channels = {};
  }

  channel(name) {
    // if the channel doesn't already exist, create one.
    if (!this.channels[name]) {
      this.channels[name] = new MockChannel(name);
    }

    // return the channel.
    return this.channels[name];
  }
}

// by exporting a new instance, it ensures other scripts
// always refer to the same instance of our class.
export const MockPusherInstance = new MockInstance();
