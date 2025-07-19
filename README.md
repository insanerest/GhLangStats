
# GhLangStats

> 🧠 A CLI to detect programming languages and frameworks used in a GitHub user’s public repositories.

---

## 🚀 Features

- Analyze public repositories of any GitHub user  
- Detect and summarize programming languages used  
- Detect and summarize frameworks utilized  
- Lightweight and easy to integrate API  
- Command-line interface (CLI) for quick usage  

---

## 📦 Installation

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



Read the [Documentation](https://github.com/insanerest/ghlangstats) (Coming Soon) for all the usage options


---

## ⚙️ How It Works

1. Fetch user’s public repositories via GitHub REST API
2. For each repo:
    - Analyze language used via file extension
    - Searches for the presence of config files for popular frameworks
3. Aggregate and return summary

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

## 🐞 Issues

![issues](https://img.shields.io/github/issues/insanerest/GhLangStats)


Found a bug or have a suggestion? [Open an issue](https://github.com/insanerest/GhLangStats/issues).

---

## 📄 License

![license](https://img.shields.io/github/license/insanerest/GhLangStats)


This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 📫 Contact

Created and maintained by [insanerest](https://github.com/insanerest).  

