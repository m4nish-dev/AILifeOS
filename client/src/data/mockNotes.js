export const foldersData = [
  { id: 'f1', name: 'React',    icon: '⚛️', color: 'blue' },
  { id: 'f2', name: 'DSA',      icon: '🧮', color: 'amber' },
  { id: 'f3', name: 'Backend',  icon: '⚙️', color: 'green' },
  { id: 'f4', name: 'Personal', icon: '📝', color: 'coffee' },
  { id: 'f5', name: 'Ideas',    icon: '💡', color: 'red' },
]

export const notesData = [
  {
    id: 'n1', folderId: 'f1', title: 'React Hooks Deep Dive',
    content: `# React Hooks Deep Dive

## useState
useState allows functional components to manage local state. It returns the current state value and a setter function.

\`\`\`js
const [count, setCount] = useState(0)
\`\`\`

## useEffect
useEffect is used for side effects — data fetching, subscriptions, DOM manipulation. It runs after the render is committed to the screen.

The dependency array controls when the effect re-runs:
- No array: runs after every render
- Empty array: runs only once (on mount)
- With deps: runs when any dep changes

## useContext
useContext lets you subscribe to context without wrapping in <Consumer>. Much cleaner API.

## useMemo & useCallback
Both are performance optimizations. Use them when you have expensive computations or want to prevent child re-renders.

## Custom Hooks
Extract reusable logic into custom hooks. They must start with "use" and can call other hooks.`,
    createdAt: '2026-08-15',
    updatedAt: '2026-08-21',
    tags: ['react', 'hooks', 'frontend'],
    pinned: true,
  },
  {
    id: 'n2', folderId: 'f2', title: 'Binary Tree Traversals',
    content: `# Tree Traversals

## Inorder (Left, Root, Right)
Used for BSTs to get sorted output.

## Preorder (Root, Left, Right)
Used for tree serialization.

## Postorder (Left, Right, Root)
Used for tree deletion.

## Level Order (BFS)
Uses a queue. Great for level-based problems.

## Time Complexity
All are O(n) where n is number of nodes.`,
    createdAt: '2026-08-10',
    updatedAt: '2026-08-19',
    tags: ['dsa', 'trees', 'algorithms'],
    pinned: false,
  },
  {
    id: 'n3', folderId: 'f3', title: 'JWT Authentication Notes',
    content: `# JWT Authentication

JSON Web Tokens are used for stateless auth.

## Structure
- Header: algorithm & token type
- Payload: claims (user data)
- Signature: verifies token hasn't been altered

## Flow
1. User logs in → server issues JWT
2. Client stores JWT (httpOnly cookie preferred)
3. Client sends JWT in Authorization header
4. Server verifies & decodes JWT

## Best Practices
- Short-lived access tokens (15m)
- Refresh tokens for long sessions
- Never store sensitive data in payload
- Use HTTPS always`,
    createdAt: '2026-08-05',
    updatedAt: '2026-08-18',
    tags: ['backend', 'auth', 'jwt', 'security'],
    pinned: true,
  },
  {
    id: 'n4', folderId: 'f5', title: 'AI LifeOS - Feature Ideas',
    content: `# Feature Ideas for AI LifeOS

## Must Have
- Task management with AI generation
- Goals with AI roadmaps
- Calendar with smart scheduling
- Notes with AI summary & quiz
- Dashboard with insights

## Nice to Have
- Habit tracker
- Journal with mood tracking
- Focus mode with Pomodoro
- Weekly review prompts
- Voice input for tasks

## Later
- Team collaboration
- Templates marketplace
- Mobile app
- Integrations (Google Calendar, Notion, Slack)`,
    createdAt: '2026-07-20',
    updatedAt: '2026-08-20',
    tags: ['ideas', 'product', 'roadmap'],
    pinned: false,
  },
  {
    id: 'n5', folderId: 'f4', title: 'Weekly Review — Aug 21',
    content: `# Weekly Review

## Wins
- Shipped Dashboard v1
- Completed 12 DSA problems
- Read 3 chapters of Clean Code

## Lessons
- Need more focused deep work blocks
- CSS variables are worth the setup effort

## Next Week
- Ship Tasks page
- Start Goals page
- Practice system design`,
    createdAt: '2026-08-21',
    updatedAt: '2026-08-21',
    tags: ['review', 'personal'],
    pinned: false,
  },
]
