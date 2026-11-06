window.DB_DATA = {
  project: "TEAMLY",
  about: "TEAMLY is a marketplace where clients plan an event, send requests to providers (photographers, decorators, venues...), chat with them and pay for the project. An admin follows everything.",
  groups: [
    { id: "accounts", name: "Accounts" }, { id: "services", name: "Services" },
    { id: "projects", name: "Projects" }, { id: "money", name: "Money" }, { id: "talk", name: "Talk" }
  ],
  tables: [
    { name: "users", group: "accounts", desc: "Everyone who can log in: clients, providers and admins.", cols: [
      ["id", "INT", "pk"], ["full_name", "NVARCHAR(100)", ""], ["email", "NVARCHAR(150)", "uq"], ["password_hash", "NVARCHAR(255)", ""],
      ["role", "NVARCHAR(10)", "", { e: ["client", "provider", "admin"] }],
      ["status", "NVARCHAR(10)", "", { e: ["active", "pending", "inactive"], d: "'active'" }],
      ["created_at", "DATETIME2", "", { d: "SYSDATETIME()" }]] },
    { name: "providers", group: "accounts", desc: "Extra profile data for users whose role is provider.", cols: [
      ["id", "INT", "pk"], ["user_id", "INT", "fk uq"],
      ["provider_type", "NVARCHAR(10)", "", { e: ["individual", "company"] }],
      ["company_name", "NVARCHAR(100)", "null"], ["tagline", "NVARCHAR(150)", "null"], ["location", "NVARCHAR(100)", ""],
      ["description", "NVARCHAR(1000)", "null"], ["starting_price", "DECIMAL(10,2)", ""]] },
    { name: "services", group: "services", desc: "The kinds of work a provider can offer.", cols: [
      ["id", "INT", "pk"], ["name", "NVARCHAR(50)", "uq"]] },
    { name: "provider_services", group: "services", desc: "Joins providers and services (many-to-many).", cols: [
      ["provider_id", "INT", "pk fk"], ["service_id", "INT", "pk fk"]] },
    { name: "portfolio_items", group: "services", desc: "Photos and videos a provider shows on the profile.", cols: [
      ["id", "INT", "pk"], ["provider_id", "INT", "fk"], ["media_type", "NVARCHAR(10)", "", { e: ["photo", "video"] }],
      ["file_url", "NVARCHAR(300)", ""]] },
    { name: "projects", group: "projects", desc: "An event a client is planning.", cols: [
      ["id", "INT", "pk"], ["client_id", "INT", "fk"], ["name", "NVARCHAR(100)", ""], ["event_type", "NVARCHAR(30)", ""],
      ["location", "NVARCHAR(100)", ""], ["event_date", "DATE", "null"], ["budget", "DECIMAL(10,2)", ""],
      ["status", "NVARCHAR(10)", "", { e: ["pending", "active", "completed", "cancelled"], d: "'pending'" }]] },
    { name: "requests", group: "projects", desc: "A client project asking one provider for one service.", cols: [
      ["id", "INT", "pk"], ["project_id", "INT", "fk"], ["provider_id", "INT", "fk"], ["service_id", "INT", "fk"],
      ["status", "NVARCHAR(10)", "", { e: ["new", "pending", "accepted", "rejected", "expired"], d: "'new'" }],
      ["deadline", "DATE", "null"], ["created_at", "DATETIME2", "", { d: "SYSDATETIME()" }]] },
    { name: "reviews", group: "projects", desc: "The rating a client gives after a request is done.", cols: [
      ["id", "INT", "pk"], ["request_id", "INT", "fk uq"], ["rating", "TINYINT", "", { k: "rating BETWEEN 1 AND 5" }],
      ["comment", "NVARCHAR(500)", "null"], ["created_at", "DATETIME2", "", { d: "SYSDATETIME()" }]] },
    { name: "subscription_plans", group: "money", desc: "Free, Professional and Business plans.", cols: [
      ["id", "INT", "pk"], ["name", "NVARCHAR(30)", "uq"], ["price", "DECIMAL(6,2)", ""]] },
    { name: "subscriptions", group: "money", desc: "The plan a provider pays for.", cols: [
      ["id", "INT", "pk"], ["provider_id", "INT", "fk"], ["plan_id", "INT", "fk"],
      ["status", "NVARCHAR(10)", "", { e: ["active", "expired", "cancelled", "pending"], d: "'pending'" }],
      ["start_date", "DATE", ""], ["renewal_date", "DATE", "null"]] },
    { name: "transactions", group: "money", desc: "A payment for a project; commission is TEAMLY's share.", cols: [
      ["id", "INT", "pk"], ["project_id", "INT", "fk"], ["payer_id", "INT", "fk"], ["amount", "DECIMAL(10,2)", ""],
      ["commission", "DECIMAL(10,2)", "", { d: "0" }], ["method", "NVARCHAR(20)", ""],
      ["status", "NVARCHAR(10)", "", { e: ["successful", "pending", "failed", "refunded"], d: "'pending'" }],
      ["created_at", "DATETIME2", "", { d: "SYSDATETIME()" }]] },
    { name: "messages", group: "talk", desc: "Chat messages between a client and a provider.", cols: [
      ["id", "INT", "pk"], ["project_id", "INT", "fk"], ["sender_id", "INT", "fk"], ["receiver_id", "INT", "fk"],
      ["body", "NVARCHAR(250)", ""], ["sent_at", "DATETIME2", "", { d: "SYSDATETIME()" }]] },
    { name: "notifications", group: "talk", desc: "Alerts shown to a user.", cols: [
      ["id", "INT", "pk"], ["user_id", "INT", "fk"], ["title", "NVARCHAR(100)", ""],
      ["is_read", "BIT", "", { d: "0" }], ["created_at", "DATETIME2", "", { d: "SYSDATETIME()" }]] }
  ],
  // [from table, column, to table, cardinality at from end, cardinality at to end, verb]
  rels: [
    ["providers", "user_id", "users", "zeroOne", "one", "profile of"],
    ["provider_services", "provider_id", "providers", "zeroMany", "one", "offered by"],
    ["provider_services", "service_id", "services", "zeroMany", "one", "is a"],
    ["portfolio_items", "provider_id", "providers", "zeroMany", "one", "shown by"],
    ["projects", "client_id", "users", "zeroMany", "one", "created by"],
    ["requests", "project_id", "projects", "zeroMany", "one", "part of"],
    ["requests", "provider_id", "providers", "zeroMany", "one", "sent to"],
    ["requests", "service_id", "services", "zeroMany", "one", "asks for"],
    ["reviews", "request_id", "requests", "zeroOne", "one", "rates"],
    ["subscriptions", "provider_id", "providers", "zeroMany", "one", "held by"],
    ["subscriptions", "plan_id", "subscription_plans", "zeroMany", "one", "uses"],
    ["transactions", "project_id", "projects", "zeroMany", "one", "pays for"],
    ["transactions", "payer_id", "users", "zeroMany", "one", "paid by"],
    ["messages", "project_id", "projects", "zeroMany", "one", "inside"],
    ["messages", "sender_id", "users", "zeroMany", "one", "sent by"],
    ["messages", "receiver_id", "users", "zeroMany", "one", "sent to"],
    ["notifications", "user_id", "users", "zeroMany", "one", "for"]
  ],
  layout: [
    ["users", "notifications", "messages"],
    ["providers", "projects", "transactions"],
    ["provider_services", "portfolio_items", "subscriptions", "requests", "reviews"],
    ["services", "subscription_plans"]
  ],
  indexes: [["requests", "provider_id"], ["requests", "project_id"], ["projects", "client_id"], ["transactions", "project_id"], ["messages", "project_id"], ["notifications", "user_id"]],
  rules: [
    ["One account per email", "users.email is UNIQUE, so two people cannot register with the same email."],
    ["One provider profile per user", "providers.user_id is UNIQUE, so a user has at most one provider profile."],
    ["A provider lists a service once", "provider_services uses (provider_id, service_id) as its primary key, so the same pair cannot repeat."],
    ["One review per request", "reviews.request_id is UNIQUE, so a request can be rated only once."],
    ["Ratings are 1 to 5", "A CHECK constraint rejects any other rating."],
    ["Only known statuses", "Every status and role column has a CHECK constraint listing the allowed words."],
    ["No orphan rows", "Every foreign key must point to a row that exists, so you cannot add a request for a missing project."],
    ["No deleting used rows", "A user, provider or project that other rows point to cannot be deleted until those rows are removed."]
  ],
  statusMaps: [
    { title: "requests.status", rows: [["new", "New"], ["pending", "Waiting for reply"], ["accepted", "Accepted"], ["rejected", "Declined"], ["expired", "Expired"]] },
    { title: "projects.status", rows: [["pending", "Pending"], ["active", "In progress"], ["completed", "Completed"], ["cancelled", "Cancelled"]] },
    { title: "transactions.status", rows: [["successful", "Paid"], ["pending", "Processing"], ["failed", "Failed"], ["refunded", "Refunded"]] }
  ],
  basics: [
    ["What is a database?", "A database is an organised place to store data so you can find, change and share it easily. TEAMLY keeps its users, projects, requests and payments in one database instead of loose files."],
    ["Relational and non-relational", "Relational databases store data in tables that are linked by keys. Examples: SQL Server, MySQL, PostgreSQL, Oracle.\nNon-relational (NoSQL) databases store data as documents, key-value pairs, graphs or wide columns. Examples: MongoDB, Redis, Firebase, Cassandra."],
    ["What are SQL and SQL Server?", "SQL (Structured Query Language) is the language used to talk to a relational database: create tables, add data, read it back.\nSQL Server is Microsoft's database program that stores the data and runs your SQL. SQL Server Management Studio (SSMS) is the tool you use to work with it."],
    ["Your first database and table, without code", "1. Open SSMS and connect to your server.\n2. Right-click Databases, choose New Database, type Teamly, click OK.\n3. Open Teamly, right-click Tables, choose New, then Table.\n4. Type the column names and data types. Untick Allow Nulls for required columns.\n5. Right-click the id row and choose Set Primary Key.\n6. Press Ctrl+S and name the table users.\n7. Right-click the table, choose Edit Top 200 Rows and type a few rows."],
    ["Tables, rows, columns and data types", "A table is a grid about one thing (users). A column is one property (email). A row is one record (one user).\nMain data types:", "INT            whole numbers (id)\nDECIMAL(10,2)  exact numbers with decimals (budget)\nNVARCHAR(100)  text up to 100 characters\nDATE           a day\nDATETIME2      a day and time\nBIT            yes/no (0 or 1)"],
    ["Constraints", "Constraints are rules the database enforces. PRIMARY KEY identifies each row (unique, never empty). NOT NULL means a value is required. UNIQUE means no two rows can share the value.", "CREATE TABLE services (\n  id   INT NOT NULL PRIMARY KEY,\n  name NVARCHAR(50) NOT NULL UNIQUE\n);"],
    ["CREATE DATABASE and DROP DATABASE", "CREATE DATABASE makes a new database. DROP DATABASE deletes it with everything inside, so be careful.", "CREATE DATABASE Teamly;\nGO\nUSE Teamly;\nGO\nDROP DATABASE Teamly;"],
    ["CREATE, ALTER, DROP and TRUNCATE TABLE", "CREATE TABLE makes a table. ALTER TABLE changes its columns. DROP TABLE deletes the table. TRUNCATE TABLE keeps the table but removes all rows.", "CREATE TABLE services (id INT PRIMARY KEY, name NVARCHAR(50));\nALTER TABLE services ADD icon NVARCHAR(30) NULL;\nALTER TABLE services DROP COLUMN icon;\nTRUNCATE TABLE services;\nDROP TABLE services;"],
    ["SELECT, INSERT, UPDATE and DELETE", "SELECT reads rows. INSERT adds a row. UPDATE changes rows. DELETE removes rows. Always use WHERE with UPDATE and DELETE, or they affect every row.", "SELECT id, name FROM services;\nINSERT INTO services (id, name) VALUES (1, 'Photography');\nUPDATE services SET name = 'Photo' WHERE id = 1;\nDELETE FROM services WHERE id = 1;"],
    ["Aggregation functions", "Aggregation functions turn many rows into one value: COUNT, SUM, AVG, MIN, MAX.", "SELECT COUNT(*) AS payments, SUM(amount) AS total,\n       AVG(amount) AS average, MIN(amount) AS smallest, MAX(amount) AS biggest\nFROM transactions\nWHERE status = 'successful';"]
  ],
  topics: [
    ["Relations: one-to-one, one-to-many, many-to-many", "One-to-one: one user has at most one provider profile (providers.user_id is UNIQUE).\nOne-to-many: one user creates many projects (projects.client_id).\nMany-to-many: a provider offers many services and a service has many providers. A middle table, provider_services, holds the pairs.", "-- one-to-many\nSELECT p.name FROM projects p WHERE p.client_id = 1;\n-- many-to-many uses the middle table\nSELECT * FROM provider_services WHERE provider_id = 3;"],
    ["Database schema", "The schema is the design of the database: its tables, columns, data types, keys and relations. The Schema tab shows TEAMLY's design. In SQL Server every table also lives in a schema name, and dbo is the default."],
    ["Joins: INNER, LEFT, RIGHT, FULL", "INNER JOIN keeps only matching rows. LEFT JOIN keeps all rows from the left table. RIGHT JOIN keeps all rows from the right table. FULL JOIN keeps all rows from both.", "-- providers that have a request\nSELECT pr.id, r.status FROM providers pr INNER JOIN requests r ON r.provider_id = pr.id;\n-- all providers, even with no request\nSELECT pr.id, r.status FROM providers pr LEFT JOIN requests r ON r.provider_id = pr.id;\n-- all requests, even without a provider\nSELECT pr.id, r.status FROM providers pr RIGHT JOIN requests r ON r.provider_id = pr.id;\n-- everything from both sides\nSELECT pr.id, r.status FROM providers pr FULL JOIN requests r ON r.provider_id = pr.id;"],
    ["Joins through relations", "To join tables, follow the foreign keys. A one-to-many join uses one key. A many-to-many join goes through the middle table.", "-- one-to-many: each project with its client\nSELECT p.name, u.full_name\nFROM projects p JOIN users u ON u.id = p.client_id;\n-- many-to-many: providers with their services\nSELECT u.full_name, s.name AS service\nFROM providers pr\nJOIN users u ON u.id = pr.user_id\nJOIN provider_services ps ON ps.provider_id = pr.id\nJOIN services s ON s.id = ps.service_id;"],
    ["WHERE, GROUP BY, HAVING", "WHERE filters rows before grouping. GROUP BY puts rows into groups. HAVING filters the groups after grouping.", "SELECT status, COUNT(*) AS total\nFROM requests\nWHERE created_at >= '2026-01-01'\nGROUP BY status\nHAVING COUNT(*) > 5;"],
    ["Indexing: clustered and non-clustered", "An index helps the database find rows fast, like the index of a book. A clustered index sorts the table itself, so there is only one per table (the primary key creates it). A non-clustered index is a separate list that points to the rows, and a table can have many.", "CREATE NONCLUSTERED INDEX IX_requests_provider_id\n  ON requests (provider_id);"],
    ["Views", "A view is a saved SELECT that you use like a table.", "CREATE VIEW v_project_clients AS\nSELECT p.id, p.name, u.full_name AS client\nFROM projects p JOIN users u ON u.id = p.client_id;\nGO\nSELECT * FROM v_project_clients;"],
    ["Functions", "A function takes values and returns one value you can use inside a query.", "CREATE FUNCTION fn_commission (@amount DECIMAL(10,2))\nRETURNS DECIMAL(10,2)\nAS\nBEGIN\n  RETURN @amount * 0.15;\nEND;\nGO\nSELECT amount, dbo.fn_commission(amount) FROM transactions;"],
    ["Stored procedures", "A stored procedure is saved SQL you run by name. It can take parameters.", "CREATE PROCEDURE sp_requests_by_status @status NVARCHAR(10)\nAS\nBEGIN\n  SELECT * FROM requests WHERE status = @status;\nEND;\nGO\nEXEC sp_requests_by_status 'accepted';"],
    ["Subqueries", "A subquery is a SELECT inside another query.", "-- clients who created at least one project\nSELECT full_name FROM users\nWHERE id IN (SELECT client_id FROM projects);\n-- payments above the average\nSELECT * FROM transactions\nWHERE amount > (SELECT AVG(amount) FROM transactions);"],
    ["Triggers", "A trigger runs by itself when rows are inserted, updated or deleted. This one creates a notification when a request is added.", "CREATE TRIGGER trg_request_notify ON requests\nAFTER INSERT\nAS\nBEGIN\n  INSERT INTO notifications (user_id, title)\n  SELECT pr.user_id, 'New request'\n  FROM inserted i JOIN providers pr ON pr.id = i.provider_id;\nEND;"],
    ["Normalization and denormalization", "Normalization splits data so each fact is stored once. If a request stored the provider's name and phone, every change would need many updates. So requests store only provider_id and the details live in providers and users. Denormalization does the opposite on purpose: it copies a value to avoid joins and read faster, for example saving the total in a report table. It makes reading quicker but you must keep the copies in sync."]
  ]
};