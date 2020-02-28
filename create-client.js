import ActualClient from "./actual-client";

export const createClient = id =>
  new ActualClient({ authorizer: callback => callback({ id }) });
