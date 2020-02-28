export const proxyMockChannel = (channel, client) =>
  new Proxy(channel, {
    get(target, key) {
      switch (key) {
        // intercept the "members" getter
        case "members":
          return {
            ...target.members,
            myID: client.id
          };
        // otherwise just return the normal value
        default:
          return target[key];
      }
    }
  });
