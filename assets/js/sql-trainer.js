/* ═══════════════════════════════════════════════════════════
   SQL Trainer — Duolingo-style SQL learning tool
   - Real query execution via sql.js (SQLite WASM)
   - Lesson path with sequential unlocking
   - Progress saved to localStorage
   ═══════════════════════════════════════════════════════════ */

/* ─── 1. STATE ─────────────────────────────────────────────── */

const STORAGE_KEY = 'sql-trainer-v1';

const defaultProgress = {
  completed: {},      // { 'unitId.lessonIdx': true }
  xp: 0,
  streakDays: 0,
  lastDay: null,
  hearts: 5,
  heartsRefilledAt: null,
};

let progress = loadProgress();
let DB = null;        // sql.js Database
let SQL = null;       // sql.js module

let activeLesson = null;   // { unitId, lessonIdx, exercises, currentIdx, hearts, xpEarned }

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultProgress };
    return { ...defaultProgress, ...JSON.parse(raw) };
  } catch {
    return { ...defaultProgress };
  }
}
function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function bumpStreak() {
  const today = todayStr();
  if (progress.lastDay === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (progress.lastDay === yesterday) progress.streakDays += 1;
  else progress.streakDays = 1;
  progress.lastDay = today;
}
function refillHearts() {
  // refill 1 heart per 30 minutes, max 5
  const now = Date.now();
  if (!progress.heartsRefilledAt) progress.heartsRefilledAt = now;
  const elapsedMin = (now - progress.heartsRefilledAt) / 60000;
  if (progress.hearts < 5 && elapsedMin >= 30) {
    const add = Math.min(5 - progress.hearts, Math.floor(elapsedMin / 30));
    progress.hearts += add;
    progress.heartsRefilledAt = now;
    saveProgress();
  }
}

/* ─── 2. SCHEMA + SEED ─────────────────────────────────────── */

const SEED_SQL = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT,
  country TEXT,
  signup_date TEXT,
  plan TEXT
);
INSERT INTO users VALUES
  (1, 'Anya Patel', 'US', '2025-01-12', 'pro'),
  (2, 'Diego Rivera', 'MX', '2025-01-15', 'free'),
  (3, 'Mei Chen', 'SG', '2025-02-03', 'pro'),
  (4, 'Jordan Lee', 'US', '2025-02-18', 'free'),
  (5, 'Priya Singh', 'IN', '2025-03-01', 'pro'),
  (6, 'Ola Sundgren', 'SE', '2025-03-09', 'free'),
  (7, 'Tomás Ruiz', 'MX', '2025-03-22', 'pro'),
  (8, 'Rita Okafor', 'NG', '2025-04-02', 'pro'),
  (9, 'Sam Carter', 'US', '2025-04-14', 'free'),
  (10, 'Yuki Tanaka', 'JP', '2025-04-29', 'pro');

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT,
  category TEXT,
  price REAL
);
INSERT INTO products VALUES
  (1, 'Notebook', 'stationery', 12.50),
  (2, 'Pen Set', 'stationery', 8.00),
  (3, 'Headphones', 'electronics', 89.00),
  (4, 'Keyboard', 'electronics', 65.00),
  (5, 'Mug', 'home', 14.00),
  (6, 'Lamp', 'home', 42.00),
  (7, 'Backpack', 'apparel', 78.00),
  (8, 'T-Shirt', 'apparel', 22.00);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  product_id INTEGER,
  quantity INTEGER,
  total REAL,
  order_date TEXT,
  status TEXT
);
INSERT INTO orders VALUES
  (1, 1, 3, 1, 89.00, '2025-02-10', 'completed'),
  (2, 1, 1, 2, 25.00, '2025-02-15', 'completed'),
  (3, 2, 5, 3, 42.00, '2025-02-18', 'completed'),
  (4, 3, 4, 1, 65.00, '2025-02-20', 'completed'),
  (5, 3, 7, 1, 78.00, '2025-03-05', 'completed'),
  (6, 4, 2, 5, 40.00, '2025-03-12', 'pending'),
  (7, 5, 6, 1, 42.00, '2025-03-20', 'completed'),
  (8, 5, 3, 2, 178.00, '2025-04-01', 'completed'),
  (9, 6, 1, 1, 12.50, '2025-04-04', 'cancelled'),
  (10, 7, 8, 3, 66.00, '2025-04-08', 'completed'),
  (11, 7, 4, 1, 65.00, '2025-04-15', 'completed'),
  (12, 8, 7, 1, 78.00, '2025-04-19', 'completed'),
  (13, 8, 6, 2, 84.00, '2025-04-22', 'completed'),
  (14, 9, 5, 1, 14.00, '2025-04-25', 'pending'),
  (15, 10, 3, 1, 89.00, '2025-04-30', 'completed'),
  (16, 10, 7, 2, 156.00, '2025-05-01', 'completed'),
  (17, 1, 6, 1, 42.00, '2025-05-03', 'completed'),
  (18, 3, 8, 4, 88.00, '2025-05-04', 'completed');

CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  event_type TEXT,
  event_date TEXT
);
INSERT INTO events VALUES
  (1, 1, 'page_view', '2025-02-09'),
  (2, 1, 'add_to_cart', '2025-02-10'),
  (3, 1, 'purchase', '2025-02-10'),
  (4, 2, 'page_view', '2025-02-17'),
  (5, 2, 'page_view', '2025-02-18'),
  (6, 2, 'add_to_cart', '2025-02-18'),
  (7, 2, 'purchase', '2025-02-18'),
  (8, 3, 'page_view', '2025-02-19'),
  (9, 3, 'add_to_cart', '2025-02-20'),
  (10, 3, 'purchase', '2025-02-20'),
  (11, 4, 'page_view', '2025-03-10'),
  (12, 4, 'add_to_cart', '2025-03-12'),
  (13, 5, 'page_view', '2025-03-19'),
  (14, 5, 'purchase', '2025-03-20'),
  (15, 6, 'page_view', '2025-04-03'),
  (16, 7, 'page_view', '2025-04-07'),
  (17, 7, 'purchase', '2025-04-08'),
  (18, 8, 'page_view', '2025-04-18'),
  (19, 8, 'purchase', '2025-04-19'),
  (20, 10, 'page_view', '2025-04-29'),
  (21, 10, 'purchase', '2025-04-30');

CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT,
  department TEXT,
  salary REAL,
  manager_id INTEGER,
  hire_date TEXT
);
INSERT INTO employees VALUES
  (1, 'Alice Chen', 'engineering', 145000, NULL, '2022-01-15'),
  (2, 'Bob Park', 'engineering', 125000, 1, '2022-06-01'),
  (3, 'Carol Diaz', 'engineering', 130000, 1, '2022-03-20'),
  (4, 'Dan Osei', 'product', 135000, NULL, '2021-11-01'),
  (5, 'Eva Ruiz', 'product', 115000, 4, '2023-02-14'),
  (6, 'Frank Li', 'design', 120000, NULL, '2022-08-10'),
  (7, 'Grace Kim', 'design', 110000, 6, '2023-05-01'),
  (8, 'Hiro Tanaka', 'engineering', 155000, 1, '2021-09-01'),
  (9, 'Ivy Shah', 'product', 105000, 4, '2024-01-08'),
  (10, 'Jake Moss', 'engineering', 98000, 2, '2024-03-15');

CREATE TABLE logins (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  login_date TEXT
);
INSERT INTO logins VALUES
  (1, 1, '2025-04-01'),
  (2, 1, '2025-04-02'),
  (3, 1, '2025-04-03'),
  (4, 1, '2025-04-05'),
  (5, 1, '2025-04-06'),
  (6, 2, '2025-04-01'),
  (7, 2, '2025-04-03'),
  (8, 2, '2025-04-04'),
  (9, 2, '2025-04-05'),
  (10, 3, '2025-04-01'),
  (11, 3, '2025-04-02'),
  (12, 3, '2025-04-03'),
  (13, 3, '2025-04-04'),
  (14, 3, '2025-04-05'),
  (15, 4, '2025-04-02'),
  (16, 4, '2025-04-07'),
  (17, 5, '2025-04-01'),
  (18, 5, '2025-04-02'),
  (19, 5, '2025-04-03'),
  (20, 5, '2025-04-04'),
  (21, 5, '2025-04-05'),
  (22, 5, '2025-04-06'),
  (23, 5, '2025-04-07'),
  (24, 6, '2025-04-03'),
  (25, 6, '2025-04-05');

CREATE TABLE sessions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  start_time TEXT,
  end_time TEXT,
  pages_viewed INTEGER,
  converted INTEGER
);
INSERT INTO sessions VALUES
  (1, 1, '2025-03-01 09:00', '2025-03-01 09:12', 5, 1),
  (2, 2, '2025-03-01 10:30', '2025-03-01 10:33', 2, 0),
  (3, 3, '2025-03-01 14:00', '2025-03-01 14:22', 8, 1),
  (4, 4, '2025-03-02 08:15', '2025-03-02 08:18', 1, 0),
  (5, 5, '2025-03-02 11:00', '2025-03-02 11:45', 12, 1),
  (6, 1, '2025-03-03 09:00', '2025-03-03 09:08', 3, 0),
  (7, 6, '2025-03-03 16:00', '2025-03-03 16:30', 7, 1),
  (8, 2, '2025-03-04 10:00', '2025-03-04 10:05', 2, 0),
  (9, 7, '2025-03-04 13:00', '2025-03-04 13:25', 6, 1),
  (10, 3, '2025-03-05 09:30', '2025-03-05 09:55', 9, 1),
  (11, 8, '2025-03-05 14:00', '2025-03-05 14:02', 1, 0),
  (12, 4, '2025-03-06 08:00', '2025-03-06 08:04', 2, 0),
  (13, 9, '2025-03-06 11:30', '2025-03-06 11:50', 7, 1),
  (14, 5, '2025-03-07 10:00', '2025-03-07 10:35', 10, 1),
  (15, 10, '2025-03-07 15:00', '2025-03-07 15:08', 3, 0);
