/* ═══════════════���═══════════════════════════════════════════
   Python Trainer — Duolingo-style coding interview prep
   - Real Python execution via Pyodide (CPython WASM)
   - Learning path with sequential unlocking
   - Progress saved to localStorage
   - Timed interview simulation mode
   ══════════════════════��══════════════════════════���═════════ */

/* ─── 1. STATE ─────────────────���───────────────────────────── */

const PY_STORAGE = 'python-trainer-v1';
const PY_SIM_STORAGE = 'python-sim-history-v1';

const pyDefaultProgress = {
  completed: {},
  xp: 0,
  streakDays: 0,
  lastDay: null,
  hearts: 5,
  heartsRefilledAt: null,
};

let pyProgress = loadPyProgress();
let pyodide = null;
let pyActiveLesson = null;

function loadPyProgress() {
  try {
    const raw = localStorage.getItem(PY_STORAGE);
    if (!raw) return { ...pyDefaultProgress };
    return { ...pyDefaultProgress, ...JSON.parse(raw) };
  } catch { return { ...pyDefaultProgress }; }
}
function savePyProgress() {
  localStorage.setItem(PY_STORAGE, JSON.stringify(pyProgress));
}

function pyTodayStr() { return new Date().toISOString().slice(0, 10); }
function pyBumpStreak() {
  const today = pyTodayStr();
  if (pyProgress.lastDay === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (pyProgress.lastDay === yesterday) pyProgress.streakDays += 1;
  else pyProgress.streakDays = 1;
  pyProgress.lastDay = today;
}
function pyRefillHearts() {
  const now = Date.now();
  if (!pyProgress.heartsRefilledAt) pyProgress.heartsRefilledAt = now;
  const elapsedMin = (now - pyProgress.heartsRefilledAt) / 60000;
  if (pyProgress.hearts < 5 && elapsedMin >= 30) {
    const add = Math.min(5 - pyProgress.hearts, Math.floor(elapsedMin / 30));
    pyProgress.hearts += add;
    pyProgress.heartsRefilledAt = now;
    savePyProgress();
  }
}

/* ─── 2. COURSE CONTENT ────────────────────��───────────────── */
/* Exercise types:
   - intro:  { type:'intro', title, body, syntax }
   - mc:     { type:'mc', q, choices, correct, explain }
   - write:  { type:'write', q, starterCode, testCases:[{input,expected}], hint, explain }
   - fill:   { type:'fill', q, template, answers, explain }
*/

const PY_COURSE = [
  {
    id: 'arrays',
    title: 'Arrays & Hashmaps',
    icon: '📦',
    lessons: [
      {
        title: 'Two Sum',
        exercises: [
          { type: 'intro',
            title: 'The most famous interview question.',
            body: 'Given an array of integers and a target, return the <strong>indices</strong> of two numbers that add up to the target. The hashmap approach runs in O(n) — one pass through the array, storing complements.',
            syntax: '<span class="kw">def</span> <span class="fn">two_sum</span>(nums, target):\n    seen = {}  <span class="cm"># value → index</span>\n    <span class="kw">for</span> i, n <span class="kw">in</span> enumerate(nums):\n        complement = target - n\n        <span class="kw">if</span> complement <span class="kw">in</span> seen:\n            <span class="kw">return</span> [seen[complement], i]\n        seen[n] = i'
          },
          { type: 'mc',
            q: 'What is the time complexity of the hashmap two-sum approach?',
            choices: ['O(n²)', 'O(n)', 'O(n log n)', 'O(1)'],
            correct: 1,
            explain: 'One pass through the array (O(n)), with O(1) hashmap lookups at each step. Total: O(n).'
          },
          { type: 'write',
            q: 'Implement two_sum(nums, target) that returns a list of two indices whose values add to target. Assume exactly one solution exists.',
            starterCode: 'def two_sum(nums, target):\n    # Your code here\n    pass',
            testCases: [
              { input: 'two_sum([2, 7, 11, 15], 9)', expected: '[0, 1]' },
              { input: 'two_sum([3, 2, 4], 6)', expected: '[1, 2]' },
              { input: 'two_sum([3, 3], 6)', expected: '[0, 1]' }
            ],
            hint: 'Use a dict to store {value: index} as you iterate.',
            explain: 'For each number, check if (target - num) is already in the dict. If yes, return both indices.'
          }
        ]
      },
      {
        title: 'Valid Anagram',
        exercises: [
          { type: 'intro',
            title: 'Character frequency counting.',
            body: 'Two strings are anagrams if they use the same characters the same number of times. Use a <strong>Counter</strong> (hashmap of char→count) for O(n) solution.',
            syntax: '<span class="kw">from</span> collections <span class="kw">import</span> Counter\n\n<span class="kw">def</span> <span class="fn">is_anagram</span>(s, t):\n    <span class="kw">return</span> Counter(s) == Counter(t)'
          },
          { type: 'write',
            q: 'Implement is_anagram(s, t) that returns True if t is an anagram of s, False otherwise. Use only lowercase letters.',
            starterCode: 'def is_anagram(s, t):\n    # Your code here\n    pass',
            testCases: [
              { input: 'is_anagram("anagram", "nagaram")', expected: 'True' },
              { input: 'is_anagram("rat", "car")', expected: 'False' },
              { input: 'is_anagram("listen", "silent")', expected: 'True' }
            ],
            hint: 'Count character frequencies with a dict or Counter, then compare.',
            explain: 'Counter comparison is O(n). Sorting both strings would be O(n log n) — faster with hashmaps.'
          },
          { type: 'write',
            q: 'Given a list of strings, group anagrams together. Return a list of groups (order doesn\'t matter).',
            starterCode: 'def group_anagrams(strs):\n    # Your code here\n    pass',
            testCases: [
              { input: 'sorted([sorted(g) for g in group_anagrams(["eat","tea","tan","ate","nat","bat"])])', expected: "[[\'ate\', \'eat\', \'tea\'], [\'bat\'], [\'nat\', \'tan\']]" },
              { input: 'group_anagrams([""])', expected: '[[""]]' }
            ],
            hint: 'Use sorted(word) as a key in a dict of lists.',
            explain: 'Anagrams produce the same string when sorted. Group by that sorted key.'
          }
        ]
      },
      {
        title: 'Contains Duplicate',
        exercises: [
          { type: 'intro',
            title: 'Sets for O(1) lookup.',
            body: 'A <strong>set</strong> gives O(1) membership testing. To check for duplicates: iterate and check if already seen.',
            syntax: '<span class="kw">def</span> <span class="fn">contains_dup</span>(nums):\n    seen = <span class="fn">set</span>()\n    <span class="kw">for</span> n <span class="kw">in</span> nums:\n        <span class="kw">if</span> n <span class="kw">in</span> seen:\n            <span class="kw">return</span> True\n        seen.add(n)\n    <span class="kw">return</span> False'
          },
          { type: 'write',
            q: 'Implement contains_duplicate(nums) that returns True if any value appears at least twice.',
            starterCode: 'def contains_duplicate(nums):\n    # Your code here\n    pass',
            testCases: [
              { input: 'contains_duplicate([1,2,3,1])', expected: 'True' },
              { input: 'contains_duplicate([1,2,3,4])', expected: 'False' },
              { input: 'contains_duplicate([1,1,1,3,3,4,3,2,4,2])', expected: 'True' }
            ],
            hint: 'Use a set. If len(set(nums)) < len(nums), there are duplicates.',
            explain: 'Set approach: O(n) time, O(n) space. One-liner: return len(nums) != len(set(nums)).'
          },
          { type: 'write',
            q: 'Find the top K frequent elements in an array. Return them in any order.',
            starterCode: 'def top_k_frequent(nums, k):\n    # Your code here\n    pass',
            testCases: [
              { input: 'sorted(top_k_frequent([1,1,1,2,2,3], 2))', expected: '[1, 2]' },
              { input: 'top_k_frequent([1], 1)', expected: '[1]' }
            ],
            hint: 'Count frequencies with a dict, then sort by count or use a heap.',
            explain: 'Counter + sorted by value (or heapq.nlargest). O(n log n) with sort, O(n log k) with heap.'
          }
        ]
      },
      {
        title: 'Product of Array Except Self',
        exercises: [
          { type: 'intro',
            title: 'Prefix and suffix products.',
            body: 'Given an array, return a new array where each element is the product of all other elements — <strong>without using division</strong>. The trick: build prefix products from the left and suffix products from the right.',
            syntax: '<span class="kw">def</span> <span class="fn">product_except_self</span>(nums):\n    n = len(nums)\n    result = [1] * n\n    <span class="cm"># left pass: prefix products</span>\n    prefix = 1\n    <span class="kw">for</span> i <span class="kw">in</span> range(n):\n        result[i] = prefix\n        prefix *= nums[i]\n    <span class="cm"># right pass: suffix products</span>\n    suffix = 1\n    <span class="kw">for</span> i <span class="kw">in</span> range(n-1, -1, -1):\n        result[i] *= suffix\n        suffix *= nums[i]\n    <span class="kw">return</span> result'
          },
          { type: 'write',
            q: 'Implement product_except_self(nums). Return an array where output[i] = product of all elements except nums[i]. Do NOT use division.',
            starterCode: 'def product_except_self(nums):\n    # Your code here\n    pass',
            testCases: [
              { input: 'product_except_self([1,2,3,4])', expected: '[24, 12, 8, 6]' },
              { input: 'product_except_self([-1,1,0,-3,3])', expected: '[0, 0, 9, 0, 0]' }
            ],
            hint: 'Two passes: left-to-right for prefix products, right-to-left for suffix.',
            explain: 'O(n) time, O(1) extra space (output array doesn\'t count). This is a FAANG favorite.'
          },
          { type: 'mc',
            q: 'Why can\'t you just compute total_product / nums[i] for each position?',
            choices: [
              'Division is too slow',
              'It breaks when any element is zero (division by zero)',
              'Python doesn\'t support division',
              'The result would be a float'
            ],
            correct: 1,
            explain: 'If nums contains a 0, dividing total_product by 0 fails. The prefix/suffix approach handles zeros correctly.'
          }
        ]
      }
    ]
  },

  {
    id: 'strings',
    title: 'Strings & Sliding Window',
    icon: '🪟',
    lessons: [
      {
        title: 'Longest Substring Without Repeating',
        exercises: [
          { type: 'intro',
            title: 'The sliding window pattern.',
            body: 'A <strong>sliding window</strong> maintains a range [left, right] that expands right and contracts left when a condition breaks. For "longest without repeating": expand right, if char already in window, move left past the duplicate.',
            syntax: '<span class="kw">def</span> <span class="fn">length_of_longest</span>(s):\n    seen = {}  <span class="cm"># char → last index</span>\n    left = 0\n    max_len = 0\n    <span class="kw">for</span> right, c <span class="kw">in</span> enumerate(s):\n        <span class="kw">if</span> c <span class="kw">in</span> seen <span class="kw">and</span> seen[c] >= left:\n            left = seen[c] + 1\n        seen[c] = right\n        max_len = max(max_len, right - left + 1)\n    <span class="kw">return</span> max_len'
          },
          { type: 'write',
            q: 'Implement length_of_longest_substring(s) returning the length of the longest substring without repeating characters.',
            starterCode: 'def length_of_longest_substring(s):\n    # Your code here\n    pass',
            testCases: [
              { input: 'length_of_longest_substring("abcabcbb")', expected: '3' },
              { input: 'length_of_longest_substring("bbbbb")', expected: '1' },
              { input: 'length_of_longest_substring("pwwkew")', expected: '3' },
              { input: 'length_of_longest_substring("")', expected: '0' }
            ],
            hint: 'Use a dict to track last seen index of each char. Move left pointer when you see a repeat.',
            explain: 'O(n) — each character is visited at most twice (once by right, once by left). Classic sliding window.'
          }
        ]
      },
      {
        title: 'Valid Palindrome',
        exercises: [
          { type: 'intro',
            title: 'Two pointers from the edges.',
            body: 'A palindrome reads the same forwards and backwards. Use <strong>two pointers</strong>: one from the start, one from the end, moving inward. Skip non-alphanumeric characters.',
            syntax: '<span class="kw">def</span> <span class="fn">is_palindrome</span>(s):\n    s = <span class="str">""</span>.join(c.lower() <span class="kw">for</span> c <span class="kw">in</span> s <span class="kw">if</span> c.isalnum())\n    <span class="kw">return</span> s == s[::-1]'
          },
          { type: 'write',
            q: 'Implement is_palindrome(s) that returns True if the string is a palindrome (ignoring non-alphanumeric chars and case).',
            starterCode: 'def is_palindrome(s):\n    # Your code here\n    pass',
            testCases: [
              { input: 'is_palindrome("A man, a plan, a canal: Panama")', expected: 'True' },
              { input: 'is_palindrome("race a car")', expected: 'False' },
              { input: 'is_palindrome(" ")', expected: 'True' }
            ],
            hint: 'Clean the string first (lowercase + alphanumeric only), then compare to its reverse.',
            explain: 'O(n) time. The two-pointer version avoids creating a new string — better for follow-up questions about space.'
          }
        ]
      },
      {
        title: 'Minimum Window Substring',
        exercises: [
          { type: 'intro',
            title: 'Hard sliding window.',
            body: 'Given strings s and t, find the minimum window in s that contains all chars of t. Expand right to include chars, shrink left to minimize. Track char counts with a dict.',
            syntax: '<span class="kw">from</span> collections <span class="kw">import</span> Counter\n\n<span class="kw">def</span> <span class="fn">min_window</span>(s, t):\n    need = Counter(t)\n    have = 0\n    need_total = len(need)\n    window = {}\n    left = 0\n    res = (float("inf"), 0, 0)\n    <span class="kw">for</span> right, c <span class="kw">in</span> enumerate(s):\n        window[c] = window.get(c, 0) + 1\n        <span class="kw">if</span> c <span class="kw">in</span> need <span class="kw">and</span> window[c] == need[c]:\n            have += 1\n        <span class="kw">while</span> have == need_total:\n            <span class="kw">if</span> (right - left + 1) < res[0]:\n                res = (right - left + 1, left, right)\n            window[s[left]] -= 1\n            <span class="kw">if</span> s[left] <span class="kw">in</span> need <span class="kw">and</span> window[s[left]] < need[s[left]]:\n                have -= 1\n            left += 1\n    <span class="kw">return</span> s[res[1]:res[2]+1] <span class="kw">if</span> res[0] != float("inf") <span class="kw">else</span> <span class="str">""</span>'
          },
          { type: 'write',
            q: 'Implement min_window(s, t) returning the minimum window substring of s that contains all characters of t. Return "" if no valid window exists.',
            starterCode: 'def min_window(s, t):\n    # Your code here\n    pass',
            testCases: [
              { input: 'min_window("ADOBECODEBANC", "ABC")', expected: '"BANC"' },
              { input: 'min_window("a", "a")', expected: '"a"' },
              { input: 'min_window("a", "aa")', expected: '""' }
            ],
            hint: 'Expand right until window is valid, then shrink left to find minimum. Track satisfied character counts.',
            explain: 'O(n) time. The "have vs need" counter avoids re-checking the entire window on each step.'
          },
          { type: 'mc',
            q: 'In the sliding window pattern, when do you shrink the left pointer?',
            choices: [
              'Every iteration',
              'When the window satisfies the constraint (to minimize it)',
              'Only when right reaches the end',
              'When the window is larger than t'
            ],
            correct: 1,
            explain: 'Shrink left when the window is valid — you are looking for the minimum valid window, so contract after each valid state.'
          }
        ]
      }
    ]
  },

  {
    id: 'stacks',
    title: 'Stacks & Queues',
    icon: '📚',
    lessons: [
      {
        title: 'Valid Parentheses',
        exercises: [
          { type: 'intro',
            title: 'The stack\'s killer app.',
            body: 'For bracket matching, push open brackets onto a stack and pop when you see a close bracket. If the popped bracket matches, continue. If stack is empty at the end, the string is valid.',
            syntax: '<span class="kw">def</span> <span class="fn">is_valid</span>(s):\n    stack = []\n    pairs = {<span class="str">")"</span>: <span class="str">"("</span>, <span class="str">"}"</span>: <span class="str">"{"</span>, <span class="str">"]"</span>: <span class="str">"["</span>}\n    <span class="kw">for</span> c <span class="kw">in</span> s:\n        <span class="kw">if</span> c <span class="kw">in</span> pairs:\n            <span class="kw">if not</span> stack <span class="kw">or</span> stack.pop() != pairs[c]:\n                <span class="kw">return</span> False\n        <span class="kw">else</span>:\n            stack.append(c)\n    <span class="kw">return</span> len(stack) == 0'
          },
          { type: 'write',
            q: 'Implement is_valid(s) that returns True if the string of brackets is valid. Brackets: (), {}, [].',
            starterCode: 'def is_valid(s):\n    # Your code here\n    pass',
            testCases: [
              { input: 'is_valid("()")', expected: 'True' },
              { input: 'is_valid("()[]{}")', expected: 'True' },
              { input: 'is_valid("(]")', expected: 'False' },
              { input: 'is_valid("([)]")', expected: 'False' },
              { input: 'is_valid("{[]}")', expected: 'True' }
            ],
            hint: 'Push openers, pop on closers and compare.',
            explain: 'O(n) time, O(n) space. The stack naturally handles nesting depth.'
          }
        ]
      },
      {
        title: 'Min Stack',
        exercises: [
          { type: 'intro',
            title: 'Stack with O(1) getMin.',
            body: 'Design a stack that supports push, pop, top, and getMin — all in O(1). The trick: maintain a parallel stack that tracks the current minimum at each depth level.',
            syntax: '<span class="kw">class</span> <span class="fn">MinStack</span>:\n    <span class="kw">def</span> __init__(self):\n        self.stack = []\n        self.min_stack = []\n\n    <span class="kw">def</span> push(self, val):\n        self.stack.append(val)\n        m = min(val, self.min_stack[-1] <span class="kw">if</span> self.min_stack <span class="kw">else</span> val)\n        self.min_stack.append(m)\n\n    <span class="kw">def</span> pop(self):\n        self.stack.pop()\n        self.min_stack.pop()\n\n    <span class="kw">def</span> top(self): <span class="kw">return</span> self.stack[-1]\n    <span class="kw">def</span> getMin(self): <span class="kw">return</span> self.min_stack[-1]'
          },
          { type: 'write',
            q: 'Implement a MinStack class with push(val), pop(), top(), and getMin() — all O(1).',
            starterCode: 'class MinStack:\n    def __init__(self):\n        pass\n\n    def push(self, val):\n        pass\n\n    def pop(self):\n        pass\n\n    def top(self):\n        pass\n\n    def getMin(self):\n        pass',
            testCases: [
              { input: 'ms = MinStack(); ms.push(-2); ms.push(0); ms.push(-3); r1 = ms.getMin(); ms.pop(); r2 = ms.top(); r3 = ms.getMin(); [r1, r2, r3]', expected: '[-3, 0, -2]' }
            ],
            hint: 'Keep a second stack that tracks the minimum at each height.',
            explain: 'Each push also pushes the new min to min_stack. Each pop also pops from min_stack. O(1) for all operations.'
          }
        ]
      },
      {
        title: 'Daily Temperatures',
        exercises: [
          { type: 'intro',
            title: 'Monotonic stack pattern.',
            body: 'Given temperatures, find how many days until a warmer day. Use a <strong>monotonic decreasing stack</strong>: when you find a warmer temp, pop all cooler days from the stack and record their wait time.',
            syntax: '<span class="kw">def</span> <span class="fn">daily_temps</span>(temps):\n    result = [0] * len(temps)\n    stack = []  <span class="cm"># indices of decreasing temps</span>\n    <span class="kw">for</span> i, t <span class="kw">in</span> enumerate(temps):\n        <span class="kw">while</span> stack <span class="kw">and</span> temps[stack[-1]] < t:\n            j = stack.pop()\n            result[j] = i - j\n        stack.append(i)\n    <span class="kw">return</span> result'
          },
          { type: 'write',
            q: 'Implement daily_temperatures(temperatures) returning a list where output[i] is the number of days until a warmer temperature. 0 if no warmer day exists.',
            starterCode: 'def daily_temperatures(temperatures):\n    # Your code here\n    pass',
            testCases: [
              { input: 'daily_temperatures([73,74,75,71,69,72,76,73])', expected: '[1, 1, 4, 2, 1, 1, 0, 0]' },
              { input: 'daily_temperatures([30,40,50,60])', expected: '[1, 1, 1, 0]' },
              { input: 'daily_temperatures([30,20,10])', expected: '[0, 0, 0]' }
            ],
            hint: 'Use a stack of indices. Pop when current temp > stack top temp.',
            explain: 'Monotonic stack: O(n) — each index is pushed and popped at most once. This pattern solves "next greater element" problems.'
          }
        ]
      }
    ]
  },

  {
    id: 'trees',
    title: 'Trees & Graphs',
    icon: '🌳',
    lessons: [
      {
        title: 'Binary Tree Traversal',
        exercises: [
          { type: 'intro',
            title: 'DFS: inorder, preorder, postorder.',
            body: 'Trees are recursive structures. <strong>Inorder</strong> (left → root → right) gives sorted output for BSTs. <strong>Preorder</strong> (root → left → right) and <strong>Postorder</strong> (left → right → root) are used for serialization and evaluation.',
            syntax: '<span class="kw">class</span> <span class="fn">TreeNode</span>:\n    <span class="kw">def</span> __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\n<span class="kw">def</span> <span class="fn">inorder</span>(root):\n    <span class="kw">if not</span> root: <span class="kw">return</span> []\n    <span class="kw">return</span> inorder(root.left) + [root.val] + inorder(root.right)'
          },
          { type: 'write',
            q: 'Implement invert_tree(root) that flips a binary tree (swap left and right children at every node). Return the root. Use the TreeNode class.',
            starterCode: 'class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef invert_tree(root):\n    # Your code here\n    pass\n\n# Helper to convert tree to list (BFS)\ndef tree_to_list(root):\n    if not root: return []\n    result, queue = [], [root]\n    while queue:\n        node = queue.pop(0)\n        if node:\n            result.append(node.val)\n            queue.append(node.left)\n            queue.append(node.right)\n        else:\n            result.append(None)\n    while result and result[-1] is None: result.pop()\n    return result',
            testCases: [
              { input: 'tree_to_list(invert_tree(TreeNode(4, TreeNode(2, TreeNode(1), TreeNode(3)), TreeNode(7, TreeNode(6), TreeNode(9)))))', expected: '[4, 7, 2, 9, 6, 3, 1]' },
              { input: 'tree_to_list(invert_tree(TreeNode(2, TreeNode(1), TreeNode(3))))', expected: '[2, 3, 1]' }
            ],
            hint: 'Recursively swap left and right, then recurse on children.',
            explain: 'Swap root.left and root.right, then recurse. Base case: if root is None, return None. O(n) time.'
          }
        ]
      },
      {
        title: 'Max Depth & Balanced Tree',
        exercises: [
          { type: 'intro',
            title: 'Recursive tree height.',
            body: 'The <strong>depth</strong> of a tree is 1 + max(depth_left, depth_right). A tree is <strong>balanced</strong> if for every node, the heights of left and right subtrees differ by at most 1.',
            syntax: '<span class="kw">def</span> <span class="fn">max_depth</span>(root):\n    <span class="kw">if not</span> root: <span class="kw">return</span> 0\n    <span class="kw">return</span> 1 + max(max_depth(root.left), max_depth(root.right))'
          },
          { type: 'write',
            q: 'Implement max_depth(root) that returns the maximum depth (number of nodes along the longest path from root to leaf).',
            starterCode: 'class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef max_depth(root):\n    # Your code here\n    pass',
            testCases: [
              { input: 'max_depth(TreeNode(3, TreeNode(9), TreeNode(20, TreeNode(15), TreeNode(7))))', expected: '3' },
              { input: 'max_depth(TreeNode(1, None, TreeNode(2)))', expected: '2' },
              { input: 'max_depth(None)', expected: '0' }
            ],
            hint: '1 + max(left depth, right depth). Base case: None → 0.',
            explain: 'Classic recursion: each node delegates to its children, adds 1 for itself. O(n) visits every node once.'
          }
        ]
      },
      {
        title: 'BFS: Level Order Traversal',
        exercises: [
          { type: 'intro',
            title: 'Process level by level.',
            body: '<strong>BFS</strong> uses a queue. Process all nodes at the current depth before moving deeper. Perfect for "shortest path" and "level-by-level" problems.',
            syntax: '<span class="kw">from</span> collections <span class="kw">import</span> deque\n\n<span class="kw">def</span> <span class="fn">level_order</span>(root):\n    <span class="kw">if not</span> root: <span class="kw">return</span> []\n    result, queue = [], deque([root])\n    <span class="kw">while</span> queue:\n        level = []\n        <span class="kw">for</span> _ <span class="kw">in</span> range(len(queue)):\n            node = queue.popleft()\n            level.append(node.val)\n            <span class="kw">if</span> node.left: queue.append(node.left)\n            <span class="kw">if</span> node.right: queue.append(node.right)\n        result.append(level)\n    <span class="kw">return</span> result'
          },
          { type: 'write',
            q: 'Implement level_order(root) that returns a list of lists, where each inner list contains node values at that depth level.',
            starterCode: 'from collections import deque\n\nclass TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef level_order(root):\n    # Your code here\n    pass',
            testCases: [
              { input: 'level_order(TreeNode(3, TreeNode(9), TreeNode(20, TreeNode(15), TreeNode(7))))', expected: '[[3], [9, 20], [15, 7]]' },
              { input: 'level_order(TreeNode(1))', expected: '[[1]]' },
              { input: 'level_order(None)', expected: '[]' }
            ],
            hint: 'Use a deque. Process len(queue) nodes per level, appending children.',
            explain: 'The key insight: snapshot the queue length at the start of each level, process exactly that many nodes.'
          }
        ]
      }
    ]
  },

  {
    id: 'dp',
    title: 'Dynamic Programming',
    icon: '🧩',
    lessons: [
      {
        title: 'Climbing Stairs',
        exercises: [
          { type: 'intro',
            title: 'The gateway DP problem.',
            body: 'You can climb 1 or 2 stairs at a time. How many ways to reach step n? This is the Fibonacci sequence. <strong>DP</strong> means: break into subproblems, solve bottom-up (or memoize top-down), avoid recomputation.',
            syntax: '<span class="kw">def</span> <span class="fn">climb_stairs</span>(n):\n    <span class="kw">if</span> n <= 2: <span class="kw">return</span> n\n    a, b = 1, 2\n    <span class="kw">for</span> _ <span class="kw">in</span> range(3, n + 1):\n        a, b = b, a + b\n    <span class="kw">return</span> b'
          },
          { type: 'write',
            q: 'Implement climb_stairs(n) returning the number of distinct ways to climb n stairs (1 or 2 steps at a time).',
            starterCode: 'def climb_stairs(n):\n    # Your code here\n    pass',
            testCases: [
              { input: 'climb_stairs(2)', expected: '2' },
              { input: 'climb_stairs(3)', expected: '3' },
              { input: 'climb_stairs(5)', expected: '8' },
              { input: 'climb_stairs(10)', expected: '89' }
            ],
            hint: 'dp[i] = dp[i-1] + dp[i-2]. You only need the last two values.',
            explain: 'O(n) time, O(1) space with two variables. This is Fibonacci with a different name.'
          }
        ]
      },
      {
        title: 'Coin Change',
        exercises: [
          { type: 'intro',
            title: 'Minimum coins for amount.',
            body: 'Given coins and a target amount, find the fewest coins needed. Build a DP table: dp[i] = min coins to make amount i. For each amount, try each coin and take the minimum.',
            syntax: '<span class="kw">def</span> <span class="fn">coin_change</span>(coins, amount):\n    dp = [float("inf")] * (amount + 1)\n    dp[0] = 0\n    <span class="kw">for</span> a <span class="kw">in</span> range(1, amount + 1):\n        <span class="kw">for</span> c <span class="kw">in</span> coins:\n            <span class="kw">if</span> c <= a:\n                dp[a] = min(dp[a], dp[a - c] + 1)\n    <span class="kw">return</span> dp[amount] <span class="kw">if</span> dp[amount] != float("inf") <span class="kw">else</span> -1'
          },
          { type: 'write',
            q: 'Implement coin_change(coins, amount) returning the minimum number of coins needed. Return -1 if impossible.',
            starterCode: 'def coin_change(coins, amount):\n    # Your code here\n    pass',
            testCases: [
              { input: 'coin_change([1, 5, 10, 25], 30)', expected: '2' },
              { input: 'coin_change([2], 3)', expected: '-1' },
              { input: 'coin_change([1], 0)', expected: '0' },
              { input: 'coin_change([1, 2, 5], 11)', expected: '3' }
            ],
            hint: 'dp[0] = 0, dp[i] = min(dp[i - coin] + 1) for each coin <= i.',
            explain: 'O(amount * len(coins)) time. Classic unbounded knapsack variant.'
          }
        ]
      },
      {
        title: 'Longest Increasing Subsequence',
        exercises: [
          { type: 'intro',
            title: 'Classic O(n²) DP + O(n log n) optimization.',
            body: 'Find the longest strictly increasing subsequence. DP approach: dp[i] = length of LIS ending at index i. For each i, check all j < i where nums[j] < nums[i].',
            syntax: '<span class="kw">def</span> <span class="fn">length_of_lis</span>(nums):\n    dp = [1] * len(nums)\n    <span class="kw">for</span> i <span class="kw">in</span> range(1, len(nums)):\n        <span class="kw">for</span> j <span class="kw">in</span> range(i):\n            <span class="kw">if</span> nums[j] < nums[i]:\n                dp[i] = max(dp[i], dp[j] + 1)\n    <span class="kw">return</span> max(dp)'
          },
          { type: 'write',
            q: 'Implement length_of_lis(nums) returning the length of the longest strictly increasing subsequence.',
            starterCode: 'def length_of_lis(nums):\n    # Your code here\n    pass',
            testCases: [
              { input: 'length_of_lis([10,9,2,5,3,7,101,18])', expected: '4' },
              { input: 'length_of_lis([0,1,0,3,2,3])', expected: '4' },
              { input: 'length_of_lis([7,7,7,7,7,7,7])', expected: '1' }
            ],
            hint: 'dp[i] = 1 + max(dp[j] for all j < i where nums[j] < nums[i]).',
            explain: 'O(n²) with nested loops. The O(n log n) version uses binary search on a tails array — good follow-up to mention.'
          },
          { type: 'mc',
            q: 'How would you improve the O(n²) LIS to O(n log n)?',
            choices: [
              'Use a hashmap instead of an array',
              'Maintain a tails array and use binary search for insertion position',
              'Sort the input first',
              'Use memoization'
            ],
            correct: 1,
            explain: 'The patience sorting approach: maintain an array of smallest tail elements. Binary search where to place each new element. O(n log n).'
          }
        ]
      }
    ]
  },

  {
    id: 'sorting',
    title: 'Sorting & Searching',
    icon: '🔍',
    lessons: [
      {
        title: 'Binary Search',
        exercises: [
          { type: 'intro',
            title: 'Halve the search space.',
            body: '<strong>Binary search</strong> finds a target in a sorted array in O(log n) by repeatedly cutting the search range in half. The tricky part: getting the boundaries right (left <= right? left < right? mid calculation).',
            syntax: '<span class="kw">def</span> <span class="fn">binary_search</span>(nums, target):\n    left, right = 0, len(nums) - 1\n    <span class="kw">while</span> left <= right:\n        mid = (left + right) // 2\n        <span class="kw">if</span> nums[mid] == target:\n            <span class="kw">return</span> mid\n        <span class="kw">elif</span> nums[mid] < target:\n            left = mid + 1\n        <span class="kw">else</span>:\n            right = mid - 1\n    <span class="kw">return</span> -1'
          },
          { type: 'write',
            q: 'Implement search(nums, target) that returns the index of target in a sorted array, or -1 if not found.',
            starterCode: 'def search(nums, target):\n    # Your code here\n    pass',
            testCases: [
              { input: 'search([-1,0,3,5,9,12], 9)', expected: '4' },
              { input: 'search([-1,0,3,5,9,12], 2)', expected: '-1' },
              { input: 'search([5], 5)', expected: '0' }
            ],
            hint: 'left = 0, right = len-1. While left <= right, compute mid and narrow.',
            explain: 'O(log n) time. The most important detail: use left <= right (not <) to handle single-element ranges.'
          }
        ]
      },
      {
        title: 'Search in Rotated Sorted Array',
        exercises: [
          { type: 'intro',
            title: 'Binary search with a twist.',
            body: 'A sorted array rotated at some pivot (e.g., [4,5,6,7,0,1,2]). One half is always sorted. Determine which half, then decide which side to search.',
            syntax: '<span class="kw">def</span> <span class="fn">search_rotated</span>(nums, target):\n    left, right = 0, len(nums) - 1\n    <span class="kw">while</span> left <= right:\n        mid = (left + right) // 2\n        <span class="kw">if</span> nums[mid] == target: <span class="kw">return</span> mid\n        <span class="cm"># left half is sorted</span>\n        <span class="kw">if</span> nums[left] <= nums[mid]:\n            <span class="kw">if</span> nums[left] <= target < nums[mid]:\n                right = mid - 1\n            <span class="kw">else</span>:\n                left = mid + 1\n        <span class="cm"># right half is sorted</span>\n        <span class="kw">else</span>:\n            <span class="kw">if</span> nums[mid] < target <= nums[right]:\n                left = mid + 1\n            <span class="kw">else</span>:\n                right = mid - 1\n    <span class="kw">return</span> -1'
          },
          { type: 'write',
            q: 'Implement search_rotated(nums, target) that searches a rotated sorted array in O(log n). Return index or -1.',
            starterCode: 'def search_rotated(nums, target):\n    # Your code here\n    pass',
            testCases: [
              { input: 'search_rotated([4,5,6,7,0,1,2], 0)', expected: '4' },
              { input: 'search_rotated([4,5,6,7,0,1,2], 3)', expected: '-1' },
              { input: 'search_rotated([1], 0)', expected: '-1' }
            ],
            hint: 'At each step, one half is sorted. Check if target is in the sorted half.',
            explain: 'Key insight: after finding mid, one of [left..mid] or [mid..right] must be sorted. Check if target falls in the sorted range.'
          }
        ]
      },
      {
        title: 'Merge Intervals',
        exercises: [
          { type: 'intro',
            title: 'Sort then merge overlaps.',
            body: 'Given a list of intervals, merge all overlapping ones. Sort by start time, then iterate: if current overlaps the last merged interval, extend it. Otherwise, add a new interval.',
            syntax: '<span class="kw">def</span> <span class="fn">merge</span>(intervals):\n    intervals.sort()\n    merged = [intervals[0]]\n    <span class="kw">for</span> start, end <span class="kw">in</span> intervals[1:]:\n        <span class="kw">if</span> start <= merged[-1][1]:\n            merged[-1][1] = max(merged[-1][1], end)\n        <span class="kw">else</span>:\n            merged.append([start, end])\n    <span class="kw">return</span> merged'
          },
          { type: 'write',
            q: 'Implement merge_intervals(intervals) that merges all overlapping intervals. Input: list of [start, end] pairs.',
            starterCode: 'def merge_intervals(intervals):\n    # Your code here\n    pass',
            testCases: [
              { input: 'merge_intervals([[1,3],[2,6],[8,10],[15,18]])', expected: '[[1, 6], [8, 10], [15, 18]]' },
              { input: 'merge_intervals([[1,4],[4,5]])', expected: '[[1, 5]]' },
              { input: 'merge_intervals([[1,4],[0,4]])', expected: '[[0, 4]]' }
            ],
            hint: 'Sort by start. If current start <= last merged end, extend. Else append.',
            explain: 'O(n log n) for the sort. The merge pass is O(n). Sorting is the key — it ensures overlaps are adjacent.'
          }
        ]
      }
    ]
  }
];

/* ─── 3. PYODIDE INIT ──────────────────────��──────────────── */

async function initPyodide() {
  pyodide = await loadPyodide();
}

function runPython(code) {
  try {
    pyodide.runPython(code);
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}

function evalPython(expr) {
  try {
    const result = pyodide.runPython(expr);
    return { value: String(result) };
  } catch (e) {
    return { error: e.message };
  }
}

/* ─── 4. PATH RENDERING ────────────���───────────────────────── */

function pyIsLessonUnlocked(unitIdx, lessonIdx) {
  if (unitIdx === 0 && lessonIdx === 0) return true;
  if (lessonIdx > 0) {
    return !!pyProgress.completed[`${PY_COURSE[unitIdx].id}.${lessonIdx - 1}`];
  }
  const prev = PY_COURSE[unitIdx - 1];
  return !!pyProgress.completed[`${prev.id}.${prev.lessons.length - 1}`];
}

function pyIsLessonDone(unitId, lessonIdx) {
  return !!pyProgress.completed[`${unitId}.${lessonIdx}`];
}

function pyTotalLessons() {
  return PY_COURSE.reduce((n, u) => n + u.lessons.length, 0);
}
function pyDoneLessons() {
  return Object.keys(pyProgress.completed).filter(k => pyProgress.completed[k]).length;
}

function pyRenderPath() {
  const path = document.getElementById('path');
  path.innerHTML = PY_COURSE.map((unit, ui) => `
    <section class="st-unit">
      <div class="st-unit-header">
        <span class="st-unit-num">Unit ${ui + 1}</span>
        <span class="st-unit-title">${unit.icon} ${unit.title}</span>
      </div>
      <div class="st-nodes">
        ${unit.lessons.map((lesson, li) => {
          const unlocked = pyIsLessonUnlocked(ui, li);
          const done = pyIsLessonDone(unit.id, li);
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
      pyStartLesson(Number(n.dataset.unit), Number(n.dataset.lesson));
    });
  });

  pyUpdateProgressBar();
  pyUpdateStats();
}

function pyUpdateProgressBar() {
  const total = pyTotalLessons();
  const done = pyDoneLessons();
  const pct = Math.round((done / total) * 100);
  document.getElementById('prog-done').textContent = done;
  document.getElementById('prog-total').textContent = total;
  document.getElementById('prog-pct').textContent = pct + '%';
  document.getElementById('prog-fill').style.width = pct + '%';
}

function pyUpdateStats() {
  pyRefillHearts();
  document.getElementById('stat-xp').textContent = pyProgress.xp;
  document.getElementById('stat-streak').textContent = pyProgress.streakDays;
  document.getElementById('stat-hearts').textContent = pyProgress.hearts;
}

/* ─── 5. LESSON FLOW ─────────���─────────────────────────────── */

function pyStartLesson(unitIdx, lessonIdx) {
  const unit = PY_COURSE[unitIdx];
  const lesson = unit.lessons[lessonIdx];
  pyActiveLesson = {
    unitId: unit.id,
    unitIdx, lessonIdx,
    exercises: lesson.exercises,
    currentIdx: 0,
    hearts: pyProgress.hearts,
    xpEarned: 0,
    failed: false,
  };
  document.getElementById('overlay').classList.add('open');
  pyRenderExercise();
}

function pyCloseLesson() {
  document.getElementById('overlay').classList.remove('open');
  pyActiveLesson = null;
  pyRenderPath();
}

function pyRenderExercise() {
  const al = pyActiveLesson;
  const ex = al.exercises[al.currentIdx];
  const body = document.getElementById('lesson-body');
  const pct = (al.currentIdx / al.exercises.length) * 100;
  document.getElementById('lesson-pfill').style.width = pct + '%';

  // hearts
  const hh = document.getElementById('lesson-hearts');
  hh.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const h = document.createElement('span');
    h.textContent = '♥';
    if (i >= al.hearts) h.className = 'lost';
    hh.appendChild(h);
  }

  // footer
  document.getElementById('lesson-foot').className = 'st-lesson-foot';
  document.getElementById('lesson-feedback').className = 'st-feedback-msg';
  document.getElementById('lesson-feedback').textContent = ex.type === 'intro'
    ? 'Read through, then continue.' : 'Write your solution, then check.';
  const action = document.getElementById('lesson-action');
  action.textContent = ex.type === 'intro' ? 'Continue' : 'Run Tests';
  action.className = 'st-btn primary';
  action.disabled = ex.type !== 'intro';
  action.onclick = ex.type === 'intro' ? pyNextExercise : pyCheckAnswer;

  body.innerHTML = `<div class="st-lesson-content">${pyRenderExContent(ex)}</div>`;
  pyWireInputs(ex);
}

function pyRenderExContent(ex) {
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
          ${ex.choices.map((c, i) => `<button class="st-choice" data-i="${i}">${escHtml(c)}</button>`).join('')}
        </div>
      `;
    case 'write':
      return `
        <div class="st-q-type">Write the code</div>
        <h2 class="st-q-title">${ex.q}</h2>
        ${ex.hint ? `<p class="st-q-sub"><strong>Hint:</strong> ${ex.hint}</p>` : ''}
        <div class="st-editor-label">Your solution</div>
        <textarea class="st-editor" id="ex-editor" spellcheck="false" autocapitalize="off" style="min-height:180px;">${escHtml(ex.starterCode || '')}</textarea>
        <div id="ex-result"></div>
        <details class="st-expected"><summary>Show test cases</summary>
          <div style="margin-top:8px; font-family:var(--mono); font-size:12px;">
            ${ex.testCases.map(tc => `<div style="margin-bottom:4px;"><code>${escHtml(tc.input)}</code> → <code>${escHtml(tc.expected)}</code></div>`).join('')}
          </div>
        </details>
      `;
    case 'fill':
      return `
        <div class="st-q-type">Fill the blanks</div>
        <h2 class="st-q-title">${ex.q}</h2>
        <div class="st-fill" id="ex-fill">${ex.template.replace(/\{\{(\d+)\}\}/g, (_, i) =>
          `<input data-blank="${i}" autocapitalize="off" spellcheck="false" />`)}</div>
      `;
  }
}

function pyWireInputs(ex) {
  const action = document.getElementById('lesson-action');

  if (ex.type === 'mc') {
    document.querySelectorAll('#ex-choices .st-choice').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#ex-choices .st-choice').forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        pyActiveLesson.userAnswer = Number(b.dataset.i);
        action.disabled = false;
      });
    });
  }

  if (ex.type === 'write') {
    const ta = document.getElementById('ex-editor');
    ta.addEventListener('input', () => { action.disabled = ta.value.trim().length < 10; });
  }

  if (ex.type === 'fill') {
    const inputs = document.querySelectorAll('#ex-fill input');
    inputs.forEach(inp => {
      inp.addEventListener('input', () => {
        action.disabled = !Array.from(inputs).every(i => i.value.trim().length > 0);
      });
    });
  }
}

