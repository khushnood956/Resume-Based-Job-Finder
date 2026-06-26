# Development Guidelines

This document outlines the coding standards, development workflows, and testing expectations for all modules in this project.

---

## 1. Technical Standards

### TypeScript & Frontend
* Use **TypeScript** for all Next.js code. Avoid the use of `any` types.
* Prefer **functional components** and React hooks over class components.
* Write reusable service classes/utilities for shared logic (e.g. Supabase client wrapper, notification handlers).

### Styling (Vanilla CSS)
* Do not install CSS frameworks (Tailwind, Bootstrap) unless explicitly requested.
* Use **CSS Modules** (`*.module.css`) to prevent global style pollution.
* Leverage **CSS Variables** defined in a global sheet (`index.css` or `globals.css`) for color scheme consistency:
  ```css
  :root {
    --primary: #2563eb;
    --primary-hover: #1d4ed8;
    --background: #f8fafc;
    --card: #ffffff;
    --text: #1e293b;
    --border: #e2e8f0;
  }
  ```
* Standardize UI details:
  * Smooth transitions: `transition: all 0.2s ease-in-out;`
  * Round corners: `border-radius: 8px;`
  * Focus indicators: Always style `:focus-visible` for accessibility.

### Python Backend
* Format code conforming to **PEP 8** standards.
* Use **Type Hints** for all function parameters and return signatures:
  ```python
  def process_text(raw_text: str) -> list[dict[str, str]]:
      ...
  ```
* Keep dependencies minimal. List all modules inside `requirements.txt`.

---

## 2. Commit Message Guidelines

We follow the Conventional Commits specification.

### Formats:
* `feat(scope): description` - Added a new feature.
* `fix(scope): description` - Fixed a bug.
* `docs(scope): description` - Documentation updates.
* `style(scope): description` - CSS formatting / UI touch-ups (no functional changes).
* `test(scope): description` - Added or modified tests.

### Examples:
* `feat(parser): add PDF upload endpoint`
* `fix(matching): adjust weights on location matching`
* `docs(readme): update setup instructions`

---

## 3. Testing Policy

### Frontend Unit Tests
* Write unit tests for matching score calculation utilities and text parsers inside `frontend/tests`.
* Use **Vitest** for running TS tests.

### Python Service Tests
* Write tests verifying the parser logic using **pytest**.
* Create a mock PDF file inside `tests/fixtures` to test raw text extraction.
* Test skill boundary extraction logic to prevent regressions:
  ```python
  def test_extract_skills():
      text = "We need a C++ developer who knows SQL."
      skills = extract_skills(text, test_dict)
      assert "c++" in [s['name'] for s in skills]
      assert "sql" in [s['name'] for s in skills]
  ```
