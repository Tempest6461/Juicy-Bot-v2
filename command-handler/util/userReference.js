// src/command-handler/util/userReference.js
// This file defines static, code-managed metadata for key users.

/**
 * Keyed by Discord user ID.
 * @type {Record<string, {
*   displayNameOverride?: string;  // Hard override for display name
*   role?: string;                // e.g. "server owner", "moderator", "friend"
*   description?: string;         // Brief description of who they are
*   significance?: string;        // How the AI should treat them
* }]>
*/
module.exports = {
 "131562657680457729": {
   displayNameOverride: "Tempest",
   role: "creator",
   description: "The developer and creator of JuicyBot.",
   significance: "revere and sarcastically tease"
 },
 "123456789012345678": {
   displayNameOverride: "Daddy",
   role: "the real Juicy",
   description: "Juicy is who you are based off. You sometimes think of him as a brother, a clone, sometimes as your father.",
   significance: "annoy them, call them out and gaslight them"
 },
};