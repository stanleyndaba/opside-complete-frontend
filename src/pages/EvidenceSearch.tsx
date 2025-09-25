import React, { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Search } from '@mui/icons-material';

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
        const response = await fetch(`/api/v1/integrations/evidence/search?q=${encodeURIComponent(query)}`);
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Evidence Search
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search evidence across connected documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
            startIcon={<Search />}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </Box>
      </Paper>

      {results.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Search Results ({results.length})
          </Typography>
          <List>
            {results.map((result) => (
              <ListItem key={result.id} divider>
                <ListItemText
                  primary={result.title}
                  secondary={
                    <Box>
                      <Typography variant="body2">{result.snippet}</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption">Source: {result.source}</Typography>
                        <Typography variant="caption">
                          Confidence: {(result.confidence * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {results.length === 0 && query && !loading && (
        <Typography textAlign="center" color="text.secondary">
          No results found for \"{query}\"
        </Typography>
      )}
    </Container>
  );
};

export default EvidenceSearch;
