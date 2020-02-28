import MockInstance from "./mock-instance";

export class MockClient {
  constructor(config) {
    this.config = config;
  }

  subscribe(name) {
    const callback = result => {
      this.id = result.id;
    };
    this.id = this.config.authorizer(callback);
    return MockInstance.channel(name, this);
  }
}
