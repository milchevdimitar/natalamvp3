#!/usr/bin/env bash

# Проверка дали файлът Cardology.csv съществува
if [ ! -f "Cardology.csv" ]; then
  echo "❌ Грешка: Cardology.csv не е намерен в текущата папка!"
  exit 1
fi

echo "⚙️  Генериране на cardologyData.ts от Cardology.csv..."

# Използваме Node.js за прецизно парсване на CSV към TypeScript
node -e '
const fs = require("fs");

try {
  const fileContent = fs.readFileSync("Cardology.csv", "utf-8");
  const lines = fileContent.trim().split(/\r?\n/);

  if (lines.length < 2) {
    console.error("❌ Грешка: CSV файлът е празен или няма достатъчно редове.");
    process.exit(1);
  }

  // Заглавие (headers)
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));

  // Масив с обекти
  const data = lines.slice(1).filter(line => line.trim() !== "").map(line => {
    const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const obj = {};
    headers.forEach((h, i) => {
      const val = values[i] !== undefined ? values[i] : "";
      obj[h] = !isNaN(val) && val !== "" ? Number(val) : val;
    });
    return obj;
  });

  const tsContent = `// Автоматично генериран файл от Cardology.csv
export interface CardologyRecord {
  [key: string]: string | number;
}

export const CARDOLOGY_TABLE = ${JSON.stringify(data, null, 2)} as const;
`;

  fs.writeFileSync("cardologyData.ts", tsContent, "utf-8");
  console.log(`✅ Успешно обработени ${data.length} реда!`);
} catch (err) {
  console.error("❌ Грешка при обработката:", err.message);
  process.exit(1);
}
'

echo "🎉 Файлът cardologyData.ts е готов за ползване!"