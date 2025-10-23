export const auth = {
  token: localStorage.getItem("token"),
  set(token: string) {
    this.token = token;
    localStorage.setItem("token", token);
  },
  clear() {
    this.token = null as any;
    localStorage.removeItem("token");
  }
};
