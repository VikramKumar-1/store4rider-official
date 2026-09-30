import { exec } from "child_process";

exec("npx tsc --noEmit -p backend/tsconfig.json", { cwd: "c:\\Users\\vikur\\Downloads\\store4riders" }, (error, stdout, stderr) => {
  if (error) {
    console.error("Compilation failed:");
    console.error(stdout);
    console.error(stderr);
  } else {
    console.log("Compilation passed!");
  }
});
