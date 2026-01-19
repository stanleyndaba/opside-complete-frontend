import os
import re

# Directories to search
dirs = [
    r'c:\Users\Student\Contacts\Clario-Complete-Backend\opside-complete-frontend\src\pages',
    r'c:\Users\Student\Contacts\Clario-Complete-Backend\opside-complete-frontend\src\components',
]

# Files to exclude (landing page files)
exclude_files = [
    'CookieConsent.tsx', 'InteractiveDemo.tsx', 'ProductsMegaMenu.tsx',
    'Index.tsx', 'Careers.tsx', 'ApiLanding.tsx', 'Privacy.tsx', 
    'Terms.tsx', 'RefundPolicy.tsx', 'Sales.tsx', 'Docs.tsx'
]

count = 0

for dir_path in dirs:
    for root, dirs_list, files in os.walk(dir_path):
        for file in files:
            if file.endswith('.tsx') and file not in exclude_files:
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original = content
                    # Remove " uppercase" and "uppercase " patterns
                    content = re.sub(r' uppercase(?=[ "\'\)])', '', content)
                    content = re.sub(r'uppercase ', '', content)
                    
                    if content != original:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f'Updated: {file}')
                        count += 1
                except Exception as e:
                    print(f'Error processing {file}: {e}')

print(f'\nTotal files updated: {count}')
