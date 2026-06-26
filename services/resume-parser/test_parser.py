import unittest
from parser import detect_sections, extract_skills_from_text, load_skills_dictionary

class TestParser(unittest.TestCase):
    def setUp(self):
        # Sample dictionary for tests to remain independent of global dictionary changes
        self.test_dict = {
            "programming_languages": ["java", "go", "c++", "c#", "python"],
            "frameworks": ["react", "next.js", "nextjs", "django"],
            "mobile": ["react native", "flutter"],
            "databases": ["postgresql", "postgres"]
        }

    def test_detect_sections(self):
        resume_text = (
            "Khushnood Ahmad\n"
            "Email: test@example.com\n"
            "EDUCATION\n"
            "BS Computer Science from FAST NUCES Lahore (2020 - 2024)\n"
            "WORK EXPERIENCE\n"
            "Junior Developer at TechLogix Lahore\n"
            "Worked on React Native and Python backend systems.\n"
            "TECHNICAL SKILLS\n"
            "React, Python, Django, C++, Git, Docker\n"
            "PROJECTS\n"
            "Resume Matching Engine: Built with Python and Next.js"
        )
        sections = detect_sections(resume_text)
        
        self.assertIn("Khushnood Ahmad", sections["other"])
        self.assertIn("BS Computer Science", sections["education"])
        self.assertIn("Junior Developer", sections["experience"])
        self.assertIn("React, Python", sections["skills"])
        self.assertIn("Resume Matching Engine", sections["projects"])

    def test_extract_skills_greedy_matching(self):
        # "react native" should match and hide "react"
        text = "I have experience working with React Native projects."
        skills = extract_skills_from_text(text, self.test_dict)
        
        skill_names = [s["name"] for s in skills]
        self.assertIn("React Native", skill_names)
        self.assertNotIn("React", skill_names)  # React shouldn't match independently inside React Native

    def test_extract_skills_avoid_partial_match(self):
        # "java" shouldn't match in "javascript"
        # "go" shouldn't match in "government" or "django"
        text = "We will go to government offices to study javascript."
        skills = extract_skills_from_text(text, self.test_dict)
        
        skill_names = [s["name"] for s in skills]
        self.assertNotIn("Java", skill_names)
        self.assertNotIn("Go", skill_names)

    def test_extract_skills_developer_symbols(self):
        # Developer symbols like C++ and C# should match cleanly
        text = "I write code in C++ and C# daily."
        skills = extract_skills_from_text(text, self.test_dict)
        
        skill_names = [s["name"] for s in skills]
        self.assertIn("C++", skill_names)
        self.assertIn("C#", skill_names)

    def test_extract_skills_aliases_mapping(self):
        # "nextjs" alias should map to "Next.js"
        # "postgres" alias should map to "PostgreSQL"
        text = "Nextjs developer with experience in postgres databases."
        skills = extract_skills_from_text(text, self.test_dict)
        
        skill_names = [s["name"] for s in skills]
        self.assertIn("Next.js", skill_names)
        self.assertIn("PostgreSQL", skill_names)

if __name__ == "__main__":
    unittest.main()
