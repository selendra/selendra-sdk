# Tutorial: Building Your First dApp on Selendra

This tutorial guides you through building a decentralized application (dApp) on the Selendra blockchain.

## What We'll Build

We'll create a **Decentralized Task Manager** where users can:

- Create and manage tasks on the blockchain
- Mark tasks as d
- Earn rewards for completing tasks
- View all tasks on the network

## Prerequisites

Requirements:

1. Node.js 18.0+
2. Basic knowledge of:
   - JavaScript/TypeScript
   - React
   - Command line
3. Development tools:
   - Code editor
   - Git

## What You'll Learn

- Setting up a Selendra development environment
- Connecting to the blockchain
- Creating and managing user accounts
- Building a React frontend with blockchain integration
- Handling blockchain transactions
- Reading and writing blockchain data
- Building UI components
- Error handling

## Step 1: Project Setup

### Initialize Your Project

Create a new React project with TypeScript:

```bash
# Create new React app with TypeScript
npx create-react-app selendra-task-manager --template typescript
cd selendra-task-manager

# Install Selendra SDK
npm install @selendrajs/sdk

# Install additional dependencies
npm install @tanstack/react-query tailwindcss
npm install -D @types/node
```

### Configure Tailwind CSS

```bash
# Initialize Tailwind CSS
npx tailwindcss init -p
```

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Replace `src/index.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
    "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans",
    "Helvetica Neue", sans-serif;
}
```

---

## Step 2: Basic App Structure

### Create the Main App

Replace `src/App.tsx` with:

```tsx
import React from "react";
import { SelendraProvider } from "@selendrajs/sdk/react";
import { TaskManager } from "./components/TaskManager";
import "./App.css";

// Initialize SDK
const sdk = new SelendraSDK({
  network: "testnet", // Use testnet for development
  wsEndpoint: "wss://testnet-rpc.selendra.org",
  autoConnect: true,
});

function App() {
  return (
    <SelendraProvider sdk={sdk}>
      <div className="min-h-screen bg-gray-50">
        <TaskManager />
      </div>
    </SelendraProvider>
  );
}

export default App;
```

### Create the Task Manager Component

Create `src/components/TaskManager.tsx`:

```tsx
import React, { useState, useEffect } from "react";
import { useAccount, useBalance, SelendraSDK } from "@selendrajs/sdk/react";
import { WalletConnect } from "./WalletConnect";
import { TaskList } from "./TaskList";
import { CreateTaskForm } from "./CreateTaskForm";

interface Task {
  id: string;
  title: string;
  description: string;
  d: boolean;
  creator: string;
  assignee?: string;
  reward: bigint;
  createdAt: number;
}

export const TaskManager: React.FC = () => {
  const { account, isConnected } = useAccount();
  const { balance } = useBalance();
  const [tasks, setTasks] = useState<Task[]>([]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Selendra Task Manager
          </h1>
          <p className="text-gray-600 mb-8">
            Connect your wallet to start managing tasks
          </p>
          <WalletConnect />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Task Manager</h1>
        <div className="flex items-center space-x-4 text-gray-600">
          <span>Balance: {balance?.free} SEL</span>
          <span>•</span>
          <span>Tasks: {tasks.length}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <CreateTaskForm
            onTaskCreated={(task) => setTasks([task, ...tasks])}
          />
        </div>
        <div>
          <TaskList
            tasks={tasks}
            onTaskUpdate={(updatedTask) => {
              setTasks(
                tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
              );
            }}
          />
        </div>
      </div>
    </div>
  );
};
```

---

## Step 3: Wallet Connection

Create `src/components/WalletConnect.tsx`:

```tsx
import React, { useState } from "react";
import { useAccount } from "@selendrajs/sdk/react";

export const WalletConnect: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { account, isConnected, connect, disconnect, createAccount } =
    useAccount();

  const handleCreateWallet = async () => {
    setIsCreating(true);
    try {
      await createAccount({
        type: "both", // Create both Substrate and EVM accounts
        name: "Task Manager Account",
      });
    } catch (error) {
      console.error("Failed to create account:", error);
      alert("Failed to create wallet. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <button
          onClick={handleCreateWallet}
          disabled={isCreating}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isCreating ? "Creating Wallet..." : "Create New Wallet"}
        </button>
        <p className="text-sm text-gray-600">
          This will create a new blockchain wallet for you
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Connected as</p>
          <p className="font-mono text-sm">
            {account?.address.slice(0, 6)}...{account?.address.slice(-4)}
          </p>
        </div>
        <button
          onClick={disconnect}
          className="text-sm bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 transition-colors"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
};
```

---

## Step 4: Task Creation Form

Create `src/components/CreateTaskForm.tsx`:

```tsx
import React, { useState } from "react";
import { useTransaction } from "@selendrajs/sdk/react";
import { Task } from "./TaskManager";

interface CreateTaskFormProps {
  onTaskCreated: (task: Task) => void;
}

export const CreateTaskForm: React.FC<CreateTaskFormProps> = ({
  onTaskCreated,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { send } = useTransaction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !reward) {
      alert("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      // Convert reward from SEL to smallest unit (assuming 12 decimals)
      const rewardAmount = BigInt(parseFloat(reward) * 1000000000000);

      // Create task transaction (simplified for tutorial)
      const taskId = Date.now().toString();
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        reward: rewardAmount,
        taskId,
      };

      // In a real app, this would interact with a smart contract
      // For now, we'll simulate blockchain storage
      const tx = await send({
        data: JSON.stringify(taskData),
        value: rewardAmount, // Stake reward amount
      });

      const newTask: Task = {
        id: taskId,
        title: title.trim(),
        description: description.trim(),
        d: false,
        creator: tx.from, // Would be current account
        reward: rewardAmount,
        createdAt: Date.now(),
      };

      onTaskCreated(newTask);

      // Reset form
      setTitle("");
      setDescription("");
      setReward("");
    } catch (error) {
      console.error("Failed to create task:", error);
      alert("Failed to create task. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Create New Task</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the task requirements"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reward (SEL) *
          </label>
          <input
            type="number"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? "Creating Task..." : "Create Task"}
        </button>
      </form>
    </div>
  );
};
```

---

## Step 5: Task List Component

Create `src/components/TaskList.tsx`:

```tsx
import React, { useState } from "react";
import { Task } from "./TaskManager";
import { useTransaction } from "@selendrajs/sdk/react";

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: (task: Task) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onTaskUpdate }) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { send } = useTransaction();

  const handleTask = async (task: Task) => {
    if (!confirm("Are you sure you want to mark this task as d?")) {
      return;
    }

    try {
      // Send transaction to  task
      const tx = await send({
        data: JSON.stringify({
          action: "",
          taskId: task.id,
        }),
      });

      // Update task locally
      const updatedTask = { ...task, d: true };
      onTaskUpdate(updatedTask);

      alert("Task d successfully! Check your wallet for the reward.");
    } catch (error) {
      console.error("Failed to  task:", error);
      alert("Failed to  task. Please try again.");
    }
  };

  const formatReward = (reward: bigint): string => {
    return (Number(reward) / 1000000000000).toFixed(2); // Convert from smallest unit
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="text-gray-400 mb-2">📋</div>
        <p className="text-gray-600">No tasks created yet</p>
        <p className="text-sm text-gray-500 mt-2">
          Create your first task to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Available Tasks</h2>

      {tasks.map((task) => (
        <div
          key={task.id}
          className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${
            task.d ? "border-green-500 opacity-75" : "border-blue-500"
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <h3
              className={`text-lg font-medium ${
                task.d ? "text-gray-500 line-through" : "text-gray-900"
              }`}
            >
              {task.title}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                task.d
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {task.d ? "d" : "Open"}
            </span>
          </div>

          {task.description && (
            <p className="text-gray-600 mb-4">{task.description}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Reward: {formatReward(task.reward)} SEL</span>
              <span>•</span>
              <span>
                Created: {new Date(task.createdAt).toLocaleDateString()}
              </span>
            </div>

            {!task.d && (
              <button
                onClick={() => handleTask(task)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm"
              >
                Task
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## Step 6: Testing Your dApp

Now let's test our application!

### Start the Development Server

```bash
npm start
```

Open http://localhost:3000 in your browser.

### Test the Workflow

1. **Create a Wallet** - Click "Create New Wallet"
2. **Create a Task** - Fill in the form with:
   - Title: "Build a React component"
   - Description: "Create a reusable button component"
   - Reward: "10"
3. **View Your Task** - See it appear in the task list
4. ** the Task** - Click " Task" to simulate completion
5. **Check Balance** - Observe how your balance changes

---

## Step 7: Adding Blockchain Persistence

Let's make our tasks persist on the blockchain by creating a simple contract:

### Create Task Contract

Create `src/contracts/taskContract.ts`:

```tsx
import { SelendraSDK } from "@selendrajs/sdk";

export class TaskContract {
  private sdk: SelendraSDK;
  private storageKey = "selendra_tasks";

  constructor(sdk: SelendraSDK) {
    this.sdk = sdk;
  }

  async saveTask(task: any): Promise<void> {
    // In a real app, this would save to a smart contract
    // For this tutorial, we'll use blockchain storage
    const tx = await this.sdk.sendTransaction({
      data: JSON.stringify({
        action: "save_task",
        task,
      }),
    });

    // Save to localStorage for demo purposes
    const tasks = this.getLocalTasks();
    tasks.push(task);
    localStorage.setItem(this.storageKey, JSON.stringify(tasks));
  }

  async getTasks(): Promise<any[]> {
    // In a real app, this would query the blockchain
    return this.getLocalTasks();
  }

