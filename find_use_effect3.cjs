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
        
        // Let's just do a simple search for supabase.from and useEffect in the same file
        if (content.includes('supabase') && content.includes('useEffect')) {
             
             // Check if it has a useEffect without a dependency array
             // A string that ends with }) instead of }, []) or }, [deps])
             // Let's print out all files that contain useEffect and supabase.from just in case
             if (content.includes('supabase.from')) {
                 console.log(`\n\n\n--- Checking: ${file} ---`);
                 const lines = content.split('\n');
                 for(let i=0; i<lines.length; i++) {
                     if (lines[i].includes('supabase.from') || lines[i].includes('useEffect')) {
                         console.log(`${i+1}: ${lines[i].trim()}`);
                     }
                 }
             }
        }
    } catch (e) {
    }
  });
}

findBuggyUseEffects();