/* ─── 6. ANSWER CHECKING ─────────────────��─────────────────── */

function pyCheckAnswer() {
  const al = pyActiveLesson;
  const ex = al.exercises[al.currentIdx];
  let correct = false;
  let detail = '';

  if (ex.type === 'mc') {
    correct = al.userAnswer === ex.correct;
    document.querySelectorAll('#ex-choices .st-choice').forEach((b, i) => {
      b.classList.add('disabled');
      if (i === ex.correct) b.classList.add('correct');
      if (i === al.userAnswer && i !== ex.correct) b.classList.add('wrong');
    });
  }

  if (ex.type === 'fill') {
    const inputs = document.querySelectorAll('#ex-fill input');
    correct = true;
    inputs.forEach(inp => {
      const i = Number(inp.dataset.blank);
      const ok = inp.value.trim().toLowerCase() === ex.answers[i].trim().toLowerCase();
      inp.classList.add(ok ? 'correct' : 'wrong');
      inp.disabled = true;
      if (!ok) correct = false;
    });
  }

  if (ex.type === 'write') {
    const userCode = document.getElementById('ex-editor').value.trim();
    const out = document.getElementById('ex-result');

    // Run user code then test cases
    const defineResult = runPython(userCode);
    if (defineResult.error) {
      correct = false;
      detail = defineResult.error.split('\n').pop();
      out.innerHTML = `<div class="st-result-empty" style="color:#c4546c;">⚠ ${escHtml(detail)}</div>`;
    } else {
      let allPass = true;
      let results = [];
      for (const tc of ex.testCases) {
        const r = evalPython(`repr(${tc.input})`);
        if (r.error) {
          allPass = false;
          results.push({ input: tc.input, expected: tc.expected, got: 'ERROR: ' + r.error.split('\n').pop(), pass: false });
        } else {
          const got = r.value;
          const pass = got === tc.expected;
          if (!pass) allPass = false;
          results.push({ input: tc.input, expected: tc.expected, got, pass });
        }
      }
      correct = allPass;
      out.innerHTML = `
        <div class="st-result">
          <table>
            <thead><tr><th>Input</th><th>Expected</th><th>Got</th><th></th></tr></thead>
            <tbody>${results.map(r => `
              <tr style="color:${r.pass ? 'var(--green)' : '#c4546c'};">
                <td style="font-size:11px;">${escHtml(r.input)}</td>
                <td>${escHtml(r.expected)}</td>
                <td>${escHtml(r.got)}</td>
                <td>${r.pass ? '✓' : '✗'}</td>
              </tr>
            `).join('')}</tbody>
          </table>
        </div>
      `;
    }
  }

  // Feedback
  const foot = document.getElementById('lesson-foot');
  const fb = document.getElementById('lesson-feedback');
  const action = document.getElementById('lesson-action');

  if (correct) {
    al.xpEarned += 15;
    foot.classList.add('correct');
    fb.className = 'st-feedback-msg correct';
    fb.innerHTML = `✓ All tests pass! ${ex.explain || ''}`;
    action.className = 'st-btn success';
    action.textContent = al.currentIdx === al.exercises.length - 1 ? 'Finish' : 'Continue';
    action.disabled = false;
    action.onclick = pyNextExercise;
  } else {
    al.hearts = Math.max(0, al.hearts - 1);
    pyProgress.hearts = al.hearts;
    pyProgress.heartsRefilledAt = Date.now();
    savePyProgress();

    foot.classList.add('wrong');
    fb.className = 'st-feedback-msg wrong';
    fb.innerHTML = `✗ Not quite. ${detail || ex.explain || ''}`;
    action.textContent = 'Try again';
    action.className = 'st-btn primary';
    action.disabled = false;

    if (al.hearts === 0) {
      al.failed = true;
      action.textContent = 'Close';
      action.onclick = pyCloseLesson;
      fb.innerHTML += ' Out of hearts! Take a break.';
    } else {
      action.onclick = () => pyRenderExercise();
    }

    // re-render hearts
    const hh = document.getElementById('lesson-hearts');
    hh.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const h = document.createElement('span');
      h.textContent = '♥';
      if (i >= al.hearts) h.className = 'lost';
      hh.appendChild(h);
    }
  }
}

