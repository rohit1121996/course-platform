"use client";

import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  role: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  const handleLogin = (userId: string) => {
    Cookies.set("userId", userId, { path: "/" });
    router.push("/");
    router.refresh();
  };

  return (
    <main className="max-w-md mx-auto p-8 mt-20">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Login</h1>
        <p className="text-gray-600">Select a user to continue.</p>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Loading users...</div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => handleLogin(user.id)}
              className="w-full text-left p-4 border rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-colors flex justify-between items-center bg-white text-gray-900"
            >
              <div>
                <div className="font-semibold">{user.name}</div>
                <div className="text-sm text-gray-500 text-xs mt-1">{user.id}</div>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded ${
                user.role === 'MODERATOR' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {user.role}
              </span>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
