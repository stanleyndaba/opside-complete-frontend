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
        // ignore stat errors
      }
    });
  } catch (e) {
      // ignore dir errors
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
        
        let inUseEffect = false;
        let braceCount = 0;
        let useEffectStarts = [];
        let usesSupabase = false;

        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check for useEffect ending without dependencies
            // This regex looks for `})` possibly with semicolons, but NOT followed by `,`
            if (line.match(/useEffect\s*\([\s\S]+,\s*\[\]\s*\)/)) {
                // correctly has a deps array, let's skip for simple checks
            } else if (line.match(/useEffect/)) {
                 // It's entering a useEffect block. Let's look at the next few lines.
                 let j = i;
                 let block = "";
                 let foundEnd = false;
                 // Look ahead up to 30 lines
                 while(j < i + 30 && j < lines.length) {
                     block += lines[j] + '\n';
                     if (lines[j].includes('supabase.from') || lines[j].includes('api.')) {
                         usesSupabase = true;
                     }
                     // simple heuristic for end of hook: ^  }, [deps]) or ^  })
                     if (lines[j].match(/^\s*\}\)\s*;?\s*$/)) {
                         foundEnd = true;
                         if (usesSupabase) {
                             console.log(`\n🚨 FOUND MISSING DEP ARRAY IN: ${file}:${j+1}`);
                             console.log(`Ends with: ${lines[j]}`);
                             usesSupabase = false;
                             break;
                         }
                     }
                     
                     if (lines[j].match(/^\s*\}\s*,\s*\[.*\]\)\s*;?\s*$/)) {
                         // found correct end
                         foundEnd = true;
                         usesSupabase = false;
                         break;
                     }
                     j++;
                 }
                 usesSupabase = false;
            }
        }
    } catch (e) {
        // ignore read errors
    }
  });
}

findBuggyUseEffects();
