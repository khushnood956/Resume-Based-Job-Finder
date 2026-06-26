import os
import re
import json

# Load skill dictionary
DICTIONARY_PATH = os.path.join(os.path.dirname(__file__), "dictionary.json")

def load_skills_dictionary() -> dict[str, list[str]]:
    """Loads and returns the skill dictionary from JSON."""
    try:
        with open(DICTIONARY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        # Fallback dictionary if file load fails
        return {
            "programming_languages": ["javascript", "python", "php", "java", "c++", "c#", "typescript", "ruby", "go", "rust", "kotlin", "swift", "sql", "html", "css"],
            "frameworks": ["react", "next.js", "nextjs", "vue", "angular", "node.js", "nodejs", "express", "django", "fastapi", "laravel", "wordpress", "codeigniter", "spring boot", "asp.net", "flask", "jquery"],
            "databases": ["mysql", "postgresql", "postgres", "mongodb", "sqlite", "redis", "oracle", "firebase", "cassandra"],
            "mobile": ["flutter", "react native", "android studio", "ios", "swiftui"],
            "devops_cloud": ["aws", "docker", "kubernetes", "git", "github", "gitlab", "ci/cd", "azure", "gcp", "linux", "nginx", "jenkins"],
            "design": ["figma", "adobe xd", "photoshop", "illustrator", "ui/ux", "graphic design"],
            "business_marketing": ["seo", "digital marketing", "content writing", "social media marketing", "excel", "shopify", "copywriting"]
        }

def detect_sections(text: str) -> dict[str, str]:
    """
    Parses a resume string to detect and isolate key sections:
    Education, Experience, Projects, Skills, and other content.
    """
    sections = {
        "education": "",
        "experience": "",
        "projects": "",
        "skills": "",
        "other": ""
    }
    
    # Standard headers mapping
    header_patterns = {
        "education": r'\b(education|academic background|academic profile|qualification|qualifications|studies)\b',
        "experience": r'\b(experience|work experience|employment history|professional experience|work history|career history)\b',
        "projects": r'\b(projects|personal projects|academic projects|key projects)\b',
        "skills": r'\b(skills|technical skills|technologies|key skills|core competencies|skills & tools|languages & technologies)\b'
    }
    
    lines = text.split('\n')
    current_section = "other"
    section_content = {k: [] for k in sections.keys()}
    
    for line in lines:
        line_clean = line.strip().lower()
        # Skip empty lines
        if not line_clean:
            continue
            
        # Check if line looks like a header (short line containing header keyword)
        is_header = False
        if len(line_clean) < 40:
            for sec_name, pattern in header_patterns.items():
                if re.search(pattern, line_clean):
                    current_section = sec_name
                    is_header = True
                    break
                    
        if not is_header:
            section_content[current_section].append(line)
            
    # Combine content lists back into text blocks
    for sec_name in sections.keys():
        sections[sec_name] = "\n".join(section_content[sec_name]).strip()
        
    return sections

def extract_skills_from_text(text: str, skill_dict: dict[str, list[str]] = None) -> list[dict[str, str]]:
    """
    Extracts skills from text based on a dictionary matching approach.
    Uses custom lookbehind/lookahead boundaries to prevent false-positives
    (e.g., matching "go" inside "google" or "java" inside "javascript").
    
    Order-independent greedy match: matches multi-word skills first to prevent sub-word matching.
    """
    if not text:
        return []
        
    if skill_dict is None:
        skill_dict = load_skills_dictionary()
        
    # Prepare text for matching (space padded lowercase and original case)
    text_lower = " " + text.lower() + " "
    text_padded = " " + text + " "
    
    # Flatten the dictionary into a list of tuples: (skill_name, category)
    # Sort skills by length in descending order to match multi-word and longer terms first
    all_skills = []
    for category, skills in skill_dict.items():
        for skill in skills:
            all_skills.append((skill.lower(), category))
            
    all_skills.sort(key=lambda x: len(x[0]), reverse=True)
    
    extracted_skills = []
    
    for skill_name, category in all_skills:
        # Custom boundary check:
        # Before and after the skill name there must NOT be any alphanumeric characters or standard skill symbols
        if skill_name == "go":
            # For the very common English word 'go', require capitalization (Go or GO) to prevent false matches
            pattern = rf"(?<![a-zA-Z0-9_#+-.])(Go|GO)(?![a-zA-Z0-9_#+-.])"
            matches = list(re.finditer(pattern, text_padded))
        else:
            pattern = rf"(?<![a-zA-Z0-9_#+-.])({re.escape(skill_name)})(?![a-zA-Z0-9_#+-.])"
            matches = list(re.finditer(pattern, text_lower))
            
        if matches:
            # Add to results (using the capitalized standard name from the dictionary)
            # Find the original case-sensitive name or just capitalize nicely
            standardized_name = skill_name
            # Map aliases (e.g. nextjs -> next.js, postgres -> postgresql)
            if skill_name == "nextjs":
                standardized_name = "Next.js"
            elif skill_name == "nodejs":
                standardized_name = "Node.js"
            elif skill_name == "postgres":
                standardized_name = "PostgreSQL"
            else:
                # Format common developer names nicely
                dev_names = {
                    "javascript": "JavaScript", "python": "Python", "php": "PHP", "java": "Java",
                    "typescript": "TypeScript", "mysql": "MySQL", "postgresql": "PostgreSQL",
                    "mongodb": "MongoDB", "sqlite": "SQLite", "redis": "Redis", "oracle": "Oracle",
                    "firebase": "Firebase", "cassandra": "Cassandra", "react": "React", "vue": "Vue",
                    "angular": "Angular", "django": "Django", "fastapi": "FastAPI", "laravel": "Laravel",
                    "wordpress": "WordPress", "codeigniter": "CodeIgniter", "flask": "Flask",
                    "jquery": "jQuery", "flutter": "Flutter", "react native": "React Native",
                    "android studio": "Android Studio", "swiftui": "SwiftUI", "git": "Git",
                    "github": "GitHub", "gitlab": "GitLab", "nginx": "Nginx", "seo": "SEO",
                    "shopify": "Shopify"
                }
                standardized_name = dev_names.get(skill_name, skill_name.title())
                
            extracted_skills.append({
                "name": standardized_name,
                "category": category
            })
            
            # Replace matched instances in text with equal number of space characters
            # to prevent it from matching inside shorter keywords (greedy extraction)
            for match in matches:
                start, end = match.span(1)
                text_lower = text_lower[:start] + (" " * (end - start)) + text_lower[end:]
                text_padded = text_padded[:start] + (" " * (end - start)) + text_padded[end:]
                
    return extracted_skills
