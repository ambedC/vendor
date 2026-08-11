/* i18next-scanner.config.cjs */
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const LOCALES_DIR = "public/locales";
const LANGS = ["en", "hi", "ar"];

// Collect all discovered keys here (independent from scanner internals)
const COLLECTED_KEYS = new Set();

// Helper: flatten nested JSON to dot.notation keys
function flatten(obj, prefix = "", out = {}) {
    Object.keys(obj || {}).forEach((k) => {
        const val = obj[k];
        const key = prefix ? `${prefix}.${k}` : k;
        if (val && typeof val === "object" && !Array.isArray(val)) flatten(val, key, out);
        else out[key] = val;
    });
    return out;
}

module.exports = {
    input: [
        "src/**/*.{js,jsx,ts,tsx}",
        "!**/node_modules/**",
        "!src/i18n/**",
    ],
    output: LOCALES_DIR,
    options: {
        debug: false,
        removeUnusedKeys: false,
        sort: true,
        func: {
            // Add your custom wrappers here if any (e.g., "translate", "tt")
            list: ["t", "i18next.t"],
            extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
        // We’re not scanning <Trans> right now; add later if you use it heavily.
        trans: false,
        lngs: LANGS,
        defaultLng: "en",
        defaultNs: "translation",
        defaultValue: (lng, ns, key) => key,
        resource: {
            loadPath: path.join(LOCALES_DIR, "{{lng}}.json"),
            savePath: path.join(LOCALES_DIR, "{{lng}}.json"),
        },
    },

    // Collect keys as the files are parsed
    transform(file, enc, done) {
        const parser = this.parser;
        const content = fs.readFileSync(file.path, enc);

        // Extract from t('key') calls
        parser.parseFuncFromString(content, { list: ["t", "i18next.t"] }, (key) => {
            if (typeof key === "string" && key.trim()) {
                COLLECTED_KEYS.add(key);
            }
            // keep the scanner happy in case you also want it to write files later
            parser.set(key, key);
        });

        // Optional: basic noise filter – skip obvious non-keys
        const count = Array.from(COLLECTED_KEYS).length;
        console.log(chalk.green.bold("✅ Scanned:"), file.path, chalk.gray(`(${count} total unique keys so far)`));
        done();
    },

    // Compare with locale JSONs and print a clean report
    flush(done) {
        const allKeys = Array.from(COLLECTED_KEYS).sort();

        console.log("\n🔍 Missing Translation Keys Report:");
        if (allKeys.length === 0) {
            console.log(chalk.yellow("No keys were discovered. Did you use t('...') in your code?"));
            return done();
        }

        let anyMissing = false;

        LANGS.forEach((lng) => {
            const filePath = path.join(LOCALES_DIR, `${lng}.json`);
            if (!fs.existsSync(filePath)) {
                console.log(chalk.red(`\n✖ ${lng}.json not found at ${filePath}`));
                anyMissing = true;
                return;
            }

            const existingRaw = JSON.parse(fs.readFileSync(filePath, "utf8"));
            const existingFlat = flatten(existingRaw);
            const existingKeys = new Set(Object.keys(existingFlat));

            // Compute missing for this language
            const missing = allKeys.filter((k) => !existingKeys.has(k));

            if (missing.length === 0) {
                console.log(chalk.green(`\nLanguage: ${lng} — ✅ No missing keys`));
            } else {
                anyMissing = true;
                console.log(chalk.yellow(`\nLanguage: ${lng} — Missing ${missing.length} key(s):`));
                missing.forEach((k) => console.log(`  - ${k}`));
            }
        });

        if (!anyMissing) {
            console.log(chalk.green("\n🎉 All good — no missing keys in any language."));
        }

        done();
    },
};