function pyNextExercise() {
  pyActiveLesson.currentIdx += 1;
  if (pyActiveLesson.currentIdx >= pyActiveLesson.exercises.length) {
    pyFinishLesson();
  } else {
    pyRenderExercise();
  }
}

function pyFinishLesson() {
  const al = pyActiveLesson;
  const key = `${al.unitId}.${al.lessonIdx}`;
  const wasFirst = !pyProgress.completed[key];
  pyProgress.completed[key] = true;
  if (wasFirst) {
    pyProgress.xp += al.xpEarned;
    pyBumpStreak();
  }
  savePyProgress();

  document.getElementById('lesson-pfill').style.width = '100%';
  document.getElementById('lesson-body').innerHTML = `
    <div class="st-complete">
      <div class="st-complete-emoji">🎉</div>
      <h2>Lesson complete!</h2>
      <p>${PY_COURSE[al.unitIdx].title} · ${PY_COURSE[al.unitIdx].lessons[al.lessonIdx].title}</p>
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
          <div class="st-complete-stat-num">${pyProgress.streakDays}🔥</div>
          <div class="st-complete-stat-label">Day streak</div>
        </div>
      </div>
    </div>
  `;
  const foot = document.getElementById('lesson-foot');
  foot.className = 'st-lesson-foot correct';
  const fb = document.getElementById('lesson-feedback');
  fb.className = 'st-feedback-msg correct';
  fb.textContent = wasFirst ? 'Nice — next lesson unlocked.' : 'Reviewed. XP only counts first time.';
  const action = document.getElementById('lesson-action');
  action.textContent = 'Back to path';
  action.className = 'st-btn success';
  action.disabled = false;
  action.onclick = pyCloseLesson;
}

