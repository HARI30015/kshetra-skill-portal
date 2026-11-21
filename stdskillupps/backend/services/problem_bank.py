"""Hand-curated problem bank for the stdskillupps adaptive planner.

Every topic in the planner (see recommender.py FOUNDATION / INTERMEDIATE /
ADVANCED topics) maps to a pool of real problems from the platforms
students actually train on: LeetCode, CodeChef, InterviewBit, HackerRank
and GeeksforGeeks. The "System Design" topic has no coding problems, so
it maps to Guide entries — reading resources (the System Design Primer,
GFG tutorials, and similar) instead.

Verification status (2026-11-21):
- Every CodeChef, InterviewBit, HackerRank, GeeksforGeeks and Guide URL
  in this file was checked live with curl from this machine: HTTP 200
  AND the returned page contains the problem title. Any URL that failed
  was replaced or dropped; nothing unverified is left in the bank.
- LeetCode links could NOT be curl-verified from this machine: LeetCode
  blocks this network with a Cloudflare "Just a moment" page (HTTP 403),
  so a 403/timeout here says nothing about the link. Every LeetCode
  entry below therefore uses only a canonical, long-stable slug from
  the standard DSA sheets (NeetCode 150, Blind 75, Striver SDE sheet) —
  e.g. two-sum, valid-parentheses, merge-two-sorted-lists. No slug was
  invented or guessed, and no LeetCode premium-only problem is included.
- Codeforces is skipped entirely for the same reason (it flips between
  403 and connection failure from this network); the site links to it
  as a platform, but no specific Codeforces problem is listed here.

How the caller uses it (recommender.py):
- Each plan week has one topic and a daily pace. ``week_problems`` gives
  the Mon..Sat problem lists for that week (seeded by week number, so
  the same week always yields the same problems); ``today_problems``
  gives one day's list for the Today's Map card. ``focus=True`` is
  passed for weeks whose topic is a focus area of the student's aim
  company, so those weeks get one extra, harder problem.
- Selection is deterministic: same (topic, seed, count, focus) always
  returns the same problems, in the same order.
"""

import math

_DIFFICULTY_RANK = {"Easy": 0, "Medium": 1, "Hard": 2, "Guide": 3}

TOPIC_LIST = [
    "Arrays & Hashing",
    "Two Pointers",
    "Sliding Window",
    "Strings",
    "Stack",
    "Binary Search",
    "Linked List",
    "Trees",
    "Heap",
    "Tries",
    "Backtracking",
    "Graphs",
    "Dynamic Programming",
    "System Design",
]

