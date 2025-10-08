import React, { useState, useEffect } from 'react';
import { User, Plus, Trash2, Check, X } from 'lucide-react';
import dataService from '../services/dataService';

const UserManager = ({ onUserSelect, onClose }) => {
  const [users, setUsers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadUsers();
    setCurrentUser(dataService.getCurrentUser());
  }, []);

  const loadUsers = () => {
    const allUsers = dataService.getAllUsers();
    setUsers(allUsers);
  };

  const handleCreateUser = () => {
    if (newUserName.trim()) {
      const newUser = dataService.createUser(newUserName.trim(), newUserEmail.trim() || null);
      setCurrentUser(newUser);
      loadUsers();
      setNewUserName('');
      setNewUserEmail('');
      setShowCreateForm(false);
      onUserSelect(newUser);
    }
  };

  const handleSelectUser = (user) => {
    dataService.setCurrentUser(user.id);
    setCurrentUser(user);
    onUserSelect(user);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      dataService.deleteUser(userId);
      loadUsers();
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(null);
        onUserSelect(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-stone-200">
          <h3 className="text-xl font-bold text-[#333333] uppercase tracking-wide">User Management</h3>
          <button onClick={onClose} className="text-[#333333] hover:opacity-60">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Current User Display */}
          {currentUser && (
            <div className="bg-stone-100 p-3 rounded-lg">
              <p className="text-sm font-bold text-[#333333] uppercase tracking-wider mb-1">Current User</p>
              <p className="text-lg font-bold text-[#333333]">{currentUser.name}</p>
              {currentUser.email && (
                <p className="text-sm text-[#333333] opacity-70">{currentUser.email}</p>
              )}
            </div>
          )}

          {/* Users List */}
          <div>
            <h4 className="font-bold text-[#333333] mb-3 text-sm uppercase tracking-wide">All Users</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {users.map(user => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                    currentUser && currentUser.id === user.id
                      ? 'border-[#333333] bg-stone-50'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User size={20} strokeWidth={2.5} className="text-[#333333]" />
                    <div>
                      <p className="font-medium text-[#333333]">{user.name}</p>
                      {user.email && (
                        <p className="text-xs text-[#333333] opacity-70">{user.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentUser && currentUser.id === user.id ? (
                      <Check size={20} strokeWidth={2.5} className="text-[#333333]" />
                    ) : (
                      <button
                        onClick={() => handleSelectUser(user)}
                        className="text-xs bg-black text-white px-3 py-1 rounded hover:bg-[#333333] font-bold uppercase tracking-wider transition-colors"
                      >
                        Select
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-[#333333] opacity-40 hover:opacity-100 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-[#333333] opacity-50 text-sm text-center py-4">No users found</p>
              )}
            </div>
          </div>

          {/* Create New User */}
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg hover:bg-[#333333] font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
            >
              <Plus size={20} strokeWidth={2.5} />
              Create New User
            </button>
          ) : (
            <div className="space-y-3 p-4 bg-stone-50 rounded-lg">
              <div>
                <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                  Name *
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Enter user name"
                  className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#333333] mb-2 uppercase tracking-wider">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg focus:outline-none focus:border-[#333333]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewUserName('');
                    setNewUserEmail('');
                  }}
                  className="flex-1 px-4 py-2.5 border-2 border-[#333333] text-[#333333] rounded-lg hover:bg-stone-100 font-bold uppercase text-sm tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-[#333333] font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-105"
                >
                  Create User
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManager;