  async Task(taskId: string): Promise<void> {
    const tx = await this.sdk.sendTransaction({
      data: JSON.stringify({
        action: "_task",
        taskId,
      }),
    });

    // Update local storage
    const tasks = this.getLocalTasks();
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex].d = true;
      localStorage.setItem(this.storageKey, JSON.stringify(tasks));
    }
  }

  private getLocalTasks(): any[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }
}
```

### Update Task Manager

Modify `src/components/TaskManager.tsx` to use the contract:

```tsx
import { TaskContract } from "../contracts/taskContract";
import { useSelendra } from "@selendrajs/sdk/react";

// Add to component
const sdk = useSelendra();
const [taskContract] = useState(() => new TaskContract(sdk));

// Load tasks on mount
useEffect(() => {
  const loadTasks = async () => {
    const tasks = await taskContract.getTasks();
    setTasks(tasks);
  };
  loadTasks();
}, [taskContract]);

// Update create task handler
const handleTaskCreated = async (task: Task) => {
  await taskContract.saveTask(task);
  const updatedTasks = await taskContract.getTasks();
  setTasks(updatedTasks);
};
```

---

## Step 8: Adding Real-World Features

Let's enhance our dApp with additional features:

### Task Assignment

Update `Task` interface and forms to include task assignment:

```tsx
interface Task {
  // ... existing fields
  assignee?: string;
}

// Add to CreateTaskForm
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Assign To (Optional)
  </label>
  <input
    type="text"
    value={assignee}
    onChange={(e) => setAssignee(e.target.value)}
    placeholder="Enter wallet address"
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  />
</div>;
```

### Task Filtering

Add filtering capabilities:

```tsx
const [filter, setFilter] = useState<"all" | "open" | "d">("all");

const filteredTasks = tasks.filter((task) => {
  switch (filter) {
    case "open":
      return !task.d;
    case "d":
      return task.d;
    default:
      return true;
  }
});

// Add filter buttons
<div className="flex space-x-2 mb-4">
  {["all", "open", "d"].map((filterType) => (
    <button
      key={filterType}
      onClick={() => setFilter(filterType as any)}
      className={`px-4 py-2 rounded-lg ${
        filter === filterType
          ? "bg-blue-600 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
    </button>
  ))}
</div>;
```

---

## Step 9: Deployment

### Build for Production

```bash
# Build the application
npm run build

# Test production build
npm install -g serve
serve -s build
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ]
}
```

---

## Step 10: Next Steps & Improvements

Congratulations! 🎉 You've built your first dApp on Selendra. Here are ways to improve it:

### Advanced Features to Add

1. **Smart Contract Integration** - Replace storage with actual smart contracts
2. **User Profiles** - Add reputation and history tracking
3. **Task Categories** - Organize tasks by type or difficulty
4. **Time Tracking** - Add deadlines and time estimates
5. **Collaboration** - Allow multiple assignees
6. **Notifications** - Real-time updates for task changes

### Production Considerations

1. **Security** - Add input validation and sanitization
2. **Error Handling** - Implement error management
3. **Loading States** - Better UX for async operations
4. **Mobile Responsive** - Optimize for mobile devices
5. **Testing** - Add unit and integration tests
6. **Analytics** - Track user behavior and performance

### Code Quality

1. **TypeScript** - Add stronger typing throughout
2. **Linting** - Configure ESLint and Prettier
3. **Documentation** - Add inline documentation
4. **Error Boundaries** - Handle React errors gracefully

---

## 🎓 What You've Learned

**Blockchain Integration**: Connected React app to Selendra blockchain
**Account Management**: Created and managed blockchain wallets
**Transactions**: Handled sending and receiving blockchain transactions
**State Management**: Managed app state with blockchain data
**UI/UX**: Built responsive, user-friendly interfaces
**Error Handling**: Implemented proper error management
**Deployment**: Published your dApp to the web

---

## Additional Resources

### Documentation

- [Selendra SDK Documentation](../../api/)
- [React Integration Guide](../../api/react.md)
- [Error Handling Guide](../guides/error-handling.md)

### Community

- [Discord Server](https://discord.gg/selendra)
- [GitHub Discussions](https://github.com/selendra/selendra-sdk/discussions)
- [Developer Forum](https://forum.selendra.org)

### Examples

- [Simple Wallet Example](../../examples/simple-wallet/)
- [DeFi Swap App](../../examples/defi-swap-app/)
- [NFT Marketplace](../../examples/nft-marketplace/)

---

## Continue Your Journey

You're now ready to explore more advanced topics:

1. **Smart Contract Development** - Learn to write and deploy contracts
2. **Advanced React Patterns** - Master state management and hooks
3. **Cross-Chain Applications** - Build applications spanning multiple blockchains
4. **DeFi Protocols** - Integrate with decentralized finance
5. **NFTs and Digital Assets** - Create and manage unique digital items

**Happy building!** 🎉

If you enjoyed this tutorial, consider sharing it with others and contributing to the Selendra ecosystem!
