export const proxyMockChannel = (channel, client) => {
  const handler = {
    get(target, key) {
      if (key === "myID") return client.id;
      return target[key];
    }
  };
  return new Proxy(channel, handler);
};

export default proxyMockChannel;
