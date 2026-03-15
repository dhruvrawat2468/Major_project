import { exec } from "child_process";
import fs from "fs";
import path from "path";

export const runCode = async (code, input) => {

  return new Promise((resolve, reject) => {

    try {

      // create unique filename
      const filename = `code_${Date.now()}.py`;

      const filePath = path.join("src/temp", filename);

      // write submitted code to file
      fs.writeFileSync(filePath, code);

      // execute python program
      const process = exec(`python ${filePath}`);

      // send input
      process.stdin.write(input);
      process.stdin.end();

      let output = "";

      process.stdout.on("data", data => {
        output += data;
      });

      process.stderr.on("data", data => {
        console.error("Execution error:", data);
      });

      process.on("close", () => {

        // delete temporary file after execution
        console.log('file created in temp folder');
        fs.unlinkSync(filePath);
        console.log('file deleted from temp folder');

        resolve(output.trim());

      });

    } catch (error) {
      reject(error);
    }

  });

};