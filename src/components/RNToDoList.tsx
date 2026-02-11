import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export function RNToDoList() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    // Load todos from localStorage
    const saved = localStorage.getItem("rn-todos");
    if (saved) {
      try {
        setTodos(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading todos:", e);
      }
    }
  }, []);

  useEffect(() => {
    // Save todos to localStorage whenever they change
    localStorage.setItem("rn-todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (!newTodo.trim()) return;

    const newItem: TodoItem = {
      id: Date.now().toString(),
      text: newTodo.trim(),
      completed: false,
    };

    setTodos([newItem, ...todos]);
    setNewTodo("");
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">My To-Do List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Add a quick note or reminder..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addTodo()}
            />
            <Button onClick={addTodo} size="icon" className="shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {todos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No to-dos yet. Add one above!</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-2 p-2 rounded bg-muted/50 hover:bg-muted transition"
                >
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => toggleTodo(todo.id)}
                  />
                  <span
                    className={`flex-1 text-sm ${
                      todo.completed ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {todo.text}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => deleteTodo(todo.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