`;

/* ─── 3. COURSE CONTENT ────────────────────────────────────── */
/* Exercise types:
   - intro:   { type:'intro', title, body, syntax }
   - mc:      { type:'mc', q, choices:['a','b','c','d'], correct: 0, explain }
   - fill:    { type:'fill', q, template: 'SELECT {{0}} FROM users', answers: ['name'], explain }
   - write:   { type:'write', q, expectedSql, ordered?, hint, explain }
   - arrange: { type:'arrange', q, chips:['a','b'...], correctOrder:[1,0,...], explain }
*/

const COURSE = [
  {
    id: 'basics',
    title: 'SELECT Basics',
    icon: '🌱',
    lessons: [
      {
        title: 'Your first SELECT',
        exercises: [
          { type: 'intro',
            title: 'SELECT picks columns. FROM picks tables.',
            body: 'Every SQL query starts with <strong>SELECT</strong> (which columns) and <strong>FROM</strong> (which table). The semicolon at the end is optional but good practice.',
            syntax: '<span class="kw">SELECT</span> name, country\n<span class="kw">FROM</span> users;'
          },
          { type: 'mc',
            q: 'Which clause picks the table you\'re reading from?',
            choices: ['SELECT', 'FROM', 'WHERE', 'TABLE'],
            correct: 1,
            explain: 'FROM picks the table. SELECT picks the columns inside it.'
          },
          { type: 'fill',
            q: 'Complete the query to get every user\'s name.',
            template: '<span class="kw">{{0}}</span> name <span class="kw">{{1}}</span> users;',
            answers: ['SELECT', 'FROM'],
            explain: 'SELECT chooses columns, FROM names the table.'
          },
          { type: 'write',
            q: 'Get the name and country of every user.',
            expectedSql: 'SELECT name, country FROM users',
            hint: 'Two columns, one table.',
            explain: 'Pick exactly the columns you need — avoid SELECT * in production code.'
          }
        ]
      },
      {
        title: 'SELECT * and DISTINCT',
        exercises: [
          { type: 'intro',
            title: 'The shortcut and the deduplicator.',
            body: '<strong>SELECT *</strong> grabs every column — handy for exploring, dangerous in production. <strong>DISTINCT</strong> removes duplicate rows.',
            syntax: '<span class="kw">SELECT DISTINCT</span> country\n<span class="kw">FROM</span> users;'
          },
          { type: 'write',
            q: 'Get every column from the products table.',
            expectedSql: 'SELECT * FROM products',
            hint: 'Use the * shortcut.',
            explain: '* is fine for exploring — but in real code, list columns explicitly so your query doesn\'t silently break when the schema changes.'
          },
          { type: 'mc',
            q: 'Which query gives you each unique country, with no duplicates?',
            choices: [
              'SELECT country FROM users',
              'SELECT UNIQUE country FROM users',
              'SELECT DISTINCT country FROM users',
              'SELECT * FROM users GROUP BY country'
            ],
            correct: 2,
            explain: 'DISTINCT is the keyword for unique values. UNIQUE is a constraint, not a SELECT modifier.'
          },
          { type: 'write',
            q: 'List every distinct product category.',
            expectedSql: 'SELECT DISTINCT category FROM products',
            hint: 'DISTINCT goes right after SELECT.',
            explain: 'DISTINCT applies across the whole row you SELECT — so DISTINCT category gives unique categories.'
          }
        ]
      },
      {
        title: 'Aliases (AS)',
        exercises: [
          { type: 'intro',
            title: 'Rename columns on the fly.',
            body: 'Use <strong>AS</strong> to give a column a friendlier name in the output. Aliases also let you label calculated columns. The <code>AS</code> keyword is optional in most engines.',
            syntax: '<span class="kw">SELECT</span> name <span class="kw">AS</span> customer_name,\n  total <span class="kw">AS</span> amount\n<span class="kw">FROM</span> orders;'
          },
          { type: 'fill',
            q: 'Alias the price column as cost.',
            template: '<span class="kw">SELECT</span> name, price <span class="kw">AS</span> {{0}}\n<span class="kw">FROM</span> products;',
            answers: ['cost'],
            explain: 'After AS, just name it whatever you want. Use snake_case for SQL identifiers.'
          },
          { type: 'write',
            q: 'Select user name aliased as customer from the users table.',
            expectedSql: 'SELECT name AS customer FROM users',
            hint: 'SELECT col AS alias.',
            explain: 'Aliases are surface-level labels — they don\'t change the underlying column.'
          }
        ]
      }
    ]
  },

  {
    id: 'filtering',
    title: 'Filtering with WHERE',
    icon: '🔍',
    lessons: [
      {
        title: 'WHERE basics',
        exercises: [
          { type: 'intro',
            title: 'Filter rows with WHERE.',
            body: '<strong>WHERE</strong> keeps only the rows that satisfy a condition. Use <code>=</code>, <code>!=</code> (or <code>&lt;&gt;</code>), <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&gt;=</code>.',
            syntax: '<span class="kw">SELECT</span> *\n<span class="kw">FROM</span> orders\n<span class="kw">WHERE</span> status = <span class="str">\'completed\'</span>;'
          },
          { type: 'write',
            q: 'Get all users on the pro plan.',
            expectedSql: "SELECT * FROM users WHERE plan = 'pro'",
            hint: 'Strings need single quotes.',
            explain: 'SQL string literals use single quotes. Double quotes are for column names in some engines.'
          },
          { type: 'write',
            q: 'Get all products that cost more than 50.',
            expectedSql: 'SELECT * FROM products WHERE price > 50',
            hint: 'Numbers don\'t need quotes.',
            explain: 'Numbers are bare; strings are quoted. Mixing them up is a top-3 SQL bug.'
          }
        ]
      },
      {
        title: 'AND, OR, NOT',
        exercises: [
          { type: 'intro',
            title: 'Combine conditions.',
            body: 'Use <strong>AND</strong> when both must be true, <strong>OR</strong> when either works, and <strong>NOT</strong> to invert. Wrap with parentheses to be explicit.',
            syntax: '<span class="kw">SELECT</span> *\n<span class="kw">FROM</span> orders\n<span class="kw">WHERE</span> status = <span class="str">\'completed\'</span>\n  <span class="kw">AND</span> total > <span class="num">50</span>;'
          },
          { type: 'mc',
            q: 'Which query finds US users on the pro plan?',
            choices: [
              "WHERE country = 'US' OR plan = 'pro'",
              "WHERE country = 'US' AND plan = 'pro'",
              "WHERE country = 'US', plan = 'pro'",
              "WHERE country AND plan = 'US' AND 'pro'"
            ],
            correct: 1,
            explain: 'Both conditions must hold, so AND. OR would give US users OR pro users — a much bigger set.'
          },
          { type: 'write',
            q: 'Get completed orders with a total of at least 80.',
            expectedSql: "SELECT * FROM orders WHERE status = 'completed' AND total >= 80",
            hint: 'Two conditions joined with AND.',
            explain: '>= is "greater than or equal to". Order of conditions doesn\'t matter for correctness, but can matter for readability.'
          },
          { type: 'write',
            q: 'Get all users not from the US.',
            expectedSql: "SELECT * FROM users WHERE country != 'US'",
            hint: 'Use != or <>.',
            explain: 'SQLite accepts both != and <>. Both mean "not equal".'
          }
        ]
      },
      {
        title: 'IN, BETWEEN, LIKE',
        exercises: [
          { type: 'intro',
            title: 'Shorthand operators.',
            body: '<strong>IN</strong> matches a list. <strong>BETWEEN</strong> matches a range (inclusive). <strong>LIKE</strong> does pattern matching: <code>%</code> = any chars, <code>_</code> = single char.',
            syntax: '<span class="kw">SELECT</span> *\n<span class="kw">FROM</span> users\n<span class="kw">WHERE</span> country <span class="kw">IN</span> (<span class="str">\'US\'</span>, <span class="str">\'MX\'</span>);\n\n<span class="cm">-- Names starting with A</span>\n<span class="kw">SELECT</span> * <span class="kw">FROM</span> users\n<span class="kw">WHERE</span> name <span class="kw">LIKE</span> <span class="str">\'A%\'</span>;'
          },
          { type: 'write',
            q: 'Get products priced between 20 and 70 (inclusive).',
            expectedSql: 'SELECT * FROM products WHERE price BETWEEN 20 AND 70',
            hint: 'BETWEEN x AND y.',
            explain: 'BETWEEN is inclusive on both ends. Same as price >= 20 AND price <= 70.'
          },
          { type: 'write',
            q: 'Get users from the US, Mexico, or India (use IN).',
            expectedSql: "SELECT * FROM users WHERE country IN ('US', 'MX', 'IN')",
            hint: 'IN takes a comma-separated list in parentheses.',
            explain: 'IN is cleaner than chaining ORs and runs the same way under the hood.'
          },
          { type: 'fill',
            q: 'Find users whose names contain "an" anywhere.',
            template: '<span class="kw">SELECT</span> *\n<span class="kw">FROM</span> users\n<span class="kw">WHERE</span> name {{0}} <span class="str">\'%an%\'</span>;',
            answers: ['LIKE'],
            explain: '% means "any sequence of characters". %an% matches "an" anywhere in the name.'
          }
        ]
      }
    ]
  },

  {
    id: 'sorting',
    title: 'Sorting & Limits',
    icon: '🔢',
    lessons: [
      {
        title: 'ORDER BY',
        exercises: [
          { type: 'intro',
            title: 'Sort your results.',
            body: '<strong>ORDER BY</strong> sorts rows. Default is ascending (<code>ASC</code>). Use <code>DESC</code> for biggest-first. You can sort by multiple columns.',
            syntax: '<span class="kw">SELECT</span> name, price\n<span class="kw">FROM</span> products\n<span class="kw">ORDER BY</span> price <span class="kw">DESC</span>;'
          },
          { type: 'write',
            q: 'List products sorted by price, lowest first.',
            expectedSql: 'SELECT * FROM products ORDER BY price ASC',
            ordered: true,
            hint: 'ASC is the default — both work.',
            explain: 'Default sort is ascending, so ORDER BY price and ORDER BY price ASC are equivalent.'
          },
          { type: 'write',
            q: 'List products sorted by price, highest first.',
            expectedSql: 'SELECT * FROM products ORDER BY price DESC',
            ordered: true,
            hint: 'DESC = descending.',
            explain: 'For "top revenue" or "newest first" type questions, you\'ll almost always want DESC.'
          },
          { type: 'arrange',
            q: 'Arrange the clauses in the right order.',
            chips: ['SELECT *', 'FROM users', 'WHERE plan = \'pro\'', 'ORDER BY signup_date DESC'],
            correctOrder: [0, 1, 2, 3],
            explain: 'SQL clause order is fixed: SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT.'
          }
        ]
      },
      {
        title: 'LIMIT (and top-N)',
        exercises: [
          { type: 'intro',
            title: 'Cap the number of rows.',
            body: '<strong>LIMIT n</strong> returns at most n rows. Combine with <code>ORDER BY</code> for "top 5" / "most recent 10" queries.',
            syntax: '<span class="kw">SELECT</span> *\n<span class="kw">FROM</span> orders\n<span class="kw">ORDER BY</span> order_date <span class="kw">DESC</span>\n<span class="kw">LIMIT</span> <span class="num">5</span>;'
          },
          { type: 'write',
            q: 'Get the 3 most expensive products.',
            expectedSql: 'SELECT * FROM products ORDER BY price DESC LIMIT 3',
            ordered: true,
            hint: 'Sort by price desc, limit 3.',
            explain: 'Without ORDER BY, LIMIT just gives you any N rows — usually not what you want.'
          },
          { type: 'write',
            q: 'Get the 5 most recent orders.',
            expectedSql: 'SELECT * FROM orders ORDER BY order_date DESC LIMIT 5',
            ordered: true,
            hint: 'Most recent = highest date = DESC.',
            explain: '"Recent", "latest", "newest" → ORDER BY date DESC.'
          }
        ]
      }
    ]
  },

  {
    id: 'aggregates',
    title: 'Aggregates & Grouping',
    icon: '∑',
    lessons: [
      {
        title: 'COUNT, SUM, AVG',
        exercises: [
          { type: 'intro',
            title: 'Collapse rows into numbers.',
            body: '<strong>COUNT</strong> counts rows, <strong>SUM</strong> totals values, <strong>AVG</strong> averages, <strong>MIN/MAX</strong> find extremes. Without GROUP BY, they collapse the entire table into one row.',
            syntax: '<span class="kw">SELECT</span>\n  <span class="fn">COUNT</span>(*) <span class="kw">AS</span> total_orders,\n  <span class="fn">SUM</span>(total) <span class="kw">AS</span> revenue,\n  <span class="fn">AVG</span>(total) <span class="kw">AS</span> avg_order\n<span class="kw">FROM</span> orders;'
          },
          { type: 'write',
            q: 'How many users are there in total?',
            expectedSql: 'SELECT COUNT(*) FROM users',
            hint: 'COUNT(*) counts every row.',
            explain: 'COUNT(*) counts rows including NULLs. COUNT(column) skips NULLs in that column.'
          },
          { type: 'write',
            q: 'What is the total revenue across all completed orders?',
            expectedSql: "SELECT SUM(total) FROM orders WHERE status = 'completed'",
            hint: 'SUM the total column, but only for completed.',
            explain: 'WHERE filters before the aggregate runs, so cancelled and pending orders are excluded.'
          },
          { type: 'mc',
            q: 'What does COUNT(DISTINCT user_id) return on the orders table?',
            choices: [
              'The total number of orders',
              'The number of unique users who placed at least one order',
              'The total quantity of items ordered',
              'The number of distinct products ordered'
            ],
            correct: 1,
            explain: 'COUNT(DISTINCT col) counts unique non-NULL values — here, unique buyers.'
          }
        ]
      },
      {
        title: 'GROUP BY',
        exercises: [
          { type: 'intro',
            title: 'One aggregate per group.',
            body: '<strong>GROUP BY</strong> splits rows into groups, then runs the aggregate on each. Anything you SELECT must either be in GROUP BY or be an aggregate.',
            syntax: '<span class="kw">SELECT</span> category, <span class="fn">COUNT</span>(*) <span class="kw">AS</span> n\n<span class="kw">FROM</span> products\n<span class="kw">GROUP BY</span> category;'
          },
          { type: 'write',
            q: 'Count the number of orders per status.',
            expectedSql: 'SELECT status, COUNT(*) FROM orders GROUP BY status',
            hint: 'GROUP BY status, then COUNT(*).',
            explain: 'Two columns: the grouping column, and one or more aggregates over each group.'
          },
          { type: 'write',
            q: 'Total revenue per product category. Hint: you\'ll need a JOIN.',
            expectedSql: 'SELECT p.category, SUM(o.total) FROM orders o JOIN products p ON o.product_id = p.id GROUP BY p.category',
            hint: 'JOIN orders to products, then GROUP BY category.',
            explain: 'GROUP BY plays well with JOINs. Group by the readable label (category name), not the raw id.'
          }
        ]
      },
      {
        title: 'HAVING',
        exercises: [
          { type: 'intro',
            title: 'Filter the groups.',
            body: '<strong>WHERE</strong> filters rows <em>before</em> grouping. <strong>HAVING</strong> filters groups <em>after</em>. If your filter uses an aggregate, it has to be HAVING.',
            syntax: '<span class="kw">SELECT</span> user_id, <span class="fn">COUNT</span>(*) <span class="kw">AS</span> orders\n<span class="kw">FROM</span> orders\n<span class="kw">GROUP BY</span> user_id\n<span class="kw">HAVING</span> <span class="fn">COUNT</span>(*) > <span class="num">2</span>;'
          },
          { type: 'mc',
            q: 'You want users who have placed more than 2 orders. WHERE or HAVING?',
            choices: [
              'WHERE COUNT(*) > 2 — filters rows directly',
              'HAVING COUNT(*) > 2 — the filter uses an aggregate',
              'Either works in any database',
              'Both at the same time'
            ],
            correct: 1,
            explain: 'Aggregate filters belong in HAVING. WHERE runs before grouping, so it can\'t see COUNT(*).'
          },
          { type: 'write',
            q: 'Find users (user_id) who have placed more than 2 orders.',
            expectedSql: 'SELECT user_id, COUNT(*) FROM orders GROUP BY user_id HAVING COUNT(*) > 2',
            hint: 'GROUP BY user_id, then HAVING COUNT(*) > 2.',
            explain: 'Classic pattern: GROUP BY + HAVING for "users / items / categories with at least N of something."'
          }
        ]
      }
    ]
  },

  {
    id: 'joins',
    title: 'Joining Tables',
    icon: '🔗',
    lessons: [
      {
        title: 'INNER JOIN',
        exercises: [
          { type: 'intro',
            title: 'Combine related rows.',
            body: '<strong>INNER JOIN</strong> (or just JOIN) returns rows that have a match in both tables. Use <code>ON</code> to specify how they relate. Aliases (<code>u</code>, <code>o</code>) keep things short.',
            syntax: '<span class="kw">SELECT</span> u.name, o.total\n<span class="kw">FROM</span> users u\n<span class="kw">JOIN</span> orders o <span class="kw">ON</span> o.user_id = u.id;'
          },
          { type: 'fill',
            q: 'Show each order with the buyer\'s name.',
            template: '<span class="kw">SELECT</span> u.name, o.total\n<span class="kw">FROM</span> orders o\n{{0}} users u <span class="kw">ON</span> u.id = o.{{1}};',
            answers: ['JOIN', 'user_id'],
            alt: [['INNER JOIN', 'join'], []],
            explain: 'JOIN connects orders.user_id to users.id — the foreign-key relationship.'
          },
          { type: 'write',
            q: 'List each completed order with the user\'s name and the product name.',
            expectedSql: "SELECT u.name, p.name, o.total FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.id = o.product_id WHERE o.status = 'completed'",
            hint: 'Two JOINs: orders → users, orders → products.',
            explain: 'You can chain joins. Each JOIN adds one more table connected via ON.'
          }
        ]
      },
      {
        title: 'LEFT JOIN',
        exercises: [
          { type: 'intro',
            title: 'Keep rows without matches.',
            body: '<strong>LEFT JOIN</strong> keeps every row from the left table, even if there\'s no match on the right (those columns come back as <code>NULL</code>). Critical for "users without orders" or "products never bought."',
            syntax: '<span class="kw">SELECT</span> u.name, <span class="fn">COUNT</span>(o.id)\n<span class="kw">FROM</span> users u\n<span class="kw">LEFT JOIN</span> orders o <span class="kw">ON</span> o.user_id = u.id\n<span class="kw">GROUP BY</span> u.id;'
          },
          { type: 'mc',
            q: 'Why use LEFT JOIN here instead of INNER JOIN?',
            choices: [
              'It\'s always faster than INNER JOIN',
              'To include users who haven\'t placed any orders (their count would be 0)',
              'To get duplicate rows',
              'It removes NULL values automatically'
            ],
            correct: 1,
            explain: 'INNER JOIN drops users with no orders. LEFT JOIN keeps them, with NULLs in the order columns — exactly what you want for "show me everyone, including the inactive."'
          },
          { type: 'write',
            q: 'Find products that have never been ordered. Return product name only.',
            expectedSql: 'SELECT p.name FROM products p LEFT JOIN orders o ON o.product_id = p.id WHERE o.id IS NULL',
            hint: 'LEFT JOIN, then WHERE the orders side IS NULL.',
            explain: 'The LEFT JOIN + WHERE right-side IS NULL is the classic "anti-join" pattern.'
          }
        ]
      }
    ]
  },

  {
    id: 'advanced',
    title: 'Subqueries, CASE & Windows',
    icon: '🚀',
    lessons: [
      {
        title: 'Subqueries',
        exercises: [
          { type: 'intro',
            title: 'A query inside a query.',
            body: 'A <strong>subquery</strong> is a SELECT nested inside another SELECT. Useful when you need an intermediate value — like "users who spent more than the average."',
            syntax: '<span class="kw">SELECT</span> name, total\n<span class="kw">FROM</span> orders\n<span class="kw">WHERE</span> total > (\n  <span class="kw">SELECT</span> <span class="fn">AVG</span>(total) <span class="kw">FROM</span> orders\n);'
          },
          { type: 'write',
            q: 'Find products priced above the average product price.',
            expectedSql: 'SELECT * FROM products WHERE price > (SELECT AVG(price) FROM products)',
            hint: 'Subquery returns one number; compare with >.',
            explain: 'A scalar subquery returns one value. You can use it anywhere a value would go — in WHERE, SELECT, or even ORDER BY.'
          },
          { type: 'write',
            q: 'Find users who have placed at least one order. Use IN with a subquery.',
            expectedSql: 'SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)',
            hint: 'IN with a subquery that returns a list of user_ids.',
            explain: 'IN (subquery) works whenever the subquery returns a single column. Often interchangeable with EXISTS or JOIN.'
          }
        ]
      },
      {
        title: 'CASE expressions',
        exercises: [
          { type: 'intro',
            title: 'If/else inside SQL.',
            body: '<strong>CASE WHEN ... THEN ... ELSE ... END</strong> lets you branch on conditions. Great for bucketing, labeling, and conditional aggregation.',
            syntax: '<span class="kw">SELECT</span> name,\n  <span class="kw">CASE</span>\n    <span class="kw">WHEN</span> price >= <span class="num">50</span> <span class="kw">THEN</span> <span class="str">\'premium\'</span>\n    <span class="kw">WHEN</span> price >= <span class="num">20</span> <span class="kw">THEN</span> <span class="str">\'mid\'</span>\n    <span class="kw">ELSE</span> <span class="str">\'cheap\'</span>\n  <span class="kw">END</span> <span class="kw">AS</span> tier\n<span class="kw">FROM</span> products;'
          },
          { type: 'write',
            q: 'Bucket products into "expensive" (>= 50) or "affordable" (else). Return name and tier.',
            expectedSql: "SELECT name, CASE WHEN price >= 50 THEN 'expensive' ELSE 'affordable' END AS tier FROM products",
            hint: 'CASE WHEN ... THEN ... ELSE ... END.',
            explain: 'WHEN-clauses are checked top to bottom; the first match wins. ELSE catches everything else.'
          },
          { type: 'write',
            q: 'Conditional aggregation: count completed and pending orders in one row. Aliases: completed_count, pending_count.',
            expectedSql: "SELECT SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed_count, SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending_count FROM orders",
            hint: 'SUM(CASE WHEN ... THEN 1 ELSE 0 END) is the trick.',
            explain: 'Conditional aggregation is the most useful CASE pattern in analytics. It pivots multiple values into separate columns.'
          }
        ]
      },
      {
        title: 'Window functions',
        exercises: [
          { type: 'intro',
            title: 'Aggregates that don\'t collapse rows.',
            body: '<strong>Window functions</strong> compute a value across a set of rows related to the current row, without grouping. Great for rankings, running totals, and previous-row lookups.',
            syntax: '<span class="kw">SELECT</span> name, price,\n  <span class="fn">ROW_NUMBER</span>() <span class="kw">OVER</span> (\n    <span class="kw">PARTITION BY</span> category\n    <span class="kw">ORDER BY</span> price <span class="kw">DESC</span>\n  ) <span class="kw">AS</span> rank_in_cat\n<span class="kw">FROM</span> products;'
          },
          { type: 'write',
            q: 'Rank products within each category by price (highest first). Return name, category, price, and the rank as "rk".',
            expectedSql: 'SELECT name, category, price, ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rk FROM products',
            hint: 'ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC).',
            explain: 'PARTITION BY = "restart the rank for each value here". ORDER BY inside OVER = how to order within the partition.'
          },
          { type: 'mc',
            q: 'You want every order plus the running total of revenue over time. Which function?',
            choices: [
              'COUNT() OVER',
              'SUM(total) OVER (ORDER BY order_date)',
              'GROUP BY order_date',
              'LAG(total)'
            ],
            correct: 1,
            explain: 'SUM with OVER and an ORDER BY inside the window gives a running total — one of the most powerful patterns in SQL.'
          }
        ]
      },
      {
        title: 'CTEs (WITH)',
        exercises: [
          { type: 'intro',
            title: 'Name your subqueries.',
            body: 'A <strong>CTE</strong> (Common Table Expression) lets you name a subquery and reference it like a table. Makes complex queries readable. Multiple CTEs chain with commas.',
            syntax: '<span class="kw">WITH</span> top_users <span class="kw">AS</span> (\n  <span class="kw">SELECT</span> user_id, <span class="fn">SUM</span>(total) <span class="kw">AS</span> spend\n  <span class="kw">FROM</span> orders\n  <span class="kw">GROUP BY</span> user_id\n)\n<span class="kw">SELECT</span> * <span class="kw">FROM</span> top_users\n<span class="kw">WHERE</span> spend > <span class="num">100</span>;'
          },
          { type: 'write',
            q: 'Using a CTE, find users (user_id, total_spend) who have spent more than 100 in total.',
            expectedSql: 'WITH user_spend AS (SELECT user_id, SUM(total) AS total_spend FROM orders GROUP BY user_id) SELECT * FROM user_spend WHERE total_spend > 100',
            hint: 'WITH name AS ( ... ) SELECT FROM name WHERE ...',
            explain: 'CTEs are equivalent to subqueries but read top-to-bottom — much easier to debug step by step.'
          },
          { type: 'arrange',
            q: 'Order this CTE-based query.',
            chips: [
              'WITH monthly AS (',
              "SELECT strftime('%Y-%m', order_date) AS month, SUM(total) AS revenue",
              'FROM orders GROUP BY month',
              ')',
              'SELECT * FROM monthly ORDER BY month'
            ],
            correctOrder: [0, 1, 2, 3, 4],
            explain: 'A CTE has three pieces: WITH name AS (...), then a final SELECT that uses it.'
          }
        ]
      }
    ]
  },

  /* ═══ UNIT 6: INTERVIEW PATTERNS ═══ */
  {
    id: 'interview',
    title: 'Interview Patterns',
    icon: '🎯',
    lessons: [
      {
        title: 'Self-Joins',
        exercises: [
          { type: 'intro',
            title: 'Join a table to itself.',
            body: 'A <strong>self-join</strong> joins a table to itself using two aliases. Classic uses: comparing rows within the same table, finding hierarchies (employee/manager), or matching pairs.',
            syntax: '<span class="kw">SELECT</span> e.name <span class="kw">AS</span> employee,\n  m.name <span class="kw">AS</span> manager\n<span class="kw">FROM</span> employees e\n<span class="kw">LEFT JOIN</span> employees m\n  <span class="kw">ON</span> e.manager_id = m.id;'
          },
          { type: 'write',
            q: 'List each employee with their manager\'s name. Show employee_name and manager_name. Include employees with no manager (show NULL).',
            expectedSql: 'SELECT e.name AS employee_name, m.name AS manager_name FROM employees e LEFT JOIN employees m ON e.manager_id = m.id',
            hint: 'Self-join with LEFT JOIN so top-level managers still appear.',
            explain: 'The LEFT JOIN keeps rows where manager_id IS NULL (top of the hierarchy). Interviewers love this one.'
          },
          { type: 'write',
            q: 'Find employees who earn more than their direct manager. Return the employee name and their salary.',
            expectedSql: 'SELECT e.name, e.salary FROM employees e JOIN employees m ON e.manager_id = m.id WHERE e.salary > m.salary',
            hint: 'Join employee to manager, then WHERE employee salary > manager salary.',
            explain: 'This is a top-10 interview question. The trick is recognizing you need a self-join, not a subquery.'
          },
          { type: 'mc',
            q: 'You need to find all pairs of products in the same category. Which approach avoids duplicate pairs (A,B) and (B,A)?',
            choices: [
              'WHERE a.id = b.id',
              'WHERE a.id < b.id',
              'WHERE a.id != b.id',
              'WHERE a.id > b.id AND a.id < b.id'
            ],
            correct: 1,
            explain: 'a.id < b.id gives each pair exactly once. != gives duplicates (A,B and B,A). = gives only self-pairs.'
          }
        ]
      },
      {
        title: 'Nth Highest Value',
        exercises: [
          { type: 'intro',
            title: 'The classic "find the Nth" problem.',
            body: 'Finding the 2nd (or Nth) highest salary is one of the most common SQL interview questions. Multiple approaches: <strong>LIMIT/OFFSET</strong>, <strong>DENSE_RANK()</strong>, or <strong>correlated subquery</strong>.',
            syntax: '<span class="cm">-- Approach 1: LIMIT OFFSET</span>\n<span class="kw">SELECT DISTINCT</span> salary\n<span class="kw">FROM</span> employees\n<span class="kw">ORDER BY</span> salary <span class="kw">DESC</span>\n<span class="kw">LIMIT</span> <span class="num">1</span> <span class="kw">OFFSET</span> <span class="num">1</span>;\n\n<span class="cm">-- Approach 2: DENSE_RANK</span>\n<span class="kw">SELECT</span> * <span class="kw">FROM</span> (\n  <span class="kw">SELECT</span> *, <span class="fn">DENSE_RANK</span>() <span class="kw">OVER</span>(\n    <span class="kw">ORDER BY</span> salary <span class="kw">DESC</span>\n  ) <span class="kw">AS</span> rnk\n  <span class="kw">FROM</span> employees\n) <span class="kw">WHERE</span> rnk = <span class="num">2</span>;'
          },
          { type: 'write',
            q: 'Find the second highest distinct salary in the employees table. Return just the salary value.',
            expectedSql: 'SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1',
            ordered: true,
            hint: 'ORDER BY salary DESC, then OFFSET 1 to skip the first.',
            explain: 'OFFSET skips rows. DISTINCT handles ties. This is the simplest approach for "Nth highest."'
          },
          { type: 'write',
            q: 'Find the highest-paid employee in each department. Return department, name, and salary.',
            expectedSql: 'SELECT department, name, salary FROM employees WHERE (department, salary) IN (SELECT department, MAX(salary) FROM employees GROUP BY department)',
            hint: 'Subquery to get MAX salary per department, then match.',
            explain: 'Alternative: use ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) and filter rank = 1.'
          },
          { type: 'mc',
            q: 'What is the difference between RANK() and DENSE_RANK() when there are ties?',
            choices: [
              'RANK skips numbers after ties, DENSE_RANK does not',
              'DENSE_RANK skips numbers after ties, RANK does not',
              'They are identical',
              'RANK only works with PARTITION BY'
            ],
            correct: 0,
            explain: 'With salaries 100, 90, 90, 80: RANK gives 1,2,2,4. DENSE_RANK gives 1,2,2,3. Use DENSE_RANK for "Nth highest" to avoid skipping.'
          }
        ]
      },
      {
        title: 'Consecutive Days',
        exercises: [
          { type: 'intro',
            title: 'Gaps & islands: find streaks.',
            body: 'Finding consecutive login days is a classic "gaps and islands" problem. The trick: subtract a row number from the date. Consecutive dates produce the same group value.',
            syntax: '<span class="cm">-- The magic trick:</span>\n<span class="kw">SELECT</span> user_id, login_date,\n  <span class="fn">DATE</span>(login_date, \'-\' || \n    (<span class="fn">ROW_NUMBER</span>() <span class="kw">OVER</span>(\n      <span class="kw">PARTITION BY</span> user_id\n      <span class="kw">ORDER BY</span> login_date\n    ) - 1) || \' days\') <span class="kw">AS</span> grp\n<span class="kw">FROM</span> logins;'
          },
          { type: 'write',
            q: 'Count how many days each user logged in total. Return user_id and login_count, sorted by count descending.',
            expectedSql: 'SELECT user_id, COUNT(*) AS login_count FROM logins GROUP BY user_id ORDER BY login_count DESC',
            ordered: true,
            hint: 'GROUP BY user_id, COUNT(*), ORDER BY count DESC.',
            explain: 'Warm-up before the hard stuff. Always start with the simple aggregate to understand the data.'
          },
          { type: 'write',
            q: 'Find the longest consecutive login streak for user_id = 5. Return the streak length as max_streak.',
            expectedSql: "WITH numbered AS (SELECT login_date, DATE(login_date, '-' || (ROW_NUMBER() OVER (ORDER BY login_date) - 1) || ' days') AS grp FROM logins WHERE user_id = 5) SELECT MAX(cnt) AS max_streak FROM (SELECT grp, COUNT(*) AS cnt FROM numbered GROUP BY grp)",
            hint: 'Subtract row_number from date to create groups, then count per group, then MAX.',
            explain: 'The date-minus-rownum trick groups consecutive dates together. Each gap creates a new group value. This pattern appears in FAANG interviews constantly.'
          },
          { type: 'mc',
            q: 'Why does subtracting ROW_NUMBER from the date group consecutive days together?',
            choices: [
              'Because ROW_NUMBER always equals the day of month',
              'Because consecutive dates minus consecutive integers produce the same constant',
              'Because it converts dates to numbers automatically',
              'It only works with exactly 7 days'
            ],
            correct: 1,
            explain: 'Dates: Apr 1, Apr 2, Apr 3. Row nums: 1, 2, 3. Subtract: Mar 31, Mar 31, Mar 31. Same value = same streak!'
          }
        ]
      },
      {
        title: 'Running Totals & Cumulative',
        exercises: [
          { type: 'intro',
            title: 'Accumulate across rows.',
            body: 'Running totals, moving averages, and percent-of-total are bread-and-butter analytics queries. Window functions with <strong>ORDER BY</strong> inside OVER create cumulative calculations.',
            syntax: '<span class="kw">SELECT</span> order_date, total,\n  <span class="fn">SUM</span>(total) <span class="kw">OVER</span> (\n    <span class="kw">ORDER BY</span> order_date\n  ) <span class="kw">AS</span> running_total\n<span class="kw">FROM</span> orders;'
          },
          { type: 'write',
            q: 'Show each order with a running total of revenue (cumulative sum of total, ordered by order_date). Return order_date, total, and running_total.',
            expectedSql: 'SELECT order_date, total, SUM(total) OVER (ORDER BY order_date) AS running_total FROM orders',
            ordered: true,
            hint: 'SUM(total) OVER (ORDER BY order_date).',
            explain: 'ORDER BY inside OVER makes SUM cumulative. Without ORDER BY, it would just be the grand total on every row.'
          },
          { type: 'write',
            q: 'For each product, show its price and what percentage of the total product catalog price it represents. Return name, price, pct (rounded to 1 decimal).',
            expectedSql: 'SELECT name, price, ROUND(price * 100.0 / SUM(price) OVER (), 1) AS pct FROM products',
            hint: 'SUM(price) OVER () gives grand total. Divide each price by it.',
            explain: 'OVER() with no ORDER BY and no PARTITION BY = the entire table as one window. Perfect for percent-of-total.'
          },
          { type: 'write',
            q: 'Show each employee with the difference between their salary and the department average. Return name, department, salary, and diff (salary minus dept average).',
            expectedSql: 'SELECT name, department, salary, salary - AVG(salary) OVER (PARTITION BY department) AS diff FROM employees',
            hint: 'AVG(salary) OVER (PARTITION BY department) gives dept average per row.',
            explain: 'Comparing a row to its group average without GROUP BY collapsing rows. Window functions keep every row visible.'
          }
        ]
      }
    ]
  },

  /* ═══ UNIT 7: METRIC QUERIES ═══ */
  {
    id: 'metrics',
    title: 'Metric Queries',
    icon: '📊',
    lessons: [
      {
        title: 'Retention & Churn',
        exercises: [
          { type: 'intro',
            title: 'Are users coming back?',
            body: '<strong>Retention</strong> measures what fraction of users return after their first action. <strong>Day-N retention</strong>: of users who signed up on day X, how many were active N days later? This is THE metric PMs and analysts get asked about most.',
            syntax: '<span class="cm">-- Day-1 retention: users who logged in\n-- the day after their first login</span>\n<span class="kw">WITH</span> first_login <span class="kw">AS</span> (\n  <span class="kw">SELECT</span> user_id,\n    <span class="fn">MIN</span>(login_date) <span class="kw">AS</span> first_day\n  <span class="kw">FROM</span> logins\n  <span class="kw">GROUP BY</span> user_id\n)\n<span class="kw">SELECT</span>\n  <span class="fn">COUNT</span>(<span class="kw">DISTINCT</span> l.user_id) <span class="kw">AS</span> retained,\n  <span class="fn">COUNT</span>(<span class="kw">DISTINCT</span> f.user_id) <span class="kw">AS</span> total\n<span class="kw">FROM</span> first_login f\n<span class="kw">LEFT JOIN</span> logins l\n  <span class="kw">ON</span> l.user_id = f.user_id\n  <span class="kw">AND</span> l.login_date = <span class="fn">DATE</span>(f.first_day, \'+1 day\');'
          },
          { type: 'write',
            q: 'Find each user\'s first login date. Return user_id and first_login.',
            expectedSql: 'SELECT user_id, MIN(login_date) AS first_login FROM logins GROUP BY user_id',
            hint: 'MIN(login_date) grouped by user_id.',
            explain: 'First step of any retention query: identify the cohort anchor date (first login, signup, first purchase, etc.).'
          },
          { type: 'write',
            q: 'Calculate day-1 retention: how many users logged in exactly 1 day after their first login? Return retained_count.',
            expectedSql: "WITH first AS (SELECT user_id, MIN(login_date) AS first_day FROM logins GROUP BY user_id) SELECT COUNT(DISTINCT l.user_id) AS retained_count FROM first f JOIN logins l ON l.user_id = f.user_id AND l.login_date = DATE(f.first_day, '+1 day')",
            hint: 'CTE for first login, then JOIN back to logins where login_date = first_day + 1.',
            explain: 'JOIN (not LEFT JOIN) here because we only want users who DID come back. The count of matches = retained users.'
          },
          { type: 'mc',
            q: 'To compute retention RATE (not just count), what do you divide retained users by?',
            choices: [
              'Total logins in the period',
              'Total distinct users who had a first login in the cohort window',
              'Total rows in the logins table',
              'The number of days in the period'
            ],
            correct: 1,
            explain: 'Retention rate = retained / cohort size. The cohort is all users whose first login falls in your analysis window.'
          }
        ]
      },
      {
        title: 'Funnel Conversion',
        exercises: [
          { type: 'intro',
            title: 'Where do users drop off?',
            body: 'A <strong>funnel</strong> measures progression through steps: page_view → add_to_cart → purchase. The drop-off between steps reveals where the product bleeds users. Conditional aggregation makes this a single query.',
            syntax: '<span class="kw">SELECT</span>\n  <span class="fn">COUNT</span>(<span class="kw">DISTINCT CASE WHEN</span> event_type = <span class="str">\'page_view\'</span>\n    <span class="kw">THEN</span> user_id <span class="kw">END</span>) <span class="kw">AS</span> viewed,\n  <span class="fn">COUNT</span>(<span class="kw">DISTINCT CASE WHEN</span> event_type = <span class="str">\'add_to_cart\'</span>\n    <span class="kw">THEN</span> user_id <span class="kw">END</span>) <span class="kw">AS</span> carted,\n  <span class="fn">COUNT</span>(<span class="kw">DISTINCT CASE WHEN</span> event_type = <span class="str">\'purchase\'</span>\n    <span class="kw">THEN</span> user_id <span class="kw">END</span>) <span class="kw">AS</span> purchased\n<span class="kw">FROM</span> events;'
          },
          { type: 'write',
            q: 'Build a conversion funnel from the events table. Count distinct users at each stage: viewed (page_view), carted (add_to_cart), purchased (purchase).',
            expectedSql: "SELECT COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN user_id END) AS viewed, COUNT(DISTINCT CASE WHEN event_type = 'add_to_cart' THEN user_id END) AS carted, COUNT(DISTINCT CASE WHEN event_type = 'purchase' THEN user_id END) AS purchased FROM events",
            hint: 'COUNT(DISTINCT CASE WHEN ... THEN user_id END) for each step.',
            explain: 'This single-query funnel is the go-to pattern. Each CASE expression filters to one event type, COUNT DISTINCT gives unique users at that stage.'
          },
          { type: 'write',
            q: 'Using the sessions table, what is the overall conversion rate? Return conversion_rate as a percentage rounded to 1 decimal.',
            expectedSql: 'SELECT ROUND(SUM(converted) * 100.0 / COUNT(*), 1) AS conversion_rate FROM sessions',
            hint: 'SUM(converted) / COUNT(*) * 100.',
            explain: 'When you have a binary converted flag, SUM gives you the count of conversions. Divide by total sessions for rate.'
          },
          { type: 'write',
            q: 'Find the conversion rate for sessions with 5+ pages viewed vs fewer than 5. Return a category column and conversion_rate.',
            expectedSql: "SELECT CASE WHEN pages_viewed >= 5 THEN 'high_engagement' ELSE 'low_engagement' END AS category, ROUND(SUM(converted) * 100.0 / COUNT(*), 1) AS conversion_rate FROM sessions GROUP BY category",
            hint: 'CASE to bucket, then GROUP BY the bucket, then SUM/COUNT for rate.',
            explain: 'Segmented conversion analysis. PMs use this to identify which user behaviors predict conversion.'
          }
        ]
      },
      {
        title: 'Cohort Analysis',
        exercises: [
          { type: 'intro',
            title: 'Group users by when they started.',
            body: 'A <strong>cohort</strong> is a group of users who share a start date (signup month, first purchase week, etc.). Cohort analysis tracks how each group behaves over time — the gold standard for measuring product health.',
            syntax: '<span class="cm">-- Monthly signup cohorts + their order count</span>\n<span class="kw">SELECT</span>\n  <span class="fn">strftime</span>(<span class="str">\'%Y-%m\'</span>, u.signup_date) <span class="kw">AS</span> cohort,\n  <span class="fn">COUNT</span>(<span class="kw">DISTINCT</span> o.id) <span class="kw">AS</span> orders\n<span class="kw">FROM</span> users u\n<span class="kw">LEFT JOIN</span> orders o <span class="kw">ON</span> o.user_id = u.id\n<span class="kw">GROUP BY</span> cohort;'
          },
          { type: 'write',
            q: 'Create monthly signup cohorts. For each cohort (YYYY-MM of signup_date), count how many users signed up. Return cohort and user_count.',
            expectedSql: "SELECT strftime('%Y-%m', signup_date) AS cohort, COUNT(*) AS user_count FROM users GROUP BY cohort",
            hint: "strftime('%Y-%m', signup_date) extracts year-month.",
            explain: 'Step 1 of cohort analysis: define your cohorts. Month of signup is the most common grouping.'
          },
          { type: 'write',
            q: 'For each signup cohort (month), calculate total revenue generated. Return cohort and revenue. Include cohorts with 0 revenue.',
            expectedSql: "SELECT strftime('%Y-%m', u.signup_date) AS cohort, COALESCE(SUM(o.total), 0) AS revenue FROM users u LEFT JOIN orders o ON o.user_id = u.id GROUP BY cohort",
            hint: 'LEFT JOIN users to orders, GROUP BY signup month, SUM total with COALESCE for 0.',
            explain: 'LEFT JOIN ensures cohorts with no orders still appear (with 0 revenue). COALESCE turns NULL sums into 0.'
          },
          { type: 'mc',
            q: 'Why use LEFT JOIN (not INNER JOIN) when building cohort revenue?',
            choices: [
              'LEFT JOIN is always faster',
              'To include cohorts where no one has ordered yet (they would be dropped by INNER JOIN)',
              'INNER JOIN does not support GROUP BY',
              'LEFT JOIN automatically adds 0 for missing values'
            ],
            correct: 1,
            explain: 'If a cohort of users made zero purchases, INNER JOIN drops them entirely. LEFT JOIN keeps them with NULL totals — which COALESCE turns to 0.'
          }
        ]
      },
      {
        title: 'A/B Test Queries',
        exercises: [
          { type: 'intro',
            title: 'Measure experiment results.',
            body: 'A/B test analysis in SQL means splitting users into groups and comparing metrics. You need: group assignment, metric calculation per group, and statistical comparison. The SQL part focuses on getting clean aggregates per variant.',
            syntax: '<span class="cm">-- Compare conversion by user plan (as proxy for A/B)</span>\n<span class="kw">SELECT</span>\n  u.plan <span class="kw">AS</span> variant,\n  <span class="fn">COUNT</span>(<span class="kw">DISTINCT</span> u.id) <span class="kw">AS</span> users,\n  <span class="fn">COUNT</span>(<span class="kw">DISTINCT</span> o.id) <span class="kw">AS</span> orders,\n  <span class="fn">ROUND</span>(\n    <span class="fn">COUNT</span>(<span class="kw">DISTINCT</span> o.id) * 1.0 /\n    <span class="fn">COUNT</span>(<span class="kw">DISTINCT</span> u.id), 3\n  ) <span class="kw">AS</span> orders_per_user\n<span class="kw">FROM</span> users u\n<span class="kw">LEFT JOIN</span> orders o <span class="kw">ON</span> o.user_id = u.id\n<span class="kw">GROUP BY</span> u.plan;'
          },
          { type: 'write',
            q: 'Compare pro vs free users: for each plan, show user_count, total_orders, and avg_order_value (rounded to 2 decimals).',
            expectedSql: "SELECT u.plan, COUNT(DISTINCT u.id) AS user_count, COUNT(o.id) AS total_orders, ROUND(AVG(o.total), 2) AS avg_order_value FROM users u LEFT JOIN orders o ON o.user_id = u.id GROUP BY u.plan",
            hint: 'LEFT JOIN users to orders, GROUP BY plan, use COUNT and AVG.',
            explain: 'This is the shape of every A/B test result query: split by variant, compute metrics per group, compare.'
          },
          { type: 'write',
            q: 'For each user plan (variant), calculate the purchase conversion rate: the percentage of users who made at least one completed order. Return plan, users, buyers, and conversion_rate (rounded to 1 decimal).',
            expectedSql: "SELECT u.plan, COUNT(DISTINCT u.id) AS users, COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN u.id END) AS buyers, ROUND(COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN u.id END) * 100.0 / COUNT(DISTINCT u.id), 1) AS conversion_rate FROM users u LEFT JOIN orders o ON o.user_id = u.id GROUP BY u.plan",
            hint: 'COUNT DISTINCT users who have at least one completed order / total users * 100.',
            explain: 'The key insight: COUNT(DISTINCT CASE WHEN condition THEN user_id END) counts unique users meeting a condition. Dividing by total users gives the rate.'
          },
          { type: 'mc',
            q: 'In an A/B test query, why is it critical to use COUNT(DISTINCT user_id) rather than COUNT(*)?',
            choices: [
              'COUNT(*) is slower',
              'Users with multiple orders would be over-counted, inflating the conversion denominator',
              'COUNT(*) does not work with LEFT JOIN',
              'DISTINCT is required by SQL syntax for A/B tests'
            ],
            correct: 1,
            explain: 'A user who ordered 5 times is still 1 converter. COUNT(*) would count their 5 order rows, making conversion look higher than reality. Always think "per user" not "per row."'
          }
        ]
      }
    ]
  },

  /* ═══ UNIT 8: HARD PROBLEMS ═══ */
  {
    id: 'hard',
    title: 'Hard Problems',
    icon: '💀',
    lessons: [
      {
        title: 'Recursive CTEs',
        exercises: [
          { type: 'intro',
            title: 'Queries that call themselves.',
            body: 'A <strong>recursive CTE</strong> has a base case and a recursive step joined by UNION ALL. It keeps running until no new rows are produced. Used for: hierarchies (org charts), generating series, and graph traversal.',
            syntax: '<span class="cm">-- Generate numbers 1-10</span>\n<span class="kw">WITH RECURSIVE</span> nums(n) <span class="kw">AS</span> (\n  <span class="kw">SELECT</span> <span class="num">1</span>\n  <span class="kw">UNION ALL</span>\n  <span class="kw">SELECT</span> n + <span class="num">1</span> <span class="kw">FROM</span> nums\n  <span class="kw">WHERE</span> n < <span class="num">10</span>\n)\n<span class="kw">SELECT</span> * <span class="kw">FROM</span> nums;'
          },
          { type: 'write',
            q: 'Use a recursive CTE to generate a sequence of dates from 2025-04-01 to 2025-04-07. Return each date as dt.',
            expectedSql: "WITH RECURSIVE dates(dt) AS (SELECT '2025-04-01' UNION ALL SELECT DATE(dt, '+1 day') FROM dates WHERE dt < '2025-04-07') SELECT dt FROM dates",
            ordered: true,
            hint: 'Base case: first date. Recursive: DATE(dt, \'+1 day\') WHERE dt < end.',
            explain: 'Generating a date series is useful for finding gaps (days with no activity). This is how you create a calendar table on the fly.'
          },
          { type: 'write',
            q: 'Walk the employee org chart: starting from Alice Chen (id=1), find all her reports (direct and indirect). Return employee name and level (Alice = 0, her directs = 1, etc.).',
            expectedSql: "WITH RECURSIVE org(id, name, lvl) AS (SELECT id, name, 0 FROM employees WHERE id = 1 UNION ALL SELECT e.id, e.name, o.lvl + 1 FROM employees e JOIN org o ON e.manager_id = o.id) SELECT name, lvl AS level FROM org WHERE lvl > 0",
            ordered: false,
            hint: 'Base: Alice at level 0. Recursive: JOIN employees where manager_id = current id, increment level.',
            explain: 'Recursive CTEs are the SQL way to traverse trees. Start at root, join children repeatedly until no more are found.'
          },
          { type: 'mc',
            q: 'What stops a recursive CTE from running forever?',
            choices: [
              'It always stops after 100 iterations',
              'The WHERE clause in the recursive step eventually produces no new rows',
              'UNION ALL has a built-in limit',
              'The database kills it after 5 seconds'
            ],
            correct: 1,
            explain: 'The recursion terminates when the recursive SELECT returns 0 rows. Your WHERE clause must eventually become false — otherwise you get an infinite loop (and most DBs have a safety limit).'
          }
        ]
      },
      {
        title: 'LEAD, LAG & Deltas',
        exercises: [
          { type: 'intro',
            title: 'Compare a row to its neighbors.',
            body: '<strong>LAG(col, n)</strong> looks at the previous row. <strong>LEAD(col, n)</strong> looks at the next. Perfect for period-over-period growth, time between events, and detecting changes.',
            syntax: '<span class="kw">SELECT</span> order_date, total,\n  <span class="fn">LAG</span>(total) <span class="kw">OVER</span> (<span class="kw">ORDER BY</span> order_date) <span class="kw">AS</span> prev_total,\n  total - <span class="fn">LAG</span>(total) <span class="kw">OVER</span> (<span class="kw">ORDER BY</span> order_date) <span class="kw">AS</span> change\n<span class="kw">FROM</span> orders;'
          },
          { type: 'write',
            q: 'For each order (sorted by order_date), show the order_date, total, and the previous order\'s total as prev_total.',
            expectedSql: 'SELECT order_date, total, LAG(total) OVER (ORDER BY order_date) AS prev_total FROM orders',
            ordered: true,
            hint: 'LAG(total) OVER (ORDER BY order_date).',
            explain: 'LAG looks back 1 row by default. The first row gets NULL since there is no previous row.'
          },
          { type: 'write',
            q: 'Calculate day-over-day revenue change. Show order_date, total, and delta (current total minus previous total). Order by date.',
            expectedSql: 'SELECT order_date, total, total - LAG(total) OVER (ORDER BY order_date) AS delta FROM orders ORDER BY order_date',
            ordered: true,
            hint: 'total minus LAG(total).',
            explain: 'The delta pattern: current minus LAG. Positive = growth, negative = decline. This is how dashboards compute daily change.'
          },
          { type: 'write',
            q: 'For each employee, show their name, salary, and the next-higher salary in the company as next_salary (use LEAD ordered by salary ASC).',
            expectedSql: 'SELECT name, salary, LEAD(salary) OVER (ORDER BY salary) AS next_salary FROM employees',
            ordered: true,
            hint: 'LEAD(salary) OVER (ORDER BY salary).',
            explain: 'LEAD looks forward. ORDER BY salary ASC means "next higher salary." The highest-paid person gets NULL for next_salary.'
          }
        ]
      },
      {
        title: 'Pivot & Unpivot',
        exercises: [
          { type: 'intro',
            title: 'Reshape data from rows to columns.',
            body: '<strong>Pivoting</strong> turns row values into columns (e.g., one column per status). SQL doesn\'t have native PIVOT in SQLite, but <strong>conditional aggregation</strong> (CASE + GROUP BY) does the same thing. This is critical for dashboards and reports.',
            syntax: '<span class="kw">SELECT</span> user_id,\n  <span class="fn">SUM</span>(<span class="kw">CASE WHEN</span> status = <span class="str">\'completed\'</span>\n    <span class="kw">THEN</span> total <span class="kw">ELSE</span> <span class="num">0</span> <span class="kw">END</span>) <span class="kw">AS</span> completed_rev,\n  <span class="fn">SUM</span>(<span class="kw">CASE WHEN</span> status = <span class="str">\'pending\'</span>\n    <span class="kw">THEN</span> total <span class="kw">ELSE</span> <span class="num">0</span> <span class="kw">END</span>) <span class="kw">AS</span> pending_rev\n<span class="kw">FROM</span> orders\n<span class="kw">GROUP BY</span> user_id;'
          },
          { type: 'write',
            q: 'Pivot the orders table: for each user_id, show completed_orders (count of completed), pending_orders, and cancelled_orders as separate columns.',
            expectedSql: "SELECT user_id, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_orders, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_orders, SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders FROM orders GROUP BY user_id",
            hint: 'SUM(CASE WHEN status = X THEN 1 ELSE 0 END) for each status.',
            explain: 'Conditional aggregation IS the pivot. Each CASE expression becomes one output column. GROUP BY collapses rows per entity.'
          },
          { type: 'write',
            q: 'Create a monthly revenue summary: for each month (YYYY-MM of order_date), show total_revenue and order_count. Order by month.',
            expectedSql: "SELECT strftime('%Y-%m', order_date) AS month, SUM(total) AS total_revenue, COUNT(*) AS order_count FROM orders GROUP BY month ORDER BY month",
            ordered: true,
            hint: "strftime('%Y-%m', order_date) for month extraction.",
            explain: 'Time-series aggregation is the backbone of every analytics dashboard. Always GROUP BY the time bucket.'
          },
          { type: 'write',
            q: 'Pivot product categories: show a single row with columns stationery_count, electronics_count, home_count, and apparel_count.',
            expectedSql: "SELECT SUM(CASE WHEN category = 'stationery' THEN 1 ELSE 0 END) AS stationery_count, SUM(CASE WHEN category = 'electronics' THEN 1 ELSE 0 END) AS electronics_count, SUM(CASE WHEN category = 'home' THEN 1 ELSE 0 END) AS home_count, SUM(CASE WHEN category = 'apparel' THEN 1 ELSE 0 END) AS apparel_count FROM products",
            hint: 'No GROUP BY needed for a single summary row.',
            explain: 'Without GROUP BY, all rows collapse into one. Each CASE filters for one category. This is how you build one-row summary cards.'
          }
        ]
      },
      {
        title: 'Optimization Patterns',
        exercises: [
          { type: 'intro',
            title: 'Write queries that perform.',
            body: 'Interview SQL isn\'t just about correctness — they want to see you think about <strong>performance</strong>. Key ideas: EXISTS vs IN, avoiding SELECT *, indexed lookups, and minimizing joins on large tables.',
            syntax: '<span class="cm">-- EXISTS is often faster than IN for large subqueries</span>\n<span class="kw">SELECT</span> * <span class="kw">FROM</span> users u\n<span class="kw">WHERE EXISTS</span> (\n  <span class="kw">SELECT</span> <span class="num">1</span> <span class="kw">FROM</span> orders o\n  <span class="kw">WHERE</span> o.user_id = u.id\n);\n\n<span class="cm">-- vs (functionally same, potentially slower)</span>\n<span class="kw">SELECT</span> * <span class="kw">FROM</span> users\n<span class="kw">WHERE</span> id <span class="kw">IN</span> (\n  <span class="kw">SELECT</span> user_id <span class="kw">FROM</span> orders\n);'
          },
          { type: 'mc',
            q: 'When is EXISTS generally faster than IN with a subquery?',
            choices: [
              'Always — EXISTS is newer and optimized',
              'When the subquery returns many duplicate rows (EXISTS short-circuits per outer row)',
              'When the outer table is empty',
              'They are always identical in performance'
            ],
            correct: 1,
            explain: 'EXISTS stops scanning as soon as it finds ONE match for each outer row. IN must fully materialize the subquery result set. With many duplicates, EXISTS wins big.'
          },
          { type: 'write',
            q: 'Rewrite this using EXISTS: SELECT * FROM users WHERE id IN (SELECT user_id FROM orders). Return all users who have at least one order.',
            expectedSql: 'SELECT * FROM users u WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id)',
            hint: 'WHERE EXISTS (SELECT 1 FROM orders WHERE user_id = u.id).',
            explain: 'SELECT 1 (not SELECT *) inside EXISTS is convention — the database only checks if a row exists, not what it contains.'
          },
          { type: 'mc',
            q: 'You have a query: SELECT * FROM orders WHERE user_id IN (SELECT id FROM users WHERE country = \'US\'). What index would help most?',
            choices: [
              'Index on orders.total',
              'Index on users.country (to speed up the subquery filter)',
              'Index on orders.order_date',
              'Index on users.name'
            ],
            correct: 1,
            explain: 'The subquery scans users WHERE country = \'US\'. An index on users.country makes that lookup instant instead of a full table scan. Always index your WHERE clause columns.'
          },
          { type: 'mc',
            q: 'Which practice helps query performance the most?',
            choices: [
              'Always use SELECT * for simplicity',
              'Select only the columns you need, and filter early with WHERE before joining',
              'Put all logic in a single massive query with no CTEs',
              'Avoid indexes because they slow down writes'
            ],
            correct: 1,
            explain: 'Selecting fewer columns reduces I/O. Filtering early (WHERE before JOIN) shrinks the dataset before expensive join operations. CTEs help readability without hurting performance in most engines.'
          }
        ]
      }
    ]
  },

  /* ═══ UNIT 9: ADVANCED WINDOW FUNCTIONS ═══ */
  {
    id: 'adv_windows',
    title: 'Advanced Windows',
    icon: '🪟',
    lessons: [
      {
        title: 'NTILE & Percentiles',
        exercises: [
          { type: 'intro',
            title: 'Bucket rows into equal groups.',
            body: '<strong>NTILE(n)</strong> divides rows into n roughly-equal buckets, numbered 1 through n. Use it for percentiles, quartiles, and distribution analysis. Critical for: salary bands, performance tiers, and customer segmentation.',
            syntax: '<span class="kw">SELECT</span> name, salary,\n  <span class="fn">NTILE</span>(<span class="num">4</span>) <span class="kw">OVER</span> (<span class="kw">ORDER BY</span> salary) <span class="kw">AS</span> quartile\n<span class="kw">FROM</span> employees;'
          },
          { type: 'write',
            q: 'Divide employees into 4 salary quartiles. Show name, salary, and quartile. Order by salary.',
            expectedSql: 'SELECT name, salary, NTILE(4) OVER (ORDER BY salary) AS quartile FROM employees ORDER BY salary',
            ordered: true,
            hint: 'NTILE(4) OVER (ORDER BY salary).',
            explain: 'Quartile 1 = lowest 25%, quartile 4 = top 25%. Interviewers love asking about percentile-based segmentation.'
          },
          { type: 'write',
            q: 'Rank products by price into 3 tiers (budget=1, mid=2, premium=3). Show name, price, and tier.',
            expectedSql: 'SELECT name, price, NTILE(3) OVER (ORDER BY price) AS tier FROM products',
            ordered: false,
            hint: 'NTILE(3) OVER (ORDER BY price).',
            explain: 'NTILE is the fastest way to create tiered segments. No need for CASE + manual thresholds.'
          },
          { type: 'mc',
            q: 'NTILE(4) applied to 10 rows will produce buckets of sizes:',
            choices: ['2, 2, 2, 4', '3, 3, 2, 2', '2, 3, 2, 3', '2, 2, 3, 3'],
            correct: 1,
            explain: '10 / 4 = 2.5, so the first 2 buckets get 3 rows, the last 2 get 2 rows. NTILE distributes extras to the earliest buckets.'
          }
        ]
      },
      {
        title: 'Frame Clauses (ROWS BETWEEN)',
        exercises: [
          { type: 'intro',
            title: 'Control the window frame precisely.',
            body: 'By default, window functions look at all rows in the partition. <strong>ROWS BETWEEN</strong> lets you specify exactly which rows to include: N PRECEDING, CURRENT ROW, N FOLLOWING, or UNBOUNDED. This powers <strong>moving averages</strong>, <strong>trailing sums</strong>, and <strong>look-ahead</strong> calculations.',
            syntax: '<span class="kw">SELECT</span> order_date, total,\n  <span class="fn">AVG</span>(total) <span class="kw">OVER</span> (\n    <span class="kw">ORDER BY</span> order_date\n    <span class="kw">ROWS BETWEEN</span> <span class="num">2</span> <span class="kw">PRECEDING AND CURRENT ROW</span>\n  ) <span class="kw">AS</span> moving_avg_3\n<span class="kw">FROM</span> orders;'
          },
          { type: 'write',
            q: 'Calculate a 3-order moving average of totals. Show order_date, total, and moving_avg (average of current + 2 preceding). Order by date.',
            expectedSql: 'SELECT order_date, total, AVG(total) OVER (ORDER BY order_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS moving_avg FROM orders ORDER BY order_date',
            ordered: true,
            hint: 'ROWS BETWEEN 2 PRECEDING AND CURRENT ROW.',
            explain: 'Moving averages smooth noisy data. The 3-period moving average is used constantly in dashboards and financial reporting.'
          },
          { type: 'write',
            q: 'For each order, calculate a running total of all orders up to that point. Show order_date, total, and running_total. Order by date.',
            expectedSql: 'SELECT order_date, total, SUM(total) OVER (ORDER BY order_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total FROM orders ORDER BY order_date',
            ordered: true,
            hint: 'ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW.',
            explain: 'Running total = cumulative sum. UNBOUNDED PRECEDING means "from the very first row." This is how you compute YTD revenue, cumulative users, etc.'
          },
          { type: 'fill',
            q: 'Complete the frame clause to include the current row plus 1 row before and 1 after (3-row centered window):\nAVG(salary) OVER (ORDER BY salary {{0}} {{1}} AND {{2}})',
            answers: ['ROWS BETWEEN 1 PRECEDING', 'CURRENT ROW', '1 FOLLOWING'],
            explain: 'A centered window looks both backward and forward. Useful for smoothing time series without lag bias.'
          }
        ]
      },
      {
        title: 'PERCENT_RANK & CUME_DIST',
        exercises: [
          { type: 'intro',
            title: 'Where does each row fall in the distribution?',
            body: '<strong>PERCENT_RANK()</strong> = (rank - 1) / (total - 1), returns 0 to 1. <strong>CUME_DIST()</strong> = count of rows <= current / total rows. Both are essential for understanding distributions, identifying outliers, and benchmarking.',
            syntax: '<span class="kw">SELECT</span> name, salary,\n  <span class="fn">PERCENT_RANK</span>() <span class="kw">OVER</span> (<span class="kw">ORDER BY</span> salary) <span class="kw">AS</span> pct_rank,\n  <span class="fn">CUME_DIST</span>() <span class="kw">OVER</span> (<span class="kw">ORDER BY</span> salary) <span class="kw">AS</span> cume_dist\n<span class="kw">FROM</span> employees;'
          },
          { type: 'write',
            q: 'Show each employee\'s salary percentile. Return name, salary, and pct_rank (using PERCENT_RANK, ordered by salary). Order output by salary DESC.',
            expectedSql: 'SELECT name, salary, PERCENT_RANK() OVER (ORDER BY salary) AS pct_rank FROM employees ORDER BY salary DESC',
            ordered: true,
            hint: 'PERCENT_RANK() OVER (ORDER BY salary).',
            explain: 'PERCENT_RANK = 0 for the lowest, 1 for the highest. In interviews, you might be asked "find employees above the 75th percentile" — filter WHERE pct_rank > 0.75.'
          },
          { type: 'write',
            q: 'Find products where the price is above the 50th percentile (top half). Show name and price. Use PERCENT_RANK.',
            expectedSql: "SELECT name, price FROM (SELECT name, price, PERCENT_RANK() OVER (ORDER BY price) AS pr FROM products) WHERE pr > 0.5",
            hint: 'Wrap in a subquery, then WHERE pr > 0.5.',
            explain: 'You can\'t use window functions directly in WHERE, so wrap in a subquery or CTE first. This pattern comes up constantly.'
          },
          { type: 'mc',
            q: 'PERCENT_RANK returns 0.0 for the lowest value and 1.0 for the highest. CUME_DIST for the lowest value in a 10-row set returns:',
            choices: ['0.0', '0.1', '0.5', '1.0'],
            correct: 1,
            explain: 'CUME_DIST = count of rows <= current / total = 1/10 = 0.1. CUME_DIST is always > 0 (unlike PERCENT_RANK which starts at 0).'
          }
        ]
      }
    ]
  },

  /* ═══ UNIT 10: QUERY OPTIMIZATION ═══ */
  {
    id: 'optimization',
    title: 'Query Optimization',
    icon: '⚡',
    lessons: [
      {
        title: 'EXPLAIN & Query Plans',
        exercises: [
          { type: 'intro',
            title: 'Read how the database thinks.',
            body: '<strong>EXPLAIN QUERY PLAN</strong> (SQLite) or <strong>EXPLAIN ANALYZE</strong> (Postgres) shows you HOW the database will execute your query: which tables it scans, which indexes it uses, and the estimated cost. Understanding this is what separates junior from senior SQL writers.',
            syntax: '<span class="kw">EXPLAIN QUERY PLAN</span>\n<span class="kw">SELECT</span> * <span class="kw">FROM</span> orders\n<span class="kw">WHERE</span> user_id = <span class="num">1</span>;\n\n<span class="cm">-- Output: SCAN orders (no index)\n-- With index: SEARCH orders USING INDEX ...</span>'
          },
          { type: 'mc',
            q: 'You see "SCAN TABLE orders" in your EXPLAIN output. What does this mean?',
            choices: [
              'The query is using an index efficiently',
              'The database is reading every row in the table (full table scan)',
              'The query will fail',
              'The table is empty'
            ],
            correct: 1,
            explain: 'SCAN = full table scan = reading every single row. For large tables, this is slow. You want to see SEARCH USING INDEX instead.'
          },
          { type: 'mc',
            q: 'Which column should you index first to optimize: SELECT * FROM orders WHERE status = \'completed\' AND order_date > \'2025-04-01\'?',
            choices: [
              'orders.total (used in SELECT)',
              'orders.status (low cardinality: few distinct values)',
              'orders.order_date (high cardinality: many distinct values, used in range filter)',
              'orders.id (primary key, already indexed)'
            ],
            correct: 2,
            explain: 'For range queries (>, <, BETWEEN), index the range column. High cardinality columns (many distinct values) benefit most from indexes. A composite index on (status, order_date) would be even better.'
          },
          { type: 'write',
            q: 'Run EXPLAIN QUERY PLAN on: SELECT name FROM users WHERE country = \'US\'. Return the plan output.',
            expectedSql: "EXPLAIN QUERY PLAN SELECT name FROM users WHERE country = 'US'",
            hint: 'Just prepend EXPLAIN QUERY PLAN to the query.',
            explain: 'In interviews, saying "I\'d run EXPLAIN to check the query plan" shows performance awareness. The output tells you if you need an index.'
          }
        ]
      },
      {
        title: 'Rewriting for Performance',
        exercises: [
          { type: 'intro',
            title: 'Same results, faster execution.',
            body: 'Many slow queries can be rewritten to be fast: <strong>filter early</strong> (WHERE before JOIN), <strong>avoid correlated subqueries</strong> (use JOINs instead), <strong>use EXISTS over IN</strong> for large sets, and <strong>pre-aggregate</strong> before joining.',
            syntax: '<span class="cm">-- Slow: correlated subquery runs once per row</span>\n<span class="kw">SELECT</span> name, (<span class="kw">SELECT COUNT</span>(*) <span class="kw">FROM</span> orders o <span class="kw">WHERE</span> o.user_id = u.id) <span class="kw">AS</span> cnt\n<span class="kw">FROM</span> users u;\n\n<span class="cm">-- Fast: JOIN with pre-aggregated subquery</span>\n<span class="kw">SELECT</span> u.name, <span class="fn">COALESCE</span>(oc.cnt, 0) <span class="kw">AS</span> cnt\n<span class="kw">FROM</span> users u\n<span class="kw">LEFT JOIN</span> (<span class="kw">SELECT</span> user_id, <span class="fn">COUNT</span>(*) <span class="kw">AS</span> cnt <span class="kw">FROM</span> orders <span class="kw">GROUP BY</span> user_id) oc\n  <span class="kw">ON</span> u.id = oc.user_id;'
          },
          { type: 'write',
            q: 'Rewrite this correlated subquery as a JOIN: SELECT name, (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count FROM users u. Use LEFT JOIN to keep users with 0 orders.',
            expectedSql: 'SELECT u.name, COALESCE(oc.order_count, 0) AS order_count FROM users u LEFT JOIN (SELECT user_id, COUNT(*) AS order_count FROM orders GROUP BY user_id) oc ON u.id = oc.user_id',
            hint: 'Pre-aggregate orders into a subquery, then LEFT JOIN.',
            explain: 'The JOIN version runs the COUNT once for all users. The correlated version runs it once PER user. On 1M users, that is the difference between 1 query and 1 million.'
          },
          { type: 'write',
            q: 'Find all users who have placed at least one order. Use EXISTS (not IN).',
            expectedSql: 'SELECT * FROM users u WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id)',
            hint: 'WHERE EXISTS (SELECT 1 FROM orders WHERE user_id = u.id).',
            explain: 'EXISTS short-circuits: it stops as soon as it finds one match. IN must build the full result set first.'
          },
          { type: 'mc',
            q: 'You need to join a 10M-row orders table with a 5K-row products table. Which approach is fastest?',
            choices: [
              'JOIN orders ON products without filtering first',
              'Filter orders with WHERE first, then JOIN the smaller result to products',
              'Use a correlated subquery for each product',
              'SELECT * from both tables and filter in application code'
            ],
            correct: 1,
            explain: 'Filter early, join late. Reducing the orders table from 10M to (say) 50K rows BEFORE the join is dramatically faster. This is called "predicate pushdown."'
          }
        ]
      },
      {
        title: 'Anti-Patterns to Avoid',
        exercises: [
          { type: 'intro',
            title: 'The queries that get you rejected.',
            body: 'Interviewers specifically watch for these performance anti-patterns: <strong>SELECT *</strong> in production queries, <strong>functions on indexed columns</strong> in WHERE (kills the index), <strong>OR across different columns</strong> (prevents index use), and <strong>implicit type conversion</strong>.',
            syntax: '<span class="cm">-- BAD: function on indexed column</span>\n<span class="kw">WHERE</span> <span class="fn">YEAR</span>(order_date) = <span class="num">2025</span>\n\n<span class="cm">-- GOOD: range preserves index</span>\n<span class="kw">WHERE</span> order_date >= <span class="str">\'2025-01-01\'</span>\n  <span class="kw">AND</span> order_date < <span class="str">\'2026-01-01\'</span>'
          },
          { type: 'mc',
            q: 'Why does WHERE YEAR(order_date) = 2025 prevent index usage on order_date?',
            choices: [
              'YEAR() is not a valid SQL function',
              'Wrapping a column in a function means the DB must compute YEAR() for every row before comparing',
              'You need to cast the result to an integer first',
              'Indexes only work on primary keys'
            ],
            correct: 1,
            explain: 'Applying a function to a column forces a full table scan: the DB can\'t use the index because the index stores dates, not years. Rewrite as a range: WHERE order_date >= \'2025-01-01\' AND order_date < \'2026-01-01\'.'
          },
          { type: 'write',
            q: 'Rewrite this index-friendly: find all orders from April 2025. Don\'t use strftime or any function on order_date.',
            expectedSql: "SELECT * FROM orders WHERE order_date >= '2025-04-01' AND order_date < '2025-05-01'",
            hint: 'Use a range: >= start AND < next month start.',
            explain: 'Range conditions preserve index usage. This is one of the most common interview fixes. Always convert date functions to range comparisons.'
          },
          { type: 'mc',
            q: 'Which query is more index-friendly for finding users named "Alice" in the US?',
            choices: [
              'WHERE name = \'Alice\' OR country = \'US\' (OR across columns)',
              'WHERE name = \'Alice\' AND country = \'US\' (AND narrows both)',
              'WHERE name || country = \'AliceUS\' (string concatenation)',
              'WHERE LOWER(name) = \'alice\' (function on column)'
            ],
            correct: 1,
            explain: 'AND allows the DB to use indexes on both columns (or a composite index). OR across different columns often forces a full scan. Functions on columns (LOWER, YEAR, etc.) also kill indexes.'
          }
        ]
      }
    ]
  },

  /* ═══ UNIT 11: REAL-WORLD ANALYTICS ═══ */
  {
    id: 'analytics',
    title: 'Real-World Analytics',
    icon: '📊',
    lessons: [
      {
        title: 'DAU/MAU & Engagement Ratios',
        exercises: [
          { type: 'intro',
            title: 'The metrics every PM dashboard shows.',
            body: '<strong>DAU</strong> (daily active users) and <strong>MAU</strong> (monthly active users) are the foundation of engagement measurement. The <strong>DAU/MAU ratio</strong> (stickiness) tells you what fraction of monthly users come back daily. Target: 20-30% for most apps, 50%+ for messaging/social.',
            syntax: '<span class="cm">-- DAU for a specific date</span>\n<span class="kw">SELECT COUNT</span>(<span class="kw">DISTINCT</span> user_id) <span class="kw">AS</span> dau\n<span class="kw">FROM</span> logins\n<span class="kw">WHERE</span> login_date = <span class="str">\'2025-04-01\'</span>;\n\n<span class="cm">-- DAU/MAU ratio</span>\n<span class="kw">SELECT</span>\n  dau.cnt * <span class="num">1.0</span> / mau.cnt <span class="kw">AS</span> stickiness\n<span class="kw">FROM</span>\n  (<span class="kw">SELECT COUNT</span>(<span class="kw">DISTINCT</span> user_id) <span class="kw">AS</span> cnt <span class="kw">FROM</span> logins <span class="kw">WHERE</span> login_date = <span class="str">\'2025-04-05\'</span>) dau,\n  (<span class="kw">SELECT COUNT</span>(<span class="kw">DISTINCT</span> user_id) <span class="kw">AS</span> cnt <span class="kw">FROM</span> logins <span class="kw">WHERE</span> login_date >= <span class="str">\'2025-04-01\'</span> <span class="kw">AND</span> login_date <= <span class="str">\'2025-04-07\'</span>) mau;'
          },
          { type: 'write',
            q: 'Calculate DAU for each day in the logins table. Show login_date and dau (count of distinct users). Order by date.',
            expectedSql: 'SELECT login_date, COUNT(DISTINCT user_id) AS dau FROM logins GROUP BY login_date ORDER BY login_date',
            ordered: true,
            hint: 'GROUP BY login_date, COUNT DISTINCT user_id.',
            explain: 'This is the single most common analytics query. If you can only write one query in an interview, make it this one.'
          },
          { type: 'write',
            q: 'Calculate the weekly active users (WAU) for the full week of April 1-7. Return a single number as wau.',
            expectedSql: "SELECT COUNT(DISTINCT user_id) AS wau FROM logins WHERE login_date >= '2025-04-01' AND login_date <= '2025-04-07'",
            hint: 'COUNT DISTINCT over the date range.',
            explain: 'WAU = unique users active in a 7-day window. Same pattern as MAU but with a shorter range.'
          },
          { type: 'write',
            q: 'Find the power users: users who logged in on 5 or more distinct days. Show user_id and login_days.',
            expectedSql: 'SELECT user_id, COUNT(DISTINCT login_date) AS login_days FROM logins GROUP BY user_id HAVING COUNT(DISTINCT login_date) >= 5',
            hint: 'GROUP BY user_id, HAVING COUNT >= 5.',
            explain: 'Power user analysis is a staple interview question. The pattern: GROUP BY user, COUNT activity, HAVING threshold.'
          }
        ]
      },
      {
        title: 'Revenue & LTV',
        exercises: [
          { type: 'intro',
            title: 'Follow the money.',
            body: '<strong>LTV</strong> (lifetime value) = total revenue per customer. Combined with <strong>CAC</strong> (cost to acquire), LTV/CAC ratio determines if a business is viable. In SQL, LTV starts with SUM(revenue) GROUP BY customer, then gets sophisticated with time-based analysis.',
            syntax: '<span class="kw">SELECT</span> u.name,\n  <span class="fn">SUM</span>(o.total) <span class="kw">AS</span> lifetime_value,\n  <span class="fn">COUNT</span>(o.id) <span class="kw">AS</span> total_orders,\n  <span class="fn">ROUND</span>(<span class="fn">SUM</span>(o.total) / <span class="fn">COUNT</span>(o.id), <span class="num">2</span>) <span class="kw">AS</span> avg_order_value\n<span class="kw">FROM</span> users u\n<span class="kw">JOIN</span> orders o <span class="kw">ON</span> u.id = o.user_id\n<span class="kw">WHERE</span> o.status = <span class="str">\'completed\'</span>\n<span class="kw">GROUP BY</span> u.id, u.name;'
          },
          { type: 'write',
            q: 'Calculate LTV for each user: show user name, lifetime_value (sum of completed order totals), total_orders, and avg_order_value (rounded to 2 decimals). Only count completed orders.',
            expectedSql: "SELECT u.name, SUM(o.total) AS lifetime_value, COUNT(o.id) AS total_orders, ROUND(SUM(o.total) / COUNT(o.id), 2) AS avg_order_value FROM users u JOIN orders o ON u.id = o.user_id WHERE o.status = 'completed' GROUP BY u.id, u.name",
            hint: 'JOIN users + orders, WHERE completed, GROUP BY user.',
            explain: 'LTV is the single most important customer metric. In interviews, always clarify: "Should I include only completed orders?" Shows business sense.'
          },
          { type: 'write',
            q: 'Calculate monthly revenue and month-over-month growth. Show month (YYYY-MM), revenue, prev_revenue (previous month), and growth_pct (percentage change, rounded to 1 decimal). Order by month.',
            expectedSql: "SELECT month, revenue, LAG(revenue) OVER (ORDER BY month) AS prev_revenue, ROUND((revenue - LAG(revenue) OVER (ORDER BY month)) * 100.0 / LAG(revenue) OVER (ORDER BY month), 1) AS growth_pct FROM (SELECT strftime('%Y-%m', order_date) AS month, SUM(total) AS revenue FROM orders WHERE status = 'completed' GROUP BY month) ORDER BY month",
            ordered: true,
            hint: 'Subquery for monthly revenue, then LAG for previous month, then calculate percentage.',
            explain: 'MoM growth = (current - previous) / previous * 100. LAG makes period-over-period calculations clean. This query runs every dashboard at every company.'
          },
          { type: 'write',
            q: 'Find the top 3 customers by lifetime value. Show name and lifetime_value. Only completed orders.',
            expectedSql: "SELECT u.name, SUM(o.total) AS lifetime_value FROM users u JOIN orders o ON u.id = o.user_id WHERE o.status = 'completed' GROUP BY u.id, u.name ORDER BY lifetime_value DESC LIMIT 3",
            ordered: true,
            hint: 'ORDER BY lifetime_value DESC LIMIT 3.',
            explain: 'Top-N queries are everywhere. The pattern: aggregate, order descending, limit.'
          }
        ]
      },
      {
        title: 'Cohort Retention',
        exercises: [
          { type: 'intro',
            title: 'Track how cohorts behave over time.',
            body: '<strong>Cohort analysis</strong> groups users by when they signed up, then tracks their behavior over time. <strong>Retention</strong> = what % of a cohort is still active N days/weeks/months later. This is the analysis that separates real product analysts from dashboard readers.',
            syntax: '<span class="cm">-- Assign cohort (signup month)</span>\n<span class="kw">SELECT</span>\n  <span class="fn">strftime</span>(<span class="str">\'%Y-%m\'</span>, u.signup_date) <span class="kw">AS</span> cohort,\n  <span class="cm">-- Months since signup</span>\n  (<span class="fn">strftime</span>(<span class="str">\'%Y\'</span>, o.order_date) - <span class="fn">strftime</span>(<span class="str">\'%Y\'</span>, u.signup_date)) * <span class="num">12</span>\n    + <span class="fn">strftime</span>(<span class="str">\'%m\'</span>, o.order_date) - <span class="fn">strftime</span>(<span class="str">\'%m\'</span>, u.signup_date) <span class="kw">AS</span> months_since,\n  <span class="fn">COUNT</span>(<span class="kw">DISTINCT</span> u.id) <span class="kw">AS</span> active_users\n<span class="kw">FROM</span> users u\n<span class="kw">JOIN</span> orders o <span class="kw">ON</span> u.id = o.user_id\n<span class="kw">GROUP BY</span> cohort, months_since;'
          },
          { type: 'write',
            q: 'Assign each user a signup cohort (YYYY-MM of signup_date). Show user name, signup_date, and cohort.',
            expectedSql: "SELECT name, signup_date, strftime('%Y-%m', signup_date) AS cohort FROM users",
            hint: "strftime('%Y-%m', signup_date).",
            explain: 'Step 1 of any cohort analysis: assign each user to their cohort. Always use the signup/registration date.'
          },
          { type: 'write',
            q: 'Calculate cohort sizes: how many users signed up in each cohort month? Show cohort and user_count. Order by cohort.',
            expectedSql: "SELECT strftime('%Y-%m', signup_date) AS cohort, COUNT(*) AS user_count FROM users GROUP BY cohort ORDER BY cohort",
            ordered: true,
            hint: 'GROUP BY the cohort month.',
            explain: 'Cohort size is the denominator in all retention calculations. Without it, you can\'t compute retention rates.'
          },
          { type: 'write',
            q: 'Full cohort retention: for each signup cohort, count distinct users who placed an order in each month_offset (0, 1, 2...). Show cohort, month_offset, and active_users. Order by cohort, month_offset.',
            expectedSql: "SELECT strftime('%Y-%m', u.signup_date) AS cohort, (strftime('%Y', o.order_date) - strftime('%Y', u.signup_date)) * 12 + strftime('%m', o.order_date) - strftime('%m', u.signup_date) AS month_offset, COUNT(DISTINCT u.id) AS active_users FROM users u JOIN orders o ON u.id = o.user_id WHERE o.status = 'completed' GROUP BY cohort, month_offset ORDER BY cohort, month_offset",
            ordered: true,
            hint: 'Calculate month difference between order_date and signup_date. GROUP BY cohort + offset.',
            explain: 'This is THE cohort retention query. It shows how many users from each cohort are still active N months later. To get percentages, divide by cohort size.'
          }
        ]
      },
      {
        title: 'Funnel & Conversion',
        exercises: [
          { type: 'intro',
            title: 'Where do users drop off?',
            body: '<strong>Funnel analysis</strong> tracks users through a sequence of steps (page_view → add_to_cart → purchase) and measures the conversion rate at each step. The drop-off between steps tells you where to focus product improvements.',
            syntax: '<span class="kw">SELECT</span>\n  <span class="fn">COUNT</span>(<span class="kw">DISTINCT CASE WHEN</span> event_type = <span class="str">\'page_view\'</span> <span class="kw">THEN</span> user_id <span class="kw">END</span>) <span class="kw">AS</span> viewed,\n  <span class="fn">COUNT</span>(<span class="kw">DISTINCT CASE WHEN</span> event_type = <span class="str">\'add_to_cart\'</span> <span class="kw">THEN</span> user_id <span class="kw">END</span>) <span class="kw">AS</span> carted,\n  <span class="fn">COUNT</span>(<span class="kw">DISTINCT CASE WHEN</span> event_type = <span class="str">\'purchase\'</span> <span class="kw">THEN</span> user_id <span class="kw">END</span>) <span class="kw">AS</span> purchased\n<span class="kw">FROM</span> events;'
          },
          { type: 'write',
            q: 'Build the full funnel: count distinct users at each stage (page_view, add_to_cart, purchase). Return viewed, carted, and purchased as columns in a single row.',
            expectedSql: "SELECT COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN user_id END) AS viewed, COUNT(DISTINCT CASE WHEN event_type = 'add_to_cart' THEN user_id END) AS carted, COUNT(DISTINCT CASE WHEN event_type = 'purchase' THEN user_id END) AS purchased FROM events",
            hint: 'COUNT DISTINCT + CASE WHEN for each event type.',
            explain: 'Conditional COUNT DISTINCT is the cleanest way to build a funnel in one query. No self-joins needed.'
          },
          { type: 'write',
            q: 'Calculate conversion rates: what % of viewers added to cart, and what % of cart-adders purchased? Show view_to_cart_pct and cart_to_purchase_pct (rounded to 1 decimal).',
            expectedSql: "SELECT ROUND(COUNT(DISTINCT CASE WHEN event_type = 'add_to_cart' THEN user_id END) * 100.0 / COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN user_id END), 1) AS view_to_cart_pct, ROUND(COUNT(DISTINCT CASE WHEN event_type = 'purchase' THEN user_id END) * 100.0 / COUNT(DISTINCT CASE WHEN event_type = 'add_to_cart' THEN user_id END), 1) AS cart_to_purchase_pct FROM events",
            hint: 'Divide carted/viewed * 100 and purchased/carted * 100.',
            explain: 'Step-to-step conversion rates pinpoint exactly where users drop off. If view→cart is low, the product page needs work. If cart→purchase is low, checkout is the problem.'
          },
          { type: 'write',
            q: 'Find users who viewed but never purchased (dropped out of funnel). Show their user_id.',
            expectedSql: "SELECT DISTINCT user_id FROM events WHERE event_type = 'page_view' AND user_id NOT IN (SELECT DISTINCT user_id FROM events WHERE event_type = 'purchase')",
            hint: 'NOT IN (SELECT user_id WHERE event_type = purchase).',
            explain: 'These are your retargeting candidates. Finding funnel drop-offs is a classic interview question and a real analytics task.'
          }
        ]
      },
      {
        title: 'A/B Test Analysis',
        exercises: [
          { type: 'intro',
            title: 'Measure what matters in experiments.',
            body: 'A/B test analysis in SQL means comparing metrics between control and treatment groups. Key calculations: <strong>sample sizes</strong>, <strong>conversion rates per group</strong>, <strong>lift</strong> (% improvement), and sometimes <strong>statistical significance</strong> (though that\'s usually done in Python/R).',
            syntax: '<span class="cm">-- Compare conversion by plan (as proxy for A/B groups)</span>\n<span class="kw">SELECT</span>\n  u.plan <span class="kw">AS</span> test_group,\n  <span class="fn">COUNT</span>(<span class="kw">DISTINCT</span> s.user_id) <span class="kw">AS</span> users,\n  <span class="fn">SUM</span>(s.converted) <span class="kw">AS</span> conversions,\n  <span class="fn">ROUND</span>(<span class="fn">SUM</span>(s.converted) * <span class="num">100.0</span> / <span class="fn">COUNT</span>(*), <span class="num">1</span>) <span class="kw">AS</span> conv_rate\n<span class="kw">FROM</span> users u\n<span class="kw">JOIN</span> sessions s <span class="kw">ON</span> u.id = s.user_id\n<span class="kw">GROUP BY</span> u.plan;'
          },
          { type: 'write',
            q: 'Compare conversion rates between free and pro users. Using sessions table, show plan (as test_group), total sessions, total conversions, and conv_rate (rounded to 1 decimal). Group by plan.',
            expectedSql: "SELECT u.plan AS test_group, COUNT(*) AS total_sessions, SUM(s.converted) AS total_conversions, ROUND(SUM(s.converted) * 100.0 / COUNT(*), 1) AS conv_rate FROM users u JOIN sessions s ON u.id = s.user_id GROUP BY u.plan",
            hint: 'JOIN users + sessions, GROUP BY plan.',
            explain: 'This is the core A/B test query. In a real experiment, "plan" would be replaced with an experiment assignment table (user_id → variant).'
          },
          { type: 'write',
            q: 'Calculate lift: what is the percentage difference in average pages_viewed between pro and free users? Show pro_avg, free_avg, and lift_pct (rounded to 1 decimal).',
            expectedSql: "SELECT ROUND(AVG(CASE WHEN u.plan = 'pro' THEN s.pages_viewed END), 1) AS pro_avg, ROUND(AVG(CASE WHEN u.plan = 'free' THEN s.pages_viewed END), 1) AS free_avg, ROUND((AVG(CASE WHEN u.plan = 'pro' THEN s.pages_viewed END) - AVG(CASE WHEN u.plan = 'free' THEN s.pages_viewed END)) * 100.0 / AVG(CASE WHEN u.plan = 'free' THEN s.pages_viewed END), 1) AS lift_pct FROM users u JOIN sessions s ON u.id = s.user_id",
            hint: 'Use conditional AVG with CASE WHEN plan = X.',
            explain: 'Lift = (treatment - control) / control * 100. Conditional aggregation lets you compute both groups in a single query without self-joining.'
          },
          { type: 'mc',
            q: 'Your A/B test shows treatment has a 5% higher conversion rate. Sample sizes: control=50, treatment=50. What should you do?',
            choices: [
              'Ship the treatment immediately — 5% lift is significant',
              'The sample sizes are too small to draw conclusions — need more data',
              'Run a different test instead',
              'Average the two rates and use that'
            ],
            correct: 1,
            explain: 'n=50 per group is far too small for a 5% lift to be statistically significant. You need thousands of observations typically. In interviews, always mention sample size and statistical significance.'
          }
        ]
      }
    ]
  },

  /* ═══ UNIT 12: INTERVIEW CHALLENGES ═══ */
  {
    id: 'challenges',
    title: 'Interview Challenges',
    icon: '🏆',
    lessons: [
      {
        title: 'Second Highest Salary',
        exercises: [
          { type: 'intro',
            title: 'The classic SQL interview opener.',
            body: 'Finding the Nth highest value tests your understanding of subqueries, DISTINCT, LIMIT/OFFSET, and window functions. There are at least 4 ways to solve it, and interviewers want to see multiple approaches.',
            syntax: '<span class="cm">-- Method 1: Subquery</span>\n<span class="kw">SELECT MAX</span>(salary) <span class="kw">FROM</span> employees\n<span class="kw">WHERE</span> salary < (<span class="kw">SELECT MAX</span>(salary) <span class="kw">FROM</span> employees);\n\n<span class="cm">-- Method 2: DENSE_RANK</span>\n<span class="kw">SELECT</span> salary <span class="kw">FROM</span> (\n  <span class="kw">SELECT</span> salary, <span class="fn">DENSE_RANK</span>() <span class="kw">OVER</span> (<span class="kw">ORDER BY</span> salary <span class="kw">DESC</span>) <span class="kw">AS</span> rnk\n  <span class="kw">FROM</span> employees\n) <span class="kw">WHERE</span> rnk = <span class="num">2</span>;'
          },
          { type: 'write',
            q: 'Find the second highest salary using a subquery (not window functions). Return it as second_highest.',
            expectedSql: 'SELECT MAX(salary) AS second_highest FROM employees WHERE salary < (SELECT MAX(salary) FROM employees)',
            hint: 'MAX where salary < overall MAX.',
            explain: 'The subquery approach: find the max, then find the max below it. Simple and clean.'
          },
          { type: 'write',
            q: 'Now solve it using DENSE_RANK. Find the second highest DISTINCT salary. Return salary only.',
            expectedSql: 'SELECT salary FROM (SELECT DISTINCT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk FROM employees) WHERE rnk = 2',
            hint: 'DENSE_RANK in a subquery, then filter WHERE rnk = 2.',
            explain: 'DENSE_RANK handles ties correctly: if two people share the top salary, the next distinct salary is still rank 2. Use DENSE_RANK (not RANK) for "distinct Nth" problems.'
          },
          { type: 'write',
            q: 'Find the 3rd highest salary using LIMIT and OFFSET.',
            expectedSql: 'SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 2',
            hint: 'ORDER BY salary DESC, LIMIT 1 OFFSET 2 (skip top 2, take next 1).',
            explain: 'OFFSET skips rows. OFFSET 2 LIMIT 1 = skip 2, take 1 = third highest. Simpler but less flexible than window functions.'
          }
        ]
      },
      {
        title: 'Consecutive Active Days',
        exercises: [
          { type: 'intro',
            title: 'Gaps and islands: the hardest interview pattern.',
            body: 'Finding consecutive days of activity is a <strong>gaps and islands</strong> problem. The trick: subtract a row number from the date. Consecutive dates produce the same group key. This pattern appears at Meta, Stripe, and Airbnb interviews.',
            syntax: '<span class="cm">-- The magic: date minus row_number creates groups</span>\n<span class="kw">SELECT</span> user_id, login_date,\n  <span class="fn">DATE</span>(login_date, <span class="str">\'-\' || ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) || \' days\'</span>) <span class="kw">AS</span> grp\n<span class="kw">FROM</span> logins;\n<span class="cm">-- Consecutive dates get the same grp value!</span>'
          },
          { type: 'write',
            q: 'For each user, find their longest streak of consecutive login days. Show user_id and max_streak. Order by max_streak DESC.',
            expectedSql: "SELECT user_id, MAX(streak) AS max_streak FROM (SELECT user_id, grp, COUNT(*) AS streak FROM (SELECT user_id, login_date, DATE(login_date, '-' || ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) || ' days') AS grp FROM logins) GROUP BY user_id, grp) GROUP BY user_id ORDER BY max_streak DESC",
            ordered: true,
            hint: 'Three layers: 1) date minus row_number for groups, 2) COUNT per group for streak lengths, 3) MAX per user.',
            explain: 'This is a 3-step solution: assign groups → count group sizes → find max per user. The date-minus-row_number trick is the key insight that interviewers are testing for.'
          },
          { type: 'write',
            q: 'Find users who had a streak of 3 or more consecutive login days. Show user_id and streak_length.',
            expectedSql: "SELECT user_id, COUNT(*) AS streak_length FROM (SELECT user_id, login_date, DATE(login_date, '-' || ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) || ' days') AS grp FROM logins) GROUP BY user_id, grp HAVING COUNT(*) >= 3",
            hint: 'Same group trick, then HAVING COUNT(*) >= 3.',
            explain: 'Adding HAVING COUNT(*) >= 3 filters to only the meaningful streaks. This is how engagement teams define "activated" users.'
          },
          { type: 'mc',
            q: 'Why does subtracting ROW_NUMBER() from the date create groups for consecutive days?',
            choices: [
              'It\'s a mathematical coincidence that only works in SQLite',
              'Consecutive dates increase by 1 day, and ROW_NUMBER increases by 1 — so their difference is constant within a streak',
              'ROW_NUMBER always equals the date',
              'The database automatically groups consecutive values'
            ],
            correct: 1,
            explain: 'If dates are April 1, 2, 3 and row numbers are 1, 2, 3, then date minus row_number = March 31, March 31, March 31. Same value = same group. A gap breaks the pattern.'
          }
        ]
      },
      {
        title: 'Duplicate Detection',
        exercises: [
          { type: 'intro',
            title: 'Find and handle duplicate records.',
            body: 'Duplicate detection is a common interview and real-world task. Approaches: <strong>GROUP BY + HAVING COUNT > 1</strong> for simple duplicates, <strong>ROW_NUMBER</strong> for identifying which row to keep, and <strong>self-join</strong> for finding near-duplicates.',
            syntax: '<span class="cm">-- Find duplicate emails</span>\n<span class="kw">SELECT</span> name, <span class="fn">COUNT</span>(*) <span class="kw">AS</span> cnt\n<span class="kw">FROM</span> users\n<span class="kw">GROUP BY</span> name\n<span class="kw">HAVING COUNT</span>(*) > <span class="num">1</span>;\n\n<span class="cm">-- Mark duplicates with ROW_NUMBER</span>\n<span class="kw">SELECT</span> *, <span class="fn">ROW_NUMBER</span>() <span class="kw">OVER</span> (\n  <span class="kw">PARTITION BY</span> name <span class="kw">ORDER BY</span> id\n) <span class="kw">AS</span> rn\n<span class="kw">FROM</span> users;\n<span class="cm">-- rn > 1 = duplicate</span>'
          },
          { type: 'write',
            q: 'Find any product categories that have more than 1 product. Show category and product_count.',
            expectedSql: 'SELECT category, COUNT(*) AS product_count FROM products GROUP BY category HAVING COUNT(*) > 1',
            hint: 'GROUP BY category, HAVING COUNT > 1.',
            explain: 'The simplest duplicate/group-size pattern. GROUP BY + HAVING is the foundation.'
          },
          { type: 'write',
            q: 'Find users who placed orders on the same date (potential duplicate orders). Show user_id, order_date, and order_count for dates with more than 1 order.',
            expectedSql: 'SELECT user_id, order_date, COUNT(*) AS order_count FROM orders GROUP BY user_id, order_date HAVING COUNT(*) > 1',
            hint: 'GROUP BY user_id, order_date.',
            explain: 'Grouping by multiple columns catches duplicates across a compound key. This is how you find double-charges, duplicate submissions, etc.'
          },
          { type: 'write',
            q: 'Using ROW_NUMBER, mark duplicate logins per user per day. Show user_id, login_date, and rn (row number partitioned by user_id and login_date, ordered by id). Rows with rn > 1 are duplicates.',
            expectedSql: 'SELECT user_id, login_date, ROW_NUMBER() OVER (PARTITION BY user_id, login_date ORDER BY id) AS rn FROM logins',
            hint: 'PARTITION BY user_id, login_date ORDER BY id.',
            explain: 'ROW_NUMBER + PARTITION BY is the standard dedup pattern. Keep rn=1, delete rn>1. This is used in ETL pipelines everywhere.'
          }
        ]
      },
      {
        title: 'Complex Joins & Self-Joins',
        exercises: [
          { type: 'intro',
            title: 'Join a table to itself.',
            body: '<strong>Self-joins</strong> join a table to itself using different aliases. Use cases: finding pairs (e.g., employees who share a manager), comparing rows within the same table, and building hierarchies. This is an interview favorite.',
            syntax: '<span class="kw">SELECT</span>\n  e.name <span class="kw">AS</span> employee,\n  m.name <span class="kw">AS</span> manager\n<span class="kw">FROM</span> employees e\n<span class="kw">LEFT JOIN</span> employees m\n  <span class="kw">ON</span> e.manager_id = m.id;'
          },
          { type: 'write',
            q: 'Show each employee with their manager\'s name. Include employees without managers (CEO). Return employee_name and manager_name.',
            expectedSql: 'SELECT e.name AS employee_name, m.name AS manager_name FROM employees e LEFT JOIN employees m ON e.manager_id = m.id',
            hint: 'LEFT JOIN employees m ON e.manager_id = m.id.',
            explain: 'LEFT JOIN keeps employees with no manager (NULL manager_id). The self-join uses two aliases (e, m) for the same table.'
          },
          { type: 'write',
            q: 'Find employees who earn more than their manager. Show employee name, employee salary, manager name, and manager salary.',
            expectedSql: 'SELECT e.name AS employee_name, e.salary AS employee_salary, m.name AS manager_name, m.salary AS manager_salary FROM employees e JOIN employees m ON e.manager_id = m.id WHERE e.salary > m.salary',
            hint: 'JOIN on manager_id, WHERE e.salary > m.salary.',
            explain: 'A classic interview question. The self-join lets you compare employee to manager within the same query. WHERE filters to only those earning more.'
          },
          { type: 'write',
            q: 'Find pairs of users from the same country (no duplicates: each pair should appear once). Show user1 and user2 names, and their country.',
            expectedSql: 'SELECT a.name AS user1, b.name AS user2, a.country FROM users a JOIN users b ON a.country = b.country AND a.id < b.id',
            hint: 'Self-join ON country, AND a.id < b.id to avoid duplicates.',
            explain: 'The a.id < b.id trick avoids (Alice, Bob) AND (Bob, Alice) appearing. This dedup pattern works for any "find pairs" problem.'
          }
        ]
      }
    ]
  }
];

/* ─── 4. SQL.JS INIT + DB ──────────────────────────────────── */

async function initDB() {
  SQL = await initSqlJs({
    locateFile: f => `https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/${f}`
  });
  DB = new SQL.Database();
  DB.run(SEED_SQL);
}

function runQuery(sql) {
  try {
    const results = DB.exec(sql);
    if (!results.length) return { columns: [], rows: [] };
    const r = results[0];
    return { columns: r.columns, rows: r.values };
  } catch (e) {
    return { error: e.message };
  }
}

/* Compare two result sets. Unordered by default; ordered if needed. */
function compareResults(a, b, ordered) {
  if (!a || !b) return false;
  if (a.rows.length !== b.rows.length) return false;
  if (a.columns.length !== b.columns.length) return false;

  const norm = arr => arr.map(row => row.map(v => v === null ? 'NULL' : String(v)).join('|'));
  const A = norm(a.rows);
  const B = norm(b.rows);
  if (!ordered) { A.sort(); B.sort(); }
  return A.every((v, i) => v === B[i]);
}

/* ─── 5. PATH RENDERING ────────────────────────────────────── */

function isLessonUnlocked(unitIdx, lessonIdx) {
  if (unitIdx === 0 && lessonIdx === 0) return true;
  // unlocked if previous lesson completed
  if (lessonIdx > 0) {
    return !!progress.completed[`${COURSE[unitIdx].id}.${lessonIdx - 1}`];
  }
  // first lesson of unit: previous unit's last lesson must be done
  const prev = COURSE[unitIdx - 1];
  return !!progress.completed[`${prev.id}.${prev.lessons.length - 1}`];
}

function isLessonDone(unitId, lessonIdx) {
  return !!progress.completed[`${unitId}.${lessonIdx}`];
}

function totalLessons() {
  return COURSE.reduce((n, u) => n + u.lessons.length, 0);
}
function doneLessons() {
  return Object.keys(progress.completed).filter(k => progress.completed[k]).length;
}

function renderPath() {
  const path = document.getElementById('path');
  path.innerHTML = COURSE.map((unit, ui) => `
    <section class="st-unit">
      <div class="st-unit-header">
        <span class="st-unit-num">Unit ${ui + 1}</span>
        <span class="st-unit-title">${unit.icon} ${unit.title}</span>
      </div>
      <div class="st-nodes">
        ${unit.lessons.map((lesson, li) => {
          const unlocked = isLessonUnlocked(ui, li);
          const done = isLessonDone(unit.id, li);
          const cls = done ? 'completed' : (unlocked ? 'available' : 'locked');
          const icon = done
            ? '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
            : unlocked
              ? '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 19,12 8,19"/></svg>'
              : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
          return `
            <div class="st-node ${cls}" data-unit="${ui}" data-lesson="${li}">
              <div class="st-node-circle">${icon}</div>
              <div class="st-node-label">${lesson.title}</div>
              ${done ? '<div class="st-node-stars"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>' : ''}
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `).join('');

  path.querySelectorAll('.st-node').forEach(n => {
    n.addEventListener('click', () => {
      if (n.classList.contains('locked')) return;
      const ui = Number(n.dataset.unit);
      const li = Number(n.dataset.lesson);
      startLesson(ui, li);
    });
  });

  updateProgressBar();
  updateStats();
}

function updateProgressBar() {
  const total = totalLessons();
  const done = doneLessons();
  const pct = Math.round((done / total) * 100);
  document.getElementById('prog-done').textContent = done;
  document.getElementById('prog-total').textContent = total;
  document.getElementById('prog-pct').textContent = pct + '%';
  document.getElementById('prog-fill').style.width = pct + '%';
}

function updateStats() {
  refillHearts();
  document.getElementById('stat-xp').textContent = progress.xp;
  document.getElementById('stat-streak').textContent = progress.streakDays;
  document.getElementById('stat-hearts').textContent = progress.hearts;
}

/* ─── 6. LESSON FLOW ───────────────────────────────────────── */

function startLesson(unitIdx, lessonIdx) {
  const unit = COURSE[unitIdx];
  const lesson = unit.lessons[lessonIdx];
  activeLesson = {
    unitId: unit.id,
    unitIdx,
    lessonIdx,
    exercises: lesson.exercises,
    currentIdx: 0,
    hearts: progress.hearts,
    xpEarned: 0,
    failed: false,
  };
  document.getElementById('overlay').classList.add('open');
  renderExercise();
}

function closeLesson() {
  document.getElementById('overlay').classList.remove('open');
  activeLesson = null;
  renderPath();
}

function renderExercise() {
  const al = activeLesson;
  const ex = al.exercises[al.currentIdx];
  const body = document.getElementById('lesson-body');
  const pct = (al.currentIdx / al.exercises.length) * 100;
  document.getElementById('lesson-pfill').style.width = pct + '%';

  // hearts display
  const hh = document.getElementById('lesson-hearts');
  hh.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const h = document.createElement('span');
    h.textContent = '♥';
    if (i >= al.hearts) h.className = 'lost';
    hh.appendChild(h);
  }

  // reset footer
  document.getElementById('lesson-foot').className = 'st-lesson-foot';
  document.getElementById('lesson-feedback').className = 'st-feedback-msg';
  document.getElementById('lesson-feedback').textContent = ex.type === 'intro'
    ? 'Read through, then continue.'
    : 'Answer below, then check.';
  const action = document.getElementById('lesson-action');
  action.textContent = ex.type === 'intro' ? 'Continue' : 'Check';
  action.className = 'st-btn primary';
  action.disabled = ex.type !== 'intro';
  action.onclick = ex.type === 'intro' ? nextExercise : checkAnswer;

  body.innerHTML = `<div class="st-lesson-content">${renderExerciseContent(ex)}</div>`;
  wireExerciseInputs(ex);
}

