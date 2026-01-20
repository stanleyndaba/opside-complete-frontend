"""
Fix uppercase, letter-spacing, and tiny font issues in the frontend platform.
"""

import os
import re

dirs = [
    r'c:\Users\Student\Contacts\Clario-Complete-Backend\opside-complete-frontend\src\pages',
    r'c:\Users\Student\Contacts\Clario-Complete-Backend\opside-complete-frontend\src\components',
]

exclude_files = [
    'Index.tsx', 'Careers.tsx', 'ApiLanding.tsx', 'Privacy.tsx', 
    'Terms.tsx', 'RefundPolicy.tsx', 'Sales.tsx', 'Docs.tsx',
    'CookieConsent.tsx', 'InteractiveDemo.tsx', 'ProductsMegaMenu.tsx',
    'HeroSection.tsx', 'Footer.tsx', 'LandingNavbar.tsx'
]

files_processed = 0

for dir_path in dirs:
    for root, dirs_list, files in os.walk(dir_path):
        if 'landing' in root:
            continue
            
        for file in files:
            if file.endswith('.tsx') and file not in exclude_files:
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original = content
                    
                    # 1. Remove 'uppercase' class
                    content = re.sub(r' uppercase(?=[ "\'\)])', '', content)
                    content = re.sub(r'uppercase ', '', content)
                    
                    # 2. Remove wide letter-spacing
                    content = re.sub(r' tracking-\[0\.\d+em\]', '', content)
                    content = re.sub(r' tracking-widest', '', content)
                    content = re.sub(r' tracking-wider', '', content)
                    content = re.sub(r' tracking-wide', '', content)
                    
                    # 3. Fix tiny fonts
                    content = re.sub(r'text-\[8px\]', 'text-xs', content)
                    content = re.sub(r'text-\[9px\]', 'text-xs', content)
                    content = re.sub(r'text-\[10px\]', 'text-xs', content)
                    content = re.sub(r'text-\[11px\]', 'text-sm', content)
                    
                    if content != original:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(content)
                        files_processed += 1
                        print('Updated:', file)
                        
                except Exception as e:
                    print('Error:', file, str(e))

print('')
print('Total files updated:', files_processed)
