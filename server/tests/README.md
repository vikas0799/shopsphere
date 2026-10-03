# API integration tests

From `server/`, run `npm ci` and `npm test` (Node.js 18 or later).
Jest imports the exported Express app; Supertest exercises real routes and
middleware against a temporary MongoDB instance created by
`mongodb-memory-server`. No server listener, `.env`, Atlas account or seeded
ShopSphere database is required. The database is cleared between tests and
stopped after the suite.

The first run downloads a MongoDB test binary and requires network access.
For an offline environment with MongoDB already installed, set
`MONGOMS_SYSTEM_BINARY` to the absolute path to `mongod`.

The suite checks registration, duplicate emails, required fields, successful
login, rejected credentials and profile authentication. It also verifies JWT
signatures, password hashing and that API responses omit passwords.

Jest uses Node's experimental VM modules because this project uses native ES
modules. Node prints an expected experimental-feature warning.