PROBLEM_BANK = {
    "Arrays & Hashing": [
        {"title": "Two Sum", "platform": "LeetCode", "url": "https://leetcode.com/problems/two-sum/", "difficulty": "Easy"},
        {"title": "Contains Duplicate", "platform": "LeetCode", "url": "https://leetcode.com/problems/contains-duplicate/", "difficulty": "Easy"},
        {"title": "Valid Anagram", "platform": "LeetCode", "url": "https://leetcode.com/problems/valid-anagram/", "difficulty": "Easy"},
        {"title": "Group Anagrams", "platform": "LeetCode", "url": "https://leetcode.com/problems/group-anagrams/", "difficulty": "Medium"},
        {"title": "Top K Frequent Elements", "platform": "LeetCode", "url": "https://leetcode.com/problems/top-k-frequent-elements/", "difficulty": "Medium"},
        {"title": "Product of Array Except Self", "platform": "LeetCode", "url": "https://leetcode.com/problems/product-of-array-except-self/", "difficulty": "Medium"},
        {"title": "Longest Consecutive Sequence", "platform": "LeetCode", "url": "https://leetcode.com/problems/longest-consecutive-sequence/", "difficulty": "Medium"},
        {"title": "First Missing Positive", "platform": "LeetCode", "url": "https://leetcode.com/problems/first-missing-positive/", "difficulty": "Hard"},
        {"title": "Max Sum Contiguous Subarray", "platform": "InterviewBit", "url": "https://www.interviewbit.com/problems/max-sum-contiguous-subarray/", "difficulty": "Medium"},
        {"title": "GCD and LCM", "platform": "CodeChef", "url": "https://www.codechef.com/problems/FLOW016", "difficulty": "Easy"},
    ],
    "Two Pointers": [
        {"title": "Valid Palindrome", "platform": "LeetCode", "url": "https://leetcode.com/problems/valid-palindrome/", "difficulty": "Easy"},
        {"title": "Two Sum II - Input Array Is Sorted", "platform": "LeetCode", "url": "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/", "difficulty": "Medium"},
        {"title": "3Sum", "platform": "LeetCode", "url": "https://leetcode.com/problems/3sum/", "difficulty": "Medium"},
        {"title": "Container With Most Water", "platform": "LeetCode", "url": "https://leetcode.com/problems/container-with-most-water/", "difficulty": "Medium"},
        {"title": "Trapping Rain Water", "platform": "LeetCode", "url": "https://leetcode.com/problems/trapping-rain-water/", "difficulty": "Hard"},
        {"title": "Move Zeroes", "platform": "LeetCode", "url": "https://leetcode.com/problems/move-zeroes/", "difficulty": "Easy"},
        {"title": "Sort Colors", "platform": "LeetCode", "url": "https://leetcode.com/problems/sort-colors/", "difficulty": "Medium"},
        {"title": "Backspace String Compare", "platform": "LeetCode", "url": "https://leetcode.com/problems/backspace-string-compare/", "difficulty": "Easy"},
        {"title": "3 Sum", "platform": "InterviewBit", "url": "https://www.interviewbit.com/problems/3-sum/", "difficulty": "Medium"},
        {"title": "Pairs", "platform": "HackerRank", "url": "https://www.hackerrank.com/challenges/pairs/problem", "difficulty": "Medium"},
    ],
    "Sliding Window": [
        {"title": "Best Time to Buy and Sell Stock", "platform": "LeetCode", "url": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", "difficulty": "Easy"},
        {"title": "Longest Substring Without Repeating Characters", "platform": "LeetCode", "url": "https://leetcode.com/problems/longest-substring-without-repeating-characters/", "difficulty": "Medium"},
        {"title": "Longest Repeating Character Replacement", "platform": "LeetCode", "url": "https://leetcode.com/problems/longest-repeating-character-replacement/", "difficulty": "Medium"},
        {"title": "Minimum Window Substring", "platform": "LeetCode", "url": "https://leetcode.com/problems/minimum-window-substring/", "difficulty": "Hard"},
        {"title": "Permutation in String", "platform": "LeetCode", "url": "https://leetcode.com/problems/permutation-in-string/", "difficulty": "Medium"},
        {"title": "Sliding Window Maximum", "platform": "LeetCode", "url": "https://leetcode.com/problems/sliding-window-maximum/", "difficulty": "Hard"},
        {"title": "Maximum Average Subarray I", "platform": "LeetCode", "url": "https://leetcode.com/problems/maximum-average-subarray-i/", "difficulty": "Easy"},
        {"title": "Minimum Size Subarray Sum", "platform": "LeetCode", "url": "https://leetcode.com/problems/minimum-size-subarray-sum/", "difficulty": "Medium"},
        {"title": "Find All Anagrams in a String", "platform": "LeetCode", "url": "https://leetcode.com/problems/find-all-anagrams-in-a-string/", "difficulty": "Medium"},
        {"title": "Distinct Numbers in Window", "platform": "InterviewBit", "url": "https://www.interviewbit.com/problems/distinct-numbers-in-window/", "difficulty": "Medium"},
    ],
    "Strings": [
        {"title": "Longest Palindromic Substring", "platform": "LeetCode", "url": "https://leetcode.com/problems/longest-palindromic-substring/", "difficulty": "Medium"},
        {"title": "Palindromic Substrings", "platform": "LeetCode", "url": "https://leetcode.com/problems/palindromic-substrings/", "difficulty": "Medium"},
        {"title": "Longest Common Prefix", "platform": "LeetCode", "url": "https://leetcode.com/problems/longest-common-prefix/", "difficulty": "Easy"},
        {"title": "String to Integer (atoi)", "platform": "LeetCode", "url": "https://leetcode.com/problems/string-to-integer-atoi/", "difficulty": "Medium"},
        {"title": "Roman to Integer", "platform": "LeetCode", "url": "https://leetcode.com/problems/roman-to-integer/", "difficulty": "Easy"},
        {"title": "Reverse Words in a String", "platform": "LeetCode", "url": "https://leetcode.com/problems/reverse-words-in-a-string/", "difficulty": "Medium"},
        {"title": "Zigzag Conversion", "platform": "LeetCode", "url": "https://leetcode.com/problems/zigzag-conversion/", "difficulty": "Medium"},
        {"title": "Regular Expression Matching", "platform": "LeetCode", "url": "https://leetcode.com/problems/regular-expression-matching/", "difficulty": "Hard"},
        {"title": "Reverse the String", "platform": "InterviewBit", "url": "https://www.interviewbit.com/problems/reverse-the-string/", "difficulty": "Easy"},
        {"title": "Two Strings", "platform": "HackerRank", "url": "https://www.hackerrank.com/challenges/two-strings/problem", "difficulty": "Easy"},
    ],
    "Stack": [
        {"title": "Valid Parentheses", "platform": "LeetCode", "url": "https://leetcode.com/problems/valid-parentheses/", "difficulty": "Easy"},
        {"title": "Min Stack", "platform": "LeetCode", "url": "https://leetcode.com/problems/min-stack/", "difficulty": "Medium"},
        {"title": "Evaluate Reverse Polish Notation", "platform": "LeetCode", "url": "https://leetcode.com/problems/evaluate-reverse-polish-notation/", "difficulty": "Medium"},
        {"title": "Generate Parentheses", "platform": "LeetCode", "url": "https://leetcode.com/problems/generate-parentheses/", "difficulty": "Medium"},
        {"title": "Daily Temperatures", "platform": "LeetCode", "url": "https://leetcode.com/problems/daily-temperatures/", "difficulty": "Medium"},
        {"title": "Car Fleet", "platform": "LeetCode", "url": "https://leetcode.com/problems/car-fleet/", "difficulty": "Medium"},
        {"title": "Largest Rectangle in Histogram", "platform": "LeetCode", "url": "https://leetcode.com/problems/largest-rectangle-in-histogram/", "difficulty": "Hard"},
        {"title": "Next Greater Element I", "platform": "LeetCode", "url": "https://leetcode.com/problems/next-greater-element-i/", "difficulty": "Easy"},
        {"title": "Balanced Parantheses", "platform": "InterviewBit", "url": "https://www.interviewbit.com/problems/balanced-parantheses/", "difficulty": "Easy"},
        {"title": "Maximum Element", "platform": "HackerRank", "url": "https://www.hackerrank.com/challenges/maximum-element/problem", "difficulty": "Medium"},
    ],
    "Binary Search": [
        {"title": "Binary Search", "platform": "LeetCode", "url": "https://leetcode.com/problems/binary-search/", "difficulty": "Easy"},
        {"title": "Search a 2D Matrix", "platform": "LeetCode", "url": "https://leetcode.com/problems/search-a-2d-matrix/", "difficulty": "Medium"},
        {"title": "Koko Eating Bananas", "platform": "LeetCode", "url": "https://leetcode.com/problems/koko-eating-bananas/", "difficulty": "Medium"},
        {"title": "Find Minimum in Rotated Sorted Array", "platform": "LeetCode", "url": "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/", "difficulty": "Medium"},
        {"title": "Search in Rotated Sorted Array", "platform": "LeetCode", "url": "https://leetcode.com/problems/search-in-rotated-sorted-array/", "difficulty": "Medium"},
        {"title": "Time Based Key-Value Store", "platform": "LeetCode", "url": "https://leetcode.com/problems/time-based-key-value-store/", "difficulty": "Medium"},
        {"title": "Median of Two Sorted Arrays", "platform": "LeetCode", "url": "https://leetcode.com/problems/median-of-two-sorted-arrays/", "difficulty": "Hard"},
        {"title": "Search Insert Position", "platform": "LeetCode", "url": "https://leetcode.com/problems/search-insert-position/", "difficulty": "Easy"},
        {"title": "Sqrt(x)", "platform": "LeetCode", "url": "https://leetcode.com/problems/sqrtx/", "difficulty": "Easy"},
        {"title": "Search for a Range", "platform": "InterviewBit", "url": "https://www.interviewbit.com/problems/search-for-a-range/", "difficulty": "Medium"},
    ],
    "Linked List": [
        {"title": "Reverse Linked List", "platform": "LeetCode", "url": "https://leetcode.com/problems/reverse-linked-list/", "difficulty": "Easy"},
        {"title": "Merge Two Sorted Lists", "platform": "LeetCode", "url": "https://leetcode.com/problems/merge-two-sorted-lists/", "difficulty": "Easy"},
        {"title": "Reorder List", "platform": "LeetCode", "url": "https://leetcode.com/problems/reorder-list/", "difficulty": "Medium"},
        {"title": "Remove Nth Node From End of List", "platform": "LeetCode", "url": "https://leetcode.com/problems/remove-nth-node-from-end-of-list/", "difficulty": "Medium"},
        {"title": "Linked List Cycle", "platform": "LeetCode", "url": "https://leetcode.com/problems/linked-list-cycle/", "difficulty": "Easy"},
        {"title": "Add Two Numbers", "platform": "LeetCode", "url": "https://leetcode.com/problems/add-two-numbers/", "difficulty": "Medium"},
        {"title": "Copy List with Random Pointer", "platform": "LeetCode", "url": "https://leetcode.com/problems/copy-list-with-random-pointer/", "difficulty": "Medium"},
        {"title": "Merge k Sorted Lists", "platform": "LeetCode", "url": "https://leetcode.com/problems/merge-k-sorted-lists/", "difficulty": "Hard"},
        {"title": "Reverse Nodes in k-Group", "platform": "LeetCode", "url": "https://leetcode.com/problems/reverse-nodes-in-k-group/", "difficulty": "Hard"},
        {"title": "Reverse Linked List", "platform": "InterviewBit", "url": "https://www.interviewbit.com/problems/reverse-linked-list/", "difficulty": "Easy"},
    ],
    "Trees": [
        {"title": "Invert Binary Tree", "platform": "LeetCode", "url": "https://leetcode.com/problems/invert-binary-tree/", "difficulty": "Easy"},
        {"title": "Maximum Depth of Binary Tree", "platform": "LeetCode", "url": "https://leetcode.com/problems/maximum-depth-of-binary-tree/", "difficulty": "Easy"},
        {"title": "Diameter of Binary Tree", "platform": "LeetCode", "url": "https://leetcode.com/problems/diameter-of-binary-tree/", "difficulty": "Easy"},
        {"title": "Binary Tree Level Order Traversal", "platform": "LeetCode", "url": "https://leetcode.com/problems/binary-tree-level-order-traversal/", "difficulty": "Medium"},
        {"title": "Validate Binary Search Tree", "platform": "LeetCode", "url": "https://leetcode.com/problems/validate-binary-search-tree/", "difficulty": "Medium"},
        {"title": "Lowest Common Ancestor of a Binary Search Tree", "platform": "LeetCode", "url": "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/", "difficulty": "Medium"},
        {"title": "Binary Tree Maximum Path Sum", "platform": "LeetCode", "url": "https://leetcode.com/problems/binary-tree-maximum-path-sum/", "difficulty": "Hard"},
        {"title": "Serialize and Deserialize Binary Tree", "platform": "LeetCode", "url": "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/", "difficulty": "Hard"},
        {"title": "Kth Smallest Element in a BST", "platform": "LeetCode", "url": "https://leetcode.com/problems/kth-smallest-element-in-a-bst/", "difficulty": "Medium"},
        {"title": "Inorder Traversal", "platform": "InterviewBit", "url": "https://www.interviewbit.com/problems/inorder-traversal/", "difficulty": "Easy"},
    ],
    "Heap": [
        {"title": "Kth Largest Element in an Array", "platform": "LeetCode", "url": "https://leetcode.com/problems/kth-largest-element-in-an-array/", "difficulty": "Medium"},
        {"title": "Last Stone Weight", "platform": "LeetCode", "url": "https://leetcode.com/problems/last-stone-weight/", "difficulty": "Easy"},
        {"title": "K Closest Points to Origin", "platform": "LeetCode", "url": "https://leetcode.com/problems/k-closest-points-to-origin/", "difficulty": "Medium"},
        {"title": "Find Median from Data Stream", "platform": "LeetCode", "url": "https://leetcode.com/problems/find-median-from-data-stream/", "difficulty": "Hard"},
        {"title": "Task Scheduler", "platform": "LeetCode", "url": "https://leetcode.com/problems/task-scheduler/", "difficulty": "Medium"},
        {"title": "Kth Largest Element in a Stream", "platform": "LeetCode", "url": "https://leetcode.com/problems/kth-largest-element-in-a-stream/", "difficulty": "Easy"},
        {"title": "Top K Frequent Words", "platform": "LeetCode", "url": "https://leetcode.com/problems/top-k-frequent-words/", "difficulty": "Medium"},
        {"title": "Smallest Range Covering Elements from K Lists", "platform": "LeetCode", "url": "https://leetcode.com/problems/smallest-range-covering-elements-from-k-lists/", "difficulty": "Hard"},
        {"title": "QHEAP1", "platform": "HackerRank", "url": "https://www.hackerrank.com/challenges/qheap1/problem", "difficulty": "Medium"},
        {"title": "N max pair combinations", "platform": "InterviewBit", "url": "https://www.interviewbit.com/problems/n-max-pair-combinations/", "difficulty": "Medium"},
    ],
    "Tries": [
        {"title": "Implement Trie (Prefix Tree)", "platform": "LeetCode", "url": "https://leetcode.com/problems/implement-trie-prefix-tree/", "difficulty": "Medium"},
        {"title": "Design Add and Search Words Data Structure", "platform": "LeetCode", "url": "https://leetcode.com/problems/design-add-and-search-words-data-structure/", "difficulty": "Medium"},
        {"title": "Word Search II", "platform": "LeetCode", "url": "https://leetcode.com/problems/word-search-ii/", "difficulty": "Hard"},
        {"title": "Replace Words", "platform": "LeetCode", "url": "https://leetcode.com/problems/replace-words/", "difficulty": "Medium"},
        {"title": "Maximum XOR of Two Numbers in an Array", "platform": "LeetCode", "url": "https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/", "difficulty": "Medium"},
        {"title": "Longest Word in Dictionary", "platform": "LeetCode", "url": "https://leetcode.com/problems/longest-word-in-dictionary/", "difficulty": "Easy"},
        {"title": "Stream of Characters", "platform": "LeetCode", "url": "https://leetcode.com/problems/stream-of-characters/", "difficulty": "Hard"},
        {"title": "Map Sum Pairs", "platform": "LeetCode", "url": "https://leetcode.com/problems/map-sum-pairs/", "difficulty": "Medium"},
        {"title": "Shortest Unique Prefix", "platform": "InterviewBit", "url": "https://www.interviewbit.com/problems/shortest-unique-prefix/", "difficulty": "Medium"},
        {"title": "Hotel Reviews", "platform": "InterviewBit", "url": "https://www.interviewbit.com/problems/hotel-reviews/", "difficulty": "Medium"},
    ],
    "Backtracking": [
        {"title": "Subsets", "platform": "LeetCode", "url": "https://leetcode.com/problems/subsets/", "difficulty": "Medium"},
        {"title": "Combination Sum", "platform": "LeetCode", "url": "https://leetcode.com/problems/combination-sum/", "difficulty": "Medium"},
        {"title": "Permutations", "platform": "LeetCode", "url": "https://leetcode.com/problems/permutations/", "difficulty": "Medium"},
        {"title": "Word Search", "platform": "LeetCode", "url": "https://leetcode.com/problems/word-search/", "difficulty": "Medium"},
        {"title": "N-Queens", "platform": "LeetCode", "url": "https://leetcode.com/problems/n-queens/", "difficulty": "Hard"},
        {"title": "Palindrome Partitioning", "platform": "LeetCode", "url": "https://leetcode.com/problems/palindrome-partitioning/", "difficulty": "Medium"},
        {"title": "Letter Combinations of a Phone Number", "platform": "LeetCode", "url": "https://leetcode.com/problems/letter-combinations-of-a-phone-number/", "difficulty": "Medium"},
        {"title": "Sudoku Solver", "platform": "LeetCode", "url": "https://leetcode.com/problems/sudoku-solver/", "difficulty": "Hard"},
        {"title": "Binary Watch", "platform": "LeetCode", "url": "https://leetcode.com/problems/binary-watch/", "difficulty": "Easy"},
        {"title": "Subsets II", "platform": "InterviewBit", "url": "https://www.interviewbit.com/problems/subsets-ii/", "difficulty": "Medium"},
    ],
    "Graphs": [
        {"title": "Number of Islands", "platform": "LeetCode", "url": "https://leetcode.com/problems/number-of-islands/", "difficulty": "Medium"},
        {"title": "Clone Graph", "platform": "LeetCode", "url": "https://leetcode.com/problems/clone-graph/", "difficulty": "Medium"},
        {"title": "Pacific Atlantic Water Flow", "platform": "LeetCode", "url": "https://leetcode.com/problems/pacific-atlantic-water-flow/", "difficulty": "Medium"},
        {"title": "Course Schedule", "platform": "LeetCode", "url": "https://leetcode.com/problems/course-schedule/", "difficulty": "Medium"},
        {"title": "Course Schedule II", "platform": "LeetCode", "url": "https://leetcode.com/problems/course-schedule-ii/", "difficulty": "Medium"},
        {"title": "Surrounded Regions", "platform": "LeetCode", "url": "https://leetcode.com/problems/surrounded-regions/", "difficulty": "Medium"},
        {"title": "Rotting Oranges", "platform": "LeetCode", "url": "https://leetcode.com/problems/rotting-oranges/", "difficulty": "Medium"},
        {"title": "Word Ladder", "platform": "LeetCode", "url": "https://leetcode.com/problems/word-ladder/", "difficulty": "Hard"},
        {"title": "Find the Town Judge", "platform": "LeetCode", "url": "https://leetcode.com/problems/find-the-town-judge/", "difficulty": "Easy"},
        {"title": "Word Ladder I", "platform": "InterviewBit", "url": "https://www.interviewbit.com/problems/word-ladder-i/", "difficulty": "Hard"},
    ],
    "Dynamic Programming": [
        {"title": "Climbing Stairs", "platform": "LeetCode", "url": "https://leetcode.com/problems/climbing-stairs/", "difficulty": "Easy"},
        {"title": "House Robber", "platform": "LeetCode", "url": "https://leetcode.com/problems/house-robber/", "difficulty": "Medium"},
        {"title": "House Robber II", "platform": "LeetCode", "url": "https://leetcode.com/problems/house-robber-ii/", "difficulty": "Medium"},
        {"title": "Coin Change", "platform": "LeetCode", "url": "https://leetcode.com/problems/coin-change/", "difficulty": "Medium"},
        {"title": "Longest Increasing Subsequence", "platform": "LeetCode", "url": "https://leetcode.com/problems/longest-increasing-subsequence/", "difficulty": "Medium"},
        {"title": "Word Break", "platform": "LeetCode", "url": "https://leetcode.com/problems/word-break/", "difficulty": "Medium"},
        {"title": "Decode Ways", "platform": "LeetCode", "url": "https://leetcode.com/problems/decode-ways/", "difficulty": "Medium"},
        {"title": "Unique Paths", "platform": "LeetCode", "url": "https://leetcode.com/problems/unique-paths/", "difficulty": "Medium"},
        {"title": "Edit Distance", "platform": "LeetCode", "url": "https://leetcode.com/problems/edit-distance/", "difficulty": "Hard"},
        {"title": "Longest Common Subsequence", "platform": "LeetCode", "url": "https://leetcode.com/problems/longest-common-subsequence/", "difficulty": "Medium"},
        {"title": "Kadane's Algorithm", "platform": "GeeksforGeeks", "url": "https://www.geeksforgeeks.org/problems/kadanes-algorithm-1587115620/1", "difficulty": "Medium"},
    ],
    "System Design": [
        {"title": "System Design Primer", "platform": "Guide", "url": "https://github.com/donnemartin/system-design-primer", "difficulty": "Guide"},
        {"title": "System Design Tutorial", "platform": "Guide", "url": "https://www.geeksforgeeks.org/system-design-tutorial/", "difficulty": "Guide"},
        {"title": "Awesome Scalability", "platform": "Guide", "url": "https://github.com/binhnguyennus/awesome-scalability", "difficulty": "Guide"},
        {"title": "System Design Interview", "platform": "Guide", "url": "https://github.com/checkcheckzz/system-design-interview", "difficulty": "Guide"},
        {"title": "URL Shortner System Design", "platform": "Guide", "url": "https://www.geeksforgeeks.org/system-design/system-design-url-shortening-service/", "difficulty": "Guide"},
        {"title": "System Design in a Hurry", "platform": "Guide", "url": "https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction", "difficulty": "Guide"},
        {"title": "System Design", "platform": "Guide", "url": "https://github.com/karanpratapsingh/system-design", "difficulty": "Guide"},
        {"title": "Top 10 System Design Interview Questions and Answers", "platform": "Guide", "url": "https://www.geeksforgeeks.org/top-10-system-design-interview-questions-and-answers/", "difficulty": "Guide"},
        {"title": "System Design One", "platform": "Guide", "url": "https://systemdesign.one/", "difficulty": "Guide"},
        {"title": "ByteByteGo", "platform": "Guide", "url": "https://bytebytego.com/", "difficulty": "Guide"},
    ],
}


def _sorted_pool(topic):
    """Pool for a topic, ordered Easy < Medium < Hard < Guide, then title."""
    pool = PROBLEM_BANK.get(topic) or []
    return sorted(
        pool,
        key=lambda p: (_DIFFICULTY_RANK.get(p["difficulty"], 99), p["title"].lower()),
    )


def select_problems(topic, seed, count, focus=False):
    """Deterministically pick problems for one day of one topic.

    The pool is sorted by (difficulty, title); selection starts at an
    offset derived from ``seed`` and wraps around the pool, so the same
    (topic, seed, count, focus) always returns the same problems and
    never returns a duplicate within one call. With ``focus=True`` the
    offset starts in the harder half of the pool, the harder half is
    used up first (wrapping within it), and only then does selection
    spill into the easier half — and one extra problem is returned
    (count + 1). ``focus`` is used for weeks that are a focus area of
    the student's aim company. Unknown or empty topics return [].
    """
    pool = _sorted_pool(topic)
    n = len(pool)
    if n == 0 or count <= 0:
        return []
    take = min(count + 1, n) if focus else min(count, n)
    if not focus:
        start = seed % n
        return [pool[(start + i) % n] for i in range(take)]
    # Focus week: draw from the hardest (take + 2) problems only, with a
    # coprime stride so each day's set actually differs (taking the
    # whole harder half every day would repeat the same problems
    # Mon..Sat, only shuffled; a plain sliding window over the
    # hardest-first pool drifts into the easy end and ends up easier
    # than a normal week). The stride is coprime with the candidate
    # count, so the `take` indices are always distinct.
    desc = sorted(pool, key=lambda p: (-_DIFFICULTY_RANK[p["difficulty"]], p["title"]))
    candidates = desc[: min(n, take + 2)]
    k = len(candidates)
    take = min(take, k)
    stride = next(s for s in (2, 3, 5, 7, 11) if math.gcd(s, k) == 1)
    start = seed % k
    return [candidates[(start + stride * i) % k] for i in range(take)]


def week_problems(topic, week, daily_pace, focus=False):
    """Mon..Sat problem lists for one plan week.

    Returns {1: [...], ..., 6: [...]}; each day's list comes from
    ``select_problems`` with seed ``week * 10 + day``, so a given week
    always yields the same problems.
    """
    return {
        day: select_problems(topic, seed=week * 10 + day, count=daily_pace, focus=focus)
        for day in range(1, 7)
    }


def today_problems(topic, week, day_index, daily_pace, focus=False):
    """One day's problems: ``day_index`` 0..5 (Mon..Sat)."""
    if not 0 <= day_index <= 5:
        return []
    return week_problems(topic, week, daily_pace, focus=focus)[day_index + 1]