/* ─── 7. INTERVIEW SIM MODE ────────────────────���──────────── */

const PY_SIM_DURATION = 30 * 60;
const PY_SIM_QUESTIONS = 6;
let pySimState = null;

function getPySimPool(difficulty) {
  const pools = {
    easy: ['arrays', 'strings'],
    medium: ['stacks', 'trees'],
    hard: ['dp', 'sorting'],
    mixed: ['arrays', 'strings', 'stacks', 'trees', 'dp', 'sorting']
  };
  const unitIds = pools[difficulty] || pools.mixed;
  const questions = [];
  PY_COURSE.forEach(unit => {
    if (!unitIds.includes(unit.id)) return;
    unit.lessons.forEach(lesson => {
      lesson.exercises.forEach(ex => {
        if (ex.type === 'write') questions.push({ ...ex, unitTitle: unit.title, lessonTitle: lesson.title });
      });
    });
  });
  return questions;
}

function pyStartSim() {
  const difficulty = document.getElementById('sim-difficulty').value;
  const pool = getPySimPool(difficulty);
  if (pool.length < PY_SIM_QUESTIONS) { alert('Not enough questions. Try "mixed".'); return; }

  const picked = pyShuffle(pool).slice(0, PY_SIM_QUESTIONS);
  pySimState = {
    questions: picked, currentIdx: 0, score: 0, difficulty,
    startTime: Date.now(), timerInterval: null, answers: [], timeLeft: PY_SIM_DURATION
  };

  document.getElementById('sim-overlay').classList.add('open');
  pyStartSimTimer();
  pyRenderSimQ();
}

