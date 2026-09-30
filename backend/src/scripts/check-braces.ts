import fs from "fs";

function checkBrackets(filePath: string) {
  const code = fs.readFileSync(filePath, "utf-8");
  let openBraces = 0;
  for (let i = 0; i < code.length; i++) {
    if (code[i] === "{") openBraces++;
    if (code[i] === "}") openBraces--;
  }
  console.log(`${filePath} - Braces balance: ${openBraces}`);
}

checkBrackets("C:\\Users\\vikur\\Downloads\\store4riders\\backend\\src\\modules\\product\\product.service.ts");
checkBrackets("C:\\Users\\vikur\\Downloads\\store4riders\\backend\\src\\modules\\product\\product.controller.ts");
checkBrackets("C:\\Users\\vikur\\Downloads\\store4riders\\backend\\src\\modules\\product\\product.route.ts");
