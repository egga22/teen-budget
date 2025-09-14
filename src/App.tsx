import { useEffect, useState } from 'react';
import './App.css';
import type { Profile, Transaction, Goal, IncomeType } from './types';
import { loadProfiles, saveProfiles } from './storage';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import confetti from 'canvas-confetti';

ChartJS.register(ArcElement, Tooltip, Legend);

function App() {
  const [profiles, setProfiles] = useState<Profile[]>(() => loadProfiles());
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  );

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const current = profiles.find((p) => p.id === currentId) || null;

  function updateProfile(updated: Profile) {
    const next = profiles.map((p) => (p.id === updated.id ? updated : p));
    setProfiles(next);
    saveProfiles(next);
  }

  function addProfile(name: string) {
    const newProfile: Profile = {
      id: crypto.randomUUID(),
      name,
      balance: 0,
      categories: ['Food', 'Fun', 'Subscriptions', 'Savings'],
      transactions: [],
      goals: [],
      budgets: {},
    };
    const next = [...profiles, newProfile];
    setProfiles(next);
    saveProfiles(next);
  }

  function addTransaction(t: Omit<Transaction, 'id'>) {
    if (!current) return;
    const tx: Transaction = { id: crypto.randomUUID(), ...t };
    const newBalance =
      t.type === 'income' ? current.balance + t.amount : current.balance - t.amount;
    const categories = current.categories.includes(t.category)
      ? current.categories
      : [...current.categories, t.category];
    const updated: Profile = {
      ...current,
      balance: newBalance,
      transactions: [tx, ...current.transactions],
      categories,
    };
    updateProfile(updated);
  }

  function addGoal(name: string, target: number) {
    if (!current) return;
    const goal: Goal = { id: crypto.randomUUID(), name, target, saved: 0 };
    updateProfile({ ...current, goals: [...current.goals, goal] });
  }

  function contributeGoal(goalId: string, amount: number) {
    if (!current) return;
    const goals = current.goals.map((g) => {
      if (g.id === goalId) {
        const saved = g.saved + amount;
        if (saved >= g.target) {
          confetti();
        }
        return { ...g, saved };
      }
      return g;
    });
    updateProfile({ ...current, goals });
  }

  function toggleTheme() {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }

  function handleSetBudget() {
    if (!current) return;
    const category = prompt('Category to set budget for?');
    if (!category) return;
    const amount = Number(prompt('Budget amount?'));
    const budgets = { ...current.budgets, [category]: amount };
    updateProfile({ ...current, budgets });
  }

  // Form handlers
  function handleAddIncome() {
    const amount = Number(prompt('Amount received?'));
    const incomeType = prompt('Type (allowance/chore/job/gift)?') as IncomeType;
    const category = prompt('Category?') || 'Income';
    const recurring = prompt('Is this recurring? (y/n)') === 'y';
    addTransaction({
      type: 'income',
      amount,
      incomeType,
      category,
      recurring,
      date: new Date().toISOString(),
    });
  }

  function handleAddExpense() {
    const amount = Number(prompt('Amount spent?'));
    const category = prompt('Category?') || 'General';
    const notes = prompt('Notes?') || '';
    const recurring = prompt('Is this recurring (subscription)? (y/n)') === 'y';
    addTransaction({
      type: 'expense',
      amount,
      category,
      notes,
      recurring,
      date: new Date().toISOString(),
    });
  }

  function handleAddGoal() {
    const name = prompt('Goal name?');
    const target = Number(prompt('Target amount?'));
    if (name) addGoal(name, target);
  }

  function handleGoalContribution(id: string) {
    const amount = Number(prompt('How much to add?'));
    if (amount > 0) contributeGoal(id, amount);
  }

  // Charts
  const chartData = {
    labels: current?.categories || [],
    datasets: [
      {
        label: 'Spending by Category',
        data:
          current?.categories.map((c) =>
            current.transactions
              .filter((t) => t.type === 'expense' && t.category === c)
              .reduce((sum, t) => sum + t.amount, 0)
          ) || [],
        backgroundColor: ['#ff6384', '#36a2eb', '#ffcd56', '#4bc0c0', '#9966ff'],
      },
    ],
  };

  if (!current) {
    return (
      <div className="login">
        <h1>👛 Teen Budget</h1>
        <ul>
          {profiles.map((p) => (
            <li key={p.id}>
              <button onClick={() => setCurrentId(p.id)}>{p.name}</button>
            </li>
          ))}
        </ul>
        <button onClick={() => {
          const name = prompt('Your name?');
          if (name) addProfile(name);
        }}>Add Profile</button>
        <button onClick={toggleTheme}>Toggle {theme} mode</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header>
        <h2>Hi {current.name}! Balance: ${current.balance.toFixed(2)}</h2>
        <button onClick={() => setCurrentId(null)}>Switch Profile</button>
        <button onClick={toggleTheme}>Toggle {theme} mode</button>
      </header>

      <div className="actions">
        <button onClick={handleAddIncome}>➕ Add Income</button>
        <button onClick={handleAddExpense}>💸 Add Expense</button>
        <button onClick={handleAddGoal}>🎯 New Goal</button>
        <button onClick={handleSetBudget}>📊 Set Budget</button>
      </div>

      <section className="goals">
        <h3>Goals</h3>
        {current.goals.map((g) => (
          <div key={g.id} className="goal">
            <span>{g.name} - ${g.saved}/{g.target}</span>
            <progress value={g.saved} max={g.target}></progress>
            <button onClick={() => handleGoalContribution(g.id)}>Add 💰</button>
          </div>
        ))}
      </section>

      <section className="budgets">
        <h3>Budgets</h3>
        {Object.entries(current.budgets).map(([cat, limit]) => {
          const spent = current.transactions
            .filter((t) => t.type === 'expense' && t.category === cat)
            .reduce((s, t) => s + t.amount, 0);
          return (
            <div key={cat} className="budget">
              <span>{cat}: ${spent} / {limit}</span>
              <progress value={spent} max={limit}></progress>
            </div>
          );
        })}
      </section>

      <section className="chart">
        <Doughnut data={chartData} />
      </section>

      <section className="transactions">
        <h3>Recent Activity</h3>
        <ul>
          {current.transactions.slice(0, 10).map((t) => (
            <li key={t.id}>
              {t.type === 'income' ? '⬆️' : '⬇️'} ${t.amount} {t.category}{' '}
              {t.type === 'income' && t.incomeType ? `(${t.incomeType})` : ''}
              {t.recurring ? ' 🔁' : ''}
            </li>
          ))}
        </ul>
      </section>

      <section className="ai">
        <h3>🤖 Smart Tips</h3>
        <p>AI suggestions will appear here soon!</p>
      </section>
    </div>
  );
}

export default App;
