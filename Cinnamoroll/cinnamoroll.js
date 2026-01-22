process.stdin.setEncoding("utf8");

if (process.argv.length != 3) {
    process.stdout.write('Usage cinnamoroll.js PORT_NUMBER_HERE');
    process.exit(1);
} else {
    const portNumber = process.argv[2];
    const express = require("express");
    const path = require("path");
    const app = express();

    app.use(express.static(path.resolve(__dirname)));
    
    app.set("views", path.resolve(__dirname, ""));
    app.set("view engine", "ejs");

    /* GET */
    app.get("/", (_, response) => {
        response.render("index");
    });
    
    /* read */
    app.listen(portNumber);
    console.log(`Web server is running at http://localhost:${portNumber}`);

    const prompt = "Stop to shutdown the server: ";
    process.stdout.write(prompt);

    process.stdin.on("readable", function () {
        const dataInput = process.stdin.read();
        if (dataInput !== null) {
        const command = dataInput.trim();
        if (command === "stop") {
            process.stdout.write("Shutting down the server\n");
            process.exit(0);
        } else {
            process.stdout.write("Invalid command: " + command + "\n");
            process.stdout.write(prompt);
        }
        process.stdin.resume();
        }
    });

}