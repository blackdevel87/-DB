import { loadUsers } from "./auth.js";
import { loadNotices } from "./notice.js";
import "./guild-attack.js";

await loadUsers();
await loadNotices();