function renderExerciseContent(ex) {
  switch (ex.type) {
    case 'intro':
      return `
        <div class="st-q-type">Concept</div>
        <h2 class="st-q-title">${ex.title}</h2>
        <div class="st-explain">${ex.body}</div>
        ${ex.syntax ? `<div class="st-syntax">${ex.syntax}</div>` : ''}
      `;

    case 'mc':
      return `
        <div class="st-q-type">Multiple choice</div>
        <h2 class="st-q-title">${ex.q}</h2>
        <div class="st-choices" id="ex-choices">
          ${ex.choices.map((c, i) => `<button class="st-choice" data-i="${i}">${c}</button>`).join('')}
        </div>
      `;

    case 'fill':
      return `
        <div class="st-q-type">Fill the blanks</div>
        <h2 class="st-q-title">${ex.q}</h2>
        <div class="st-fill" id="ex-fill">${renderFillTemplate(ex)}</div>
      `;

    case 'arrange':
      return `
        <div class="st-q-type">Arrange the clauses</div>
        <h2 class="st-q-title">${ex.q}</h2>
        <p class="st-q-sub">Click chips in the correct order. Click them in the target to remove.</p>
        <div class="st-editor-label">Your query</div>
        <div class="st-arrange-target" id="ex-target"></div>
        <div class="st-editor-label">Available chips</div>
        <div class="st-arrange-pool" id="ex-pool">
          ${shuffle(ex.chips.map((c, i) => ({ c, i }))).map(({ c, i }) => `<button class="st-chip" data-i="${i}">${escapeHtml(c)}</button>`).join('')}
        </div>
      `;

    case 'write':
      return `
        <div class="st-q-type">Write the query</div>
        <h2 class="st-q-title">${ex.q}</h2>
        ${ex.hint ? `<p class="st-q-sub"><strong>Hint:</strong> ${ex.hint}</p>` : ''}
        <div class="st-schema">
          <strong>Tables:</strong> users(id, name, country, signup_date, plan), products(id, name, category, price), orders(id, user_id, product_id, quantity, total, order_date, status), events(id, user_id, event_type, event_date)
        </div>
        <div class="st-editor-label">Your query</div>
        <textarea class="st-editor" id="ex-editor" placeholder="SELECT ..." spellcheck="false" autocapitalize="off"></textarea>
        <div id="ex-result"></div>
        <details class="st-expected"><summary>Show solution</summary><pre style="margin-top:8px; white-space:pre-wrap;">${escapeHtml(ex.expectedSql)}</pre></details>
      `;
  }
}