function pyStartSimTimer() {
  const timerEl = document.getElementById('sim-timer');
  pySimState.timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - pySimState.startTime) / 1000);
    pySimState.timeLeft = Math.max(0, PY_SIM_DURATION - elapsed);
    const min = Math.floor(pySimState.timeLeft / 60);
    const sec = pySimState.timeLeft % 60;
    timerEl.textContent = `${min}:${String(sec).padStart(2, '0')}`;
    if (pySimState.timeLeft <= 120) timerEl.classList.add('warning');
    if (pySimState.timeLeft === 0) { clearInterval(pySimState.timerInterval); pyEndSim(true); }
  }, 1000);
}

function pyRenderSimQ() {
  const s = pySimState;
  const ex = s.questions[s.currentIdx];
  const body = document.getElementById('sim-body');

  document.getElementById('sim-q-count').textContent = `Q${s.currentIdx + 1} / ${PY_SIM_QUESTIONS}`;
  document.getElementById('sim-score').textContent = `Score: ${s.score}`;

  document.getElementById('sim-foot').className = 'st-lesson-foot';
  const fb = document.getElementById('sim-feedback');
  fb.className = 'st-feedback-msg';
  fb.textContent = `${ex.unitTitle} · ${ex.lessonTitle}`;
  const action = document.getElementById('sim-action');
  action.textContent = 'Run Tests';
  action.className = 'st-btn primary';
  action.disabled = true;
  action.onclick = pyCheckSimAnswer;

  body.innerHTML = `
    <div class="st-lesson-content">
      <div class="st-q-type">Interview Question ${s.currentIdx + 1} of ${PY_SIM_QUESTIONS}</div>
      <h2 class="st-q-title">${ex.q}</h2>
      ${ex.hint ? `<p class="st-q-sub"><strong>Hint:</strong> ${ex.hint}</p>` : ''}
      <div class="st-editor-label">Your solution</div>
      <textarea class="st-editor" id="sim-editor" spellcheck="false" autocapitalize="off" style="min-height:200px;">${escHtml(ex.starterCode || '')}</textarea>
      <div id="sim-result"></div>
    </div>
  `;

  const ta = document.getElementById('sim-editor');
  ta.addEventListener('input', () => { action.disabled = ta.value.trim().length < 10; });
  ta.focus();
}

