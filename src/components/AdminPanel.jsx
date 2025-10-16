import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Filter, Check, AlertCircle, RefreshCw, Download, Upload } from 'lucide-react';
import dataService from '../services/dataService';

const AdminPanel = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('quotes');
  const [quotes, setQuotes] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Quote management state
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    quote: '',
    author: '',
    virtue: 'Present'
  });
  const [quoteFilter, setQuoteFilter] = useState('all');
  
  // Challenge management state
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [challengeForm, setChallengeForm] = useState({
    challenge: '',
    virtue: 'Present',
    difficulty: 'medium'
  });
  const [challengeFilter, setChallengeFilter] = useState('all');

  const virtues = ['Present', 'Determined', 'Confident', 'Patient', 'Genuine', 'Responsible', 'Strong', 'Disciplined', 'Humble'];
  const difficulties = ['easy', 'medium', 'hard'];

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading admin panel data...');
      
      // Load quotes and challenges separately to handle individual failures
      let quotesData = [];
      let challengesData = [];
      
      try {
        quotesData = await dataService.getQuotes();
        console.log('Quotes loaded:', quotesData);
      } catch (quotesError) {
        console.warn('Failed to load quotes:', quotesError);
        // Continue without quotes
      }
      
      try {
        challengesData = await dataService.getChallenges();
        console.log('Challenges loaded:', challengesData);
      } catch (challengesError) {
        console.warn('Failed to load challenges:', challengesError);
        // Continue without challenges
      }
      
      setQuotes(quotesData);
      setChallenges(challengesData);
      
      // Show success message if any data loaded successfully
      if (quotesData.length > 0 || challengesData.length > 0) {
        showSuccess(`Loaded ${quotesData.length} quotes and ${challengesData.length} challenges`);
      } else {
        showSuccess('Admin panel loaded - no data found yet. You can add quotes and challenges!');
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  // Quote handlers
  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingQuote) {
        await dataService.updateQuote(editingQuote.id, quoteForm);
        setQuotes(quotes.map(q => q.id === editingQuote.id ? { ...q, ...quoteForm } : q));
        showSuccess('Quote updated successfully!');
      } else {
        const newQuote = await dataService.addQuote(quoteForm);
        setQuotes([...quotes, newQuote]);
        showSuccess('Quote added successfully!');
      }
      
      setShowQuoteForm(false);
      setEditingQuote(null);
      setQuoteForm({ quote: '', author: '', virtue: 'Present' });
    } catch (err) {
      showError(err.message);
    }
  };

  const handleQuoteEdit = (quote) => {
    setEditingQuote(quote);
    setQuoteForm({
      quote: quote.quote,
      author: quote.author,
      virtue: quote.virtue
    });
    setShowQuoteForm(true);
  };

  const handleQuoteDelete = async (quoteId) => {
    if (!window.confirm('Are you sure you want to delete this quote?')) return;
    
    try {
      await dataService.deleteQuote(quoteId);
      setQuotes(quotes.filter(q => q.id !== quoteId));
      showSuccess('Quote deleted successfully!');
    } catch (err) {
      showError(err.message);
    }
  };

  // Challenge handlers
  const handleChallengeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingChallenge) {
        await dataService.updateChallenge(editingChallenge.id, challengeForm);
        setChallenges(challenges.map(c => c.id === editingChallenge.id ? { ...c, ...challengeForm } : c));
        showSuccess('Challenge updated successfully!');
      } else {
        const newChallenge = await dataService.addChallenge(challengeForm);
        setChallenges([...challenges, newChallenge]);
        showSuccess('Challenge added successfully!');
      }
      
      setShowChallengeForm(false);
      setEditingChallenge(null);
      setChallengeForm({ challenge: '', virtue: 'Present', difficulty: 'medium' });
    } catch (err) {
      showError(err.message);
    }
  };

  const handleChallengeEdit = (challenge) => {
    setEditingChallenge(challenge);
    setChallengeForm({
      challenge: challenge.challenge,
      virtue: challenge.virtue,
      difficulty: challenge.difficulty
    });
    setShowChallengeForm(true);
  };

  const handleChallengeDelete = async (challengeId) => {
    if (!window.confirm('Are you sure you want to delete this challenge?')) return;
    
    try {
      await dataService.deleteChallenge(challengeId);
      setChallenges(challenges.filter(c => c.id !== challengeId));
      showSuccess('Challenge deleted successfully!');
    } catch (err) {
      showError(err.message);
    }
  };

  // Filter data
  const filteredQuotes = quoteFilter === 'all' 
    ? quotes 
    : quotes.filter(q => q.virtue === quoteFilter);

  const filteredChallenges = challengeFilter === 'all' 
    ? challenges 
    : challenges.filter(c => c.virtue === challengeFilter);

  const getVirtueColor = (virtue) => {
    const colors = {
      'Present': 'bg-blue-100 text-blue-800',
      'Determined': 'bg-red-100 text-red-800',
      'Confident': 'bg-yellow-100 text-yellow-800',
      'Patient': 'bg-green-100 text-green-800',
      'Genuine': 'bg-purple-100 text-purple-800',
      'Responsible': 'bg-indigo-100 text-indigo-800',
      'Strong': 'bg-orange-100 text-orange-800',
      'Disciplined': 'bg-pink-100 text-pink-800',
      'Humble': 'bg-gray-100 text-gray-800'
    };
    return colors[virtue] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'easy': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'hard': 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  // CSV Export functionality
  const exportQuotesToCSV = () => {
    try {
      const csvContent = [
        // CSV Header
        ['Quote', 'Author', 'Virtue'].join(','),
        // CSV Data
        ...quotes.map(quote => [
          `"${quote.quote.replace(/"/g, '""')}"`, // Escape quotes in quote text
          `"${quote.author.replace(/"/g, '""')}"`, // Escape quotes in author
          quote.virtue
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `quotes_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showSuccess(`Exported ${quotes.length} quotes to CSV`);
    } catch (error) {
      console.error('Error exporting quotes to CSV:', error);
      showError('Failed to export quotes to CSV');
    }
  };

  // CSV Import functionality
  const handleCSVImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvText = e.target.result;
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          showError('CSV file must contain at least a header row and one data row');
          return;
        }

        // Parse CSV (simple parser - assumes no commas in quoted fields except for escaped quotes)
        const rows = lines.map(line => {
          const result = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
              if (inQuotes && nextChar === '"') {
                current += '"';
                i++; // Skip next quote
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        });

        const header = rows[0];
        const dataRows = rows.slice(1);

        // Validate header
        if (header.length < 3 || 
            !header[0].toLowerCase().includes('quote') || 
            !header[1].toLowerCase().includes('author') || 
            !header[2].toLowerCase().includes('virtue')) {
          showError('CSV header must contain: Quote, Author, Virtue columns');
          return;
        }

        // Process and validate data
        const newQuotes = [];
        const errors = [];

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const rowNum = i + 2; // +2 because we skip header and arrays are 0-indexed

          if (row.length < 3) {
            errors.push(`Row ${rowNum}: Missing required columns`);
            continue;
          }

          const quote = row[0].replace(/^"|"$/g, ''); // Remove surrounding quotes
          const author = row[1].replace(/^"|"$/g, '');
          const virtue = row[2].replace(/^"|"$/g, '');

          // Validate data
          if (!quote.trim()) {
            errors.push(`Row ${rowNum}: Quote cannot be empty`);
            continue;
          }
          if (!author.trim()) {
            errors.push(`Row ${rowNum}: Author cannot be empty`);
            continue;
          }
          if (!virtues.includes(virtue)) {
            errors.push(`Row ${rowNum}: Invalid virtue "${virtue}". Must be one of: ${virtues.join(', ')}`);
            continue;
          }

          newQuotes.push({
            quote: quote.trim(),
            author: author.trim(),
            virtue: virtue.trim()
          });
        }

        if (errors.length > 0) {
          showError(`Import failed with ${errors.length} errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`);
          return;
        }

        if (newQuotes.length === 0) {
          showError('No valid quotes found in CSV file');
          return;
        }

        // Import quotes one by one
        let successCount = 0;
        let failCount = 0;

        for (const quoteData of newQuotes) {
          try {
            const newQuote = await dataService.addQuote(quoteData);
            setQuotes(prev => [...prev, newQuote]);
            successCount++;
          } catch (error) {
            console.error('Error adding quote:', error);
            failCount++;
          }
        }

        if (successCount > 0) {
          showSuccess(`Successfully imported ${successCount} quotes${failCount > 0 ? ` (${failCount} failed)` : ''}`);
        } else {
          showError('Failed to import any quotes');
        }

      } catch (error) {
        console.error('Error parsing CSV:', error);
        showError('Failed to parse CSV file. Please check the format.');
      }
    };

    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-600 mx-auto"></div>
          <p className="mt-2 text-stone-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200">
          <h2 className="text-2xl font-bold text-stone-800">Admin Panel</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={20} className="text-stone-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <X size={24} className="text-stone-600" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200">
          <button
            onClick={() => setActiveTab('quotes')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'quotes'
                ? 'text-stone-800 border-b-2 border-stone-600'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Quotes ({quotes.length})
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'challenges'
                ? 'text-stone-800 border-b-2 border-stone-600'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Challenges ({challenges.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'quotes' && (
            <div className="h-full flex flex-col">
              {/* Quotes Header */}
              <div className="p-6 border-b border-stone-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-800">Manage Quotes</h3>
                    <p className="text-sm text-stone-500 mt-1">
                      {quotes.length} total quotes • {filteredQuotes.length} filtered
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportQuotesToCSV}
                      className="flex items-center gap-2 px-3 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                      title="Export quotes to CSV"
                    >
                      <Download size={16} />
                      Export CSV
                    </button>
                    <label className="flex items-center gap-2 px-3 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer">
                      <Upload size={16} />
                      Import CSV
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCSVImport}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => {
                        setEditingQuote(null);
                        setQuoteForm({ quote: '', author: '', virtue: 'Present' });
                        setShowQuoteForm(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-stone-600 text-white rounded-lg hover:bg-stone-700 transition-colors"
                    >
                      <Plus size={16} />
                      Add Quote
                    </button>
                  </div>
                </div>
                
                {/* Filter */}
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-stone-500" />
                  <select
                    value={quoteFilter}
                    onChange={(e) => setQuoteFilter(e.target.value)}
                    className="px-3 py-1 border border-stone-300 rounded-lg text-sm"
                  >
                    <option value="all">All Virtues</option>
                    {virtues.map(virtue => (
                      <option key={virtue} value={virtue}>{virtue}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quotes List */}
              <div className="flex-1 overflow-y-auto p-6">
                {filteredQuotes.length === 0 ? (
                  <div className="text-center py-8 text-stone-500">
                    No quotes found. Add your first quote!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredQuotes.map((quote) => (
                      <div key={quote.id} className="bg-stone-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-stone-800 font-medium mb-2">"{quote.quote}"</p>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-stone-600">— {quote.author}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVirtueColor(quote.virtue)}`}>
                                {quote.virtue}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleQuoteEdit(quote)}
                              className="p-2 hover:bg-stone-200 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} className="text-stone-600" />
                            </button>
                            <button
                              onClick={() => handleQuoteDelete(quote.id)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} className="text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'challenges' && (
            <div className="h-full flex flex-col">
              {/* Challenges Header */}
              <div className="p-6 border-b border-stone-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-800">Manage Challenges</h3>
                    <p className="text-sm text-stone-500 mt-1">
                      {challenges.length} total challenges • {filteredChallenges.length} filtered
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingChallenge(null);
                      setChallengeForm({ challenge: '', virtue: 'Present', difficulty: 'medium' });
                      setShowChallengeForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-600 text-white rounded-lg hover:bg-stone-700 transition-colors"
                  >
                    <Plus size={16} />
                    Add Challenge
                  </button>
                </div>
                
                {/* Filter */}
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-stone-500" />
                  <select
                    value={challengeFilter}
                    onChange={(e) => setChallengeFilter(e.target.value)}
                    className="px-3 py-1 border border-stone-300 rounded-lg text-sm"
                  >
                    <option value="all">All Virtues</option>
                    {virtues.map(virtue => (
                      <option key={virtue} value={virtue}>{virtue}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Challenges List */}
              <div className="flex-1 overflow-y-auto p-6">
                {filteredChallenges.length === 0 ? (
                  <div className="text-center py-8 text-stone-500">
                    No challenges found. Add your first challenge!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredChallenges.map((challenge) => (
                      <div key={challenge.id} className="bg-stone-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-stone-800 font-medium mb-2">{challenge.challenge}</p>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVirtueColor(challenge.virtue)}`}>
                                {challenge.virtue}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                                {challenge.difficulty}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleChallengeEdit(challenge)}
                              className="p-2 hover:bg-stone-200 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} className="text-stone-600" />
                            </button>
                            <button
                              onClick={() => handleChallengeDelete(challenge.id)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} className="text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quote Form Modal */}
        {showQuoteForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-stone-800 mb-4">
                {editingQuote ? 'Edit Quote' : 'Add New Quote'}
              </h3>
              <form onSubmit={handleQuoteSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Quote</label>
                  <textarea
                    value={quoteForm.quote}
                    onChange={(e) => setQuoteForm({ ...quoteForm, quote: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                    rows="3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Author</label>
                  <input
                    type="text"
                    value={quoteForm.author}
                    onChange={(e) => setQuoteForm({ ...quoteForm, author: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Virtue</label>
                  <select
                    value={quoteForm.virtue}
                    onChange={(e) => setQuoteForm({ ...quoteForm, virtue: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                  >
                    {virtues.map(virtue => (
                      <option key={virtue} value={virtue}>{virtue}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuoteForm(false);
                      setEditingQuote(null);
                      setQuoteForm({ quote: '', author: '', virtue: 'Present' });
                    }}
                    className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-stone-600 text-white rounded-lg hover:bg-stone-700 transition-colors"
                  >
                    {editingQuote ? 'Update' : 'Add'} Quote
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Challenge Form Modal */}
        {showChallengeForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-stone-800 mb-4">
                {editingChallenge ? 'Edit Challenge' : 'Add New Challenge'}
              </h3>
              <form onSubmit={handleChallengeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Challenge</label>
                  <textarea
                    value={challengeForm.challenge}
                    onChange={(e) => setChallengeForm({ ...challengeForm, challenge: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                    rows="3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Virtue</label>
                  <select
                    value={challengeForm.virtue}
                    onChange={(e) => setChallengeForm({ ...challengeForm, virtue: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                  >
                    {virtues.map(virtue => (
                      <option key={virtue} value={virtue}>{virtue}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Difficulty</label>
                  <select
                    value={challengeForm.difficulty}
                    onChange={(e) => setChallengeForm({ ...challengeForm, difficulty: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                  >
                    {difficulties.map(difficulty => (
                      <option key={difficulty} value={difficulty}>{difficulty}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChallengeForm(false);
                      setEditingChallenge(null);
                      setChallengeForm({ challenge: '', virtue: 'Present', difficulty: 'medium' });
                    }}
                    className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-stone-600 text-white rounded-lg hover:bg-stone-700 transition-colors"
                  >
                    {editingChallenge ? 'Update' : 'Add'} Challenge
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notifications */}
        {success && (
          <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 z-70">
            <Check size={16} />
            {success}
          </div>
        )}
        
        {error && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 z-70">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