function renderFillTemplate(ex) {
  return ex.template.replace(/\{\{(\d+)\}\}/g, (_, i) =>
    `<input data-blank="${i}" autocapitalize="off" spellcheck="false" />`
  );
}

function wireExerciseInputs(ex) {
  const action = document.getElementById('lesson-action');

  if (ex.type === 'mc') {
    let picked = null;
    document.querySelectorAll('#ex-choices .st-choice').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#ex-choices .st-choice').forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        picked = Number(b.dataset.i);
        activeLesson.userAnswer = picked;
        action.disabled = false;
      });
    });
  }

  if (ex.type === 'fill') {
    const inputs = document.querySelectorAll('#ex-fill input');
    inputs.forEach(inp => {
      inp.addEventListener('input', () => {
        const allFilled = Array.from(inputs).every(i => i.value.trim().length > 0);
        action.disabled = !allFilled;
      });
    });
  }

  if (ex.type === 'write') {
    const ta = document.getElementById('ex-editor');
    ta.addEventListener('input', () => {
      action.disabled = ta.value.trim().length < 5;
    });
  }

  if (ex.type === 'arrange') {
    const target = document.getElementById('ex-target');
    const pool = document.getElementById('ex-pool');
    const moveChip = (chip, to) => {
      to.appendChild(chip);
      action.disabled = pool.children.length > 0;
    };
    pool.addEventListener('click', e => {
      const chip = e.target.closest('.st-chip');
      if (chip) moveChip(chip, target);
    });
    target.addEventListener('click', e => {
      const chip = e.target.closest('.st-chip');
      if (chip) moveChip(chip, pool);
    });
  }
}

