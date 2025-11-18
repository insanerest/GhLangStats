
# GhLangStats

## THIS PROJECT IS NOT BEING MAINTAINED ANYMORE

[![codecov](https://codecov.io/gh/insanerest/GhLangStats/branch/main/graph/badge.svg)](https://codecov.io/gh/insanerest/GhLangStats)
![issues](https://img.shields.io/github/issues/insanerest/GhLangStats)
![license](https://img.shields.io/github/license/insanerest/GhLangStats)
[![npm](https://img.shields.io/npm/dt/ghlangstats.svg)](https://www.npmjs.com/package/ghlangstats)
[![npm](https://img.shields.io/npm/v/ghlangstats.svg)](https://www.npmjs.com/package/ghlangstats)

time spent on this project:
[![wakatime](https://wakatime.com/badge/user/6d0c0e21-5c17-43c9-8782-5a9b4529ac0b/project/24a533f6-168d-4db8-8466-addd16015d92.svg)](https://wakatime.com/badge/user/6d0c0e21-5c17-43c9-8782-5a9b4529ac0b/project/24a533f6-168d-4db8-8466-addd16015d92)

> 🧠 A CLI to detect programming languages and frameworks used in a GitHub user’s public repositories.

---

![Demo](https://raw.githubusercontent.com/insanerest/GhLangStats/main/.github/demo.gif)

---

## 🚀 Features

- Analyze public repositories of any GitHub user  
- Detect and summarize programming languages used  
- Detect and summarize frameworks utilized  
- Command-line interface (CLI) for quick usage  

---

## 📦 Installation

You can install via npm:

```bash
npm install -g ghlangstats
```

or install manually:


Clone the repository:

```bash
git clone https://github.com/insanerest/GhLangStats.git
cd GhLangStats
```

Install dependencies:

```bash
npm install
```

> [!NOTE]
> To link the CLI for usage as `ghlangstats <options>`, run `npm run linkcli`



---

## 🧪 Usage

Run the CLI tool:


```bash
# Run via the file itself
node bin/cli.js <options>
# Or with its name if linked
ghlangstats <options>
```

**Example:**
```bash
node bin/cli.js --user insanerest --format json
```
For Help:

```bash
node bin/cli.js --help
```



Read the [Documentation](https://github.com/insanerest/GhLangStats/wiki) for all the usage options


---

## ⚙️ How It Works

1. Fetch user’s public repositories via GitHub REST API
2. For each repo:
    - Analyze language used via file extension
    - Searches for the presence of config files for popular frameworks
3. Aggregate and return summary


---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 📫 Contact

 [insanerest](https://github.com/insanerest).  
 Discord: `insanerst`



