import re

def remove_git_conflicts(filepath):
    """Remove git conflict markers and keep the appropriate version"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match conflict blocks
    pattern = r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> [a-f0-9]+\n'
    
    # For most conflicts, we'll keep the HEAD version (first part)
    # But we need to handle each file differently
    
    if 'StoreCustomer.js' in filepath:
        # For StoreCustomer, keep the required fields (HEAD version)
        cleaned = re.sub(pattern, r'\1\n', content, flags=re.DOTALL)
    elif 'MiniDrawer.js' in filepath:
        # Remove all commented code at the top
        lines = content.split('\n')
        active_start = None
        for i, line in enumerate(lines):
            if line.strip() and not line.strip().startswith('//'):
                active_start = i
                break
        if active_start:
            content = '\n'.join(lines[active_start:])
        cleaned = re.sub(pattern, r'\1\n', content, flags=re.DOTALL)
    elif 'StoreDetails.js' in filepath:
        # Remove duplicate component definition
        lines = content.split('\n')
        # Find where actual imports start (not commented)
        active_start = None
        for i, line in enumerate(lines):
            if line.strip().startswith('import ') and not line.strip().startswith('//'):
                active_start = i
                break
        if active_start:
            content = '\n'.join(lines[active_start:])
        cleaned = re.sub(pattern, r'\1\n', content, flags=re.DOTALL)
    elif 'Storemanagement.js' in filepath:
        # Remove duplicate component definition
        lines = content.split('\n')
        # Find where actual imports start (not commented)
        active_start = None
        for i, line in enumerate(lines):
            if line.strip().startswith('import ') and not line.strip().startswith('//'):
                active_start = i
                break
        if active_start:
            content = '\n'.join(lines[active_start:])
        cleaned = re.sub(pattern, r'\1\n', content, flags=re.DOTALL)
    else:
        cleaned = re.sub(pattern, r'\1\n', content, flags=re.DOTALL)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(cleaned)
    
    print(f"Fixed {filepath}")

# Fix the files
files = [
    r'e:\prd\Latest_Update\StockHandle-main\StockHandle-main\my-app\src\Pages\StoreCustomer.js',
    r'e:\prd\Latest_Update\StockHandle-main\StockHandle-main\my-app\src\Pages\MiniDrawer.js',
    r'e:\prd\Latest_Update\StockHandle-main\StockHandle-main\my-app\src\Pages\StoreDetails.js',
    r'e:\prd\Latest_Update\StockHandle-main\StockHandle-main\my-app\src\Pages\Storemanagement.js'
]

for filepath in files:
    try:
        remove_git_conflicts(filepath)
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")