/* ─── 7. ANSWER CHECKING ───────────────────────────────────── */

/**
 * Check if user's fill-in-the-blank answer is acceptable.
 * Handles case-insensitive matching, stripped punctuation, and alternate answers via ex.alt[i].
 */
function sqlFillCheck(got, ex, blankIdx) {
  const primary = ex.answers[blankIdx].trim().toLowerCase();
  const gotClean = got.trim().toLowerCase();
  const gotStripped = gotClean.replace(/[^a-z0-9_ ]/g, '');
  const primaryStripped = primary.replace(/[^a-z0-9_ ]/g, '');
  if (gotClean === primary || gotStripped === primaryStripped) return true;
  if (gotStripped.includes(primaryStripped)) return true;
  if (gotStripped.length >= 2 && primaryStripped.includes(gotStripped)) return true;
  // Check alternates
  if (ex.alt && ex.alt[blankIdx]) {
    for (const altAnswer of ex.alt[blankIdx]) {
      const altClean = altAnswer.trim().toLowerCase();
      const altStripped = altClean.replace(/[^a-z0-9_ ]/g, '');
      if (gotClean === altClean || gotStripped === altStripped) return true;
      if (gotStripped.includes(altStripped)) return true;
      if (gotStripped.length >= 2 && altStripped.includes(gotStripped)) return true;
    }
  }
  return false;
}