function pyCheckSimAnswer() {
  const s = pySimState;
  const ex = s.questions[s.currentIdx];
  const userCode = document.getElementById('sim-editor').value.trim();
  const out = document.getElementById('sim-result');
  const foot = document.getElementById('sim-foot');
  const fb = document.getElementById('sim-feedback');
  const action = document.getElementById('sim-action');

  let correct = false;
  const defineResult = runPython(userCode);
  if (defineResult.error) {
    out.innerHTML = `<div class="st-result-empty" style="color:#c4546c;">⚠ ${escHtml(defineResult.error.split('\\n').pop())}</div>`;
  } else {
    let allPass = true;
    let results = [];
    for (const tc of ex.testCases) {
      const r = evalPython(`repr(${tc.input})`);
      if (r.error) { allPass = false; results.push({ input: tc.input, expected: tc.expected, got: 'ERROR', pass: false }); }
      else { const pass = r.value === tc.expected; if (!pass) allPass = false; results.push({ input: tc.input, expected: tc.expected, got: r.value, pass }); }
    }
    correct = allPass;
    out.innerHTML = `<div class="st-result"><table><thead><tr><th>Input</th><th>Expected</th><th>Got</th><th></th></tr></thead><tbody>${results.map(r => `<tr style="color:${r.pass ? 'var(--green)' : '#c4546c'};"><td style="font-size:11px;">${escHtml(r.input)}</td><td>${escHtml(r.expected)}</td><td>${escHtml(r.got)}</td><td>${r.pass ? '✓' : '✗'}</td></tr>`).join('')}</tbody></table></div>`;
  }

  s.answers.push({ q: ex.q, correct, userCode });

  if (correct) {
    s.score += Math.max(15, Math.floor(s.timeLeft / 12));
    foot.classList.add('correct');
    fb.className = 'st-feedback-msg correct';
    fb.innerHTML = `✓ All tests pass! +${Math.max(15, Math.floor(s.timeLeft / 12))} pts`;
  } else {
    foot.classList.add('wrong');
    fb.className = 'st-feedback-msg wrong';
    fb.textContent = '✗ Some tests failed.';
  }

  document.getElementById('sim-score').textContent = `Score: ${s.score}`;
  const isLast = s.currentIdx >= PY_SIM_QUESTIONS - 1;
  action.textContent = isLast ? 'Finish' : 'Next';
  action.className = isLast ? 'st-btn success' : 'st-btn primary';
  action.disabled = false;
  action.onclick = isLast ? () => pyEndSim(false) : pyNextSimQ;
}

