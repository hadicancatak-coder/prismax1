import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Replace } from 'lucide-react';
import { toast } from 'sonner';

interface FindReplaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cellData: Record<string, any>;
  onReplace: (findText: string, replaceText: string, replaceAll: boolean, options: FindReplaceOptions) => void;
}

export interface FindReplaceOptions {
  caseSensitive: boolean;
  matchEntireCell: boolean;
  searchFormulas: boolean;
}

export function FindReplaceDialog({ open, onOpenChange, cellData, onReplace }: FindReplaceDialogProps) {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [matchEntireCell, setMatchEntireCell] = useState(false);
  const [searchFormulas, setSearchFormulas] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  const findMatches = () => {
    if (!findText) {
      toast.error('Please enter text to find');
      return [];
    }

    const matches: string[] = [];
    Object.entries(cellData).forEach(([key, cell]) => {
      const searchText = searchFormulas && cell.formula ? cell.formula : cell.value;
      if (!searchText) return;

      const cellText = caseSensitive ? searchText : searchText.toLowerCase();
      const search = caseSensitive ? findText : findText.toLowerCase();

      if (matchEntireCell) {
        if (cellText === search) matches.push(key);
      } else {
        if (cellText.includes(search)) matches.push(key);
      }
    });

    setTotalMatches(matches.length);
    if (matches.length === 0) {
      toast.info('No matches found');
    } else {
      toast.success(`Found ${matches.length} match${matches.length > 1 ? 'es' : ''}`);
    }
    return matches;
  };

  const handleFindNext = () => {
    const matches = findMatches();
    if (matches.length > 0) {
      const nextIndex = (currentMatch + 1) % matches.length;
      setCurrentMatch(nextIndex);
      // TODO: Navigate to cell
    }
  };

  const handleReplace = () => {
    if (!findText) {
      toast.error('Please enter text to find');
      return;
    }
    onReplace(findText, replaceText, false, { caseSensitive, matchEntireCell, searchFormulas });
    setFindText('');
    setReplaceText('');
  };

  const handleReplaceAll = () => {
    if (!findText) {
      toast.error('Please enter text to find');
      return;
    }
    const matches = findMatches();
    if (matches.length === 0) return;
    
    onReplace(findText, replaceText, true, { caseSensitive, matchEntireCell, searchFormulas });
    setFindText('');
    setReplaceText('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Find and Replace</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="find" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="find">
              <Search className="h-4 w-4 mr-2" />
              Find
            </TabsTrigger>
            <TabsTrigger value="replace">
              <Replace className="h-4 w-4 mr-2" />
              Replace
            </TabsTrigger>
          </TabsList>

          <TabsContent value="find" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="find-text">Find</Label>
              <Input
                id="find-text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Enter text to find..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFindNext();
                }}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="case-sensitive"
                  checked={caseSensitive}
                  onCheckedChange={(checked) => setCaseSensitive(checked as boolean)}
                />
                <Label htmlFor="case-sensitive" className="text-sm font-normal cursor-pointer">
                  Match case
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="match-entire"
                  checked={matchEntireCell}
                  onCheckedChange={(checked) => setMatchEntireCell(checked as boolean)}
                />
                <Label htmlFor="match-entire" className="text-sm font-normal cursor-pointer">
                  Match entire cell contents
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="search-formulas"
                  checked={searchFormulas}
                  onCheckedChange={(checked) => setSearchFormulas(checked as boolean)}
                />
                <Label htmlFor="search-formulas" className="text-sm font-normal cursor-pointer">
                  Search in formulas
                </Label>
              </div>
            </div>

            {totalMatches > 0 && (
              <div className="text-sm text-muted-foreground">
                Match {currentMatch + 1} of {totalMatches}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleFindNext} className="flex-1">
                Find Next
              </Button>
              <Button onClick={findMatches} variant="outline" className="flex-1">
                Find All
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="replace" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="find-replace-text">Find</Label>
              <Input
                id="find-replace-text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Enter text to find..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="replace-with-text">Replace with</Label>
              <Input
                id="replace-with-text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Enter replacement text..."
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="case-sensitive-replace"
                  checked={caseSensitive}
                  onCheckedChange={(checked) => setCaseSensitive(checked as boolean)}
                />
                <Label htmlFor="case-sensitive-replace" className="text-sm font-normal cursor-pointer">
                  Match case
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="match-entire-replace"
                  checked={matchEntireCell}
                  onCheckedChange={(checked) => setMatchEntireCell(checked as boolean)}
                />
                <Label htmlFor="match-entire-replace" className="text-sm font-normal cursor-pointer">
                  Match entire cell contents
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="search-formulas-replace"
                  checked={searchFormulas}
                  onCheckedChange={(checked) => setSearchFormulas(checked as boolean)}
                />
                <Label htmlFor="search-formulas-replace" className="text-sm font-normal cursor-pointer">
                  Search in formulas
                </Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleReplace} variant="outline" className="flex-1">
                Replace
              </Button>
              <Button onClick={handleReplaceAll} className="flex-1">
                Replace All
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
