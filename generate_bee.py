#!/usr/bin/env python3
import urllib.request
URL = "https://gist.githubusercontent.com/MattIPv4/045239bc27b16b2bcf7a3a9a4648c08a/raw/2411e31293a35f3e565f61e7490a806d4720ea7e/bee%20movie%20script"
SUPPORTED = set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-x!. \n")
# replacements
REPLACEMENTS = {
    ',': '.',
    '?': '!',
    ':': '.',
    ';': '.',
    "'": '.',
    '"': '..',
    '\u201c': '..',  # left double quote
    '\u201d': '..',  # right double quote
    '\u2018': '.',   # left single quote
    '\u2019': '.',   # right single quote
    '(': '',
    ')': '',
    '[': '',
    ']': '',
    '{': '',
    '}': '',
    '/': '.',
    '\\': '.',
    '&': 'AND',
    '#': '',
    '@': 'AT',
    '*': 'X',
    '+': '',
    '=': '',
    '_': '-',
    '~': '',
    '`': '',
    '%': '',
    '^': '',
    '<': '',
    '>': '',
    '|': '.',
    '\u2026': '...',  # ellipsis
    '\u2013': '-',    # en dash
    '\u2014': '-',    # em dash (ooh ai!! spooky ai!!!)
}

def convert(text):
    result = text.upper()
    # replace
    for old, new in REPLACEMENTS.items():
        result = result.replace(old.upper(), new)
        result = result.replace(old, new)
    
    # are there any unsupported characters???
    unsupported = set()
    final = []
    for ch in result:
        if ch in SUPPORTED:
            final.append(ch)
        else:
            unsupported.add(ch)
            # skip em.
    
    if unsupported:
        print(f"Unsupported characters: ")
        for ch in sorted(unsupported):
            print(f"  U+{ord(ch):04X} '{ch}'")
    
    return ''.join(final)

def main():
    print("Fetching the Bee Movie.")
    req = urllib.request.Request(URL)
    with urllib.request.urlopen(req) as response:
        raw = response.read().decode('utf-8')
    
    print(f"Original: {len(raw)} characters")
    converted = convert(raw)
    print(f"Converted: {len(converted)} characters")
    
    with open('bee.txt', 'w') as f:
        f.write(converted)
    
    print("Go check out bee.txt")

if __name__ == '__main__':
    main()
