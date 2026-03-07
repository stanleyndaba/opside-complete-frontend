const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function walkDir(dir, callback) {
  try {
    fs.readdirSync(dir).forEach(f => {
      let dirPath = path.join(dir, f);
      try {
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if(isDirectory && !dirPath.includes('node_modules')) {
             walkDir(dirPath, callback);
        } else if(!isDirectory) {
             callback(path.join(dir, f));
        }
      } catch (e) {
      }
    });
  } catch (e) {
  }
}

function findBuggyUseEffects() {
  const reactFiles = [];
  walkDir(directoryPath, function(filePath) {
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      reactFiles.push(filePath);
    }
  });

  reactFiles.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Find all indices of 'useEffect'
        let startIndex = 0;
        while ((startIndex = content.indexOf('useEffect', startIndex)) !== -1) {
            // Find the opening parenthesis for useEffect(
            const openParen = content.indexOf('(', startIndex);
            if (openParen !== -1) {
                // Find matching closing parenthesis
                let parenCount = 1;
                let closeParen = -1;
                let fetchInside = false;
                
                for (let i = openParen + 1; i < content.length; i++) {
                    const char = content[i];
                    if (char === '(') parenCount++;
                    if (char === ')') parenCount--;
                    
                    if (content.substr(i, 8) === 'supabase' || content.substr(i, 3) === 'api' || content.substr(i, 5) === 'fetch') {
                        fetchInside = true;
                    }
                    
                    if (parenCount === 0) {
                        closeParen = i;
                        break;
                    }
                }
                
                if (closeParen !== -1 && fetchInside) {
                     // We found the boundaries of `useEffect(...)`
                     const hookContent = content.substring(openParen, closeParen + 1);
                     
                     // Check if it ends with `}, [])` or similar.
                     // The last non-whitespace characters inside the parens should be `}` or `]`
                     const insideParens = content.substring(openParen + 1, closeParen).trim();
                     if (insideParens.endsWith('}')) {
                         // It ends with block brace, which means NO DEPENDENCY ARRAY.
                         console.log(`\n🚨 FOUND LIKELY BUG IN ${file}`);
                         
                         // Try to get the line number
                         const linesUpToMatch = content.substring(0, closeParen).split('\n');
                         const lineNum = linesUpToMatch.length;
                         console.log(`Line ${lineNum}: ... ${content.substring(closeParen - 20, closeParen + 5).replace(/\n/g, ' ')} ...`);
                     }
                }
            }
            startIndex += 9; // move past 'useEffect'
        }
        
    } catch (e) {
    }
  });
}

findBuggyUseEffects();
