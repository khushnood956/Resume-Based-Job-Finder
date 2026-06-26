# Skill Extraction Strategy

This document details the Natural Language Processing (NLP) and rule-based text processing steps used to isolate skills from candidate resumes and job postings.

---

## 1. Resume Ingestion & Text Normalization

### PDF Extraction
We use **PyMuPDF** (`fitz`) in Python due to its speed, lightweight footprint, and high accuracy in extraction of multi-column layouts, which are common in modern resumes.

### Text Normalization Pipeline
Before running search operations, the raw string is processed through the following sanitization steps:
1. **Lowercase**: Convert all text to lowercase to maintain case-insensitive matching.
2. **Whitespace Collapsing**: Replace tabs, newlines, and multiple spaces with a single space.
3. **Symbol Safeguarding**: Standard regex tokenizers remove symbols. We must preserve specific developer symbols:
   * `C++`
   * `C#`
   * `.NET`
   * `Node.js`
   * `Vue.js`
   * `React.js`
4. **Section Isolation**: Match header anchors (e.g., `skills`, `technical skills`, `experience`, `education`, `projects`) to weight skills found in the "Skills" section higher than random occurrences in body paragraphs.

---

## 2. Skill Dictionary (Curated for Pakistani Market)

The dictionary is organized into categories. It targets popular tech stack items found in Karachi, Lahore, Islamabad, and remote hubs.

```json
{
  "programming_languages": [
    "javascript", "python", "php", "java", "c++", "c#", "typescript", "ruby", "go", "rust", "kotlin", "swift", "sql", "html", "css"
  ],
  "frameworks": [
    "react", "next.js", "nextjs", "vue", "angular", "node.js", "nodejs", "express", "django", "fastapi", "laravel", "wordpress", "codeigniter", "spring boot", "asp.net", "flask", "jquery"
  ],
  "databases": [
    "mysql", "postgresql", "postgres", "mongodb", "sqlite", "redis", "oracle", "firebase", "cassandra"
  ],
  "mobile": [
    "flutter", "react native", "android studio", "ios", "kotlin", "swiftui"
  ],
  "devops_cloud": [
    "aws", "docker", "kubernetes", "git", "github", "gitlab", "ci/cd", "azure", "gcp", "linux", "nginx", "jenkins"
  ],
  "design": [
    "figma", "adobe xd", "photoshop", "illustrator", "ui/ux", "graphic design"
  ],
  "business_marketing": [
    "seo", "digital marketing", "content writing", "social media marketing", "excel", "shopify", "copywriting"
  ]
}
```

---

## 3. Extraction Logic & Boundary Matching

To prevent false matches (e.g., matching "go" inside "government" or "java" inside "javascript"), we use structured boundaries.

### Match Ordering (Greedy Match)
1. **Multi-Word Matches First**: Search for multi-word phrases first (e.g., "react native", "digital marketing") and tag/remove them from the search string so their sub-words don't trigger single-word matches later.
2. **Single-Word Matches**: Run single-word matching on remaining text.

### Custom Boundary Regex
Standard word boundaries `\b` do not work for symbols (e.g., `\b.net\b` matches `.net` but fails to match `c++` because `+` is not a word character).

We use a custom boundary check:
* A skill matches if it is surrounded by spaces, punctuation, or start/end of line.
* **Regex Template**:
  ```python
  def get_skill_regex(skill_name):
      # Escape special regex chars but preserve +, #, .
      escaped = re.escape(skill_name)
      # Boundary: Character before/after must not be letters or digits
      return rf"(?:^|[^a-zA-Z0-9_+-])({escaped})(?:$|[^a-zA-Z0-9_+-])"
  ```

### Python Implementation Outline (`services/resume-parser/parser.py`)
```python
import re
import fitz  # PyMuPDF

def extract_text_from_pdf(pdf_bytes):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def extract_skills(text, skill_dict):
    text_lower = " " + re.sub(r'\s+', ' ', text.lower()) + " "
    matched_skills = []
    
    # Iterate through categories and look for matches
    for category, skills in skill_dict.items():
        for skill in skills:
            # Custom boundary check
            pattern = rf"(?:^|[^a-zA-Z0-9_#+-.])({re.escape(skill)})(?:$|[^a-zA-Z0-9_#+-.])"
            if re.search(pattern, text_lower):
                matched_skills.append({
                    "name": skill,
                    "category": category
                })
                # Replace matched skill with space to avoid double parsing sub-words
                text_lower = re.sub(pattern, " ", text_lower)
                
    return matched_skills
```
