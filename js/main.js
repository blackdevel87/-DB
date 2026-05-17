import { loadUsers } from "./auth.js";
import { loadNotices } from "./notice.js";
import "./guild-attack.js";
import "./pve.js";

await loadUsers();
await loadNotices();
