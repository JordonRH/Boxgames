// Prefer the persistent connection used by normal play. Try HTTP polling if
// the network refuses WebSockets; production ingress must support both paths.
export const connectionOptions = {
  autoConnect: false,
  transports: ["websocket", "polling"],
  tryAllTransports: true,
};