function checkAnswer() {
  const ex = activeLesson.exercises[activeLesson.currentIdx];
  let correct = false;
  let detail = '';

  if (ex.type === 'mc') {
    correct = activeLesson.userAnswer === ex.correct;
    document.querySelectorAll('#ex-choices .st-choice').forEach((b, i) => {
      b.classList.add('disabled');
      if (i === ex.correct) b.classList.add('correct');
      if (i === activeLesson.userAnswer && i !== ex.correct) b.classList.add('wrong');
    });
  }

  if (ex.type === 'fill') {
    const inputs = document.querySelectorAll('#ex-fill input');
    correct = true;
    const fillMisses = [];
    inputs.forEach(inp => {
      const i = Number(inp.dataset.blank);
      const ok = sqlFillCheck(inp.value, ex, i);
      inp.classList.add(ok ? 'correct' : 'wrong');
      inp.disabled = true;
      if (!ok) {
        correct = false;
        fillMisses.push({ got: inp.value.trim(), expected: ex.answers[i].trim(), blank: i });
      }
    });
    if (!correct) {
      ex._fillMisses = fillMisses;
    }
  }

  if (ex.type === 'arrange') {
    const target = document.getElementById('ex-target');
    const order = Array.from(target.querySelectorAll('.st-chip')).map(c => Number(c.dataset.i));
    correct = order.length === ex.correctOrder.length &&
              order.every((v, i) => v === ex.correctOrder[i]);
    if (!correct) {
      detail = 'Expected order: ' + ex.correctOrder.map(i => ex.chips[i]).join(' → ');
    }
  }

  if (ex.type === 'write') {
    const userSql = document.getElementById('ex-editor').value.trim();
    const userResult = runQuery(userSql);
    const expectedResult = runQuery(ex.expectedSql);

    const out = document.getElementById('ex-result');
    if (userResult.error) {
      correct = false;
      detail = 'SQL error: ' + userResult.error;
      out.innerHTML = `<div class="st-result-empty" style="color:#c4546c;">⚠ ${escapeHtml(userResult.error)}</div>`;
    } else {
      correct = compareResults(userResult, expectedResult, ex.ordered);
      out.innerHTML = renderResultTable(userResult);
    }
  }

  // explain in feedback
  const foot = document.getElementById('lesson-foot');
  const fb = document.getElementById('lesson-feedback');
  const action = document.getElementById('lesson-action');

  if (correct) {
    activeLesson.xpEarned += 10;
    foot.classList.add('correct');
    fb.className = 'st-feedback-msg correct';
    fb.innerHTML = `✓ Correct! ${ex.explain || ''}`;
    action.className = 'st-btn success';
    action.textContent = activeLesson.currentIdx === activeLesson.exercises.length - 1 ? 'Finish' : 'Continue';
    action.disabled = false;
    action.onclick = nextExercise;
  } else {
    activeLesson.hearts = Math.max(0, activeLesson.hearts - 1);
    progress.hearts = activeLesson.hearts;
    progress.heartsRefilledAt = Date.now();
    saveProgress();

    foot.classList.add('wrong');
    fb.className = 'st-feedback-msg wrong';
    let wrongMsg = '✗ Not quite.';
    // Show expected answers for fill-in-the-blank
    if (ex.type === 'fill' && ex._fillMisses && ex._fillMisses.length > 0) {
      const corrections = ex._fillMisses.map(m =>
        `Expected "${m.expected}" — you wrote "${m.got || '(blank)'}"`
      ).join('. ');
      wrongMsg += ' ' + corrections + '.';
    }
    if (detail) wrongMsg += ' ' + detail;
    if (ex.explain) wrongMsg += ' ' + ex.explain;
    fb.innerHTML = wrongMsg;
    action.textContent = 'Try again';
    action.className = 'st-btn primary';
    action.disabled = false;

    if (activeLesson.hearts === 0) {
      // out of hearts — end lesson
      activeLesson.failed = true;
      action.textContent = 'Close';
      action.onclick = closeLesson;
      fb.innerHTML += ' Out of hearts! Take a break and try again later.';
    } else {
      action.onclick = () => renderExercise(); // retry same exercise
    }

    // re-render hearts
    const hh = document.getElementById('lesson-hearts');
    hh.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const h = document.createElement('span');
      h.textContent = '♥';
      if (i >= activeLesson.hearts) h.className = 'lost';
      hh.appendChild(h);
    }
  }
}

