import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  source: string;
  confidence: number;
}

const EvidenceSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(\/api/v1/integrations/evidence/search?q=\\);
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=\"container max-w-6xl py-8\">
      <h1 className=\"text-4xl font-bold mb-4\">Evidence Search</h1>
      
      <Card className=\"p-6 mb-6\">
        <CardContent className=\"p-0\">
          <div className=\"flex gap-4\">
            <Input
              placeholder=\"Search evidence across connected documents...\"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className=\"flex-1\"
            />
            <Button
              onClick={handleSearch}
              disabled={loading}
            >
              <Search className=\"mr-2 h-4 w-4\" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({results.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"space-y-4\">
              {results.map((result) => (
                <div key={result.id} className=\"border-b pb-4 last:border-0\">
                  <h4 className=\"font-semibold mb-2\">{result.title}</h4>
                  <p className=\"text-sm text-muted-foreground mb-2\">{result.snippet}</p>
                  <div className=\"flex justify-between text-xs text-muted-foreground\">
                    <span>Source: {result.source}</span>
                    <span>Confidence: {(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {results.length === 0 && query && !loading && (
        <div className=\"text-center text-muted-foreground py-8\">
          No results found for \"{query}\"
        </div>
      )}
    </div>
  );
};

export default EvidenceSearch;