function pyNextSimQ() { pySimState.currentIdx++; pyRenderSimQ(); }

function pyEndSim(timedOut) {
  clearInterval(pySimState.timerInterval);
  const s = pySimState;
  const correctCount = s.answers.filter(a => a.correct).length;
  const elapsed = Math.min(PY_SIM_DURATION, Math.floor((Date.now() - s.startTime) / 1000));
  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;

  const history = getPySimHistory();
  history.push({ date: pyTodayStr(), difficulty: s.difficulty, score: s.score, correct: correctCount, total: s.answers.length, time: `${min}:${String(sec).padStart(2, '0')}`, timedOut });
  localStorage.setItem(PY_SIM_STORAGE, JSON.stringify(history.slice(-20)));

  const grade = correctCount >= 5 ? '🏆' : correctCount >= 4 ? '✅' : correctCount >= 2 ? '💪' : '📚';
  document.getElementById('sim-body').innerHTML = `
    <div class="st-complete">
      <div class="st-complete-emoji">${grade}</div>
      <h2>${timedOut ? "Time's up!" : 'Simulation Complete'}</h2>
      <p>${s.difficulty} · ${min}:${String(sec).padStart(2, '0')} elapsed</p>
      <div class="st-complete-stats">
        <div class="st-complete-stat"><div class="st-complete-stat-num">${s.score}</div><div class="st-complete-stat-label">Score</div></div>
        <div class="st-complete-stat"><div class="st-complete-stat-num">${correctCount}/${s.answers.length}</div><div class="st-complete-stat-label">Correct</div></div>
        <div class="st-complete-stat"><div class="st-complete-stat-num">${Math.round(correctCount / s.answers.length * 100)}%</div><div class="st-complete-stat-label">Accuracy</div></div>
      </div>
      <div style="text-align:left; max-width:600px; margin:0 auto;">
        ${s.answers.map((a, i) => `<div style="padding:10px 0; border-bottom:1px solid var(--border-light); font-size:13px;"><span style="color:${a.correct ? 'var(--green)' : '#c4546c'}; font-weight:600;">${a.correct ? '✓' : '✗'}</span> Q${i + 1}: ${a.q}</div>`).join('')}
      </div>
    </div>
  `;

  const foot = document.getElementById('sim-foot');
  foot.className = 'st-lesson-foot';
  document.getElementById('sim-feedback').textContent = correctCount >= 4 ? 'Solid. You are interview ready.' : 'Keep grinding. Review the patterns you missed.';
  const action = document.getElementById('sim-action');
  action.textContent = 'Close';
  action.className = 'st-btn success';
  action.disabled = false;
  action.onclick = pyCloseSim;
  pyRenderSimHistory();
}