function renderResultTable(res) {
  if (!res.columns.length) return '<div class="st-result-empty">Query ran. No rows returned.</div>';
  return `
    <div class="st-result">
      <table>
        <thead><tr>${res.columns.map(c => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead>
        <tbody>${res.rows.slice(0, 50).map(r => `<tr>${r.map(v => `<td>${v === null ? '<em style="color:#9088a0">NULL</em>' : escapeHtml(String(v))}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
      ${res.rows.length > 50 ? `<div class="st-result-empty" style="margin-top:6px;">+ ${res.rows.length - 50} more rows</div>` : ''}
    </div>
  `;
}

function nextExercise() {
  activeLesson.currentIdx += 1;
  if (activeLesson.currentIdx >= activeLesson.exercises.length) {
    finishLesson();
  } else {
    renderExercise();
  }
}

function finishLesson() {
  const al = activeLesson;
  const key = `${al.unitId}.${al.lessonIdx}`;
  const wasFirst = !progress.completed[key];
  progress.completed[key] = true;
  if (wasFirst) {
    progress.xp += al.xpEarned;
    bumpStreak();
  }
  saveProgress();

  // completion screen
  document.getElementById('lesson-pfill').style.width = '100%';
  document.getElementById('lesson-body').innerHTML = `
    <div class="st-complete">
      <div class="st-complete-emoji">🎉</div>
      <h2>Lesson complete!</h2>
      <p>${COURSE[al.unitIdx].title} &middot; ${COURSE[al.unitIdx].lessons[al.lessonIdx].title}</p>
      <div class="st-complete-stats">
        <div class="st-complete-stat">
          <div class="st-complete-stat-num">+${al.xpEarned}</div>
          <div class="st-complete-stat-label">XP earned</div>
        </div>
        <div class="st-complete-stat">
          <div class="st-complete-stat-num">${al.hearts}</div>
          <div class="st-complete-stat-label">Hearts left</div>
        </div>
        <div class="st-complete-stat">
          <div class="st-complete-stat-num">${progress.streakDays}🔥</div>
          <div class="st-complete-stat-label">Day streak</div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('lesson-foot').className = 'st-lesson-foot correct';
  const fb = document.getElementById('lesson-feedback');
  fb.className = 'st-feedback-msg correct';
  fb.textContent = wasFirst ? 'Nice work — lesson unlocked the next one.' : 'Reviewed — XP only counts the first time.';
  const action = document.getElementById('lesson-action');
  action.textContent = 'Back to path';
  action.className = 'st-btn success';
  action.disabled = false;
  action.onclick = closeLesson;
}

/* ─── 8. UTILITIES ─────────────────────────────────────────── */

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ─── 9. INTERVIEW SIM MODE ────────────────────────────────── */

const SIM_STORAGE = 'sql-sim-history-v1';
const SIM_DURATION = 25 * 60; // 25 minutes in seconds
const SIM_QUESTIONS = 8;

let simState = null; // { questions, currentIdx, score, startTime, timerInterval, answers }

function getSimQuestionPool(difficulty) {
  // Map difficulties to unit IDs
  const pools = {
    easy: ['basics', 'filtering'],
    medium: ['sorting', 'aggregates', 'joins'],
    hard: ['advanced', 'interview', 'metrics', 'hard'],
    mixed: ['basics', 'filtering', 'sorting', 'aggregates', 'joins', 'advanced', 'interview', 'metrics', 'hard']
  };
  const unitIds = pools[difficulty] || pools.mixed;

  // Collect all 'write' exercises from matching units
  const questions = [];
  COURSE.forEach(unit => {
    if (!unitIds.includes(unit.id)) return;
    unit.lessons.forEach(lesson => {
      lesson.exercises.forEach(ex => {
        if (ex.type === 'write') {
          questions.push({ ...ex, unitTitle: unit.title, lessonTitle: lesson.title });
        }
      });
    });
  });
  return questions;
}

function startSim() {
  const difficulty = document.getElementById('sim-difficulty').value;
  const pool = getSimQuestionPool(difficulty);
  if (pool.length < SIM_QUESTIONS) {
    alert('Not enough questions for this difficulty. Try "mixed".');
    return;
  }

  // Pick random questions
  const shuffled = shuffle(pool);
  const picked = shuffled.slice(0, SIM_QUESTIONS);

  simState = {
    questions: picked,
    currentIdx: 0,
    score: 0,
    difficulty,
    startTime: Date.now(),
    timerInterval: null,
    answers: [],
    timeLeft: SIM_DURATION
  };

  document.getElementById('sim-overlay').classList.add('open');
  startSimTimer();
  renderSimQuestion();
}

function startSimTimer() {
  const timerEl = document.getElementById('sim-timer');
  simState.timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - simState.startTime) / 1000);
    simState.timeLeft = Math.max(0, SIM_DURATION - elapsed);
    const min = Math.floor(simState.timeLeft / 60);
    const sec = simState.timeLeft % 60;
    timerEl.textContent = `${min}:${String(sec).padStart(2, '0')}`;

    if (simState.timeLeft <= 120) timerEl.classList.add('warning');
    if (simState.timeLeft === 0) {
      clearInterval(simState.timerInterval);
      endSim(true);
    }
  }, 1000);
}

function renderSimQuestion() {
  const s = simState;
  const ex = s.questions[s.currentIdx];
  const body = document.getElementById('sim-body');

  document.getElementById('sim-q-count').textContent = `Q${s.currentIdx + 1} / ${SIM_QUESTIONS}`;
  document.getElementById('sim-score').textContent = `Score: ${s.score}`;

  // Reset footer
  const foot = document.getElementById('sim-foot');
  foot.className = 'st-lesson-foot';
  const fb = document.getElementById('sim-feedback');
  fb.className = 'st-feedback-msg';
  fb.textContent = `${ex.unitTitle} · ${ex.lessonTitle}`;
  const action = document.getElementById('sim-action');
  action.textContent = 'Submit';
  action.className = 'st-btn primary';
  action.disabled = true;
  action.onclick = checkSimAnswer;

  body.innerHTML = `
    <div class="st-lesson-content">
      <div class="st-q-type">Interview Question ${s.currentIdx + 1} of ${SIM_QUESTIONS}</div>
      <h2 class="st-q-title">${ex.q}</h2>
      ${ex.hint ? `<p class="st-q-sub"><strong>Hint:</strong> ${ex.hint}</p>` : ''}
      <div class="st-schema">
        <strong>Tables:</strong> users(id, name, country, signup_date, plan), products(id, name, category, price), orders(id, user_id, product_id, quantity, total, order_date, status), events(id, user_id, event_type, event_date), employees(id, name, department, salary, manager_id, hire_date), logins(id, user_id, login_date), sessions(id, user_id, start_time, end_time, pages_viewed, converted)
      </div>
      <div class="st-editor-label">Your query</div>
      <textarea class="st-editor" id="sim-editor" placeholder="SELECT ..." spellcheck="false" autocapitalize="off"></textarea>
      <div id="sim-result"></div>
    </div>
  `;

  const ta = document.getElementById('sim-editor');
  ta.addEventListener('input', () => {
    action.disabled = ta.value.trim().length < 5;
  });
  ta.focus();
}

function checkSimAnswer() {
  const s = simState;
  const ex = s.questions[s.currentIdx];
  const userSql = document.getElementById('sim-editor').value.trim();
  const userResult = runQuery(userSql);
  const expectedResult = runQuery(ex.expectedSql);

  const out = document.getElementById('sim-result');
  const foot = document.getElementById('sim-foot');
  const fb = document.getElementById('sim-feedback');
  const action = document.getElementById('sim-action');

  let correct = false;

  if (userResult.error) {
    out.innerHTML = `<div class="st-result-empty" style="color:#c4546c;">⚠ ${escapeHtml(userResult.error)}</div>`;
  } else {
    correct = compareResults(userResult, expectedResult, ex.ordered);
    out.innerHTML = renderResultTable(userResult);
  }

  s.answers.push({ q: ex.q, correct, userSql });

  if (correct) {
    s.score += Math.max(10, Math.floor(s.timeLeft / 15)); // bonus for speed
    foot.classList.add('correct');
    fb.className = 'st-feedback-msg correct';
    fb.innerHTML = `✓ Correct! +${Math.max(10, Math.floor(s.timeLeft / 15))} pts`;
  } else {
    foot.classList.add('wrong');
    fb.className = 'st-feedback-msg wrong';
    fb.innerHTML = `✗ Not quite. Expected: <code style="font-size:11px;">${escapeHtml(ex.expectedSql)}</code>`;
  }

  document.getElementById('sim-score').textContent = `Score: ${s.score}`;

  const isLast = s.currentIdx >= SIM_QUESTIONS - 1;
  action.textContent = isLast ? 'Finish' : 'Next';
  action.className = isLast ? 'st-btn success' : 'st-btn primary';
  action.disabled = false;
  action.onclick = isLast ? () => endSim(false) : nextSimQuestion;
}

function nextSimQuestion() {
  simState.currentIdx += 1;
  renderSimQuestion();
}

function endSim(timedOut) {
  clearInterval(simState.timerInterval);
  const s = simState;
  const correctCount = s.answers.filter(a => a.correct).length;
  const elapsed = Math.min(SIM_DURATION, Math.floor((Date.now() - s.startTime) / 1000));
  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;

  // Save to history
  const history = getSimHistory();
  history.push({
    date: todayStr(),
    difficulty: s.difficulty,
    score: s.score,
    correct: correctCount,
    total: s.answers.length,
    time: `${min}:${String(sec).padStart(2, '0')}`,
    timedOut
  });
  localStorage.setItem(SIM_STORAGE, JSON.stringify(history.slice(-20)));

  // Show results
  const body = document.getElementById('sim-body');
  const grade = correctCount >= 7 ? '🏆' : correctCount >= 5 ? '✅' : correctCount >= 3 ? '💪' : '📚';
  body.innerHTML = `
    <div class="st-complete">
      <div class="st-complete-emoji">${grade}</div>
      <h2>${timedOut ? 'Time\'s up!' : 'Simulation Complete'}</h2>
      <p>${s.difficulty.charAt(0).toUpperCase() + s.difficulty.slice(1)} difficulty · ${min}:${String(sec).padStart(2, '0')} elapsed</p>
      <div class="st-complete-stats">
        <div class="st-complete-stat">
          <div class="st-complete-stat-num">${s.score}</div>
          <div class="st-complete-stat-label">Total Score</div>
        </div>
        <div class="st-complete-stat">
          <div class="st-complete-stat-num">${correctCount}/${s.answers.length}</div>
          <div class="st-complete-stat-label">Correct</div>
        </div>
        <div class="st-complete-stat">
          <div class="st-complete-stat-num">${Math.round(correctCount / s.answers.length * 100)}%</div>
          <div class="st-complete-stat-label">Accuracy</div>
        </div>
      </div>
      <div style="text-align:left; max-width:600px; margin:0 auto;">
        <h3 style="font-family:var(--mono); font-size:12px; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-light); margin-bottom:12px;">Review</h3>
        ${s.answers.map((a, i) => `
          <div style="padding:10px 0; border-bottom:1px solid var(--border-light); font-size:13px;">
            <span style="color:${a.correct ? 'var(--green)' : '#c4546c'}; font-weight:600;">${a.correct ? '✓' : '✗'}</span>
            Q${i + 1}: ${a.q}
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const foot = document.getElementById('sim-foot');
  foot.className = 'st-lesson-foot';
  const fb = document.getElementById('sim-feedback');
  fb.className = 'st-feedback-msg';
  fb.textContent = correctCount >= 6 ? 'Strong performance. You\'re interview ready.' : 'Keep practicing. Focus on the topics you missed.';
  const action = document.getElementById('sim-action');
  action.textContent = 'Close';
  action.className = 'st-btn success';
  action.disabled = false;
  action.onclick = closeSim;

  renderSimHistory();
}

function closeSim() {
  clearInterval(simState?.timerInterval);
  document.getElementById('sim-overlay').classList.remove('open');
  document.getElementById('sim-timer').classList.remove('warning');
  simState = null;
}

function getSimHistory() {
  try {
    return JSON.parse(localStorage.getItem(SIM_STORAGE) || '[]');
  } catch { return []; }
}

function renderSimHistory() {
  const history = getSimHistory();
  const el = document.getElementById('sim-history');
  if (!history.length) { el.innerHTML = ''; return; }
  const recent = history.slice(-5).reverse();
  el.innerHTML = recent.map(h =>
    `<div class="st-sim-history-item">${h.date} · ${h.difficulty} · <span class="score">${h.correct}/${h.total}</span> · ${h.time}</div>`
  ).join('');
}

/* ─── 10. WIRE UP ──────────────────────────────────────────── */

document.getElementById('lesson-close').addEventListener('click', closeLesson);
document.getElementById('overlay').addEventListener('click', e => {
  if (e.target.id === 'overlay') closeLesson();
});

document.getElementById('sim-close').addEventListener('click', closeSim);
document.getElementById('sim-overlay').addEventListener('click', e => {
  if (e.target.id === 'sim-overlay') closeSim();
});
document.getElementById('sim-start').addEventListener('click', startSim);

document.getElementById('ref-toggle').addEventListener('click', () => {
  document.getElementById('ref-panel').classList.toggle('open');
});

(async () => {
  try {
    await initDB();
    renderPath();
    renderSimHistory();
  } catch (e) {
    document.getElementById('path').innerHTML = `<div class="st-loading" style="color:#c4546c;">Failed to load SQL engine. Check your internet connection and refresh.<br/><small style="opacity:.7;">${escapeHtml(e.message || e)}</small></div>`;
  }
})();
