const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function walkDir(dir, callback) {
  try {
    fs.readdirSync(dir).forEach(f => {
      let dirPath = path.join(dir, f);
      try {
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
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
        
        // Let's just do a simple search for supabase.from and useEffect in the same file
        if (content.includes('supabase') && content.includes('useEffect')) {
             console.log(`\n--- Checking: ${file} ---`);
             
             // Check if it has a useEffect without a dependency array
             // A very simple regex for `useEffect(() => { ... })`
             // This doesn't catch everything but it's a good guess
             if (content.match(/useEffect\s*\(\s*(async\s*)?\(\)\s*=>\s*\{[^\[]*\}\s*\)/g)) {
                 console.log(`🚨 LIKELY BUG: Found useEffect with NO dependency array!`);
             }
             
             const lines = content.split('\n');
             for(let i=0; i<lines.length; i++) {
                 if (lines[i].includes('supabase.from') || lines[i].includes('supabase.rpc')) {
                     console.log(`Line ${i+1}: ${lines[i].trim()}`);
                 }
             }
        }
    } catch (e) {
    }
  });
}

findBuggyUseEffects();