function pyCloseSim() {
  clearInterval(pySimState?.timerInterval);
  document.getElementById('sim-overlay').classList.remove('open');
  document.getElementById('sim-timer').classList.remove('warning');
  pySimState = null;
}

function getPySimHistory() {
  try { return JSON.parse(localStorage.getItem(PY_SIM_STORAGE) || '[]'); } catch { return []; }
}

function pyRenderSimHistory() {
  const history = getPySimHistory();
  const el = document.getElementById('sim-history');
  if (!history.length) { el.innerHTML = ''; return; }
  el.innerHTML = history.slice(-5).reverse().map(h =>
    `<div class="st-sim-history-item">${h.date} · ${h.difficulty} · <span class="score">${h.correct}/${h.total}</span> · ${h.time}</div>`
  ).join('');
}

/* ─── 8. UTILITIES ─────────────────────────────────────────── */

function escHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function pyShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ─── 9. WIRE UP ────────────────────────────���──────────────── */

document.getElementById('lesson-close').addEventListener('click', pyCloseLesson);
document.getElementById('overlay').addEventListener('click', e => {
  if (e.target.id === 'overlay') pyCloseLesson();
});
document.getElementById('sim-close').addEventListener('click', pyCloseSim);
document.getElementById('sim-overlay').addEventListener('click', e => {
  if (e.target.id === 'sim-overlay') pyCloseSim();
});
document.getElementById('sim-start').addEventListener('click', pyStartSim);
document.getElementById('ref-toggle').addEventListener('click', () => {
  document.getElementById('ref-panel').classList.toggle('open');
});

(async () => {
  try {
    await initPyodide();
    pyRenderPath();
    pyRenderSimHistory();
  } catch (e) {
    document.getElementById('path').innerHTML = `<div class="st-loading" style="color:#c4546c;">Failed to load Python engine. Check your internet connection and refresh.<br/><small style="opacity:.7;">${escHtml(e.message || e)}</small></div>`;
  }
})();
