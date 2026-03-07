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
        
        // Remove comments
        const noComments = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
        
        let inHook = false;
        let braceCount = 0;
        let paramParenCount = 0;
        let hookContent = "";
        
        const lines = noComments.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            if (line.includes('useEffect')) {
                // simple start
                inHook = true;
                hookContent = "";
            }
            
            if (inHook) {
                hookContent += line + '\n';
                
                // Count Braces (we want to find the corresponding '}')
                for (let char of line) {
                    if (char === '{') braceCount++;
                    if (char === '}') {
                        braceCount--;
                        if (braceCount === 0 && inHook && hookContent.includes('{')) {
                            // Okay, we just closed the main block of the useEffect callback.
                            // The rest of this line (or next line) should contain the dependency array `),` or `)`.
                            let reminderOfLine = line.substring(line.lastIndexOf('}') + 1);
                            
                            // Let's check the next line too
                            let nextLine = i + 1 < lines.length ? lines[i+1] : "";
                            let followingText = (reminderOfLine + " " + nextLine).trim();
                            
                            if (followingText.startsWith(')')) {
                                // No dependency array! `})`
                                if (hookContent.includes('supabase.from') || hookContent.includes('api.get') || hookContent.includes('fetch')) {
                                    console.log(`\n🚨 DANGER: Missing dependency array for DB call in ${file}:${i+1} :`);
                                    console.log(`End snippet looks like: ${followingText}`);
                                }
                            } else if (!followingText.startsWith(',')) {
                                 // Might be formatted weirdly, let's just flag it if it's missing '['
                                if (!hookContent.includes('[') && !followingText.includes('[')) {
                                    if (hookContent.includes('supabase.from') || hookContent.includes('api.get') || hookContent.includes('fetch')) {
                                        console.log(`\n🚨 POTENTIAL: Missing dependency array for DB call in ${file}:${i+1} :`);
                                        console.log(`End snippet looks like: ${followingText}`);
                                    }
                                }
                            }
                            
                            inHook = false;
                            hookContent = "";
                        }
                    }
                }
            }
        }
    } catch (e) {
    }
  });
}

findBuggyUseEffects();
