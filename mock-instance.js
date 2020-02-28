import MockChannel from "./mock-channel";
import proxyChannel from "./proxyMockChannel";

class MockInstance {
  channels = {};

  channel = (name, client) => {
    if (!this.channels[name]) {
      this.channels[name] = new MockChannel(name);
    }
    return proxyChannel(this.channels[name], client);
  };
}

export default new MockInstance();
